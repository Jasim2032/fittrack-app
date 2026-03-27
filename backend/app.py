"""
FitTrack API - Flask Backend
Professional fitness tracking REST API with JWT authentication.
Supports SQLite (local dev) and PostgreSQL (production via DATABASE_URL).
"""

from flask import Flask, request, jsonify, g
from flask_cors import CORS
from datetime import datetime, timedelta
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import sqlite3
import os
import jwt
import json
import re
import urllib.request
import urllib.parse

load_dotenv()

app = Flask(__name__)
CORS(app)

DATABASE     = os.path.join(os.path.dirname(__file__), 'fittrack.db')
DATABASE_URL = os.environ.get('DATABASE_URL')
SECRET_KEY   = os.environ.get('SECRET_KEY', 'fittrack-dev-secret-2024-change-in-prod')
JWT_EXPIRY_DAYS = 7

MET_VALUES = {
    'Running': 9.8, 'Cycling': 7.5, 'HIIT': 8.0, 'Strength': 5.0,
    'Cardio': 6.5, 'Yoga': 3.0, 'Swimming': 7.0, 'Boxing': 9.0,
    'Pilates': 3.5, 'CrossFit': 8.5,
}


# ─── Database layer ───────────────────────────────────────────
# Supports both SQLite (local) and PostgreSQL (production).

def _is_pg():
    return bool(DATABASE_URL)


class _DBConn:
    """Thin wrapper that makes psycopg2 and sqlite3 look the same."""

    def __init__(self):
        if _is_pg():
            import psycopg2
            import psycopg2.extras
            url = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
            self._raw = psycopg2.connect(url)
            self._pg  = True
        else:
            self._raw = sqlite3.connect(DATABASE)
            self._raw.row_factory = sqlite3.Row
            self._raw.execute('PRAGMA foreign_keys = ON')
            self._pg = False

    def _cur(self):
        import psycopg2.extras
        return self._raw.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    def execute(self, sql, params=()):
        if self._pg:
            cur = self._cur()
            cur.execute(sql.replace('?', '%s'), params or ())
            return cur
        return self._raw.execute(sql, params)

    def insert(self, sql, params=()):
        """Execute INSERT and return the new row id."""
        if self._pg:
            cur = self._cur()
            cur.execute(
                sql.replace('?', '%s').rstrip().rstrip(';') + ' RETURNING id',
                params or ()
            )
            return cur.fetchone()['id']
        return self._raw.execute(sql, params).lastrowid

    def commit(self):   self._raw.commit()
    def rollback(self): self._raw.rollback()
    def close(self):
        try:
            self._raw.close()
        except Exception:
            pass


def get_db():
    return _DBConn()


# ─── Schema ───────────────────────────────────────────────────

_PG_TABLES = [
    """CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT,
        plan TEXT DEFAULT 'starter',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""",
    """CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        workout_type TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        calories_burned INTEGER DEFAULT 0,
        notes TEXT,
        date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""",
    """CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sets INTEGER DEFAULT 0,
        reps INTEGER DEFAULT 0,
        weight_kg REAL DEFAULT 0
    )""",
    """CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        target_value REAL NOT NULL,
        current_value REAL DEFAULT 0,
        unit TEXT NOT NULL,
        deadline TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""",
    """CREATE TABLE IF NOT EXISTS saved_exercises (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        exercise_data TEXT NOT NULL,
        source TEXT DEFAULT 'web',
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""",
]

_SQLITE_SCHEMA = '''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT,
        plan TEXT DEFAULT 'starter',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        workout_type TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        calories_burned INTEGER DEFAULT 0,
        notes TEXT,
        date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        sets INTEGER DEFAULT 0,
        reps INTEGER DEFAULT 0,
        weight_kg REAL DEFAULT 0,
        FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        target_value REAL NOT NULL,
        current_value REAL DEFAULT 0,
        unit TEXT NOT NULL,
        deadline TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS saved_exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        exercise_data TEXT NOT NULL,
        source TEXT DEFAULT 'web',
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
'''


def init_db():
    if _is_pg():
        import psycopg2
        url = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
        raw = psycopg2.connect(url)
        raw.autocommit = True          # each statement is its own transaction — no race condition
        cur = raw.cursor()
        for stmt in _PG_TABLES:
            try:
                cur.execute(stmt)
            except Exception:
                pass                   # table already exists from another worker
        for col, defn in [
            ('email',         'TEXT'),
            ('password_hash', 'TEXT'),
            ('plan',          "TEXT DEFAULT 'starter'"),
        ]:
            try:
                cur.execute(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {defn}")
            except Exception:
                pass
        cur.close()
        raw.close()
    else:
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        conn.execute('PRAGMA foreign_keys = ON')
        conn.executescript(_SQLITE_SCHEMA)
        for sql in [
            "ALTER TABLE users ADD COLUMN email TEXT UNIQUE",
            "ALTER TABLE users ADD COLUMN password_hash TEXT",
            "ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'starter'",
        ]:
            try:
                conn.execute(sql)
            except Exception:
                pass
        conn.commit()
        conn.close()


# ─── JWT Auth ────────────────────────────────────────────────

def make_token(user_id, username, plan):
    payload = {
        'user_id':  user_id,
        'username': username,
        'plan':     plan,
        'exp':      datetime.utcnow() + timedelta(days=JWT_EXPIRY_DAYS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        header = request.headers.get('Authorization', '')
        if not header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        token = header[7:]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            g.user_id  = payload['user_id']
            g.username = payload['username']
            g.plan     = payload.get('plan', 'starter')
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Session expired, please log in again'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid session, please log in again'}), 401
        return f(*args, **kwargs)
    return decorated


# ─── Health Check ─────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        conn = get_db()
        conn.execute('SELECT 1')
        conn.close()
        return jsonify({
            'status':    'healthy',
            'service':   'FitTrack API',
            'database':  'postgresql' if _is_pg() else 'sqlite',
            'timestamp': datetime.now().isoformat(),
        }), 200
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500


# ─── Auth Routes ──────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    username = (data.get('username') or '').strip()
    email    = (data.get('email')    or '').strip().lower()
    password =  data.get('password') or ''

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    conn = get_db()
    try:
        existing = conn.execute(
            'SELECT id FROM users WHERE username = ? OR (email IS NOT NULL AND email = ? AND email != \'\')',
            (username, email)
        ).fetchone()
        if existing:
            conn.close()
            return jsonify({'error': 'Username or email already registered'}), 409

        password_hash = generate_password_hash(password)
        user_id = conn.insert(
            'INSERT INTO users (username, email, password_hash, plan) VALUES (?, ?, ?, ?)',
            (username, email or None, password_hash, 'starter')
        )
        conn.commit()
        token = make_token(user_id, username, 'starter')
        return jsonify({
            'token': token,
            'user':  {'id': user_id, 'username': username, 'email': email, 'plan': 'starter'}
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    identifier = (data.get('username') or data.get('email') or '').strip()
    password   =  data.get('password') or ''

    if not identifier or not password:
        return jsonify({'error': 'Username/email and password are required'}), 400

    conn = get_db()
    user = conn.execute(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        (identifier, identifier.lower())
    ).fetchone()
    conn.close()

    if not user or not user['password_hash'] or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid credentials'}), 401

    plan  = user['plan'] or 'starter'
    token = make_token(user['id'], user['username'], plan)
    return jsonify({
        'token': token,
        'user':  {'id': user['id'], 'username': user['username'], 'email': user['email'], 'plan': plan}
    }), 200


@app.route('/api/auth/me', methods=['GET'])
@require_auth
def get_me():
    conn = get_db()
    user = conn.execute(
        'SELECT id, username, email, plan, created_at FROM users WHERE id = ?',
        (g.user_id,)
    ).fetchone()
    conn.close()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(dict(user)), 200


@app.route('/api/auth/upgrade', methods=['POST'])
@require_auth
def upgrade_plan():
    data     = request.get_json()
    new_plan = (data or {}).get('plan', 'pro')
    if new_plan not in ('starter', 'pro', 'elite'):
        return jsonify({'error': 'Invalid plan'}), 400

    conn = get_db()
    conn.execute('UPDATE users SET plan = ? WHERE id = ?', (new_plan, g.user_id))
    conn.commit()
    user = conn.execute(
        'SELECT id, username, email, plan, created_at FROM users WHERE id = ?', (g.user_id,)
    ).fetchone()
    conn.close()

    token = make_token(user['id'], user['username'], new_plan)
    return jsonify({'token': token, 'user': dict(user)}), 200


# ─── Workout Routes ───────────────────────────────────────────

@app.route('/api/workouts', methods=['GET'])
@require_auth
def get_workouts():
    conn       = get_db()
    start_date = request.args.get('start_date')
    end_date   = request.args.get('end_date')

    query  = 'SELECT * FROM workouts WHERE user_id = ?'
    params = [g.user_id]
    if start_date:
        query += ' AND date >= ?'
        params.append(start_date)
    if end_date:
        query += ' AND date <= ?'
        params.append(end_date)
    query += ' ORDER BY date DESC'

    workouts = conn.execute(query, params).fetchall()
    result   = []
    for w in workouts:
        workout     = dict(w)
        exercises   = conn.execute(
            'SELECT * FROM exercises WHERE workout_id = ?', (w['id'],)
        ).fetchall()
        workout['exercises'] = [dict(e) for e in exercises]
        result.append(workout)

    conn.close()
    return jsonify(result), 200


@app.route('/api/workouts', methods=['POST'])
@require_auth
def create_workout():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    for field in ['workout_type', 'duration_minutes', 'date']:
        if field not in data:
            return jsonify({'error': f"'{field}' is required"}), 400

    conn = get_db()
    try:
        workout_id = conn.insert(
            """INSERT INTO workouts (user_id, workout_type, duration_minutes,
               calories_burned, notes, date) VALUES (?, ?, ?, ?, ?, ?)""",
            (
                g.user_id, data['workout_type'], data['duration_minutes'],
                data.get('calories_burned', 0), data.get('notes', ''), data['date']
            )
        )
        for ex in data.get('exercises', []):
            conn.execute(
                'INSERT INTO exercises (workout_id, name, sets, reps, weight_kg) VALUES (?, ?, ?, ?, ?)',
                (workout_id, ex['name'], ex.get('sets', 0), ex.get('reps', 0), ex.get('weight_kg', 0))
            )
        conn.commit()
        workout = dict(conn.execute('SELECT * FROM workouts WHERE id = ?', (workout_id,)).fetchone())
        return jsonify(workout), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/workouts/<int:workout_id>', methods=['DELETE'])
@require_auth
def delete_workout(workout_id):
    conn = get_db()
    conn.execute('DELETE FROM workouts WHERE id = ? AND user_id = ?', (workout_id, g.user_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Workout deleted'}), 200


# ─── Goals Routes ─────────────────────────────────────────────

@app.route('/api/goals', methods=['GET'])
@require_auth
def get_goals():
    conn  = get_db()
    goals = conn.execute(
        'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC', (g.user_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(goal) for goal in goals]), 200


@app.route('/api/goals', methods=['POST'])
@require_auth
def create_goal():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    for field in ['title', 'target_value', 'unit']:
        if field not in data:
            return jsonify({'error': f"'{field}' is required"}), 400

    conn    = get_db()
    goal_id = conn.insert(
        'INSERT INTO goals (user_id, title, target_value, unit, deadline) VALUES (?, ?, ?, ?, ?)',
        (g.user_id, data['title'], data['target_value'], data['unit'], data.get('deadline'))
    )
    conn.commit()
    goal = dict(conn.execute('SELECT * FROM goals WHERE id = ?', (goal_id,)).fetchone())
    conn.close()
    return jsonify(goal), 201


@app.route('/api/goals/<int:goal_id>', methods=['PATCH'])
@require_auth
def update_goal(goal_id):
    data = request.get_json()
    conn = get_db()

    updates, params = [], []
    for field in ['current_value', 'status', 'title', 'target_value']:
        if field in data:
            updates.append(f'{field} = ?')
            params.append(data[field])

    if updates:
        params.extend([goal_id, g.user_id])
        conn.execute(f"UPDATE goals SET {', '.join(updates)} WHERE id = ? AND user_id = ?", params)
        conn.commit()

    goal = conn.execute(
        'SELECT * FROM goals WHERE id = ? AND user_id = ?', (goal_id, g.user_id)
    ).fetchone()
    conn.close()

    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    return jsonify(dict(goal)), 200


@app.route('/api/goals/<int:goal_id>', methods=['DELETE'])
@require_auth
def delete_goal(goal_id):
    conn = get_db()
    conn.execute('DELETE FROM goals WHERE id = ? AND user_id = ?', (goal_id, g.user_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Goal deleted'}), 200


# ─── Stats Routes ─────────────────────────────────────────────

@app.route('/api/stats', methods=['GET'])
@require_auth
def get_stats():
    conn = get_db()
    uid  = g.user_id

    total = conn.execute(
        'SELECT COUNT(*) as c FROM workouts WHERE user_id = ?', (uid,)
    ).fetchone()['c']

    week_start = (datetime.now() - timedelta(days=datetime.now().weekday())).strftime('%Y-%m-%d')
    this_week  = conn.execute(
        'SELECT COUNT(*) as c FROM workouts WHERE user_id = ? AND date >= ?', (uid, week_start)
    ).fetchone()['c']

    total_calories = conn.execute(
        'SELECT COALESCE(SUM(calories_burned), 0) as t FROM workouts WHERE user_id = ?', (uid,)
    ).fetchone()['t']

    total_minutes = conn.execute(
        'SELECT COALESCE(SUM(duration_minutes), 0) as t FROM workouts WHERE user_id = ?', (uid,)
    ).fetchone()['t']

    active_goals = conn.execute(
        "SELECT COUNT(*) as c FROM goals WHERE user_id = ? AND status = 'active'", (uid,)
    ).fetchone()['c']

    # Weekly data (last 8 weeks)
    weekly_data = []
    for i in range(7, -1, -1):
        start  = (datetime.now() - timedelta(weeks=i, days=datetime.now().weekday())).strftime('%Y-%m-%d')
        end_dt = datetime.now() - timedelta(weeks=i-1, days=datetime.now().weekday()) if i > 0 else datetime.now()
        end    = end_dt.strftime('%Y-%m-%d')
        row    = conn.execute(
            """SELECT COUNT(*) as workouts, COALESCE(SUM(calories_burned), 0) as calories,
               COALESCE(SUM(duration_minutes), 0) as minutes
               FROM workouts WHERE user_id = ? AND date >= ? AND date < ?""",
            (uid, start, end)
        ).fetchone()
        weekly_data.append({'week': f'W{8-i}', 'workouts': row['workouts'],
                            'calories': row['calories'], 'minutes': row['minutes']})

    # Workout type distribution
    type_dist = conn.execute(
        'SELECT workout_type, COUNT(*) as count FROM workouts WHERE user_id = ? GROUP BY workout_type', (uid,)
    ).fetchall()

    # Streak
    dates  = conn.execute(
        'SELECT DISTINCT date FROM workouts WHERE user_id = ? ORDER BY date DESC', (uid,)
    ).fetchall()
    streak = 0
    if dates:
        today = datetime.now().date()
        prev  = None
        for row in dates:
            d = datetime.strptime(row['date'], '%Y-%m-%d').date()
            if prev is None:
                if (today - d).days <= 1:
                    streak = 1
                    prev   = d
                else:
                    break
            else:
                if (prev - d).days == 1:
                    streak += 1
                    prev    = d
                else:
                    break

    conn.close()
    return jsonify({
        'total_workouts': total,
        'this_week':      this_week,
        'total_calories': total_calories,
        'total_minutes':  total_minutes,
        'active_goals':   active_goals,
        'weekly_data':    weekly_data,
        'workout_types':  [dict(t) for t in type_dist],
        'streak':         streak,
    }), 200


# ─── Calorie Estimation ───────────────────────────────────────

@app.route('/api/calories/estimate', methods=['POST'])
@require_auth
def estimate_calories():
    data             = request.get_json() or {}
    workout_type     = data.get('workout_type', 'Cardio')
    duration_minutes = float(data.get('duration_minutes', 30))
    weight_kg        = float(data.get('weight_kg', 75))
    met      = MET_VALUES.get(workout_type, 6.0)
    calories = round(met * weight_kg * (duration_minutes / 60))
    return jsonify({'estimated_calories': calories, 'met': met}), 200


# ─── Seed Data ────────────────────────────────────────────────

@app.route('/api/seed', methods=['POST'])
@require_auth
def seed_data():
    conn = get_db()
    conn.execute(
        'DELETE FROM exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_id = ?)',
        (g.user_id,)
    )
    conn.execute('DELETE FROM workouts WHERE user_id = ?', (g.user_id,))
    conn.execute('DELETE FROM goals WHERE user_id = ?', (g.user_id,))

    sample_workouts = [
        ('Strength', 60, 450, 'Chest and triceps day', -1),
        ('Running',  35, 380, 'Morning 5K run',        -2),
        ('HIIT',     25, 320, 'Tabata intervals',      -3),
        ('Yoga',     45, 180, 'Flexibility and recovery', -5),
        ('Cardio',   40, 400, 'Cycling session',       -6),
        ('Strength', 55, 420, 'Back and biceps',       -7),
        ('Running',  50, 520, '8K tempo run',          -9),
        ('HIIT',     30, 350, 'Circuit training',      -10),
        ('Strength', 65, 480, 'Leg day',               -12),
        ('Yoga',     40, 160, 'Morning yoga flow',     -14),
        ('Cardio',   45, 430, 'Rowing machine',        -16),
        ('Strength', 50, 400, 'Shoulders and core',   -18),
        ('Running',  30, 340, 'Interval sprints',      -20),
        ('HIIT',     20, 280, 'Bodyweight HIIT',       -22),
        ('Strength', 60, 460, 'Full body workout',     -25),
        ('Cardio',   35, 360, 'Elliptical session',   -28),
        ('Running',  45, 480, '10K practice',          -30),
        ('Yoga',     50, 200, 'Deep stretch session',  -33),
        ('Strength', 55, 440, 'Push day',              -36),
        ('HIIT',     25, 310, 'Kettlebell HIIT',       -40),
    ]

    exercises_map = {
        'Strength': [('Bench Press', 4, 10, 60), ('Deadlift', 3, 8, 80),
                     ('Squat', 4, 10, 70), ('Overhead Press', 3, 10, 40)],
        'HIIT':     [('Burpees', 4, 15, 0), ('Mountain Climbers', 3, 20, 0),
                     ('Jump Squats', 4, 12, 0)],
        'Running':  [('Running', 1, 1, 0)],
        'Cardio':   [('Cycling', 1, 1, 0)],
        'Yoga':     [('Sun Salutation', 3, 5, 0)],
    }

    for wtype, duration, calories, notes, day_offset in sample_workouts:
        date = (datetime.now() + timedelta(days=day_offset)).strftime('%Y-%m-%d')
        wid  = conn.insert(
            'INSERT INTO workouts (user_id, workout_type, duration_minutes, calories_burned, notes, date) VALUES (?, ?, ?, ?, ?, ?)',
            (g.user_id, wtype, duration, calories, notes, date)
        )
        for ex in exercises_map.get(wtype, []):
            conn.execute(
                'INSERT INTO exercises (workout_id, name, sets, reps, weight_kg) VALUES (?, ?, ?, ?, ?)',
                (wid, ex[0], ex[1], ex[2], ex[3])
            )

    goals = [
        ('Run 50km this month',    50,    32,   'km',       30),
        ('Workout 5 days/week',    20,    14,   'sessions', 28),
        ('Burn 10,000 calories',   10000, 7200, 'kcal',     30),
        ('Bench press 80kg',       80,    60,   'kg',       60),
    ]
    for title, target, current, unit, days in goals:
        deadline = (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d')
        conn.execute(
            'INSERT INTO goals (user_id, title, target_value, current_value, unit, deadline) VALUES (?, ?, ?, ?, ?, ?)',
            (g.user_id, title, target, current, unit, deadline)
        )

    conn.commit()
    conn.close()
    return jsonify({'message': 'Sample data seeded successfully'}), 201


# ─── Exercise Online Search ───────────────────────────────────

@app.route('/api/exercises/search', methods=['GET'])
@require_auth
def search_exercises_online():
    query = request.args.get('q', '').strip()
    if not query or len(query) < 2:
        return jsonify({'exercises': []}), 200

    try:
        search_url = (
            'https://wger.de/api/v2/exercise/search/?'
            + urllib.parse.urlencode({'term': query, 'language': 'english', 'format': 'json'})
        )
        req = urllib.request.Request(search_url, headers={'User-Agent': 'FitTrack/1.0'})
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read())

        suggestions = data.get('suggestions', [])[:4]
        exercises   = []

        for s in suggestions:
            base_id = s.get('data', {}).get('base_id')
            if not base_id:
                continue
            try:
                info_url = f'https://wger.de/api/v2/exerciseinfo/{base_id}/?format=json'
                req2 = urllib.request.Request(info_url, headers={'User-Agent': 'FitTrack/1.0'})
                with urllib.request.urlopen(req2, timeout=6) as resp2:
                    info = json.loads(resp2.read())
            except Exception:
                continue

            translations = info.get('translations', [])
            en_trans     = next((t for t in translations if t.get('language') == 2), None)

            name        = s.get('value', '').strip()
            description = ''
            steps       = []
            if en_trans:
                raw_desc    = en_trans.get('description', '')
                description = re.sub(r'<[^>]+>', '', raw_desc).strip()
                sentences   = [x.strip() for x in re.split(r'(?<=[.!?])\s+', description) if x.strip()]
                steps       = sentences[:5] if sentences else []

            category_name = info.get('category', {}).get('name', 'General')
            muscles       = [m.get('name_en') or m.get('name', '') for m in info.get('muscles', [])]
            muscles_sec   = [m.get('name_en') or m.get('name', '') for m in info.get('muscles_secondary', [])]
            equip_list    = [e.get('name', '') for e in info.get('equipment', [])]
            equipment     = ', '.join(filter(None, equip_list)) or 'No specific equipment'

            exercises.append({
                'id':          f'web_{base_id}',
                'name':        name,
                'category':    category_name,
                'muscle':      muscles[0] if muscles else category_name,
                'muscles':     muscles if muscles else [category_name],
                'secondary':   muscles_sec,
                'equipment':   equipment,
                'difficulty':  'Intermediate',
                'description': description or f'{name} — sourced from wger exercise database.',
                'sets':        '3–4 sets × 8–12 reps',
                'rest':        '60–90 sec',
                'steps':       steps,
                'tips':        [],
                'mistakes':    [],
                'videoSearch': f'{name} exercise proper form tutorial',
                'source':      'web',
            })

        return jsonify({'exercises': exercises}), 200

    except Exception as e:
        return jsonify({'exercises': [], 'error': str(e)}), 200


# ─── Saved Exercises (My Library) ─────────────────────────────

@app.route('/api/exercises/saved', methods=['GET'])
@require_auth
def get_saved_exercises():
    conn   = get_db()
    rows   = conn.execute(
        'SELECT * FROM saved_exercises WHERE user_id = ? ORDER BY saved_at DESC',
        (g.user_id,)
    ).fetchall()
    conn.close()
    result = []
    for row in rows:
        try:
            ex             = json.loads(row['exercise_data'])
            ex['saved_id'] = row['id']
            ex['saved_at'] = row['saved_at']
            result.append(ex)
        except Exception:
            pass
    return jsonify(result), 200


@app.route('/api/exercises/saved', methods=['POST'])
@require_auth
def save_exercise():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Exercise data required'}), 400

    conn     = get_db()
    existing = conn.execute(
        'SELECT id FROM saved_exercises WHERE user_id = ? AND name = ?',
        (g.user_id, data['name'])
    ).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'Already saved', 'saved_id': existing['id']}), 409

    saved_id = conn.insert(
        'INSERT INTO saved_exercises (user_id, name, exercise_data, source) VALUES (?, ?, ?, ?)',
        (g.user_id, data['name'], json.dumps(data), data.get('source', 'web'))
    )
    conn.commit()
    conn.close()
    return jsonify({'saved_id': saved_id, 'message': 'Exercise saved to your library'}), 201


@app.route('/api/exercises/saved/<int:saved_id>', methods=['DELETE'])
@require_auth
def delete_saved_exercise(saved_id):
    conn = get_db()
    conn.execute(
        'DELETE FROM saved_exercises WHERE id = ? AND user_id = ?',
        (saved_id, g.user_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Removed from library'}), 200


# ─── Startup ──────────────────────────────────────────────────

init_db()

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
