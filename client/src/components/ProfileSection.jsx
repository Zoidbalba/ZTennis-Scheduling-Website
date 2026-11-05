import React from 'react';
import { Link } from 'react-router-dom';

export default function ProfileSection({ profile }) {
  if (!profile) return null;

  const specialties = profile.specialties
    ? (typeof profile.specialties === 'string' ? profile.specialties.split(',') : profile.specialties)
    : [];

  return (
    <section id="profile" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-10 gap-3 sm:gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#92334f] dark:text-[#FFDBE5] bg-[#FFDBE5] dark:bg-[#20101a] px-4 py-1.5 rounded-full shadow-soft-xs inline-block">
            Instructor Spotlight
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3">
            Meet Your Coach
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-base mt-1.5">
            Dedicated tennis instruction customized to your level in {profile.location || 'Malaybalay City'}.
          </p>
        </div>

        <Link
          to="/coach"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#E27396] dark:hover:text-[#EA9AB2] transition-colors self-start sm:self-auto group"
        >
          <span>View Full Coach Profile</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>

      {/* Profile Card — Solid Smooth Surface */}
      <div className="card-hover-lift bg-white dark:bg-slate-900 rounded-3xl shadow-soft-md overflow-hidden">
        <div className="md:flex">
          {/* Photo & Identity Left Column */}
          <div className="md:w-5/12 flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-50 dark:bg-slate-850 relative">
            {/* Status Pill */}
            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-[#FFDBE5] dark:bg-[#20101a] text-[10px] sm:text-[11px] font-bold text-[#92334f] dark:text-[#FFDBE5] px-3 py-1 rounded-full shadow-soft-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6D9F71] animate-pulse"></span>
              <span>Available This Week</span>
            </div>

            {/* Profile Avatar */}
            <div className="relative mt-4">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.name}
                  className="w-32 h-32 sm:w-44 sm:h-44 rounded-full object-cover shadow-soft-lg ring-4 ring-[#FFDBE5] dark:ring-[#20101a]"
                />
              ) : (
                <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-[#E27396] flex items-center justify-center shadow-soft-lg text-4xl text-white font-black ring-4 ring-[#FFDBE5] dark:ring-[#20101a]">
                  Z
                </div>
              )}
            </div>

            <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white mt-4 sm:mt-5 text-center">{profile.name}</h3>
            <p className="text-xs text-[#92334f] dark:text-[#FFDBE5] font-bold bg-[#FFDBE5] dark:bg-[#20101a] px-3.5 py-1 rounded-full mt-2 shadow-soft-xs">
              Personal Tennis Coach
            </p>

            {profile.experience && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 font-medium text-center">
                {profile.experience}
              </p>
            )}
          </div>

          {/* Info Right Column */}
          <div className="md:w-7/12 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {profile.location && (
                <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 sm:mb-3 uppercase tracking-wider">
                  Location: {profile.location}
                </div>
              )}

              <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-normal">
                {profile.bio}
              </p>

              {/* Specialties */}
              {specialties.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
                    Coaching Focus & Drills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((s, i) => (
                      <span
                        key={i}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                      >
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Court Details Badge */}
              {profile.court_details && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs text-slate-700 dark:text-slate-300 mb-6">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">Court & Venue:</div>
                  <div className="text-slate-600 dark:text-slate-400 leading-relaxed">{profile.court_details}</div>
                </div>
              )}
            </div>

            {/* Quick Action Links: Call/SMS, Messenger, Facebook, Instagram */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2.5">
              <Link
                to="/coach"
                className="btn-hover-pink w-full sm:w-auto text-center bg-[#E27396] hover:bg-[#cf5479] text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-soft-xs min-h-[40px] flex items-center justify-center"
              >
                Full Bio & Rates
              </Link>

              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="flex-1 sm:flex-none text-center inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors min-h-[40px]"
                >
                  Call / SMS: {profile.phone}
                </a>
              )}

              {profile.messenger_link && (
                <a
                  href={profile.messenger_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none text-center inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-400 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px]"
                >
                  Messenger
                </a>
              )}

              {profile.facebook_link && (
                <a
                  href={profile.facebook_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-800 dark:hover:text-blue-400 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px]"
                >
                  Facebook
                </a>
              )}

              {profile.instagram_link && (
                <a
                  href={profile.instagram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/50 hover:text-pink-700 dark:hover:text-pink-400 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px]"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
