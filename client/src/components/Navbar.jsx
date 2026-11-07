import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import ZTennisLogo from './ZTennisLogo';
import GoogleSignInModal from './GoogleSignInModal';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isTraineeAuthenticated, trainee, logout, logoutTrainee } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/#' + id);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm py-3'
          : 'bg-white dark:bg-slate-950 py-4 sm:py-5'
      }`}
    >
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between">
          {/* Official ZTennis Brand Logo matching Brand Guide */}
          <Link to="/" className="flex items-center">
            <ZTennisLogo
              className="w-8 h-8 sm:w-9 sm:h-9"
              textClassName="text-xl sm:text-2xl font-black"
              showTagline={true}
            />
          </Link>

          {/* Desktop Navigation matching Figma Screenshot 1 */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
            <button
              onClick={() => scrollToSection('coach')}
              className="text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('sessions')}
              className="text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Sessions
            </button>
            <button
              onClick={() => scrollToSection('availability')}
              className="text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Availability
            </button>

            {/* Trainee / Coach Auth Status */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="text-xs lg:text-sm font-bold text-[#1F7A5A] dark:text-emerald-400 hover:underline"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : isTraineeAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/my-bookings"
                  className="inline-flex items-center gap-1.5 text-xs lg:text-sm font-bold text-[#1F7A5A] dark:text-emerald-400 hover:underline"
                >
                  <span>🎾</span>
                  <span>My Bookings</span>
                </Link>
                <button
                  onClick={logoutTrainee}
                  className="text-xs font-semibold text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/my-bookings"
                  className="text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
                >
                  My Bookings
                </Link>
                <button
                  onClick={() => setGoogleModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs lg:text-sm font-bold text-[#E0749A] hover:text-[#cf5479] transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Google Sign-In</span>
                </button>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  Coach
                </Link>
              </div>
            )}

            {/* Book a lesson pill button */}
            <button
              onClick={() => scrollToSection('availability')}
              className="bg-[#E0749A] hover:bg-[#cf5479] text-white text-xs lg:text-sm font-bold px-5 py-2.5 rounded-xl shadow-soft-xs hover:shadow-soft-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Book a lesson</span>
              <span className="text-base leading-none">→</span>
            </button>

            <ThemeToggle />
          </nav>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-5 space-y-4 shadow-lg animate-fade-in-up">
          <button
            onClick={() => {
              scrollToSection('coach');
              setMobileOpen(false);
            }}
            className="block w-full text-left font-bold text-sm text-slate-800 dark:text-slate-200 py-2 cursor-pointer"
          >
            About
          </button>
          <button
            onClick={() => {
              scrollToSection('sessions');
              setMobileOpen(false);
            }}
            className="block w-full text-left font-bold text-sm text-slate-800 dark:text-slate-200 py-2 cursor-pointer"
          >
            Sessions
          </button>
          <button
            onClick={() => {
              scrollToSection('availability');
              setMobileOpen(false);
            }}
            className="block w-full text-left font-bold text-sm text-slate-800 dark:text-slate-200 py-2 cursor-pointer"
          >
            Availability
          </button>

          <Link
            to="/my-bookings"
            onClick={() => setMobileOpen(false)}
            className="block w-full text-left font-bold text-sm text-[#1F7A5A] dark:text-emerald-400 py-2 cursor-pointer"
          >
            🎾 My Bookings & Schedule
          </Link>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="block font-bold text-sm text-[#1F7A5A] dark:text-emerald-400 py-2"
            >
              Coach Dashboard →
            </Link>
          ) : isTraineeAuthenticated ? (
            <div className="py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                {trainee?.email}
              </span>
              <button
                onClick={() => {
                  logoutTrainee();
                  setMobileOpen(false);
                }}
                className="font-bold text-rose-500 hover:underline cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="py-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setGoogleModalOpen(true);
                  setMobileOpen(false);
                }}
                className="w-full text-left font-bold text-sm text-[#E0749A] py-1 cursor-pointer flex items-center gap-2"
              >
                <span>Google / Gmail Sign-In →</span>
              </button>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block font-medium text-xs text-slate-400 hover:text-slate-600 py-1"
              >
                Coach login
              </Link>
            </div>
          )}

          <button
            onClick={() => {
              scrollToSection('availability');
              setMobileOpen(false);
            }}
            className="w-full bg-[#E0749A] hover:bg-[#cf5479] text-white font-bold text-sm py-3 rounded-xl shadow-soft-xs text-center flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Book a lesson</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Google Sign-In Modal */}
      <GoogleSignInModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        onSuccess={() => navigate('/my-bookings')}
      />
    </header>
  );
}
