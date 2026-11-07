import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ZTennisLogo from '../components/ZTennisLogo';

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, signupTrainee, loginWithGoogle, isAuthenticated, isTraineeAuthenticated } = useAuth();

  const isBookingRedirect = searchParams.get('redirect') === 'booking' || searchParams.get('action') === 'book';
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  // Mode: 'signin' or 'signup'
  const [mode, setMode] = useState(initialMode);

  // Form states for manual registration
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Google Account prompt state
  const [googlePromptOpen, setGooglePromptOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [notRegisteredError, setNotRegisteredError] = useState(false);
  const [alreadyRegisteredError, setAlreadyRegisteredError] = useState(false);

  // Google Identity Services (GIS) integration
  const googleBtnRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Clear any legacy cached Google accounts from localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('last_google_account');
    } catch (e) {}
  }, []);

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

  // Initialize native Google Identity Services if a Client ID is provided
  useEffect(() => {
    if (window.google?.accounts?.id && googleClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response.credential) {
              setGoogleLoading(true);
              try {
                await loginWithGoogle({ credential: response.credential, mode });
                handleSuccessRedirect();
              } catch (err) {
                setError(err.message || 'Google sign-in failed');
              } finally {
                setGoogleLoading(false);
              }
            }
          },
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            text: mode === 'signup' ? 'signup_with' : 'signin_with',
            shape: 'pill',
            width: 380,
          });
        }
      } catch (err) {
        console.warn('Google Identity Services init error:', err);
      }
    }
  }, [mode, googleClientId]);

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
    setGoogleError('');
    setNotRegisteredError(false);
    setAlreadyRegisteredError(false);
  };

  // Submit Manual Sign In or Sign Up
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
        // Sign In (Checks coach first, then trainee)
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

  // Open Google Account selector (does NOT require manual form input!)
  const handleOpenGoogleAuth = () => {
    setError('');
    setGoogleError('');
    setNotRegisteredError(false);
    setAlreadyRegisteredError(false);
    setGooglePromptOpen(true);
  };

  // Execute Google Authentication with chosen Google account
  const handleExecuteGoogle = async (targetEmail, targetName = '', currentMode = mode) => {
    const emailToUse = (targetEmail || googleEmail).trim().toLowerCase();
    const nameToUse = (targetName || googleName || (emailToUse ? emailToUse.split('@')[0] : '')).trim();

    if (!emailToUse || !emailToUse.includes('@')) {
      setGoogleError('Please provide a valid Gmail or Google account address.');
      return;
    }

    try {
      setGoogleLoading(true);
      setGoogleError('');

      await loginWithGoogle({
        email: emailToUse,
        name: nameToUse,
        mode: currentMode, // 'signin' or 'signup'
      });

      setGooglePromptOpen(false);
      handleSuccessRedirect();
    } catch (err) {
      const msg = err.message || 'Google authentication failed';
      setGoogleError(msg);
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

          {/* Native Google Identity Services Button Container (if configured) */}
          {googleClientId && (
            <div className="flex justify-center mb-2">
              <div ref={googleBtnRef} />
            </div>
          )}

          {/* Custom Google Sign In / Sign Up Button */}
          <button
            type="button"
            onClick={handleOpenGoogleAuth}
            className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-soft-xs hover:shadow-soft-sm flex items-center justify-center gap-3 cursor-pointer"
          >
            {/* Official Google G Logo */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>
              {mode === 'signup'
                ? 'Sign Up with Google Account'
                : 'Sign In with Google Account'}
            </span>
          </button>

          {/* Simple Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              or with email & password
            </span>
          </div>

          {/* Manual Authentication Form */}
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

      {/* FOOTER */}
      <div className="max-w-md mx-auto w-full text-center pb-4 text-slate-500 text-[11px]">
        ZTennis Coaching Portal • Coach Zoid • Malaybalay City
      </div>

      {/* GOOGLE ACCOUNT PROMPT MODAL */}
      {googlePromptOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 dark:bg-black/85 backdrop-blur-sm animate-fade-in"
          onClick={() => setGooglePromptOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-2xl w-full max-w-md overflow-hidden animate-scale-up border border-slate-100 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Google Brand Header */}
            <div className="p-6 sm:p-7 text-center border-b border-slate-100 dark:border-slate-800 relative bg-slate-50/60 dark:bg-slate-850">
              <button
                type="button"
                onClick={() => setGooglePromptOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>

              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-soft-xs flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              </div>

              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your Google Account to connect to <strong>ZTennis</strong>
              </p>
            </div>

            {/* Google Prompt Body */}
            <div className="p-6 sm:p-7 space-y-4">
              {googleError && (
                <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 p-3.5 rounded-2xl text-xs font-semibold space-y-2">
                  <div className="flex items-start gap-2">
                    <span>⚠️</span>
                    <p className="flex-1 leading-snug">{googleError}</p>
                  </div>
                  {notRegisteredError && (
                    <button
                      type="button"
                      onClick={() => {
                        handleModeSwitch('signup');
                        handleExecuteGoogle(googleEmail, googleName, 'signup');
                      }}
                      className="w-full bg-[#E0749A] hover:bg-[#cf5479] text-white py-2 px-3 rounded-xl font-bold text-xs shadow-soft-xs cursor-pointer text-center"
                    >
                      Sign Up with this Google Account Now →
                    </button>
                  )}
                </div>
              )}

              {/* Enter Google Account */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Google / Gmail Account:
                  </label>
                  <input
                    type="email"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    autoFocus
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#E0749A] outline-none border-0 transition-all placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleExecuteGoogle(googleEmail, googleName)}
                  disabled={googleLoading || !googleEmail}
                  className="w-full py-3.5 bg-[#E0749A] hover:bg-[#cf5479] text-white rounded-xl font-bold text-xs sm:text-sm shadow-soft-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>
                    {googleLoading
                      ? 'Connecting Google Account...'
                      : mode === 'signup'
                      ? 'Sign Up with Google Account →'
                      : 'Sign In with Google Account →'}
                  </span>
                </button>
              </div>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your tennis coaching confirmations and schedule notifications will be delivered to this Google account.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}