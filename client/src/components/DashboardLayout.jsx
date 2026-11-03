import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard/bookings', label: 'Bookings & Schedule' },
  { to: '/dashboard/trainees', label: 'Trainees Roster' },
  { to: '/dashboard/availability', label: 'Availability' },
  { to: '/dashboard/rates', label: 'Rates' },
  { to: '/dashboard/profile', label: 'Profile' },
];

export default function DashboardLayout({ children }) {
  const { coach, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile top bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-black text-sm flex items-center justify-center">
            Z
          </span>
          <span>Z Tennis Coach</span>
        </Link>
        <button onClick={logout} className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors">
          Logout
        </button>
      </div>

      {/* Mobile tabs */}
      <div className="lg:hidden bg-white border-b border-slate-200 overflow-x-auto">
        <div className="flex">
          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex-1 text-center px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
                location.pathname === to
                  ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-slate-200 min-h-screen">
          <div className="p-6 border-b border-slate-100">
            <Link to="/" className="flex items-center gap-2.5 font-extrabold text-lg text-slate-900 mb-4">
              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-soft-xs">
                Z
              </span>
              <span>Z Tennis Coach</span>
            </Link>
            {coach && (
              <div className="text-xs text-slate-600">
                <p className="font-bold text-slate-900">{coach.name || 'Coach'}</p>
                <p className="text-slate-400">Coach Dashboard</p>
              </div>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  location.pathname === to
                    ? 'bg-slate-900 text-white shadow-soft-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 space-y-2">
            <Link
              to="/"
              className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              ← View Public Site
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
