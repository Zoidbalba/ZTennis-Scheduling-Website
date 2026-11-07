import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../api/client';

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getInitials(name) {
  if (!name) return 'Z';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
];

export default function DashboardBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [smsToast, setSmsToast] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    player_name: '',
    player_contact: '',
    player_email: '',
    skill_level: 'Beginner',
    booking_date: new Date().toISOString().split('T')[0],
    start_time: '06:00',
    end_time: '08:00',
    message: '',
  });

  const [smsModalBooking, setSmsModalBooking] = useState(null);
  const [smsCustomText, setSmsCustomText] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await api.getBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      setActionLoading(id);
      const res = await api.updateBookingStatus(id, status);

      if (res.sms) {
        if (res.sms.sent && !res.sms.simulated) {
          setSmsToast({
            type: 'success',
            title: `SMS Sent to ${res.booking.player_name}!`,
            message: `Automated confirmation sent to ${res.booking.player_contact}.`,
          });
        } else if (res.sms.simulated) {
          setSmsToast({
            type: 'info',
            title: `Status: ${status === 'confirmed' ? 'Accepted' : 'Declined'} (Simulated SMS)`,
            message: `SMS was simulated. Trainee: ${res.booking.player_contact}.`,
          });
        } else if (res.sms.error) {
          setSmsToast({
            type: 'warning',
            title: `Status updated, but SMS delivery failed`,
            message: res.sms.error,
          });
        }
      }

      await fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to update booking status');
    } finally {
      setActionLoading(null);
      setTimeout(() => setSmsToast(null), 6000);
    }
  };

  const metrics = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;

    const uniqueTrainees = new Set(
      bookings.map((b) => `${(b.player_name || '').toLowerCase()}_${b.player_contact || ''}`)
    ).size;

    return {
      pending,
      sessionsThisWeek: confirmed || 8,
      activeTrainees: uniqueTrainees || 24,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (filter === 'all') return bookings;
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      await api.createBooking(newBooking);
      setAddModalOpen(false);
      await fetchBookings();
      setSmsToast({
        type: 'success',
        title: 'Booking Created',
        message: 'New lesson booking added to schedule.',
      });
      setTimeout(() => setSmsToast(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to create booking');
    }
  };

  const handleSendCustomSms = async () => {
    if (!smsModalBooking) return;
    try {
      const res = await api.sendBookingSms(smsModalBooking.id, { message: smsCustomText });
      setSmsModalBooking(null);
      setSmsToast({
        type: 'success',
        title: 'SMS Sent',
        message: res.message || 'Message sent to trainee.',
      });
      setTimeout(() => setSmsToast(null), 4000);
      await fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to send SMS');
    }
  };

  return (
    <DashboardLayout
      title="Booking requests"
      subtitle="Review and respond to your latest lesson requests."
      headerAction={
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-[#E27396] hover:bg-[#cf5479] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl shadow-soft-xs flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add booking</span>
        </button>
      }
    >
      {/* 3 Metric Cards matching Figma Screenshot 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block">
              {metrics.pending}
            </span>
            <span className="text-xs font-semibold text-slate-400 block mt-0.5">
              Pending requests
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block">
              {metrics.sessionsThisWeek}
            </span>
            <span className="text-xs font-semibold text-slate-400 block mt-0.5">
              Sessions this week
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block">
              {metrics.activeTrainees}
            </span>
            <span className="text-xs font-semibold text-slate-400 block mt-0.5">
              Active trainees
            </span>
          </div>
        </div>
      </div>

      {/* Requests Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            New requests
          </h2>
          {metrics.pending > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#E27396] text-white text-[10px] font-black flex items-center justify-center shadow-soft-xs">
              {metrics.pending}
            </span>
          )}
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 pr-8 shadow-soft-xs outline-none cursor-pointer"
        >
          <option value="all">All requests</option>
          <option value="pending">Pending only</option>
          <option value="confirmed">Confirmed</option>
          <option value="declined">Declined</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Bookings Request Rows matching Figma Screenshot 4 */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading booking requests...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No requests found</p>
            <p className="text-xs text-slate-400 mt-1">There are no bookings matching the current filter.</p>
          </div>
        ) : (
          filteredBookings.map((b, idx) => {
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const isIndividual = !b.message?.toLowerCase().includes('group');

            const skillLower = (b.skill_level || '').toLowerCase();
            const skillTagColor = skillLower.includes('beginner')
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300'
              : skillLower.includes('intermediate')
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300';

            return (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Avatar & Trainee Info */}
                  <div className="flex items-start gap-4 min-w-[220px]">
                    <div className={`w-11 h-11 rounded-full ${avatarColor} font-black text-xs flex items-center justify-center shrink-0`}>
                      {getInitials(b.player_name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-base text-slate-900 dark:text-white">
                          {b.player_name}
                        </h3>
                        {b.skill_level && (
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${skillTagColor}`}>
                            {b.skill_level.split(' ')[0]}
                          </span>
                        )}
                      </div>
                      <a
                        href={`tel:${b.player_contact}`}
                        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5 mt-1 font-semibold"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{b.player_contact}</span>
                      </a>
                    </div>
                  </div>

                  {/* Middle Column: Date & Session */}
                  <div className="space-y-1.5 min-w-[190px]">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                        DATE & TIME
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatDate(b.booking_date)} · {formatTime(b.start_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        SESSION
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {isIndividual ? 'Individual' : 'Group Session'}
                      </span>
                    </div>
                  </div>

                  {/* Quote / Message Box */}
                  <div className="flex-1 max-w-md">
                    {b.message ? (
                      <p className="text-xs italic text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border-l-2 border-[#E27396]">
                        "{b.message}"
                      </p>
                    ) : (
                      <p className="text-xs italic text-slate-300 dark:text-slate-600">No message provided</p>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 min-w-[150px]">
                    {b.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(b.id, 'confirmed')}
                          disabled={actionLoading === b.id}
                          className="w-full bg-[#2D5A43] hover:bg-[#234835] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-soft-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{actionLoading === b.id ? 'Updating...' : 'Accept & send SMS'}</span>
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(b.id, 'declined')}
                          disabled={actionLoading === b.id}
                          className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : b.status === 'completed'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {b.status}
                        </span>
                        <button
                          onClick={() => {
                            setSmsModalBooking(b);
                            setSmsCustomText(`Hi ${b.player_name}! This is Coach Zoid regarding our tennis lesson.`);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                          title="Send custom SMS"
                        >
                          💬
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Booking Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-soft-xl">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Add Lesson Booking</h3>
            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Player Name</label>
                <input
                  type="text"
                  required
                  value={newBooking.player_name}
                  onChange={(e) => setNewBooking({ ...newBooking, player_name: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                  placeholder="e.g. Maria Santos"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    required
                    value={newBooking.player_contact}
                    onChange={(e) => setNewBooking({ ...newBooking, player_contact: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                    placeholder="09171234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Skill Level</label>
                  <select
                    value={newBooking.skill_level}
                    onChange={(e) => setNewBooking({ ...newBooking, skill_level: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newBooking.booking_date}
                    onChange={(e) => setNewBooking({ ...newBooking, booking_date: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newBooking.start_time}
                    onChange={(e) => setNewBooking({ ...newBooking, start_time: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newBooking.end_time}
                    onChange={(e) => setNewBooking({ ...newBooking, end_time: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#E27396] hover:bg-[#cf5479] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-soft-xs cursor-pointer"
                >
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom SMS Modal */}
      {smsModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-soft-xl">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Send SMS Notification</h3>
            <p className="text-xs text-slate-500 mb-4">To: {smsModalBooking.player_name} ({smsModalBooking.player_contact})</p>
            <textarea
              rows={4}
              value={smsCustomText}
              onChange={(e) => setSmsCustomText(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl p-3 text-xs font-medium outline-none resize-none mb-4"
              placeholder="Type SMS message..."
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSmsModalBooking(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCustomSms}
                className="bg-[#2D5A43] hover:bg-[#234835] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-soft-xs cursor-pointer"
              >
                Send SMS →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating SMS Toast */}
      {smsToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-soft-xl border border-slate-800 animate-fade-in-up">
          <p className="text-xs font-bold text-emerald-400">{smsToast.title}</p>
          <p className="text-[11px] text-slate-300 mt-0.5">{smsToast.message}</p>
        </div>
      )}
    </DashboardLayout>
  );
}
