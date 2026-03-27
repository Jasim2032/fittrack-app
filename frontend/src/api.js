import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fittrack_token');
      localStorage.removeItem('fittrack_user');
      delete api.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ─── Auth ───────────────────────────────────────────────────
export const register = (data) => api.post('/auth/register', data);
export const loginApi = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// ─── Workouts ───────────────────────────────────────────────
export const getWorkouts = (params = {}) => api.get('/workouts', { params });
export const createWorkout = (data) => api.post('/workouts', data);
export const deleteWorkout = (id) => api.delete(`/workouts/${id}`);

// ─── Goals ──────────────────────────────────────────────────
export const getGoals = () => api.get('/goals');
export const createGoal = (data) => api.post('/goals', data);
export const updateGoal = (id, data) => api.patch(`/goals/${id}`, data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`);

// ─── Stats ──────────────────────────────────────────────────
export const getStats = () => api.get('/stats');

// ─── Calorie estimate ───────────────────────────────────────
export const estimateCalories = (data) => api.post('/calories/estimate', data);

// ─── Health ─────────────────────────────────────────────────
export const healthCheck = () => api.get('/health');

// ─── Seed ───────────────────────────────────────────────────
export const seedData = () => api.post('/seed');

// ─── Exercise Online Search ──────────────────────────────────
export const searchExercisesOnline = (q) => api.get('/exercises/search', { params: { q } });

// ─── My Library (Saved Exercises) ───────────────────────────
export const getSavedExercises   = ()     => api.get('/exercises/saved');
export const saveExercise        = (data) => api.post('/exercises/saved', data);
export const deleteSavedExercise = (id)   => api.delete(`/exercises/saved/${id}`);

export default api;
