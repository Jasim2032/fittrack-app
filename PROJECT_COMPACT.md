# FitTrack — Project Compact Reference
> Complete technical reference for the FitTrack fitness tracking application.
> Last updated: 2026-03-27

---

## 1. Overview

FitTrack is a full-stack fitness tracking web application. Users register, log workouts, set goals, track progress with stats, browse a 153-exercise library with instructions and video links, and search exercises online via the wger.de API. The app is **free for all users** — no plans or payments.

### Live URLs
| Service | URL |
|---|---|
| **Frontend (Vercel)** | https://fittrack-delta-brown.vercel.app |
| **Backend API (Railway)** | https://fittrack-production-f9ad.up.railway.app/api |
| **Health Check** | https://fittrack-production-f9ad.up.railway.app/api/health |
| **GitHub Repository** | https://github.com/Jasim2032/fittrack- |
| **UptimeRobot Monitor** | https://dashboard.uptimerobot.com |

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 18.2.0 |
| Routing | React Router DOM | 6.20.0 |
| Charts | Recharts | 2.10.0 |
| Icons | Lucide React | 0.294.0 |
| HTTP Client | Axios | 1.6.0 |
| Backend | Python / Flask | 3.1.0 |
| Auth Tokens | PyJWT | 2.8.0 |
| Password Hash | Werkzeug Security | (via Flask) |
| Database (production) | PostgreSQL | Railway managed |
| Database (local dev) | SQLite | file: fittrack.db |
| DB Driver (PostgreSQL) | psycopg2-binary | 2.9.9 |
| CORS | Flask-CORS | 5.0.1 |
| WSGI Server | Gunicorn | 21.2.0 |
| Containerisation | Docker | — |
| CI/CD | GitHub Actions | — |
| Backend Hosting | Railway | — |
| Frontend Hosting | Vercel | — |
| Monitoring | UptimeRobot | Free tier |

---

## 3. Project Structure

```
fittrack-/                          ← GitHub repo root
├── PROJECT_COMPACT.md              ← this file
├── .github/
│   └── workflows/
│       └── ci.yml                  ← GitHub Actions CI/CD pipeline
├── backend/
│   ├── app.py                      ← Flask app (all routes, DB logic, dual DB support)
│   ├── requirements.txt            ← Python dependencies
│   ├── Dockerfile                  ← Docker image (python:3.11-slim, gunicorn)
│   ├── Procfile                    ← Heroku-style start command
│   ├── railway.toml                ← Railway deployment config
│   ├── .env.example                ← Example environment variables
│   ├── fittrack.db                 ← SQLite DB (local dev only, auto-created)
│   └── test_app.py                 ← Pytest test suite
└── frontend/
    ├── package.json
    ├── vercel.json                 ← Vercel deployment config (SPA rewrites)
    ├── Dockerfile                  ← Frontend Docker image
    └── src/
        ├── index.js
        ├── index.css               ← all styles (CSS variables + components + mobile)
        ├── App.js                  ← routing, sidebar, MobileHeader, auth guards
        ├── api.js                  ← axios instance + all API calls
        ├── contexts/
        │   └── AuthContext.js      ← global auth state (user, login, logout)
        ├── data/
        │   └── exercises.js        ← 153-exercise local database (exported array)
        └── pages/
            ├── Login.js
            ├── Dashboard.js
            ├── Workouts.js
            ├── Goals.js
            └── Exercises.js        ← library + online search + My Library tab
```

---

## 4. DevOps Implementation

### 4.1 CI/CD — GitHub Actions (`.github/workflows/ci.yml`)
Triggers on every push or pull request to `main`.

**Jobs:**
1. **Backend Tests** — Python 3.11, installs requirements, runs `pytest test_app.py -v`
2. **Frontend Build** — Node 18, runs `npm ci` + `npm run build` (CI=false)

### 4.2 Containerisation — Docker
**Backend (`backend/Dockerfile`):**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120"]
```

**Frontend (`frontend/Dockerfile`):** React build served via nginx.

### 4.3 Backend Deployment — Railway
- **Service:** `fittrack-` connected to `Jasim2032/fittrack-` GitHub repo
- **Root Directory:** `backend/`
- **Start Command:** `gunicorn app:app --bind 0.0.0.0:5000 --workers 2 --timeout 120`
- **Domain:** `fittrack-production-f9ad.up.railway.app`
- **Auto-deploys:** on every push to `main`

**Railway Environment Variables:**
| Variable | Value |
|---|---|
| `PORT` | `5000` |
| `SECRET_KEY` | `fittrack-2026` |
| `FLASK_ENV` | `production` |
| `DATABASE_URL` | PostgreSQL public URL (set by Railway PostgreSQL service) |

### 4.4 Database — Railway PostgreSQL
- Managed PostgreSQL instance provisioned inside the Railway project
- `DATABASE_URL` (public URL) injected into the backend service as env var
- App auto-detects: if `DATABASE_URL` is set → PostgreSQL; else → SQLite (local dev)
- Tables created automatically on startup via `init_db()` with `autocommit=True` to handle concurrent workers

### 4.5 Frontend Deployment — Vercel
- **Project:** `fittrack` connected to `Jasim2032/fittrack-` GitHub repo
- **Root Directory:** `frontend/`
- **Framework:** Create React App
- **Domain:** `fittrack-delta-brown.vercel.app`
- **Auto-deploys:** on every push to `main`

**Vercel Environment Variables:**
| Variable | Value |
|---|---|
| `REACT_APP_API_URL` | `https://fittrack-production-f9ad.up.railway.app/api` |

**`frontend/vercel.json`:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 4.6 Monitoring — UptimeRobot
- **Monitor type:** HTTP(s)
- **URL monitored:** `https://fittrack-production-f9ad.up.railway.app/api/health`
- **Interval:** every 5 minutes
- **Alerts:** email on downtime
- **Current status:** UP — 100% uptime

---

## 5. Database Schema

### Dual-database support
The app uses a `_DBConn` wrapper class in `app.py` that abstracts SQLite and PostgreSQL:
- SQLite: `?` placeholders, `sqlite3.Row`, `AUTOINCREMENT`, `executescript`
- PostgreSQL: `%s` placeholders, `RealDictCursor`, `SERIAL`, `RETURNING id`, `autocommit`

### `users`
| Column | Type | Notes |
|---|---|---|
| id | SERIAL / INTEGER | Primary key, auto-increment |
| username | TEXT | Unique |
| email | TEXT | Unique, optional |
| password_hash | TEXT | Werkzeug `generate_password_hash` |
| plan | TEXT | Default `'starter'` (legacy field) |
| created_at | TIMESTAMP | Auto-set on insert |

### `workouts`
| Column | Type | Notes |
|---|---|---|
| id | SERIAL / INTEGER | PK |
| user_id | INTEGER | FK → users.id |
| workout_type | TEXT | e.g. `'Strength'`, `'Cardio'` |
| duration_minutes | INTEGER | |
| calories_burned | INTEGER | Manual or MET-estimated |
| notes | TEXT | Optional |
| date | TEXT | ISO format `YYYY-MM-DD` |
| created_at | TIMESTAMP | |

### `exercises` (workout log entries)
| Column | Type | Notes |
|---|---|---|
| id | SERIAL / INTEGER | PK |
| workout_id | INTEGER | FK → workouts.id ON DELETE CASCADE |
| name | TEXT | Free text |
| sets | INTEGER | |
| reps | INTEGER | |
| weight_kg | REAL | |

### `goals`
| Column | Type | Notes |
|---|---|---|
| id | SERIAL / INTEGER | PK |
| user_id | INTEGER | FK → users.id |
| title | TEXT | |
| target_value | REAL | |
| current_value | REAL | |
| unit | TEXT | e.g. `'kg'`, `'reps'`, `'km'` |
| deadline | TEXT | ISO date |
| status | TEXT | `'active'` \| `'completed'` |
| created_at | TIMESTAMP | |

### `saved_exercises` (My Library)
| Column | Type | Notes |
|---|---|---|
| id | SERIAL / INTEGER | PK |
| user_id | INTEGER | FK → users.id |
| name | TEXT | Exercise name |
| exercise_data | TEXT | Full exercise JSON (stringified) |
| source | TEXT | `'web'` (from wger) or `'local'` |
| saved_at | TIMESTAMP | |

---

## 6. Backend API Reference

**Production Base URL:** `https://fittrack-production-f9ad.up.railway.app/api`
**Local Base URL:** `http://localhost:5000/api`
**Auth:** `Authorization: Bearer <JWT>` on all protected routes
**JWT expiry:** 7 days

### Authentication
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | — | `{ username, email?, password }` → returns `{ token, user }` |
| POST | `/auth/login` | — | `{ username, password }` → returns `{ token, user }` |
| GET | `/auth/me` | ✓ | Returns current user object |

### Workouts
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/workouts` | ✓ | Query: `?start_date=&end_date=` |
| POST | `/workouts` | ✓ | `{ workout_type, duration_minutes, calories_burned, notes, date, exercises[] }` |
| DELETE | `/workouts/:id` | ✓ | Deletes workout + child exercises (CASCADE) |

### Goals
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/goals` | ✓ | All goals for user, ordered by created_at DESC |
| POST | `/goals` | ✓ | `{ title, target_value, unit, deadline? }` |
| PATCH | `/goals/:id` | ✓ | Partial update — any goal field |
| DELETE | `/goals/:id` | ✓ | |

### Stats
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/stats` | ✓ | Returns `{ total_workouts, this_week, total_calories, total_minutes, active_goals, weekly_data[], workout_types[], streak }` |

### Exercise Online Search
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/exercises/search?q=<term>` | ✓ | Fetches from wger.de API, returns up to 4 results |

### My Library (Saved Exercises)
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/exercises/saved` | ✓ | Returns user's saved exercises |
| POST | `/exercises/saved` | ✓ | `{ name, ...exerciseData }` — saves exercise to library |
| DELETE | `/exercises/saved/:id` | ✓ | Removes exercise from library |

### Utilities
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/calories/estimate` | ✓ | `{ workout_type, duration_minutes, weight_kg }` → MET estimate |
| GET | `/health` | — | Returns `{ status, service, database, timestamp }` |
| POST | `/seed` | ✓ | Inserts 20 sample workouts + 4 goals for current user |

---

## 7. Frontend Architecture

### Auth Flow
```
App mounts
  └─ AuthContext reads localStorage (fittrack_token, fittrack_user)
       ├─ Token found → set axios default header → setUser()
       └─ No token   → user = null

Route render
  ├─ ProtectedRoute: user=null → redirect /login
  └─ PublicRoute:    user set  → redirect /
```

### `api.js` — Dynamic Base URL
```js
const API_BASE = process.env.REACT_APP_API_URL
  || `http://${window.location.hostname}:5000/api`;
```
- Production: uses `REACT_APP_API_URL` env var (Railway URL)
- Local: uses `window.location.hostname` (works for LAN access too)

### `api.js` exports
```js
// Auth
register(data), loginApi(data), getMe()

// Workouts
getWorkouts(params), createWorkout(data), deleteWorkout(id)

// Goals
getGoals(), createGoal(data), updateGoal(id, data), deleteGoal(id)

// Stats
getStats()

// Utilities
estimateCalories(data), healthCheck(), seedData()

// Exercise Online Search
searchExercisesOnline(q)

// My Library
getSavedExercises(), saveExercise(data), deleteSavedExercise(id)
```

**401 interceptor** — any 401 response clears localStorage + redirects to `/login` automatically.

### Pages

| Page | Route | Key Features |
|---|---|---|
| **Login** | `/login` | Sign-in / Register tabs, password toggle, JWT stored to localStorage |
| **Dashboard** | `/` | 6 stat cards, weather widget (Open-Meteo + Nominatim), Load Demo Data button, recent workouts |
| **Workouts** | `/workouts` | Add workout form (exercise rows, type chips, auto-calorie toggle), workout list with delete |
| **Goals** | `/goals` | Create/update/delete goals, progress bars, deadline tracking, status badges |
| **Exercises** | `/exercises` | 153-exercise library, 7 category tabs, online search tab, My Library tab, detail modal |

### Mobile Responsive Design
- **≥ 769px:** Full sidebar on left, main content fills remaining width
- **≤ 768px:** Sidebar becomes bottom tab bar (fixed, icon + label stacked), `MobileHeader` shows at top with logo
- **≤ 480px:** Further padding/font adjustments for small screens
- Modals slide up from bottom on mobile
- Charts resize at 900px breakpoint

### Sidebar / MobileHeader
- **Desktop:** Logo, nav links (Dashboard · Workouts · Goals · Exercises), user avatar + logout
- **Mobile:** Top bar with FitTrack logo; bottom tab bar with same nav links as icons + labels

---

## 8. Exercise Library

**File:** `frontend/src/data/exercises.js`
**Export:** `EXERCISE_DB` — array of 153 exercise objects

### Category Breakdown
| Category | Count |
|---|---|
| Chest | 22 |
| Back | 22 |
| Shoulders | 22 |
| Arms (Biceps + Triceps) | 22 |
| Legs | 21 |
| Core | 22 |
| Cardio | 22 |

### Exercise Object Schema
```js
{
  id:          Number,
  name:        String,
  category:    String,
  muscle:      String,          // primary muscle (display)
  muscles:     String[],        // primary muscles array
  secondary:   String[],        // secondary muscles
  difficulty:  'Beginner' | 'Intermediate' | 'Advanced',
  equipment:   String,
  sets:        String,          // e.g. '3–4 sets × 8–12 reps'
  rest:        String,
  description: String,
  steps:       String[],        // 4-step instructions
  tips:        String[],        // 2 pro tips
  mistakes:    String[],        // 2 common mistakes
  videoSearch: String,          // YouTube search query
}
```

### Online Search (wger.de API)
- Backend route: `GET /api/exercises/search?q=<term>`
- Calls `wger.de/api/v2/exercise/search/` for suggestions
- Fetches `wger.de/api/v2/exerciseinfo/<base_id>/` for full details
- Filters English translations by `language == 2`
- Strips HTML tags from descriptions
- Returns up to 4 results with muscles, equipment, steps
- Results can be saved to **My Library** (stored in `saved_exercises` table)

---

## 9. External APIs Used

| Service | Purpose | API Key |
|---|---|---|
| Open-Meteo | Current weather + temperature on Dashboard | ❌ None |
| Nominatim (OpenStreetMap) | Reverse geocoding (coords → city name) | ❌ None |
| wger.de REST API | Online exercise search | ❌ None |
| YouTube Search URL | Video tutorial links in exercise modal | ❌ None |

---

## 10. Key Implementation Details

### JWT Auth
- Generated server-side with `PyJWT`, signed with `SECRET_KEY`
- Payload: `{ user_id, username, plan, exp }`
- Expiry: 7 days
- Stored: `localStorage` as `fittrack_token` + `fittrack_user`
- Injected: `axios.defaults.headers.common['Authorization']`
- Auto-logout: 401 interceptor in `api.js`

### Dual Database (`_DBConn` class in `app.py`)
```python
# Detection
DATABASE_URL = os.environ.get('DATABASE_URL')
def _is_pg(): return bool(DATABASE_URL)

# Usage
conn = get_db()          # returns _DBConn instance
conn.execute(sql, params)   # handles ? → %s for PostgreSQL
conn.insert(sql, params)    # handles RETURNING id for PostgreSQL
conn.commit() / conn.rollback() / conn.close()
```

### `init_db()` — Race Condition Fix
Uses `autocommit=True` on PostgreSQL so each `CREATE TABLE IF NOT EXISTS` is its own transaction — prevents UniqueViolation when 2 gunicorn workers start simultaneously.

### Calorie Estimation (MET Formula)
```
calories = MET_value × weight_kg × (duration_minutes / 60)
```
MET values for 10 workout types stored in `MET_VALUES` dict in `app.py`.

### Streak Calculation
Backend queries distinct workout dates ordered DESC, counts consecutive days from today. Returned in `/api/stats` as `streak`.

### Weather Widget
1. `navigator.geolocation` → lat/lng
2. `api.open-meteo.com` → WMO weather code + temperature
3. `nominatim.openstreetmap.org` → city name
4. Silently hides if geolocation denied or API fails

---

## 11. CSS Design System

All styles in `frontend/src/index.css`:

```css
--bg-primary:      #0d0d0d
--bg-secondary:    #141414
--bg-tertiary:     #1a1a1a
--accent-primary:  #6c5ce7   /* purple brand colour */
--accent-secondary:#a29bfe
--text-primary:    #ffffff
--text-secondary:  #a0a0a0
--text-muted:      #606060
--border-color:    rgba(255,255,255,0.06)
--success:         #2ed573
--warning:         #ffa502
--danger:          #ff6b6b
```

Key classes: `.card`, `.btn`, `.btn-primary`, `.btn-danger`, `.form-input`, `.form-select`, `.badge`, `.spinner`, `.modal`, `.modal-overlay`, `.sidebar`, `.nav-link`, `.page-header`, `.empty-state`, `.ex-grid`, `.ex-card`, `.ex-category-tabs`, `.ex-modal-*`, `.mobile-header`, `.ex-web-badge`, `.ex-saved-badge`, `.ex-save-btn`, `.ex-online-section`

---

## 12. Environment Variables

### Backend (Railway Variables / `backend/.env` locally)
| Variable | Value | Notes |
|---|---|---|
| `SECRET_KEY` | `fittrack-2026` | JWT signing key |
| `FLASK_ENV` | `production` | Disables debug mode |
| `PORT` | `5000` | Gunicorn bind port |
| `DATABASE_URL` | PostgreSQL connection string | Set by Railway; if absent → SQLite |

### Frontend (Vercel / `frontend/.env` locally)
| Variable | Value | Notes |
|---|---|---|
| `REACT_APP_API_URL` | `https://fittrack-production-f9ad.up.railway.app/api` | Production API URL |

---

## 13. How to Run Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
python app.py
# Runs at http://localhost:5000 (SQLite, no DATABASE_URL set)

# Frontend
cd frontend
npm install
npm start
# Runs at http://localhost:3000
```

LAN access (e.g. friend on same WiFi):
- Frontend auto-uses `window.location.hostname` for API URL
- Visit `http://<your-ip>:3000` from any device on the network

---

## 14. Known Issues / Future Work

- `datetime.utcnow()` deprecation warning in Python 3.12+ (non-breaking)
- `/api/auth/upgrade` endpoint exists in backend but unused in UI
- No password reset / forgot-password flow
- No workout editing (add + delete only)
- No profile page (change username/email/password)
- SQLite database file lost on Railway container restart — solved by PostgreSQL in production
- wger.de API can be slow (6s timeout per request)
