import React, { useState, useEffect } from 'react';
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
  const [form, setForm] = useState({
    player_name: '',
    contact_number: '',
    email: '',
    skill_level: 'Beginner (New to tennis)',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
        player_name: form.player_name,
        player_contact: form.contact_number,
        player_email: form.email,
        skill_level: form.skill_level,
        message: form.message,
        slot_id: selectedSlot.id,
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
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-soft-xl w-full max-w-lg max-h-[92vh] overflow-y-auto animate-scale-up border border-slate-200/80 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#022414] text-white p-5 sm:p-7 rounded-t-2xl sm:rounded-t-3xl relative border-b border-[#5e8d66]/30">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#f1a6bc]">
                Lesson Reservation
              </span>
              <h3 className="text-lg sm:text-2xl font-extrabold mt-0.5 sm:mt-1">Book a Session</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 sm:mt-4 p-3 sm:p-3.5 bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl border border-[#5e8d66]/30 text-xs sm:text-sm text-slate-300">
            <p className="font-bold text-[#ffe5f4]">
              {bookingDate}
            </p>
            <p className="mt-0.5 text-slate-300">
              {formatTime(selectedSlot.start_time)} – {formatTime(selectedSlot.end_time)} (Public Court)
            </p>
          </div>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-6 sm:p-10 text-center animate-fade-in">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#022414] dark:bg-[#5e8d66] text-[#ffe5f4] dark:text-[#022414] font-black text-xl sm:text-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-soft-sm">
              Z
            </div>
            <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Booking Request Sent</h4>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-sm mx-auto mb-6 sm:mb-8 leading-relaxed">
              Coach will contact you via <strong>SMS or phone</strong> at{' '}
              <span className="font-bold text-slate-900 dark:text-white">{form.contact_number}</span> to confirm your session and court arrangements.
            </p>
            <button
              onClick={onClose}
              className="btn-hover-pink w-full sm:w-auto bg-[#022414] hover:bg-[#5e8d66] dark:bg-[#5e8d66] dark:hover:bg-[#f1a6bc] text-white dark:hover:text-[#022414] px-8 py-3 rounded-xl font-black text-sm shadow-soft-sm cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-3.5 sm:space-y-4">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}

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
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-2.5 sm:py-3 text-base sm:text-sm focus:ring-2 focus:ring-[#5e8d66]/30 focus:border-[#5e8d66] outline-none transition-all font-medium"
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
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-2.5 sm:py-3 text-base sm:text-sm focus:ring-2 focus:ring-[#5e8d66]/30 focus:border-[#5e8d66] outline-none transition-all font-medium"
                placeholder="0917 123 4567"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Email Address (optional)
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-2.5 sm:py-3 text-base sm:text-sm focus:ring-2 focus:ring-[#5e8d66]/30 focus:border-[#5e8d66] outline-none transition-all font-medium"
                placeholder="email@example.com"
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
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 sm:py-3 text-base sm:text-sm focus:ring-2 focus:ring-[#5e8d66]/30 focus:border-[#5e8d66] outline-none transition-all font-medium"
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
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-2.5 sm:py-3 text-base sm:text-sm focus:ring-2 focus:ring-[#5e8d66]/30 focus:border-[#5e8d66] outline-none transition-all resize-none font-medium"
                placeholder="Individual or group session, technique focus, etc."
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-hover-pink w-full bg-[#022414] hover:bg-[#5e8d66] dark:bg-[#5e8d66] dark:hover:bg-[#f1a6bc] text-white dark:hover:text-[#022414] py-3.5 rounded-xl font-black text-sm shadow-soft-sm hover:shadow-soft-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
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
