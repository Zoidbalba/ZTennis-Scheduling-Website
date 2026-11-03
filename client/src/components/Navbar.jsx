import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-nav shadow-soft-sm py-2.5'
          : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800 py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo with "Z" brand mark */}
          <Link
            to="/"
            className="flex items-center gap-3 font-extrabold tracking-tight text-slate-900 dark:text-white group"
          >
            <span className="w-9 h-9 rounded-xl bg-[#022414] dark:bg-[#5e8d66] text-[#ffe5f4] dark:text-[#022414] font-black text-lg flex items-center justify-center shadow-soft-xs group-hover:bg-[#f1a6bc] dark:group-hover:bg-[#f1a6bc] group-hover:text-[#022414] border border-[#5e8d66]/30 transition-all">
              Z
            </span>
            <div className="flex flex-col">
              <span className="leading-none text-slate-900 dark:text-white font-extrabold text-base tracking-tight">
                Z Tennis <span className="text-[#f1a6bc] font-black text-xs tracking-normal">PH</span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                Personal Coaching
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 lg:gap-7">
            {isDashboard ? <DashboardNav /> : <PublicNav />}
          </div>

          {/* Mobile Right Controls: Theme Toggle + Hamburger */}
          <div className="flex items-center gap-1.5 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5 animate-scale-up" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md animate-fade-in-up">
          <div className="px-5 py-4 space-y-2">
            {isDashboard ? (
              <DashboardNavMobile onClose={() => setMobileOpen(false)} />
            ) : (
              <PublicNavMobile onClose={() => setMobileOpen(false)} />
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function PublicNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleNav = (id) => {
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Link
        to="/coach"
        className={`relative text-sm font-semibold transition-all py-1 ${
          location.pathname === '/coach'
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        Coach Profile
        {location.pathname === '/coach' && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full animate-fade-in" />
        )}
      </Link>

      <button
        onClick={() => handleNav('schedule')}
        className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        Schedule
      </button>

      <button
        onClick={() => handleNav('rates')}
        className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        Rates
      </button>

      <button
        onClick={() => handleNav('profile')}
        className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        About
      </button>

      <button
        onClick={() => handleNav('schedule')}
        className="btn-hover-glow bg-slate-900 hover:bg-slate-800 dark:bg-primary-600 dark:hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-soft-xs transition-all cursor-pointer"
      >
        Book a Session
      </button>

      {/* Dark Mode Toggle */}
      <ThemeToggle />

      {isAuthenticated ? (
        <Link
          to="/dashboard/bookings"
          className="text-xs bg-slate-100 hover:bg-primary-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-primary-700 dark:hover:text-primary-400 px-3.5 py-2 rounded-xl font-bold transition-all border border-slate-200 dark:border-slate-700"
        >
          Dashboard
        </Link>
      ) : (
        <Link
          to="/login"
          className="text-xs text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium transition-colors"
        >
          Coach Login
        </Link>
      )}
    </>
  );
}

function PublicNavMobile({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleNav = (id) => {
    onClose();
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Link
        to="/coach"
        onClick={onClose}
        className={`block w-full text-left px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
          location.pathname === '/coach'
            ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400'
            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        Coach Profile
      </Link>
      <button
        onClick={() => handleNav('schedule')}
        className="block w-full text-left px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm cursor-pointer"
      >
        Schedule (Mon–Sun)
      </button>
      <button
        onClick={() => handleNav('rates')}
        className="block w-full text-left px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm cursor-pointer"
      >
        Session Rates
      </button>
      <button
        onClick={() => handleNav('profile')}
        className="block w-full text-left px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm cursor-pointer"
      >
        About Coaching
      </button>
      <button
        onClick={() => handleNav('schedule')}
        className="block w-full text-center px-4 py-3 rounded-xl bg-slate-900 dark:bg-primary-600 text-white font-bold text-sm shadow-soft-xs cursor-pointer"
      >
        Book a Session Now
      </button>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-2">
        <ThemeToggle showLabel={true} />

        {isAuthenticated ? (
          <Link
            to="/dashboard/bookings"
            onClick={onClose}
            className="text-xs font-bold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/80 px-3 py-1.5 rounded-lg border border-primary-200/50 dark:border-primary-800/50"
          >
            Coach Dashboard
          </Link>
        ) : (
          <Link
            to="/login"
            onClick={onClose}
            className="text-xs text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium"
          >
            Coach Login
          </Link>
        )}
      </div>
    </>
  );
}

function DashboardNav() {
  const { logout } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/dashboard/bookings', label: 'Bookings' },
    { to: '/dashboard/availability', label: 'Availability' },
    { to: '/dashboard/rates', label: 'Rates' },
    { to: '/dashboard/profile', label: 'Profile' },
  ];

  return (
    <>
      <Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-xs font-bold flex items-center gap-1">
        <span>←</span> View Site
      </Link>
      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
      {links.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          className={`text-sm font-semibold transition-all py-1 relative ${
            location.pathname === to
              ? 'text-primary-600 dark:text-primary-400 font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {label}
          {location.pathname === to && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full" />
          )}
        </Link>
      ))}

      {/* Dark Mode Toggle */}
      <ThemeToggle />

      <button
        onClick={logout}
        className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
      >
        Logout
      </button>
    </>
  );
}

function DashboardNavMobile({ onClose }) {
  const { logout } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/dashboard/bookings', label: 'Bookings' },
    { to: '/dashboard/availability', label: 'Availability' },
    { to: '/dashboard/rates', label: 'Rates' },
    { to: '/dashboard/profile', label: 'Profile' },
  ];

  return (
    <>
      <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
        <Link
          to="/"
          onClick={onClose}
          className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          ← View Public Site
        </Link>
        <ThemeToggle showLabel={true} />
      </div>
      {links.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          onClick={onClose}
          className={`block px-4 py-2.5 rounded-xl font-semibold text-sm ${
            location.pathname === to
              ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          {label}
        </Link>
      ))}
      <button
        onClick={() => {
          logout();
          onClose();
        }}
        className="block w-full text-left px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-bold text-sm cursor-pointer"
      >
        Logout
      </button>
    </>
  );
}
