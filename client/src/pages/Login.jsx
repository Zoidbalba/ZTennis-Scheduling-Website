import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ZTennisLogo from '../components/ZTennisLogo';

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, loginTrainee, signupTrainee, loginWithGoogle, isAuthenticated, isTraineeAuthenticated } = useAuth();

  const isBookingRedirect = searchParams.get('redirect') === 'booking' || searchParams.get('action') === 'book';
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  // Mode: 'signin' or 'signup'
  const [mode, setMode] = useState(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [notRegisteredError, setNotRegisteredError] = useState(false);
  const [alreadyRegisteredError, setAlreadyRegisteredError] = useState(false);

  // If already logged in, redirect appropriately
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard/bookings', { replace: true });
    } else if (isTraineeAuthenticated) {
      const pending = sessionStorage.getItem('pending_booking_slot');
      if (pending) {
        navigate('/?booking=ready', { replace: true });
      } else {
        navigate('/my-bookings', { replace: true });
      }
    }
  }, [isAuthenticated, isTraineeAuthenticated, navigate]);

  const handleSuccessRedirect = () => {
    const pending = sessionStorage.getItem('pending_booking_slot');
    if (pending) {
      navigate('/?booking=ready', { replace: true });
    } else {
      navigate('/my-bookings', { replace: true });
    }
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setError('');
    setNotRegisteredError(false);
    setAlreadyRegisteredError(false);
  };

  // Submit Sign In or Sign Up
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotRegisteredError(false);
    setAlreadyRegisteredError(false);
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Trainee Registration
        await signupTrainee({ name, email, phone, password });
        handleSuccessRedirect();
      } else {
        // Sign In (Checks coach first, then trainee. If trainee not registered, backend rejects!)
        const res = await login(email, password);
        if (res.role === 'coach') {
          navigate('/dashboard/bookings', { replace: true });
        } else {
          handleSuccessRedirect();
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      const msg = err.message || 'Authentication failed';
      setError(msg);

      if (err.notRegistered || msg.toLowerCase().includes('not signed up') || msg.toLowerCase().includes('no account found')) {
        setNotRegisteredError(true);
      } else if (err.status === 409 || msg.toLowerCase().includes('already exists')) {
        setAlreadyRegisteredError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Google Sign In / Sign Up
  const handleGoogleAuth = async () => {
    setError('');
    setNotRegisteredError(false);
    setAlreadyRegisteredError(false);

    if (!email || !email.includes('@')) {
      setError('Please type your Gmail or email address into the Email field above to continue with Google.');
      return;
    }

    try {
      setGoogleLoading(true);
      await loginWithGoogle({
        email: email.trim().toLowerCase(),
        name: name.trim() || email.split('@')[0],
        mode, // 'signin' or 'signup'
      });
      handleSuccessRedirect();
    } catch (err) {
      const msg = err.message || 'Google authentication failed';
      setError(msg);
      if (err.notRegistered || msg.toLowerCase().includes('not signed up') || msg.toLowerCase().includes('no account found')) {
        setNotRegisteredError(true);
      } else if (err.status === 409 || msg.toLowerCase().includes('already exists')) {
        setAlreadyRegisteredError(true);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#14060f] dark:bg-[#0d0309] flex flex-col justify-between p-4 sm:p-6 transition-colors selection:bg-[#E0749A] selection:text-white">
      {/* Top Brand Bar */}
      <div className="max-w-md mx-auto w-full pt-4 sm:pt-8 pb-4 flex items-center justify-between">
        <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
          <ZTennisLogo
            className="w-10 h-10 sm:w-11 sm:h-11"
            textClassName="text-xl sm:text-2xl text-white font-black"
            textColor="text-white"
            showTagline={true}
            taglineColor="text-[#E0749A]"
          />
        </Link>
        <Link
          to="/"
          className="text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
        >
          ← Back to Site
        </Link>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md mx-auto my-auto py-4">
        {/* Friendly Booking Notice Banner */}
        {isBookingRedirect && (
          <div className="mb-4 bg-gradient-to-r from-pink-950/80 via-[#20101a] to-emerald-950/80 border border-[#E0749A]/50 rounded-2xl p-4 shadow-soft-lg animate-fade-in text-white">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🎾</span>
              <div>
                <h4 className="font-extrabold text-sm text-[#FFDBE5]">Sign In Required to Book</h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Booking is exclusively available to signed-in trainees so Coach Zoid can send schedule confirmation emails and manage your sessions.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 animate-scale-up">
          {/* Simple Tab Switcher: Sign In vs Sign Up */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => handleModeSwitch('signin')}
              className={`py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-soft-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('signup')}
              className={`py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#E0749A] text-white shadow-soft-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {mode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {mode === 'signin'
                ? 'Sign in to access your tennis bookings and reserve training slots.'
                : 'Sign up to schedule private and group coaching lessons with Coach Zoid.'}
            </p>
          </div>

          {/* Primary Alert / Error Banner */}
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 px-4 py-3.5 rounded-2xl text-xs font-semibold mb-5 space-y-2 animate-fade-in">
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">⚠️</span>
                <p className="flex-1 leading-snug">{error}</p>
              </div>

              {/* Actionable Switch Button when not signed up yet! */}
              {notRegisteredError && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('signup')}
                    className="w-full bg-[#E0749A] hover:bg-[#cf5479] text-white py-2 px-3 rounded-xl font-bold text-xs shadow-soft-xs transition-colors cursor-pointer text-center"
                  >
                    Click Here to Sign Up Now →
                  </button>
                </div>
              )}

              {/* Actionable Switch Button when already registered */}
              {alreadyRegisteredError && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('signin')}
                    className="w-full bg-[#1F7A5A] hover:bg-[#165a42] text-white py-2 px-3 rounded-xl font-bold text-xs shadow-soft-xs transition-colors cursor-pointer text-center"
                  >
                    Click Here to Sign In Instead →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Juan dela Cruz"
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E0749A] outline-none transition-all font-medium border-0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Phone / Contact Number (optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0917 123 4567"
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E0749A] outline-none transition-all font-medium border-0"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="youremail@gmail.com"
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E0749A] outline-none transition-all font-medium border-0"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Password *
                </label>
                {mode === 'signup' && (
                  <span className="text-[10px] text-slate-400">At least 6 characters</span>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E0749A] outline-none transition-all font-medium border-0"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E0749A] hover:bg-[#cf5479] text-white py-3.5 rounded-xl font-black text-sm shadow-soft-xs hover:shadow-soft-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading
                ? mode === 'signup'
                  ? 'Creating account...'
                  : 'Signing in...'
                : mode === 'signup'
                ? 'Create Account & Continue →'
                : 'Sign In →'}
            </button>
          </form>

          {/* Simple Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <span className="relative bg-white dark:bg-slate-900 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              or continue with Google
            </span>
          </div>

          {/* Google Sign In / Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading}
            className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {/* Official Google G Logo */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>
              {googleLoading
                ? 'Connecting to Google...'
                : mode === 'signup'
                ? 'Sign Up with Google / Gmail'
                : 'Sign In with Google / Gmail'}
            </span>
          </button>

          {/* Toggle between Sign In and Sign Up at bottom */}
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            {mode === 'signin' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => handleModeSwitch('signup')}
                  className="font-bold text-[#E0749A] hover:underline cursor-pointer"
                >
                  Sign Up here
                </button>
              </p>
            ) : (
              <p>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => handleModeSwitch('signin')}
                  className="font-bold text-[#E0749A] hover:underline cursor-pointer"
                >
                  Sign In here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto w-full text-center pb-4 text-slate-500 text-[11px]">
        ZTennis Coaching Portal • Coach Zoid • Malaybalay City
      </div>
    </div>
  );
}