import React from 'react';

export default function RatesSection({ rates = [], onSelectRate }) {
  const handleBookRate = (sessionType) => {
    if (onSelectRate) {
      onSelectRate(sessionType);
    } else {
      document.getElementById('availability')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const individualRate = rates.find(
    (r) => !r.session_type.toLowerCase().includes('group') && Number(r.price) >= 300
  ) || {
    id: 1,
    session_type: 'Individual Session',
    price: 300,
    duration_minutes: 120,
    description: '1-on-1 focused coaching',
  };

  const groupRate = rates.find(
    (r) => r.session_type.toLowerCase().includes('group') || Number(r.price) === 250
  ) || {
    id: 2,
    session_type: 'Group Session',
    price: 250,
    duration_minutes: 120,
    description: '2–4 players per session',
  };

  return (
    <section id="sessions" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-12">
      {/* Header matching Figma Screenshot 2 */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-10 sm:mb-14 gap-4">
        <div>
          <span className="text-xs font-black tracking-widest text-[#E27396] uppercase mb-2 block">
            CHOOSE YOUR SESSION
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Coaching that fits your game.
          </h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md lg:text-right leading-relaxed">
          Every session includes court-side feedback and a simple practice plan to keep you progressing.
        </p>
      </div>

      {/* 2-Column Rates Cards Grid matching Figma Screenshot 2 */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Card 1: Individual Session */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-7 sm:p-9 shadow-sm border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            {/* Top row: Icon on left, Price on right */}
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] dark:bg-[#20101a] text-[#E27396] flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight block">
                  ₱{individualRate.price}
                </span>
                <span className="text-slate-400 text-xs font-semibold block mt-0.5">
                  / {individualRate.duration_minutes || 120} min
                </span>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-6">
              {individualRate.session_type}
            </h3>
            <p className="text-slate-400 text-xs font-medium mt-1">
              {individualRate.description || '1-on-1 focused coaching'}
            </p>

            <div className="my-6 border-t border-slate-100 dark:border-slate-800" />

            <ul className="space-y-3.5 mb-8">
              <li className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="text-[#E27396] font-bold text-sm">✓</span>
                <span>Personal technique assessment</span>
              </li>
              <li className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="text-[#E27396] font-bold text-sm">✓</span>
                <span>Custom drills for your goals</span>
              </li>
              <li className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="text-[#E27396] font-bold text-sm">✓</span>
                <span>Post-session practice notes</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleBookRate('Individual Session')}
            className="w-full bg-white dark:bg-slate-900 border border-[#E27396] text-[#E27396] hover:bg-[#FFF0F5] dark:hover:bg-[#20101a] font-bold text-xs sm:text-sm py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Book individual</span>
            <span>→</span>
          </button>
        </div>

        {/* Card 2: Group Session */}
        <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-7 sm:p-9 shadow-sm border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="absolute -top-3 right-6 sm:right-8">
            <span className="bg-[#2D5A43] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-soft-xs">
              BEST WITH FRIENDS
            </span>
          </div>

          <div>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F3ED] dark:bg-[#11291f] text-[#337357] dark:text-emerald-400 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight block">
                  ₱{groupRate.price}
                </span>
                <span className="text-slate-400 text-xs font-semibold block mt-0.5">
                  / player
                </span>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-6">
              {groupRate.session_type}
            </h3>
            <p className="text-slate-400 text-xs font-medium mt-1">
              {groupRate.description || '2–4 players per session'}
            </p>

            <div className="my-6 border-t border-slate-100 dark:border-slate-800" />

            <ul className="space-y-3.5 mb-8">
              <li className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="text-[#337357] dark:text-emerald-400 font-bold text-sm">✓</span>
                <span>Matchplay and live-ball drills</span>
              </li>
              <li className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="text-[#337357] dark:text-emerald-400 font-bold text-sm">✓</span>
                <span>Friendly, social atmosphere</span>
              </li>
              <li className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="text-[#337357] dark:text-emerald-400 font-bold text-sm">✓</span>
                <span>120 minutes on court</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleBookRate('Group Session')}
            className="w-full bg-[#2D5A43] hover:bg-[#224533] text-white font-bold text-xs sm:text-sm py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-soft-xs cursor-pointer"
          >
            <span>Book as a group</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
