import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const SKILL_LEVELS = ['Beginner (New to tennis)', 'Intermediate (Can rally & serve)', 'Advanced (Competitive)', 'Kids'];

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function BookingForm({ selectedSlot, onClose, onSuccess }) {
  const { trainee, isTraineeAuthenticated } = useAuth();
  const [form, setForm] = useState({
    session_type: selectedSlot?.session_type || 'Individual Session',
    member_count: selectedSlot?.member_count || (selectedSlot?.session_type === 'Group Session' ? 2 : 1),
    player_name: trainee?.name || '',
    contact_number: trainee?.phone || '',
    email: trainee?.email || '',
    skill_level: 'Beginner (New to tennis)',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (selectedSlot?.session_type) {
      setForm((prev) => ({
        ...prev,
        session_type: selectedSlot.session_type,
        member_count: selectedSlot.member_count || (selectedSlot.session_type === 'Group Session' ? 2 : 1),
      }));
    }
  }, [selectedSlot]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!selectedSlot) return null;

  const bookingDate = selectedSlot.booking_date
    ? selectedSlot.booking_date.toLocaleDateString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : DAY_NAMES[selectedSlot.day_of_week];

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let bookingDateStr = '';
      if (selectedSlot.booking_date instanceof Date) {
        const y = selectedSlot.booking_date.getFullYear();
        const m = String(selectedSlot.booking_date.getMonth() + 1).padStart(2, '0');
        const d = String(selectedSlot.booking_date.getDate()).padStart(2, '0');
        bookingDateStr = `${y}-${m}-${d}`;
      } else if (typeof selectedSlot.booking_date === 'string') {
        bookingDateStr = selectedSlot.booking_date;
      } else {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        bookingDateStr = `${y}-${m}-${d}`;
      }

      await api.createBooking({
        slot_id: selectedSlot.id,
        session_type: form.session_type,
        member_count: form.session_type === 'Group Session' ? Number(form.member_count || 2) : 1,
        player_name: form.player_name,
        player_contact: form.contact_number,
        player_email: form.email,
        skill_level: form.skill_level,
        message: form.message,
        booking_date: bookingDateStr,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
      });
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to submit booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl w-full max-w-lg max-h-[92vh] overflow-y-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#180a13] dark:bg-[#0d0309] text-white p-6 sm:p-7 rounded-t-3xl relative">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FFDBE5] bg-white/10 px-3 py-1 rounded-full">
                Lesson Reservation
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold mt-2">Book a Session</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl text-xs sm:text-sm text-slate-200">
            <p className="font-bold text-[#FFDBE5] text-sm">
              {bookingDate}
            </p>
            <p className="mt-0.5 text-slate-300">
              {formatTime(selectedSlot.start_time)} – {formatTime(selectedSlot.end_time)} (Public Court)
            </p>
          </div>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-6 sm:p-10 text-center animate-fade-in space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E0749A] text-white font-black text-2xl flex items-center justify-center mx-auto shadow-soft-sm">
              Z
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">Booking Request Sent</h4>
              <p className="text-xs text-slate-400 mt-0.5">We've received your morning session request!</p>
            </div>

            <div className="inline-block bg-[#FFF0F5] dark:bg-[#20101a] border border-[#E0749A]/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#E0749A]">
              {form.session_type === 'Group Session'
                ? `👥 Group Session · ${form.member_count || 2} players · ₱${250 * (form.member_count || 2)} total`
                : '👤 Individual Session · ₱300'}
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
              <span className="font-extrabold text-[#1F7A5A] dark:text-emerald-400 block mb-1">
                ✉️ Email Confirmation Notice
              </span>
              Confirmation updates will be delivered to <strong className="text-slate-900 dark:text-white">{form.email || form.contact_number}</strong>. You can also view your live schedule status anytime on your Trainee Portal!
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                to="/my-bookings"
                className="py-3 px-6 bg-[#1F7A5A] hover:bg-[#165a42] text-white rounded-xl font-bold text-xs shadow-soft-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Track in My Bookings →</span>
              </Link>
              <button
                onClick={onClose}
                className="py-3 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            {isTraineeAuthenticated && trainee && (
              <div className="bg-pink-50/70 dark:bg-[#20101a] border border-pink-200/80 dark:border-pink-900/60 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Booking as {trainee.name} ({trainee.email})
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase text-[#E0749A]">Gmail Synced</span>
              </div>
            )}

            {error && (
              <div className="bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 px-4 py-3 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Session Type Selector: Individual vs Group */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Session Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, session_type: 'Individual Session' }))}
                  className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                    form.session_type === 'Individual Session'
                      ? 'border-[#E0749A] bg-[#FFF0F5] dark:bg-[#E0749A]/15 text-slate-900 dark:text-white shadow-soft-xs ring-1 ring-[#E0749A]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black flex items-center gap-1.5">
                      <span>👤</span>
                      <span>Individual</span>
                    </span>
                    <span className="text-xs font-black text-[#E0749A]">₱300</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    1-on-1 private coaching (120 mins)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      session_type: 'Group Session',
                      member_count: prev.member_count > 1 ? prev.member_count : 2,
                    }))
                  }
                  className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                    form.session_type === 'Group Session'
                      ? 'border-[#1F7A5A] bg-emerald-50 dark:bg-[#1F7A5A]/20 text-slate-900 dark:text-white shadow-soft-xs ring-1 ring-[#1F7A5A]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black flex items-center gap-1.5">
                      <span>👥</span>
                      <span>Group</span>
                    </span>
                    <span className="text-xs font-black text-[#1F7A5A] dark:text-emerald-400">₱250</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Per player, share court & drills (120 mins)
                  </p>
                </button>
              </div>

              {/* Group Members Count Selector when Group Session is chosen */}
              {form.session_type === 'Group Session' && (
                <div className="mt-3 p-4 bg-emerald-50/70 dark:bg-[#1F7A5A]/15 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl animate-fade-in space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        How many players in your group?
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        ₱250 per player · Up to 6 trainees
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-soft-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            member_count: Math.max(2, (Number(prev.member_count) || 2) - 1),
                          }))
                        }
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-black text-sm text-[#1F7A5A] dark:text-emerald-400">
                        {form.member_count || 2}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            member_count: Math.min(6, (Number(prev.member_count) || 2) + 1),
                          }))
                        }
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Quick Pill Selector */}
                  <div className="flex items-center gap-2 pt-1">
                    {[2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, member_count: num }))}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          (form.member_count || 2) === num
                            ? 'bg-[#1F7A5A] text-white shadow-soft-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  {/* Live Total Rate */}
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-emerald-200/50 dark:border-emerald-800/40">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      Total Session Fee ({form.member_count || 2} players × ₱250):
                    </span>
                    <span className="font-black text-[#1F7A5A] dark:text-emerald-400 text-sm">
                      ₱{250 * (form.member_count || 2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Player Name *
              </label>
              <input
                type="text"
                name="player_name"
                value={form.player_name}
                onChange={handleChange}
                required
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E0749A] outline-none transition-all font-medium border-0"
                placeholder="Full Name"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Phone Number (for SMS confirmation) *
              </label>
              <input
                type="tel"
                name="contact_number"
                value={form.contact_number}
                onChange={handleChange}
                required
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E0749A] outline-none transition-all font-medium border-0"
                placeholder="0917 123 4567"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Gmail / Email Address *</span>
                <span className="text-[10px] text-[#1F7A5A] dark:text-emerald-400 font-bold lowercase">for schedule confirmation</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E0749A] outline-none transition-all font-medium border-0"
                placeholder="yourname@gmail.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Your Tennis Skill Level
              </label>
              <select
                name="skill_level"
                value={form.skill_level}
                onChange={handleChange}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E0749A] outline-none transition-all font-medium border-0"
              >
                {SKILL_LEVELS.map((level) => (
                  <option key={level} value={level} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Notes or Goals (optional)
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={2}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E0749A] outline-none transition-all resize-none font-medium border-0"
                placeholder="Individual or group session, technique focus, etc."
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-hover-pink w-full bg-[#E0749A] hover:bg-[#cf5479] text-white py-3.5 rounded-xl font-black text-sm shadow-soft-sm hover:shadow-soft-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
              >
                {submitting ? 'Submitting Request...' : 'Confirm Booking Request →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
