import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate('/dashboard/bookings', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard/bookings', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo with "Z" brand mark */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 text-white font-extrabold text-2xl hover:opacity-90 transition-opacity">
            <span className="w-10 h-10 rounded-xl bg-white text-slate-900 font-black text-xl flex items-center justify-center shadow-soft-sm">
              Z
            </span>
            <span>Z Tennis Coach</span>
          </Link>
          <p className="text-slate-400 mt-2 text-sm font-medium">Coach Dashboard Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-soft-xl p-8 border border-slate-200/80">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6 text-center">Sign In</h2>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all font-medium"
                placeholder="coach@tennisph.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-hover-glow w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-sm shadow-soft-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors">
              ← Return to Public Site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
