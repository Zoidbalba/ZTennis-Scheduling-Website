import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import ProfileSection from '../components/ProfileSection';
import CalendarSection from '../components/CalendarSection';
import RatesSection from '../components/RatesSection';
import BookingForm from '../components/BookingForm';
import ZTennisLogo from '../components/ZTennisLogo';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [slots, setSlots] = useState([]);
  const [rates, setRates] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingToast, setBookingToast] = useState(null);

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

  const scrollToAvailability = () => {
    document.getElementById('availability')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectRate = () => {
    scrollToAvailability();
  };

  const handleSlotSelect = (slotData) => {
    setSelectedSlot(slotData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#14060f]">
        <div className="text-center animate-fade-in space-y-3">
          <ZTennisLogo className="w-14 h-14 mx-auto" showText={true} showTagline={true} />
          <p className="text-[#E0749A] font-bold text-xs tracking-wider uppercase">Loading ZTennis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#E27396] selection:text-white transition-colors duration-200">
      <div>
        <Navbar />

        {/* HERO SECTION matching Figma Screenshot 1 */}
        <section id="coach" className="relative pt-6 pb-12 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column: Headline & CTA */}
              <div className="lg:col-span-7 space-y-6">
                {/* Sparkle pill badge */}
                <div className="inline-flex items-center gap-2 bg-[#FFF0F5] dark:bg-[#20101a] text-[#E27396] px-4 py-1.5 rounded-full text-xs font-bold shadow-soft-xs">
                  <span className="text-sm leading-none">✦</span>
                  <span>Personal coaching in Bukidnon</span>
                </div>

                {/* Big Two-Tone Headline */}
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.06]">
                  Play smarter.{' '}
                  <span className="text-[#E27396] block sm:inline">
                    Feel stronger.
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed font-normal">
                  Private tennis coaching built around your game, your goals, and your pace.
                </p>

                {/* Action CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={scrollToAvailability}
                    className="bg-[#E27396] hover:bg-[#cf5479] text-white text-sm sm:text-base font-bold px-7 py-3.5 rounded-2xl shadow-soft-sm hover:shadow-soft-md transition-all flex items-center gap-2.5 cursor-pointer"
                  >
                    <span>Find your court time</span>
                    <span className="text-lg leading-none">→</span>
                  </button>
                </div>

                {/* Social Proof */}
                <div className="flex items-center gap-3.5 pt-4">
                  <div className="flex -space-x-2">
                    <span className="w-8 h-8 rounded-full bg-[#E27396] text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-slate-950">
                      JM
                    </span>
                    <span className="w-8 h-8 rounded-full bg-[#337357] text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-slate-950">
                      KA
                    </span>
                    <span className="w-8 h-8 rounded-full bg-[#E09F3E] text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-slate-950">
                      RB
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Trusted by 40+ local players
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      Beginner-friendly · All ages welcome
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Coach Profile Card matching Figma Screenshot 1 */}
              <div className="lg:col-span-5">
                <ProfileSection profile={profile} />
              </div>
            </div>
          </div>
        </section>

        {/* HIGH-RES EDITORIAL TENNIS COURT IMAGE BANNER matching the green & pink aesthetic */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-20">
          <div className="relative rounded-3xl overflow-hidden shadow-soft-md group">
            <img
              src="/tennis-court.jpg"
              alt="Outdoor tennis court in Malaybalay City"
              className="w-full h-56 sm:h-72 lg:h-96 object-cover transform group-hover:scale-[1.02] transition-transform duration-700 ease-out"
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-6 sm:p-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between w-full gap-4 text-white">
                <div>
                  <span className="inline-flex items-center gap-1.5 bg-[#E27396] text-white px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    Malaybalay City Public Court
                  </span>
                  <h3 className="text-lg sm:text-2xl font-black tracking-tight">
                    Dedicated Morning Training Sessions
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 max-w-lg mt-1 font-medium">
                    Sessions last 1.5 to 2 hours and can extend based on court queue and playtime availability.
                  </p>
                </div>

                <button
                  onClick={scrollToAvailability}
                  className="bg-white/90 hover:bg-white text-slate-900 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm self-start sm:self-auto cursor-pointer"
                >
                  View Open Mornings →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CHOOSE YOUR SESSION matching Figma Screenshot 2 */}
        <RatesSection rates={rates} onSelectRate={handleSelectRate} />

        {/* WEEKLY AVAILABILITY matching Figma Screenshot 3 */}
        <CalendarSection
          slots={slots}
          onSlotSelect={handleSlotSelect}
          onSlotsChange={fetchSlots}
        />
      </div>

      {/* Trainee Booking Modal */}
      {selectedSlot && (
        <BookingForm
          selectedSlot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onSuccess={() => {
            setSelectedSlot(null);
            fetchSlots();
            setBookingToast('Booking submitted! Coach Zoid will confirm your session shortly.');
            setTimeout(() => setBookingToast(null), 6000);
          }}
        />
      )}

      {/* Confirmation Toast */}
      {bookingToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-emerald-600 text-white px-5 py-4 rounded-2xl shadow-soft-xl flex items-center gap-3 animate-fade-in-up">
          <span className="text-xl">🎾</span>
          <p className="text-xs font-bold leading-snug">{bookingToast}</p>
        </div>
      )}

      {/* Minimal Clean Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800/80 py-8 px-4 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <ZTennisLogo className="w-7 h-7" textClassName="text-base font-black" showTagline={true} />
          <p>© {new Date().getFullYear()} ZTennis • Coach Zoid • Malaybalay City, Bukidnon</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Back to top ↑
          </button>
        </div>
      </footer>
    </div>
  );
}
