import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import ZTennisLogo from './ZTennisLogo';
import { api } from '../api/client';

export default function DashboardLayout({ children, title, subtitle, headerAction }) {
  const { coach, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function loadPendingCount() {
      try {
        const bookings = await api.getBookings();
        if (Array.isArray(bookings)) {
          const pending = bookings.filter((b) => b.status === 'pending').length;
          setPendingCount(pending);
        }
      } catch (e) {}
    }
    loadPendingCount();
  }, [location.pathname]);

  const navItems = [
    {
      to: '/dashboard/bookings',
      label: 'Bookings',
      badge: pendingCount > 0 ? pendingCount : null,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      to: '/dashboard/availability',
      label: 'Availability',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      to: '/dashboard/rates',
      label: 'Rates',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      to: '/dashboard/trainees',
      label: 'Trainees',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      to: '/dashboard/profile',
      label: 'Profile',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors duration-200">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-[#163829] px-4 py-3.5 flex items-center justify-between text-white sticky top-0 z-40 shadow-sm">
        <Link to="/dashboard" className="flex items-center gap-2">
          <ZTennisLogo
            className="w-7 h-7"
            textClassName="text-lg text-white font-black"
            textColor="text-white"
            showTagline={true}
            taglineColor="text-[#E0749A]"
          />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#163829] border-t border-emerald-800/60 p-4 space-y-2 text-white animate-fade-in-up">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold ${
                location.pathname === item.to
                  ? 'bg-[#2D5A43] text-white'
                  : 'text-emerald-100/70 hover:bg-emerald-900/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="w-5 h-5 rounded-full bg-[#E27396] text-white text-[10px] font-black flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          <div className="pt-3 border-t border-emerald-800/60 flex items-center justify-between">
            <Link to="/" className="text-xs text-emerald-200 font-bold hover:underline">
              View public page →
            </Link>
            <button onClick={logout} className="text-xs text-rose-300 font-bold hover:underline cursor-pointer">
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Desktop Deep Forest Green Sidebar matching Figma Screenshots 4 & 5 */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-[#163829] text-white min-h-screen px-5 py-6 justify-between flex-shrink-0">
        <div>
          {/* Official ZTennis Logo matching dark styleguide card */}
          <Link to="/" className="flex items-center mb-8 pl-1">
            <ZTennisLogo
              className="w-9 h-9"
              textClassName="text-xl text-white font-black"
              textColor="text-white"
              showTagline={true}
              taglineColor="text-[#E0749A]"
            />
          </Link>

          {/* Coach Mini Profile Box with new Coach Portrait */}
          <div className="flex items-center gap-3 px-3 py-3 mb-8 rounded-2xl bg-emerald-950/40 border border-emerald-800/40">
            <img
              src="/coach-zoid.jpg"
              alt="Coach Zoid"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/40 shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=80';
              }}
            />
            <div className="min-w-0">
              <p className="font-extrabold text-xs text-white truncate">Coach Zoid</p>
              <p className="text-[11px] text-emerald-300/70 font-medium">Administrator</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-[#2D5A43] text-white shadow-soft-xs border border-emerald-600/30'
                      : 'text-emerald-100/70 hover:text-white hover:bg-emerald-900/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-white' : 'text-emerald-300/70'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="w-5 h-5 rounded-full bg-[#E27396] text-white text-[10px] font-black flex items-center justify-center shadow-soft-xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Action & Theme */}
        <div className="space-y-3 pt-6 border-t border-emerald-800/40">
          <Link
            to="/"
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-emerald-700/50 hover:bg-emerald-800/40 text-emerald-100 text-xs font-bold transition-colors"
          >
            <span>View public page</span>
            <span>→</span>
          </Link>

          <div className="flex items-center justify-between px-2 pt-1 text-xs text-emerald-300/60 font-semibold">
            <ThemeToggle showLabel={true} />
            <button
              onClick={logout}
              className="text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="max-w-[1500px] mx-auto space-y-8">
          {(title || headerAction) && (
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <span className="text-[11px] font-black tracking-widest text-[#E0749A] uppercase mb-1.5 block">
                  COACH DASHBOARD
                </span>
                {title && (
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
                    {subtitle}
                  </p>
                )}
              </div>
              {headerAction && <div className="self-start sm:self-auto">{headerAction}</div>}
            </div>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}
