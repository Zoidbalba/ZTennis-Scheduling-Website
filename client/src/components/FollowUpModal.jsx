import React, { useState } from 'react';
import { api } from '../api/client';

export default function FollowUpModal({ booking, isOpen, onClose, onSuccess }) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !booking) return null;

  const SUGGESTIONS = [
    `Hi Coach Zoid! Following up on my booking request for ${booking.booking_date} at ${booking.start_time}. Let me know if that slot works!`,
    `Looking forward to our tennis session on ${booking.booking_date}! Please confirm when you get a chance so I can prepare my gear.`,
    `Hi Coach! Just checking in about our schedule on ${booking.booking_date}. Excited to train!`,
  ];

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!message.trim()) {
      setError('Please type a short follow-up message.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.sendFollowUpMessage(booking.id, message.trim());
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to send follow-up message.');
    } finally {
      setSubmitting(false);
    }
  };

  const coachPhone = '09350034792';
  const coachEmail = 'zoidbalba2@gmail.com';
  const prefilledEmailSubject = encodeURIComponent(`🎾 Trainee Follow-Up — ${booking.booking_date}`);
  const prefilledEmailBody = encodeURIComponent(
    message.trim() || `Hi Coach Zoid! Following up on my tennis booking for ${booking.booking_date} (${booking.start_time}).`
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl w-full max-w-lg overflow-hidden animate-scale-up border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1A1118] text-white p-6 sm:p-7 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
          <span className="inline-block bg-[#E0749A] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2">
            Personal Follow-Up
          </span>
          <h3 className="text-xl sm:text-2xl font-black">Follow Up with Coach Zoid</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Personally inform the coach about your pending schedule for <strong>{booking.booking_date}</strong>.
          </p>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-6 sm:p-8 text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-black text-2xl flex items-center justify-center mx-auto shadow-soft-xs">
              ✓
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white">Follow-Up Note Sent!</h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Your message was attached to your booking and notified to Coach Zoid via email. You will receive an email update the moment your session is accepted!
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <a
                href={`mailto:${coachEmail}?subject=${prefilledEmailSubject}&body=${prefilledEmailBody}`}
                className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
              >
                <span>✉️ Open in Gmail / Mail App</span>
              </a>
              <button
                onClick={onClose}
                className="py-3 px-6 bg-[#E0749A] hover:bg-[#cf5479] text-white rounded-xl font-black text-xs shadow-soft-xs cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold p-3.5 rounded-2xl border border-rose-200/80">
                {error}
              </div>
            )}

            {/* Quick Suggestions */}
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Quick suggestion templates:
              </span>
              <div className="space-y-1.5">
                {SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMessage(sug)}
                    className="w-full text-left text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-pink-50 dark:hover:bg-[#20101a] border border-slate-200 dark:border-slate-800 hover:border-pink-300 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    "{sug}"
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Message Area */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Your Follow-Up Message *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                placeholder="Type your message to Coach Zoid here..."
                className="w-full p-3.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#E0749A] outline-none border-0 transition-all resize-none placeholder:text-slate-400"
              />
            </div>

            {/* Submit & Fallback Options */}
            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full py-3.5 px-4 bg-[#E0749A] hover:bg-[#cf5479] text-white rounded-xl font-black text-xs sm:text-sm shadow-soft-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? 'Sending...' : 'Send Follow-Up Note to Coach Zoid →'}</span>
              </button>

              <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-slate-500">
                <span>Or message directly:</span>
                <a
                  href={`mailto:${coachEmail}?subject=${prefilledEmailSubject}&body=${prefilledEmailBody}`}
                  className="font-bold text-[#E0749A] hover:underline"
                >
                  ✉️ Email Coach
                </a>
                <span>•</span>
                <a
                  href="https://m.me/tenniscoachph"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#1F7A5A] hover:underline"
                >
                  💬 Messenger
                </a>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
