"""
Tests for FitTrack API
Run with: pytest test_app.py -v
"""

import pytest
import json
import os
import tempfile
from app import app, init_db, DATABASE


@pytest.fixture
def client():
    """Create test client with temporary database."""
    app.config['TESTING'] = True
    db_fd, db_path = tempfile.mkstemp()

    import app as app_module
    original_db = app_module.DATABASE
    app_module.DATABASE = db_path

    with app.test_client() as client:
        with app.app_context():
            init_db()
        yield client

    app_module.DATABASE = original_db
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def auth_client(client):
    """Test client with a registered user and auth token."""
    res = client.post('/api/auth/register',
                      data=json.dumps({'username': 'testuser', 'password': 'testpass123'}),
                      content_type='application/json')
    token = json.loads(res.data)['token']
    client.token = token
    client.auth_headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    return client


class TestHealthCheck:
    def test_health_endpoint(self, client):
        response = client.get('/api/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert data['service'] == 'FitTrack API'


class TestAuth:
    def test_register(self, client):
        res = client.post('/api/auth/register',
                          data=json.dumps({'username': 'newuser', 'password': 'password123'}),
                          content_type='application/json')
        assert res.status_code == 201
        data = json.loads(res.data)
        assert 'token' in data
        assert data['user']['username'] == 'newuser'

    def test_login(self, auth_client):
        res = auth_client.post('/api/auth/login',
                               data=json.dumps({'username': 'testuser', 'password': 'testpass123'}),
                               content_type='application/json')
        assert res.status_code == 200
        assert 'token' in json.loads(res.data)

    def test_login_wrong_password(self, auth_client):
        res = auth_client.post('/api/auth/login',
                               data=json.dumps({'username': 'testuser', 'password': 'wrongpass'}),
                               content_type='application/json')
        assert res.status_code == 401

    def test_protected_route_no_token(self, client):
        res = client.get('/api/workouts')
        assert res.status_code == 401


class TestWorkouts:
    def test_get_workouts_empty(self, auth_client):
        response = auth_client.get('/api/workouts', headers=auth_client.auth_headers)
        assert response.status_code == 200
        assert json.loads(response.data) == []

    def test_create_workout(self, auth_client):
        workout = {
            "workout_type": "Strength",
            "duration_minutes": 60,
            "calories_burned": 400,
            "date": "2026-03-20",
            "notes": "Leg day",
            "exercises": [
                {"name": "Squat", "sets": 4, "reps": 10, "weight_kg": 70}
            ]
        }
        response = auth_client.post('/api/workouts',
                                    data=json.dumps(workout),
                                    headers=auth_client.auth_headers)
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['workout_type'] == 'Strength'

    def test_create_workout_missing_fields(self, auth_client):
        response = auth_client.post('/api/workouts',
                                    data=json.dumps({"workout_type": "Cardio"}),
                                    headers=auth_client.auth_headers)
        assert response.status_code == 400

    def test_delete_workout(self, auth_client):
        workout = {
            "workout_type": "Running",
            "duration_minutes": 30,
            "date": "2026-03-20"
        }
        create_res = auth_client.post('/api/workouts',
                                      data=json.dumps(workout),
                                      headers=auth_client.auth_headers)
        workout_id = json.loads(create_res.data)['id']
        delete_res = auth_client.delete(f'/api/workouts/{workout_id}',
                                        headers=auth_client.auth_headers)
        assert delete_res.status_code == 200


class TestGoals:
    def test_create_goal(self, auth_client):
        goal = {
            "title": "Run 50km",
            "target_value": 50,
            "unit": "km"
        }
        response = auth_client.post('/api/goals',
                                    data=json.dumps(goal),
                                    headers=auth_client.auth_headers)
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['title'] == 'Run 50km'
        assert data['status'] == 'active'

    def test_update_goal_progress(self, auth_client):
        goal = {"title": "Test Goal", "target_value": 100, "unit": "reps"}
        create_res = auth_client.post('/api/goals',
                                      data=json.dumps(goal),
                                      headers=auth_client.auth_headers)
        goal_id = json.loads(create_res.data)['id']

        update_res = auth_client.patch(f'/api/goals/{goal_id}',
                                       data=json.dumps({"current_value": 50}),
                                       headers=auth_client.auth_headers)
        assert update_res.status_code == 200
        assert json.loads(update_res.data)['current_value'] == 50

    def test_delete_goal(self, auth_client):
        goal = {"title": "Delete me", "target_value": 10, "unit": "km"}
        create_res = auth_client.post('/api/goals',
                                      data=json.dumps(goal),
                                      headers=auth_client.auth_headers)
        goal_id = json.loads(create_res.data)['id']
        delete_res = auth_client.delete(f'/api/goals/{goal_id}',
                                        headers=auth_client.auth_headers)
        assert delete_res.status_code == 200


class TestStats:
    def test_get_stats(self, auth_client):
        response = auth_client.get('/api/stats', headers=auth_client.auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'total_workouts' in data
        assert 'weekly_data' in data
        assert 'workout_types' in data


class TestSeedData:
    def test_seed_endpoint(self, auth_client):
        response = auth_client.post('/api/seed', headers=auth_client.auth_headers)
        assert response.status_code == 201

        workouts_res = auth_client.get('/api/workouts', headers=auth_client.auth_headers)
        workouts = json.loads(workouts_res.data)
        assert len(workouts) > 0

        goals_res = auth_client.get('/api/goals', headers=auth_client.auth_headers)
        goals = json.loads(goals_res.data)
        assert len(goals) > 0
