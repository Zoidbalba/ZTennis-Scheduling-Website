import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Coach
  const [isTraineeAuthenticated, setIsTraineeAuthenticated] = useState(false); // Trainee
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState(null);
  const [trainee, setTrainee] = useState(null);

  useEffect(() => {
    async function restoreAuth() {
      try {
        const coachToken = localStorage.getItem('coach_token');
        const traineeToken = localStorage.getItem('trainee_token');

        if (coachToken) {
          try {
            const profile = await api.getProfile();
            setCoach(profile);
            setIsAuthenticated(true);
          } catch (e) {
            localStorage.removeItem('coach_token');
            setIsAuthenticated(false);
          }
        }

        if (traineeToken) {
          try {
            const cached = localStorage.getItem('trainee_user');
            if (cached) setTrainee(JSON.parse(cached));
            const me = await api.getAuthMe();
            if (me && me.role === 'trainee') {
              setTrainee(me.user);
              localStorage.setItem('trainee_user', JSON.stringify(me.user));
              setIsTraineeAuthenticated(true);
            }
          } catch (e) {
            localStorage.removeItem('trainee_token');
            localStorage.removeItem('trainee_user');
            setIsTraineeAuthenticated(false);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    restoreAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('coach_token', data.token);
    const profile = await api.getProfile();
    setCoach(profile);
    setIsAuthenticated(true);
    return data;
  };

  const loginWithGoogle = async (payload) => {
    const data = await api.loginGoogle(payload);
    localStorage.setItem('trainee_token', data.token);
    localStorage.setItem('trainee_user', JSON.stringify(data.trainee));
    setTrainee(data.trainee);
    setIsTraineeAuthenticated(true);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('coach_token');
    localStorage.removeItem('trainee_token');
    localStorage.removeItem('trainee_user');
    setIsAuthenticated(false);
    setIsTraineeAuthenticated(false);
    setCoach(null);
    setTrainee(null);
  };

  const logoutTrainee = () => {
    localStorage.removeItem('trainee_token');
    localStorage.removeItem('trainee_user');
    setIsTraineeAuthenticated(false);
    setTrainee(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isTraineeAuthenticated,
        loading,
        coach,
        trainee,
        login,
        loginWithGoogle,
        logout,
        logoutTrainee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
