import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../api/client';

export default function CoachDetails() {
  const [profile, setProfile] = useState(null);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [p, r] = await Promise.all([api.getProfile(), api.getRates()]);
        setProfile(p);
        setRates(Array.isArray(r) ? r : []);
      } catch (err) {
        console.error('Failed to load coach details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-primary-600 text-white font-black text-2xl flex items-center justify-center mx-auto mb-4">
            Z
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-semibold text-xs tracking-wider uppercase">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="max-w-xl mx-auto py-24 px-4 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4 font-semibold">Coach profile could not be loaded.</p>
          <Link to="/" className="text-primary-600 dark:text-primary-400 hover:underline font-bold">← Return to Home</Link>
        </div>
      </div>
    );
  }

  const specialtiesList = profile.specialties
    ? (typeof profile.specialties === 'string' ? profile.specialties.split(',') : profile.specialties)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <div>
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in-up">
          {/* Back button */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group"
            >
              <span className="mr-1 group-hover:-translate-x-1 transition-transform">←</span> Back to Schedule & Home
            </Link>
          </div>

          {/* Profile Card Header */}
          <div className="card-hover-lift bg-white dark:bg-slate-900 rounded-3xl shadow-soft-md overflow-hidden">
            {/* Header banner */}
            <div className="bg-[#180a13] dark:bg-[#0d0309] h-32 sm:h-44 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-[#FFDBE5] text-[#92334f] text-xs font-bold px-4 py-1.5 rounded-full shadow-soft-xs">
                Personal Tennis Coach
              </div>
            </div>

            <div className="px-5 sm:px-10 pb-6 sm:pb-8 relative">
              {/* Profile Avatar */}
              <div className="-mt-14 sm:-mt-20 mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="relative">
                  {profile.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt={profile.name}
                      className="w-28 h-28 sm:w-44 sm:h-44 rounded-full object-cover shadow-soft-xl bg-white dark:bg-slate-800 ring-4 ring-[#FFDBE5] dark:ring-[#20101a]"
                    />
                  ) : (
                    <div className="w-28 h-28 sm:w-44 sm:h-44 rounded-full bg-[#E0749A] flex items-center justify-center shadow-soft-xl text-4xl sm:text-5xl text-white font-black ring-4 ring-[#FFDBE5] dark:ring-[#20101a]">
                      Z
                    </div>
                  )}
                  <span
                    className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-6 h-6 bg-[#6D9F71] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-soft-xs"
                    title="Active Coach"
                  >
                    ✓
                  </span>
                </div>

                <div className="sm:pb-2">
                  <Link
                    to="/#schedule"
                    className="btn-hover-pink w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#E0749A] hover:bg-[#cf5479] text-white px-7 py-3 rounded-xl font-black text-sm shadow-soft-sm hover:shadow-soft-md transition-all cursor-pointer min-h-[44px]"
                  >
                    Book a Session
                  </Link>
                </div>
              </div>

              {/* Coach Name & Subtitle */}
              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{profile.name}</h1>
                <p className="text-slate-600 dark:text-slate-300 font-semibold text-sm sm:text-base mt-1">
                  Dedicated Tennis Instructor & Personal Coach
                </p>
                {profile.location && (
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1.5 font-medium">
                    Location: {profile.location}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Key Highlights Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="card-hover-lift bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-soft-sm">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Location</p>
              <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-1">{profile.location || 'Malaybalay City'}</p>
            </div>

            <div className="card-hover-lift bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-soft-sm">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Venue</p>
              <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-1">Public Court</p>
            </div>

            <div className="card-hover-lift bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-soft-sm">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Session Time</p>
              <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-1">1.5 – 2 Hours</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Court extendable</p>
            </div>

            <div className="card-hover-lift bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-soft-sm">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Schedule</p>
              <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-1">M-T-TH-F-SAT</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">6:00 – 9:00 AM</p>
            </div>
          </div>

          {/* Coach Bio */}
          <div className="card-hover-lift bg-white dark:bg-slate-900 rounded-3xl shadow-soft-md p-6 sm:p-9 space-y-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              About Your Coach & Teaching Philosophy
            </h2>
            <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal">
              {profile.bio}
            </p>

            {profile.court_details && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Court Details & Playtime:</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {profile.court_details}
                </p>
              </div>
            )}
          </div>

          {/* Specialties & Focus Areas */}
          {specialtiesList.length > 0 && (
            <div className="card-hover-lift bg-white dark:bg-slate-900 rounded-3xl shadow-soft-md p-6 sm:p-9">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mb-4">
                Specialties & Training Drills
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {specialtiesList.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                  >
                    {item.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Session Rates */}
          <div className="card-hover-lift bg-white dark:bg-slate-900 rounded-3xl shadow-soft-md p-6 sm:p-9">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  Coaching Rates & Options
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5 font-medium">Transparent per-person pricing</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {rates.map((rate) => {
                const isGroup = rate.session_type.toLowerCase().includes('group') || Number(rate.price) === 250;

                return (
                  <div
                    key={rate.id}
                    className={`p-6 sm:p-7 rounded-3xl shadow-soft-xs flex flex-col justify-between ${
                      isGroup
                        ? 'bg-[#FFDBE5]/30 dark:bg-[#20101a]'
                        : 'bg-slate-50 dark:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{rate.session_type}</h3>
                          {isGroup && (
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#E0749A] text-white shadow-soft-xs">
                              2+ Players
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-soft-xs">
                          1.5 – 2 hrs
                        </span>
                      </div>

                      <div className="my-4">
                        <span className={`text-4xl font-black ${isGroup ? 'text-[#E0749A] dark:text-[#EA9AB2]' : 'text-slate-900 dark:text-white'}`}>₱{rate.price}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-sm ml-1.5 font-semibold">/ person</span>
                      </div>

                      {rate.description && (
                        <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">{rate.description}</p>
                      )}

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {isGroup
                          ? '✨ Includes live-ball rallies, doubles drills & friendly point play'
                          : '🎯 Includes 1-on-1 personalized stroke breakdown & footwork conditioning'}
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Extended playtime possible depending on public court vacancy
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Schedule Overview */}
          <div className="card-hover-lift bg-white dark:bg-slate-900 rounded-3xl shadow-soft-md p-7 sm:p-9">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
              Weekly Morning Availability
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-6 font-medium">
              Regular coaching sessions run between 6:00 AM – 9:00 AM on active days
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-center">
              {[
                { name: 'Mon', active: true, time: '6:00 - 9:00 AM' },
                { name: 'Tue', active: true, time: '6:00 - 9:00 AM' },
                { name: 'Wed', active: false, time: 'Rest Day' },
                { name: 'Thu', active: true, time: '6:00 - 9:00 AM' },
                { name: 'Fri', active: true, time: '6:00 - 9:00 AM' },
                { name: 'Sat', active: true, time: '6:00 - 9:00 AM' },
                { name: 'Sun', active: false, time: 'Rest Day' },
              ].map((day, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl transition-all ${
                    day.active
                      ? 'bg-slate-900 text-white font-bold shadow-soft-xs'
                      : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <p className="text-sm font-extrabold">{day.name}</p>
                  <p className={`text-[10px] mt-1 ${day.active ? 'text-slate-300 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                    {day.time}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/#schedule"
                className="inline-flex items-center gap-1.5 text-slate-900 dark:text-white hover:text-[#E0749A] dark:hover:text-[#EA9AB2] font-bold text-sm transition-colors"
              >
                <span>View Full Interactive Schedule & Book Available Slot →</span>
              </Link>
            </div>
          </div>

          {/* Contact Section: Phone, Messenger, Facebook, Instagram */}
          <div className="bg-[#180a13] dark:bg-[#0d0309] text-white rounded-3xl p-6 sm:p-10 shadow-soft-xl">
            <div className="max-w-2xl">
              <h2 className="text-xl sm:text-3xl font-black mb-2">Ready to Hit the Court?</h2>
              <p className="text-[#FFDBE5]/90 text-xs sm:text-base mb-6 leading-relaxed font-normal">
                Book an open morning slot directly through the schedule or reach out directly on Messenger, Facebook, or Instagram.
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
                <Link
                  to="/#schedule"
                  className="btn-hover-pink w-full sm:w-auto text-center bg-[#E0749A] hover:bg-[#cf5479] text-white px-6 py-3 rounded-xl font-black text-sm shadow-soft-sm cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  Book a Session
                </Link>

                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="w-full sm:w-auto text-center bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all min-h-[44px] flex items-center justify-center"
                  >
                    Call / SMS: {profile.phone}
                  </a>
                )}

                {profile.messenger_link && (
                  <a
                    href={profile.messenger_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto text-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-soft-xs min-h-[44px] flex items-center justify-center"
                  >
                    Messenger
                  </a>
                )}

                {profile.facebook_link && (
                  <a
                    href={profile.facebook_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto text-center bg-blue-800 hover:bg-blue-900 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-soft-xs min-h-[44px] flex items-center justify-center"
                  >
                    Facebook
                  </a>
                )}

                {profile.instagram_link && (
                  <a
                    href={profile.instagram_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto text-center bg-pink-600 hover:bg-pink-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-soft-xs min-h-[44px] flex items-center justify-center"
                  >
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-16 border-t border-slate-800 text-center text-xs">
        <p>&copy; {new Date().getFullYear()} Z Tennis Coach. All rights reserved.</p>
        <p className="text-slate-500 mt-1">Malaybalay City, Bukidnon</p>
      </footer>
    </div>
  );
}
