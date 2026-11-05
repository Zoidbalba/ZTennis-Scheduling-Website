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
          <div className="p-6 sm:p-10 text-center animate-fade-in">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#E27396] text-white font-black text-xl sm:text-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-soft-sm">
              Z
            </div>
            <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Booking Request Sent</h4>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-sm mx-auto mb-6 sm:mb-8 leading-relaxed">
              Coach will contact you via <strong>SMS or phone</strong> at{' '}
              <span className="font-bold text-slate-900 dark:text-white">{form.contact_number}</span> to confirm your session and court arrangements.
            </p>
            <button
              onClick={onClose}
              className="btn-hover-pink w-full sm:w-auto bg-[#E27396] hover:bg-[#cf5479] text-white px-8 py-3 rounded-xl font-black text-sm shadow-soft-sm cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            {error && (
              <div className="bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 px-4 py-3 rounded-2xl text-xs font-semibold">
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
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E27396] outline-none transition-all font-medium border-0"
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
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E27396] outline-none transition-all font-medium border-0"
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
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E27396] outline-none transition-all font-medium border-0"
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
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E27396] outline-none transition-all font-medium border-0"
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
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E27396] outline-none transition-all resize-none font-medium border-0"
                placeholder="Individual or group session, technique focus, etc."
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-hover-pink w-full bg-[#E27396] hover:bg-[#cf5479] text-white py-3.5 rounded-xl font-black text-sm shadow-soft-sm hover:shadow-soft-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
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
