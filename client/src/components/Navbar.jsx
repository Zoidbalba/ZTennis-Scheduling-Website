import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-nav shadow-soft-sm py-2.5'
          : 'bg-white/95 backdrop-blur-sm border-b border-slate-100 py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo with "Z" brand mark */}
          <Link
            to="/"
            className="flex items-center gap-3 font-extrabold tracking-tight text-slate-900 group"
          >
            <span className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-lg flex items-center justify-center shadow-soft-xs group-hover:bg-primary-600 transition-colors">
              Z
            </span>
            <div className="flex flex-col">
              <span className="leading-none text-slate-900 font-extrabold text-base tracking-tight">
                Z Tennis <span className="text-primary-600 font-bold text-xs">PH</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                Personal Coaching
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-7">
            {isDashboard ? <DashboardNav /> : <PublicNav />}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
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

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md animate-fade-in-up">
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
            ? 'text-primary-600'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        Coach Profile
        {location.pathname === '/coach' && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full animate-fade-in" />
        )}
      </Link>

      <button
        onClick={() => handleNav('schedule')}
        className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
      >
        Schedule
      </button>

      <button
        onClick={() => handleNav('rates')}
        className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
      >
        Rates
      </button>

      <button
        onClick={() => handleNav('profile')}
        className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
      >
        About
      </button>

      <button
        onClick={() => handleNav('schedule')}
        className="btn-hover-glow bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-soft-xs transition-all cursor-pointer"
      >
        Book a Session
      </button>

      {isAuthenticated ? (
        <Link
          to="/dashboard/bookings"
          className="text-xs bg-slate-100 hover:bg-primary-50 text-slate-700 hover:text-primary-700 px-3.5 py-2 rounded-xl font-bold transition-all border border-slate-200"
        >
          Dashboard
        </Link>
      ) : (
        <Link
          to="/login"
          className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
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
            ? 'bg-primary-50 text-primary-700'
            : 'text-slate-700 hover:bg-slate-50'
        }`}
      >
        Coach Profile
      </Link>
      <button
        onClick={() => handleNav('schedule')}
        className="block w-full text-left px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold text-sm"
      >
        Schedule (Mon–Sun)
      </button>
      <button
        onClick={() => handleNav('rates')}
        className="block w-full text-left px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold text-sm"
      >
        Session Rates
      </button>
      <button
        onClick={() => handleNav('profile')}
        className="block w-full text-left px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold text-sm"
      >
        About Coaching
      </button>
      <button
        onClick={() => handleNav('schedule')}
        className="block w-full text-center px-4 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-soft-xs"
      >
        Book a Session Now
      </button>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-2">
        {isAuthenticated ? (
          <Link
            to="/dashboard/bookings"
            onClick={onClose}
            className="text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg"
          >
            Coach Dashboard
          </Link>
        ) : (
          <Link
            to="/login"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium"
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
      <Link to="/" className="text-slate-500 hover:text-primary-600 text-xs font-bold flex items-center gap-1">
        <span>←</span> View Site
      </Link>
      <div className="h-4 w-px bg-slate-200" />
      {links.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          className={`text-sm font-semibold transition-all py-1 relative ${
            location.pathname === to
              ? 'text-primary-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {label}
          {location.pathname === to && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
          )}
        </Link>
      ))}
      <button
        onClick={logout}
        className="text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 transition-colors"
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
      <Link
        to="/"
        onClick={onClose}
        className="block px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
      >
        ← View Public Site
      </Link>
      {links.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          onClick={onClose}
          className={`block px-4 py-2.5 rounded-xl font-semibold text-sm ${
            location.pathname === to
              ? 'bg-primary-50 text-primary-700 font-bold'
              : 'text-slate-600 hover:bg-slate-50'
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
        className="block w-full text-left px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-sm"
      >
        Logout
      </button>
    </>
  );
}
