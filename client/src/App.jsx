import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Home from './pages/Home';
import CoachDetails from './pages/CoachDetails';
import Login from './pages/Login';
import DashboardBookings from './pages/DashboardBookings';
import DashboardTrainees from './pages/DashboardTrainees';
import DashboardAvailability from './pages/DashboardAvailability';
import DashboardRates from './pages/DashboardRates';
import DashboardProfile from './pages/DashboardProfile';
import TraineeBookings from './pages/TraineeBookings';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/coach" element={<CoachDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<Navigate to="/login?mode=signin" replace />} />
          <Route path="/signup" element={<Navigate to="/login?mode=signup" replace />} />
          <Route path="/my-bookings" element={<TraineeBookings />} />
          <Route path="/trainee" element={<Navigate to="/my-bookings" replace />} />
          <Route path="/dashboard" element={<Navigate to="/dashboard/bookings" replace />} />
          <Route path="/dashboard/bookings" element={<ProtectedRoute><DashboardBookings /></ProtectedRoute>} />
          <Route path="/dashboard/trainees" element={<ProtectedRoute><DashboardTrainees /></ProtectedRoute>} />
          <Route path="/dashboard/availability" element={<ProtectedRoute><DashboardAvailability /></ProtectedRoute>} />
          <Route path="/dashboard/rates" element={<ProtectedRoute><DashboardRates /></ProtectedRoute>} />
          <Route path="/dashboard/profile" element={<ProtectedRoute><DashboardProfile /></ProtectedRoute>} />
          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
