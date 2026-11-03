import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Mobile top bar */}
      <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <span className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-800 border border-slate-700/40 text-white font-black text-sm flex items-center justify-center">
            Z
          </span>
          <span className="text-sm">Z Tennis Coach</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold">
            View Site
          </Link>
          <button onClick={logout} className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors">
            Logout
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar sticky top-[49px] z-30">
        <div className="flex px-2 space-x-1">
          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-center px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-colors rounded-lg my-1.5 ${
                location.pathname === to
                  ? 'text-white bg-slate-900 dark:bg-primary-600 shadow-soft-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-screen">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <Link to="/" className="flex items-center gap-2.5 font-extrabold text-lg text-slate-900 dark:text-white mb-4">
              <span className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-700/50 text-white font-black text-sm flex items-center justify-center shadow-soft-xs">
                Z
              </span>
              <span>Z Tennis Coach</span>
            </Link>
            {coach && (
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white">{coach.name || 'Coach'}</p>
                <p className="text-slate-400 dark:text-slate-500">Coach Dashboard</p>
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
                    ? 'bg-slate-900 dark:bg-primary-600 text-white shadow-soft-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <ThemeToggle showLabel={true} className="w-full justify-start px-4 py-2.5 rounded-xl" />
            <Link
              to="/"
              className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ← View Public Site
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
