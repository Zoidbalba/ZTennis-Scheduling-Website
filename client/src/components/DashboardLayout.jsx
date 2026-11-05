import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { to: '/dashboard/bookings', label: 'Bookings & Schedule' },
  { to: '/dashboard/trainees', label: 'Trainees Roster' },
  { to: '/dashboard/availability', label: 'Availability' },
  { to: '/dashboard/rates', label: 'Rates & Pricing' },
  { to: '/dashboard/profile', label: 'Coach Profile' },
];

export default function DashboardLayout({ children }) {
  const { coach, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Mobile top bar */}
      <div className="lg:hidden bg-white dark:bg-slate-900 shadow-soft-xs px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
          <span className="w-8 h-8 rounded-xl bg-[#E27396] text-white font-black text-sm flex items-center justify-center shadow-soft-xs">
            Z
          </span>
          <span className="text-sm font-extrabold tracking-tight">Z Tennis Coach</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold px-2 py-1">
            Site
          </Link>
          <button onClick={logout} className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 px-2 py-1 transition-colors">
            Logout
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="lg:hidden bg-white dark:bg-slate-900 shadow-soft-xs overflow-x-auto no-scrollbar sticky top-[53px] z-30 py-1">
        <div className="flex px-3 space-x-1.5">
          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-center px-4 py-2 text-xs font-bold whitespace-nowrap transition-all rounded-xl my-1 ${
                location.pathname === to
                  ? 'text-white bg-[#E27396] shadow-soft-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Desktop sidebar — Solid Smooth Card Navigation */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white dark:bg-slate-900 shadow-soft-sm min-h-screen">
          <div className="p-6">
            <Link to="/" className="flex items-center gap-2.5 font-black text-lg text-slate-900 dark:text-white mb-5">
              <span className="w-9 h-9 rounded-2xl bg-[#E27396] text-white font-black text-base flex items-center justify-center shadow-soft-sm">
                Z
              </span>
              <span className="tracking-tight">Z Tennis Coach</span>
            </Link>

            {coach && (
              <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FFDBE5] text-[#92334f] font-black text-xs flex items-center justify-center shadow-soft-xs shrink-0">
                  {coach.name ? coach.name.charAt(0).toUpperCase() : 'Z'}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{coach.name || 'Coach'}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Coach Admin</p>
                </div>
              </div>
            )}
          </div>

          <nav className="flex-1 px-4 space-y-1.5">
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  location.pathname === to
                    ? 'bg-[#E27396] text-white shadow-soft-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-[#FFDBE5]/30 hover:text-[#92334f] dark:hover:bg-slate-800/80 dark:hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="p-4 space-y-2">
            <ThemeToggle showLabel={true} className="w-full justify-start px-4 py-2.5 rounded-2xl" />
            <Link
              to="/"
              className="w-full flex items-center justify-center px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ← Public Site
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-100/60 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
