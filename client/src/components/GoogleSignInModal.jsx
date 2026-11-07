import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ZTennisLogo from './ZTennisLogo';

export default function GoogleSignInModal({ isOpen, onClose, onSuccess, initialEmail = '' }) {
  const { loginWithGoogle } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  // Support ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please provide a valid Gmail or email address.');
      return;
    }

    try {
      setLoading(true);
      await loginWithGoogle({
        email: email.trim().toLowerCase(),
        name: name.trim() || email.split('@')[0],
      });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl w-full max-w-md overflow-hidden animate-scale-up border border-slate-100 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1A1118] text-white p-6 sm:p-7 relative text-center">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
          <div className="flex justify-center mb-2">
            <ZTennisLogo className="w-9 h-9" textClassName="text-xl text-white font-black" textColor="text-white" showTagline={true} />
          </div>
          <span className="inline-block mt-3 bg-white/10 text-[#FFDBE5] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
            Trainee Portal
          </span>
          <h3 className="text-xl sm:text-2xl font-black mt-2">Sign in with Google</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
            Check if your schedule was accepted, receive email confirmations, and follow up directly with Coach Zoid.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7 space-y-4">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold p-3.5 rounded-2xl border border-rose-200/80 dark:border-rose-900/50">
              {error}
            </div>
          )}

          {/* Google One-Click Action Card */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Gmail Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  {/* Google G icon */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#E0749A] outline-none border-0 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Your Full Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Tan"
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#E0749A] outline-none border-0 transition-all placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#E0749A] hover:bg-[#cf5479] text-white rounded-xl font-black text-sm shadow-soft-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Continue with Google / Gmail →'}</span>
            </button>
          </form>

          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              By continuing, your booking schedule confirmations and coach responses will be sent directly to your Gmail inbox.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
