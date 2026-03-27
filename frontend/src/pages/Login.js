import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Eye, EyeOff, ArrowRight, Dumbbell } from 'lucide-react';
import { register, loginApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setForm({ username: '', email: '', password: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await loginApi({ username: form.username, password: form.password });
      } else {
        res = await register(form);
      }
      authLogin(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background orbs */}
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Dumbbell size={22} />
          </div>
          <div>
            <h1 className="auth-brand">FitTrack</h1>
            <p className="auth-tagline">Your professional fitness companion</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Create Account
          </button>
          <div
            className="auth-tab-indicator"
            style={{ transform: `translateX(${mode === 'login' ? '0%' : '100%'})` }}
          />
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Username */}
          <div className="auth-field">
            <User size={15} className="auth-field-icon" />
            <input
              className="auth-input"
              placeholder="Username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
              autoComplete="username"
              autoFocus
            />
          </div>

          {/* Email (register only) */}
          {mode === 'register' && (
            <div className="auth-field auth-field-animate">
              <Mail size={15} className="auth-field-icon" />
              <input
                type="email"
                className="auth-input"
                placeholder="Email (optional)"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
          )}

          {/* Password */}
          <div className="auth-field">
            <Lock size={15} className="auth-field-icon" />
            <input
              type={showPass ? 'text' : 'password'}
              className="auth-input"
              placeholder={mode === 'register' ? 'Password (min 6 characters)' : 'Password'}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button type="button" className="auth-eye" onClick={() => setShowPass(s => !s)}>
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {error && (
            <div className="auth-error">
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <span className="spinner" />
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            className="auth-switch"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>

        {mode === 'login' && (
          <div className="auth-hint">
            New here? Create a free account — then click "Load Demo Data" on the dashboard to explore.
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
