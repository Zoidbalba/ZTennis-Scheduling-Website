import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('coach_token');
    if (token) {
      api.getProfile()
        .then((profile) => {
          setCoach(profile);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('coach_token');
          setIsAuthenticated(false);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('coach_token', data.token);
    const profile = await api.getProfile();
    setCoach(profile);
    setIsAuthenticated(true);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('coach_token');
    setIsAuthenticated(false);
    setCoach(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, coach, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
