import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fittrack_token');
    const saved = localStorage.getItem('fittrack_user');
    if (token && saved) {
      try {
        const userData = JSON.parse(saved);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
      } catch {
        localStorage.removeItem('fittrack_token');
        localStorage.removeItem('fittrack_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('fittrack_token', token);
    localStorage.setItem('fittrack_user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('fittrack_token');
    localStorage.removeItem('fittrack_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
