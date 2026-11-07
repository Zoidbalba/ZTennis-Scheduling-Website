import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ZTennisLogo from '../components/ZTennisLogo';

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
    <div className="min-h-screen bg-[#14060f] dark:bg-[#0d0309] flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md">
        {/* Official Brand Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
            <ZTennisLogo
              className="w-12 h-12 mx-auto"
              textClassName="text-2xl text-white font-black"
              textColor="text-white"
              showTagline={true}
              taglineColor="text-[#E0749A]"
            />
          </Link>
          <p className="text-[#FFDBE5]/80 mt-2 text-xs font-semibold">Coach Dashboard Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl p-8">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6 text-center">Sign In</h2>

          {error && (
            <div className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 px-4 py-3 rounded-2xl text-xs font-semibold mb-4">
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
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E27396] outline-none transition-all font-medium border-0"
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
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E27396] outline-none transition-all font-medium border-0"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-hover-pink w-full bg-[#E27396] hover:bg-[#cf5479] text-white py-3.5 rounded-xl font-black text-sm shadow-soft-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#E27396] dark:hover:text-[#EA9AB2] font-semibold transition-colors">
              ← Return to Public Site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
