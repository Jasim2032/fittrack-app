import React from 'react';
import {
  BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate
} from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Target, LogOut, BookOpen } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Goals from './pages/Goals';
import Exercises from './pages/Exercises';
import Login from './pages/Login';

// ─── Route Guards ─────────────────────────────────────────────

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-primary)'
      }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

// ─── Sidebar ──────────────────────────────────────────────────

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">F</div>
        <h1>FitTrack</h1>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard /> Dashboard
        </NavLink>
        <NavLink to="/workouts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Dumbbell /> Workouts
        </NavLink>
        <NavLink to="/goals" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Target /> Goals
        </NavLink>
        <NavLink to="/exercises" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BookOpen /> Exercises
        </NavLink>
      </nav>

      {/* User section */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">{initial}</div>
        <div className="sidebar-username">{user?.username}</div>
        <button className="sidebar-logout" onClick={handleLogout} title="Log out">
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile Top Header ─────────────────────────────────────────

function MobileHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initial = user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <header className="mobile-header">
      <div className="mobile-logo">
        <div className="logo-icon" style={{ width: 30, height: 30, fontSize: 14 }}>F</div>
        <span className="mobile-logo-text">FitTrack</span>
      </div>
      <div className="mobile-header-right">
        <div className="sidebar-user-avatar" style={{ width: 30, height: 30, fontSize: 12 }}>
          {initial}
        </div>
        <button className="sidebar-logout" onClick={() => { logout(); navigate('/login'); }} title="Log out">
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}

// ─── App Layout ────────────────────────────────────────────────

function AppLayout() {
  return (
    <div className="app-layout">
      <MobileHeader />
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/exercises" element={<Exercises />} />
        </Routes>
      </main>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
