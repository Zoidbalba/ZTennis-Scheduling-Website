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
    <div className="min-h-screen bg-[#022414] flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md">
        {/* Logo with "Z" brand mark */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 text-white font-extrabold text-2xl hover:opacity-90 transition-opacity">
            <span className="w-10 h-10 rounded-xl bg-[#f1a6bc] text-[#022414] font-black text-xl flex items-center justify-center shadow-soft-sm">
              Z
            </span>
            <span>Z Tennis Coach</span>
          </Link>
          <p className="text-[#a7c6af] mt-2 text-sm font-medium">Coach Dashboard Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl p-8 border border-slate-200/80 dark:border-slate-800">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6 text-center">Sign In</h2>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl text-xs font-semibold mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                placeholder="coach@tennisph.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-hover-pink w-full bg-[#022414] hover:bg-[#5e8d66] dark:bg-[#5e8d66] dark:hover:bg-[#f1a6bc] text-white dark:hover:text-[#022414] py-3.5 rounded-xl font-black text-sm shadow-soft-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-semibold transition-colors">
              ← Return to Public Site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
