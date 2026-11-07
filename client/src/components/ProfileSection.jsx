import React from 'react';

export default function ProfileSection({ profile }) {
  if (!profile) return null;

  const specialties = profile.specialties
    ? (typeof profile.specialties === 'string' ? profile.specialties.split(',') : profile.specialties)
    : ['Forehand', 'Serve', 'Drills'];

  const photoSrc = profile.photo_url && profile.photo_url.trim().length > 0
    ? profile.photo_url
    : '/coach-zoid.jpg';

  return (
    <div className="relative">
      {/* Soft Ambient Pink Background Glow matching Figma Screenshot 1 */}
      <div className="absolute -top-12 -right-10 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-[#FFDBE5]/60 dark:bg-[#E27396]/15 blur-3xl pointer-events-none -z-10" />

      {/* Coach Card matching Figma Screenshot 1 */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800/80 max-w-md mx-auto lg:max-w-none">
        {/* Top Header with Avatar & Name */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Avatar with Green Online Dot */}
          <div className="relative flex-shrink-0">
            <img
              src={photoSrc}
              alt={profile.name || 'Coach Zoid'}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-soft-xs ring-4 ring-pink-50 dark:ring-pink-950/40"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/coach-zoid.jpg';
              }}
            />
            {/* Green active dot */}
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">
              YOUR COACH
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {profile.name ? `Coach ${profile.name}` : 'Coach Zoid'}
            </h3>
            <p className="text-xs font-bold text-[#337357] dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{profile.location || 'Malaybalay City'}</span>
            </p>
          </div>
        </div>

        {/* Specialties Tags Row */}
        <div className="flex flex-wrap gap-2 mt-5">
          {specialties.slice(0, 4).map((s, i) => (
            <span
              key={i}
              className="bg-[#FFF0F5] dark:bg-[#20101a] text-[#E27396] px-3.5 py-1 rounded-full text-xs font-bold shadow-soft-xs"
            >
              {s.trim()}
            </span>
          ))}
        </div>

        {/* Bio text */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-4 font-normal">
          {profile.bio ||
            'I help new and developing players build confident strokes and smarter court habits—with clear, patient coaching that keeps tennis fun.'}
        </p>

        {/* Divider */}
        <div className="my-5 border-t border-slate-100 dark:border-slate-800" />

        {/* 2x2 Grid of Contact Buttons matching Figma */}
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={profile.phone ? `tel:${profile.phone}` : 'tel:09350034792'}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-soft-xs"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Call / SMS</span>
          </a>

          <a
            href={profile.messenger_link || 'https://m.me/tenniscoachph'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-soft-xs"
          >
            <svg className="w-3.5 h-3.5 text-[#E27396]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.5 5.43 3.84 7.08V22l3.69-2.03C10.28 20.25 11.13 20.4 12 20.4c5.52 0 10-4.03 10-9.4S17.52 2 12 2zm1.09 12.63l-2.6-2.77-5.08 2.77 5.58-5.93 2.67 2.77 5.01-2.77-5.58 5.93z" />
            </svg>
            <span>Messenger</span>
          </a>

          <a
            href={profile.facebook_link || 'https://facebook.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-soft-xs"
          >
            <svg className="w-3.5 h-3.5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Facebook</span>
          </a>

          <a
            href={profile.instagram_link || 'https://instagram.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-soft-xs"
          >
            <svg className="w-3.5 h-3.5 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span>Instagram</span>
          </a>
        </div>
      </div>
    </div>
  );
}
