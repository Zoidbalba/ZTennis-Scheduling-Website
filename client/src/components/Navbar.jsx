import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import ZTennisLogo from './ZTennisLogo';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo matching Figma */}
          <Link to="/" className="flex items-center">
            <ZTennisLogo className="w-8 h-8" textClassName="text-xl sm:text-2xl font-black" />
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

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/dashboard"
                  className="text-xs lg:text-sm font-bold text-[#337357] dark:text-emerald-400 hover:underline"
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
            ) : (
              <Link
                to="/login"
                className="text-xs lg:text-sm font-bold text-[#337357] dark:text-emerald-400 hover:text-[#244c3a] dark:hover:text-emerald-300 transition-colors"
              >
                Coach login
              </Link>
            )}

            {/* Book a lesson pill button */}
            <button
              onClick={() => scrollToSection('availability')}
              className="bg-[#E27396] hover:bg-[#cf5479] text-white text-xs lg:text-sm font-bold px-5 py-2.5 rounded-xl shadow-soft-xs hover:shadow-soft-sm transition-all flex items-center gap-1.5 cursor-pointer"
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

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="block font-bold text-sm text-[#337357] dark:text-emerald-400 py-2"
            >
              Coach Dashboard →
            </Link>
          ) : (
            <Link
              to="/login"
              className="block font-bold text-sm text-[#337357] dark:text-emerald-400 py-2"
            >
              Coach login
            </Link>
          )}

          <button
            onClick={() => {
              scrollToSection('availability');
              setMobileOpen(false);
            }}
            className="w-full bg-[#E27396] hover:bg-[#cf5479] text-white font-bold text-sm py-3 rounded-xl shadow-soft-xs text-center flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Book a lesson</span>
            <span>→</span>
          </button>
        </div>
      )}
    </header>
  );
}
