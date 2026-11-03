import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProfileSection from '../components/ProfileSection';
import CalendarSection from '../components/CalendarSection';
import RatesSection from '../components/RatesSection';
import BookingForm from '../components/BookingForm';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [slots, setSlots] = useState([]);
  const [rates, setRates] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 450);
    };
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchSlots = useCallback(async () => {
    try {
      const avail = isAuthenticated ? await api.getAllAvailability() : await api.getAvailability();
      setSlots(Array.isArray(avail) ? avail : avail.slots || []);
    } catch (err) {
      console.error('Failed to load slots:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileData, ratesData] = await Promise.allSettled([
          api.getProfile(),
          api.getRates(),
        ]);
        if (profileData.status === 'fulfilled') setProfile(profileData.value);
        if (ratesData.status === 'fulfilled') {
          const r = ratesData.value;
          setRates(Array.isArray(r) ? r : r.rates || []);
        }
        await fetchSlots();
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [fetchSlots]);

  const scrollToSchedule = () => {
    document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-[#E27396] text-white font-black text-2xl flex items-center justify-center mx-auto mb-4 shadow-soft-md">
            Z
          </div>
          <p className="text-primary-600 dark:text-primary-400 font-semibold text-xs tracking-wider uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#E27396] selection:text-white transition-colors duration-200">
      <div>
        <Navbar />

        {/* HERO SECTION — Dominant Pink Theme with Court Green Accent */}
        <section className="relative bg-[#14060f] dark:bg-[#0d0309] text-white overflow-hidden py-14 sm:py-24 lg:py-32 border-b border-[#EA9AB2]/25">
          {/* Dominant Ambient Radial Glows (Rose Pompadour, Amaranth Pink & Mimi Pink) */}
          <div className="absolute inset-0 pointer-events-none opacity-45">
            <div className="absolute -top-10 right-1/4 w-[380px] sm:w-[550px] h-[380px] sm:h-[550px] rounded-full bg-[#E27396]/35 blur-[100px] sm:blur-[130px]"></div>
            <div className="absolute bottom-0 left-1/4 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-[#EA9AB2]/25 blur-[100px] sm:blur-[120px]"></div>
            <div className="absolute top-1/2 left-10 w-[250px] h-[250px] rounded-full bg-[#337357]/20 blur-[90px]"></div>
          </div>

          {/* Minimal Geometric Court Accent */}
          <div className="absolute inset-0 pointer-events-none opacity-15 flex items-center justify-center">
            <div className="w-[850px] h-[450px] border border-[#EA9AB2]/30 rounded-3xl"></div>
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in-up">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-[#FFDBE5]/15 backdrop-blur-md border border-[#EA9AB2]/40 px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold mb-6 text-[#FFDBE5] max-w-full shadow-soft-xs">
              <span className="w-2 h-2 rounded-full bg-[#E27396] flex-shrink-0 animate-pulse"></span>
              <span className="truncate sm:overflow-visible">Private & Group Tennis Coaching • Malaybalay City</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 leading-tight tracking-tight text-white">
              Elevate Your Game on the Court
            </h1>

            {/* Sub-headline */}
            <p className="text-sm sm:text-lg text-[#FFDBE5]/90 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed font-normal">
              Structured 1-on-1 and group tennis sessions focused on stroke consistency, footwork, and live rally strategy.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md sm:max-w-none mx-auto">
              <button
                onClick={scrollToSchedule}
                className="btn-hover-pink w-full sm:w-auto bg-[#E27396] hover:bg-[#cf5479] text-white px-7 py-3.5 sm:px-8 sm:py-4 rounded-xl font-black text-sm shadow-soft-md transition-all cursor-pointer flex items-center justify-center gap-2 group min-h-[48px]"
              >
                <span>Book a Morning Session</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <Link
                to="/coach"
                className="w-full sm:w-auto border border-[#EA9AB2]/40 hover:border-[#E27396] bg-white/10 hover:bg-white/15 backdrop-blur-sm text-[#FFDBE5] hover:text-white px-7 py-3.5 sm:px-8 sm:py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center min-h-[48px]"
              >
                Meet Your Coach
              </Link>
            </div>

            {/* Key Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 mt-10 sm:mt-16 max-w-3xl mx-auto text-left">
              <div className="bg-white/5 backdrop-blur-sm border border-[#EA9AB2]/30 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                <span className="text-[10px] sm:text-[11px] text-[#FFDBE5] uppercase tracking-wider font-bold">Rates</span>
                <p className="text-base sm:text-xl font-extrabold text-[#EA9AB2] mt-0.5 sm:mt-1">₱250 – ₱300</p>
                <span className="text-[10px] sm:text-[11px] text-[#FFDBE5]/75">Per person</span>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-[#EA9AB2]/30 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                <span className="text-[10px] sm:text-[11px] text-[#FFDBE5] uppercase tracking-wider font-bold">Session Length</span>
                <p className="text-base sm:text-xl font-extrabold text-white mt-0.5 sm:mt-1">1.5 – 2 Hours</p>
                <span className="text-[10px] sm:text-[11px] text-[#6D9F71]">Court extendable</span>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-bold">Morning Hours</span>
                <p className="text-base sm:text-xl font-extrabold text-white mt-0.5 sm:mt-1">6:00 – 9:00 AM</p>
                <span className="text-[10px] sm:text-[11px] text-slate-400">M · T · TH · F · SAT</span>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-bold">Venue</span>
                <p className="text-base sm:text-xl font-extrabold text-white mt-0.5 sm:mt-1">Public Court</p>
                <span className="text-[10px] sm:text-[11px] text-[#6D9F71] font-semibold">Malaybalay City</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: MEET YOUR COACH */}
        <ProfileSection profile={profile} />

        {/* SECTION 2: INTERACTIVE SCHEDULE (MON–SUN) WITH CRUD */}
        <CalendarSection
          slots={slots}
          onSlotSelect={setSelectedSlot}
          onSlotsChange={fetchSlots}
        />

        {/* SECTION 3: RATES & SESSIONS */}
        <RatesSection rates={rates} />

        {/* BOOKING MODAL */}
        <div id="book">
          {selectedSlot && (
            <BookingForm
              selectedSlot={selectedSlot}
              onClose={() => setSelectedSlot(null)}
              onSuccess={() => {
                fetchSlots();
              }}
            />
          )}
        </div>
      </div>

      {/* FLOATING BACK TO TOP BUTTON */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-40 bg-[#E27396] hover:bg-[#cf5479] text-white p-3 rounded-xl shadow-soft-lg border border-[#FFDBE5]/30 transition-all duration-300 hover:scale-105 active:scale-95 animate-scale-up cursor-pointer backdrop-blur-md"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* FOOTER */}
      <footer className="bg-[#14060f] dark:bg-[#0d0309] text-slate-400 py-10 sm:py-14 border-t border-[#EA9AB2]/20 mt-12 sm:mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:gap-10 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-7 h-7 rounded-lg bg-[#E27396] text-white font-black text-sm flex items-center justify-center">
                  Z
                </span>
                <span className="text-white font-extrabold text-base">Z Tennis Coach</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Personalized tennis coaching in Malaybalay City. Sessions are held at a public court for players looking to refine technique and develop consistency.
              </p>
              <div className="mt-4 text-xs text-[#EA9AB2] font-semibold">
                Morning Sessions: 6:00 AM – 9:00 AM
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs tracking-wider uppercase mb-3.5">
                Navigation
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/coach" className="hover:text-[#EA9AB2] transition-colors">
                    Meet Your Coach
                  </Link>
                </li>
                <li>
                  <a href="#schedule" className="hover:text-[#EA9AB2] transition-colors">
                    Weekly Schedule (Mon – Sun)
                  </a>
                </li>
                <li>
                  <a href="#rates" className="hover:text-[#EA9AB2] transition-colors">
                    Session Rates (₱250 – ₱300)
                  </a>
                </li>
                <li>
                  <Link to="/login" className="text-slate-500 hover:text-[#EA9AB2] transition-colors">
                    Coach Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs tracking-wider uppercase mb-3.5">
                Contact & Location
              </h4>
              <ul className="space-y-2 text-sm">
                {profile?.phone && (
                  <li>
                    <a href={`tel:${profile.phone}`} className="hover:text-[#EA9AB2] transition-colors">
                      Phone: {profile.phone}
                    </a>
                  </li>
                )}
                {profile?.email && (
                  <li>
                    <a href={`mailto:${profile.email}`} className="hover:text-[#EA9AB2] transition-colors">
                      Email: {profile.email}
                    </a>
                  </li>
                )}
                {profile?.location && <li>Location: {profile.location}</li>}
                <li className="text-xs text-[#6D9F71] pt-1 font-semibold">
                  Venue: Public Tennis Court
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <p>&copy; {new Date().getFullYear()} Z Tennis Coach. All rights reserved.</p>
            <p>Single-coach training portal</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
