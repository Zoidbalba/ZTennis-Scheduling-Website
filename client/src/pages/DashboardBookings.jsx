import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  return d.toLocaleDateString('en-PH', {
    weekday: 'short',
    year: 'numeric',
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

export default function DashboardBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  // Delete modal state
  const [deleteModalBooking, setDeleteModalBooking] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Coach note modal state
  const [noteModalBooking, setNoteModalBooking] = useState(null);
  const [bookingNote, setBookingNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // SMS notification toast state
  const [smsToast, setSmsToast] = useState(null);

  // Send SMS modal state
  const [smsModalBooking, setSmsModalBooking] = useState(null);
  const [smsModalText, setSmsModalText] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  const [showSmsGuide, setShowSmsGuide] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await api.getBookings();
      setBookings(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Accept / Decline handler with automated SMS dispatch
  const handleStatusUpdate = async (id, status) => {
    try {
      setActionLoading(id);
      const res = await api.updateBookingStatus(id, status);

      // Show SMS confirmation toast
      if (res.sms) {
        if (res.sms.sent && !res.sms.simulated) {
          setSmsToast({
            type: 'success',
            title: `SMS Delivered to ${res.booking.player_name}!`,
            message: `Automated SMS was sent to ${res.booking.player_contact}.`,
          });
        } else if (res.sms.simulated) {
          setSmsToast({
            type: 'info',
            title: `Appointment ${status === 'confirmed' ? 'Accepted' : 'Declined'} (Simulation Mode)`,
            message: `Automated SMS was simulated and logged. To send live SMS to ${res.booking.player_contact}, add SEMAPHORE_API_KEY in Render.`,
          });
        } else if (res.sms.error) {
          setSmsToast({
            type: 'warning',
            title: `Appointment updated, but SMS delivery failed`,
            message: `${res.sms.error}. You can still tap SMS to message manually from your phone.`,
          });
        }
      } else {
        setSmsToast({
          type: 'info',
          title: `Appointment ${status === 'confirmed' ? 'Accepted' : 'Updated'}`,
          message: `Status set to ${status}.`,
        });
      }

      await fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to update booking status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBooking = async () => {
    if (!deleteModalBooking) return;
    try {
      setDeleting(true);
      await api.deleteBooking(deleteModalBooking.id);
      setDeleteModalBooking(null);
      await fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to delete booking');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenNote = (b) => {
    setNoteModalBooking(b);
    setBookingNote(b.coach_notes || '');
  };

  const handleSaveNote = async () => {
    if (!noteModalBooking) return;
    try {
      setSavingNote(true);
      await api.updateBooking(noteModalBooking.id, { coach_notes: bookingNote });
      setNoteModalBooking(null);
      await fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  // Open manual SMS modal with preset text
  const handleOpenSmsModal = (b, preset = 'accepted') => {
    setSmsModalBooking(b);
    const dateStr = formatDate(b.booking_date);
    const timeStr = `${formatTime(b.start_time)} - ${formatTime(b.end_time)}`;
    const name = b.player_name || 'Trainee';

    if (preset === 'accepted') {
      setSmsModalText(
        `Hi ${name}! Your tennis session on ${dateStr} at ${timeStr} (Malaybalay Public Court) has been ACCEPTED. See you on the court! Please bring your racket and hydration.`
      );
    } else if (preset === 'declined') {
      setSmsModalText(
        `Hi ${name}, thank you for your booking request on ${dateStr} at ${timeStr}. Unfortunately, Coach Zoid is unable to accommodate this schedule. Please check the website for another available morning slot.`
      );
    } else if (preset === 'reminder') {
      setSmsModalText(
        `Hi ${name}! Friendly reminder of your tennis coaching session tomorrow (${dateStr}) at ${timeStr} at Malaybalay Public Court. See you there!`
      );
    } else {
      setSmsModalText('');
    }
  };

  // Dispatch manual SMS
  const handleSendManualSms = async () => {
    if (!smsModalBooking) return;
    try {
      setSendingSms(true);
      const res = await api.sendBookingSms(smsModalBooking.id, {
        message: smsModalText,
      });

      if (res.sms?.sent && !res.sms?.simulated) {
        setSmsToast({
          type: 'success',
          title: 'SMS Sent!',
          message: `Live SMS delivered to ${smsModalBooking.player_contact}.`,
        });
      } else {
        setSmsToast({
          type: 'info',
          title: 'SMS Dispatched (Simulation)',
          message: `SMS was logged to server console. Add SEMAPHORE_API_KEY in Render for live delivery.`,
        });
      }

      setSmsModalBooking(null);
      await fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to send SMS');
    } finally {
      setSendingSms(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    declined: bookings.filter((b) => b.status === 'declined').length,
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = filter === 'all' || b.status === filter;

    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = b.booking_date === todayStr;
    } else if (dateFilter === 'upcoming') {
      matchesDate = b.booking_date >= todayStr;
    } else if (dateFilter === 'past') {
      matchesDate = b.booking_date < todayStr;
    }

    const matchesSearch =
      (b.player_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.player_contact || '').includes(searchTerm) ||
      (b.player_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.booking_date || '').includes(searchTerm);

    return matchesFilter && matchesDate && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#E27396] animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#E27396] dark:text-[#EA9AB2]">
                Coach Management Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Bookings & Schedule Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Review incoming lesson requests, confirm sessions with automated SMS alerts, and manage trainees.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/trainees"
              className="px-4 py-2 bg-[#E27396] hover:bg-[#cf5479] text-white text-xs font-bold rounded-xl transition-all shadow-soft-xs flex items-center gap-2"
            >
              <span>View Trainee Directory</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* SMS Notification Banner / Toast */}
        {smsToast && (
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-soft-sm animate-fade-in ${
              smsToast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                : smsToast.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                : 'bg-primary-50 dark:bg-primary-950/60 border-primary-200 dark:border-primary-800 text-primary-950 dark:text-primary-100'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-lg">📱</span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">{smsToast.title}</h4>
                <p className="text-xs mt-0.5 leading-relaxed opacity-90">{smsToast.message}</p>
              </div>
            </div>
            <button
              onClick={() => setSmsToast(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Automated SMS Information Callout */}
        <div className="bg-white dark:bg-slate-900 border border-[#EA9AB2]/30 rounded-2xl p-4 sm:p-5 shadow-soft-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#FFDBE5] dark:bg-[#20101a] text-[#E27396] flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                SMS
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Automated SMS Notifications Active</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#FFDBE5] dark:bg-[#20101a] text-[#E27396] border border-[#EA9AB2]/40">
                    Auto-Send
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  When you click <strong>Accept</strong> or <strong>Decline</strong>, an automated text message is instantly dispatched to the trainee's mobile number.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSmsGuide(!showSmsGuide)}
              className="text-xs font-bold text-[#E27396] dark:text-[#EA9AB2] hover:underline self-start sm:self-auto shrink-0"
            >
              {showSmsGuide ? 'Hide Setup Guide ▲' : 'Render SMS Setup Guide ▼'}
            </button>
          </div>

          {/* Collapsible SMS Setup Guide */}
          {showSmsGuide && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2.5 animate-fade-in">
              <p className="font-bold text-slate-900 dark:text-white">
                How to enable live SMS delivery to trainees in the Philippines via Semaphore:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-600 dark:text-slate-400">
                <li>Create a free account on <a href="https://semaphore.co" target="_blank" rel="noreferrer" className="text-[#E27396] underline font-bold">Semaphore.co</a> (The #1 SMS gateway for PH telcos).</li>
                <li>Copy your <strong>API Key</strong> from the Semaphore dashboard.</li>
                <li>Go to your <strong>Render Dashboard → Environment Variables</strong> (the screen you opened earlier).</li>
                <li>Add variable key <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-900 dark:text-white font-mono">SEMAPHORE_API_KEY</code> and paste your key.</li>
                <li>Save changes. Render will automatically redeploy and live SMS will start sending instantly to trainees!</li>
              </ol>
              <p className="text-[11px] text-slate-400 italic">
                *Note: Even without an API key, the system safely operates in simulation mode and never crashes.
              </p>
            </div>
          )}
        </div>

        {/* Overview Stat Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Requests</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{counts.all}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">All-time bookings</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Action</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{counts.pending}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Needs coach reply</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirmed Lessons</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{counts.confirmed}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Scheduled on calendar</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Declined</p>
            <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{counts.declined}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Declined or canceled</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-soft-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 pointer-events-none text-xs">
                🔍
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search trainee name, phone, or date..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#E27396] outline-none border-0"
              />
            </div>

            {/* Date Quick Filter */}
            <div className="flex items-center gap-1.5 self-center">
              {[
                { id: 'all', label: 'All Dates' },
                { id: 'today', label: 'Today' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'past', label: 'Past' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setDateFilter(id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                    dateFilter === id
                      ? 'bg-slate-900 dark:bg-primary-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar border-t border-slate-100 dark:border-slate-800 pt-3">
            {[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'pending', label: 'Pending', count: counts.pending },
              { id: 'confirmed', label: 'Confirmed', count: counts.confirmed },
              { id: 'declined', label: 'Declined', count: counts.declined },
            ].map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  filter === id
                    ? 'bg-[#E27396] text-white shadow-soft-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    filter === id ? 'bg-white text-[#E27396]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl shadow-soft-sm border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-[#E27396] text-white font-black flex items-center justify-center mx-auto mb-3 animate-pulse">
              Z
            </div>
            <p className="text-xs font-semibold text-slate-400">Loading bookings & SMS logs...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl shadow-soft-sm border border-slate-200 dark:border-slate-800 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-black text-lg flex items-center justify-center mx-auto mb-3">
              Z
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No bookings match your filter</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              {searchTerm || filter !== 'all' || dateFilter !== 'all'
                ? 'Try resetting the filters or clearing the search query.'
                : 'No trainees have booked a session yet.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-sm p-6 hover:shadow-soft-md transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left Column: Player, Date, Court & Notes */}
                  <div className="space-y-3 flex-1">
                    {/* Header Row: Initials + Name + Badges */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#E27396] text-white font-extrabold text-xs flex items-center justify-center shadow-soft-xs">
                        {getInitials(b.player_name)}
                      </div>

                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        {b.player_name}
                      </span>

                      {b.skill_level && (
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                          {b.skill_level}
                        </span>
                      )}

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : b.status === 'declined'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                        }`}
                      >
                        {b.status}
                      </span>

                      {/* SMS Notification Status Badge */}
                      {b.sms_status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-3 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                          <span>✓</span>
                          <span>SMS Sent</span>
                        </span>
                      ) : b.sms_status === 'simulated' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-3 py-1 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
                          <span>📱</span>
                          <span>SMS Logged</span>
                        </span>
                      ) : b.sms_status?.startsWith('failed') ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-3 py-1 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                          <span>⚠️</span>
                          <span>SMS Failed</span>
                        </span>
                      ) : null}
                    </div>

                    {/* Schedule Time & Location Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Session Date:</span>{' '}
                        <span className="font-bold text-slate-900 dark:text-white">{formatDate(b.booking_date)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Time:</span>{' '}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatTime(b.start_time)} – {formatTime(b.end_time)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Court:</span>{' '}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Malaybalay Public Court</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Duration:</span>{' '}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">1.5 - 2 Hours</span>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500">Phone:</span>{' '}
                        <a
                          href={`tel:${b.player_contact}`}
                          className="text-[#E27396] font-bold hover:underline"
                        >
                          {b.player_contact}
                        </a>
                      </div>
                      {b.player_email && (
                        <div>
                          <span className="text-slate-400 dark:text-slate-500">Email:</span>{' '}
                          <a href={`mailto:${b.player_email}`} className="text-slate-700 dark:text-slate-300 hover:underline">
                            {b.player_email}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Trainee Message */}
                    {b.message && (
                      <p className="text-xs italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="font-semibold not-italic text-slate-900 dark:text-white">Trainee message:</span> "{b.message}"
                      </p>
                    )}

                    {/* Coach Private Notes */}
                    {b.coach_notes ? (
                      <div className="text-xs bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 p-3 rounded-xl">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800 dark:text-amber-300">
                            Coach Note
                          </span>
                          <button
                            onClick={() => handleOpenNote(b)}
                            className="text-[10px] font-bold text-amber-800 dark:text-amber-300 hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                        <p>{b.coach_notes}</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Right Column: Direct Actions */}
                  <div className="flex flex-wrap sm:flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 w-full lg:w-auto">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <a
                        href={`tel:${b.player_contact}`}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
                        title="Call Trainee"
                      >
                        Call
                      </a>

                      {/* Custom/Resend SMS Button */}
                      <button
                        onClick={() => handleOpenSmsModal(b, b.status === 'confirmed' ? 'accepted' : 'reminder')}
                        className="px-2.5 py-1.5 bg-[#FFDBE5] dark:bg-[#20101a] hover:bg-[#EA9AB2]/30 text-[#E27396] text-xs font-bold rounded-xl transition-colors border border-[#EA9AB2]/40"
                        title="Compose/Send SMS via Semaphore Gateway"
                      >
                        SMS 💬
                      </button>

                      {/* Note Button */}
                      <button
                        onClick={() => handleOpenNote(b)}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                        title="Add/Edit Note"
                      >
                        {b.coach_notes ? 'Note' : '+ Note'}
                      </button>
                    </div>

                    {/* Status Management Actions with Automatic SMS Trigger */}
                    <div className="flex items-center gap-2 mt-2">
                      {b.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(b.id, 'confirmed')}
                            disabled={actionLoading === b.id}
                            className="btn-hover-pink px-4 py-2 bg-[#E27396] hover:bg-[#cf5479] text-white text-xs font-bold rounded-xl shadow-soft-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                            title="Accept appointment and send automated SMS confirmation to trainee"
                          >
                            <span>✓ Accept & SMS</span>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(b.id, 'declined')}
                            disabled={actionLoading === b.id}
                            className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                            title="Decline appointment and send automated SMS notification"
                          >
                            Decline
                          </button>
                        </>
                      ) : b.status === 'confirmed' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStatusUpdate(b.id, 'declined')}
                            disabled={actionLoading === b.id}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                            title="Cancel appointment and notify trainee via SMS"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStatusUpdate(b.id, 'confirmed')}
                          disabled={actionLoading === b.id}
                          className="px-3 py-1.5 bg-[#FFDBE5] dark:bg-[#20101a] hover:bg-[#E27396] hover:text-white text-[#E27396] text-xs font-bold rounded-xl transition-colors cursor-pointer border border-[#EA9AB2]/40"
                          title="Re-activate and notify trainee via SMS"
                        >
                          Re-activate & SMS
                        </button>
                      )}

                      {/* Delete Booking Option */}
                      <button
                        onClick={() => setDeleteModalBooking(b)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer text-xs"
                        title="Delete Booking"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual SMS Modal */}
        {smsModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 p-4 backdrop-blur-xs animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="bg-[#14060f] dark:bg-[#0d0309] text-white p-5 border-b border-[#EA9AB2]/25 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>📱 Send SMS to Trainee</span>
                  </h3>
                  <p className="text-xs text-[#FFDBE5]/80 mt-0.5">
                    Recipient: {smsModalBooking.player_name} ({smsModalBooking.player_contact})
                  </p>
                </div>
                <button
                  onClick={() => setSmsModalBooking(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                {/* Quick Presets */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Quick Template Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenSmsModal(smsModalBooking, 'accepted')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                    >
                      Accepted
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenSmsModal(smsModalBooking, 'reminder')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                    >
                      Reminder
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenSmsModal(smsModalBooking, 'declined')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                    >
                      Declined
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    SMS Message Body
                  </label>
                  <textarea
                    value={smsModalText}
                    onChange={(e) => setSmsModalText(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-xs focus:ring-2 focus:ring-[#E27396]/20 focus:border-[#E27396] outline-none font-medium resize-none"
                    placeholder="Type your SMS message..."
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                    <span>Target Phone: {smsModalBooking.player_contact}</span>
                    <span>{smsModalText.length} characters</span>
                  </div>
                </div>

                {/* Direct carrier link fallback */}
                <div className="text-center pt-1">
                  <a
                    href={`sms:${smsModalBooking.player_contact}?body=${encodeURIComponent(smsModalText)}`}
                    className="text-[11px] text-slate-400 hover:text-[#E27396] underline font-medium"
                  >
                    Or open native phone Messaging App directly →
                  </a>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setSmsModalBooking(null)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendManualSms}
                    disabled={sendingSms || !smsModalText.trim()}
                    className="btn-hover-pink px-5 py-2.5 bg-[#E27396] hover:bg-[#cf5479] text-white text-xs font-bold rounded-xl shadow-soft-xs transition-colors disabled:opacity-50"
                  >
                    {sendingSms ? 'Sending SMS...' : 'Send SMS Now →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">Delete Booking?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Are you sure you want to remove the booking for{' '}
                <strong className="text-slate-800 dark:text-slate-200">{deleteModalBooking.player_name}</strong> on{' '}
                {formatDate(deleteModalBooking.booking_date)}? This cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setDeleteModalBooking(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBooking}
                  disabled={deleting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-soft-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Coach Note Edit Modal */}
        {noteModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">
                Coach Notes ({noteModalBooking.player_name})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Session: {formatDate(noteModalBooking.booking_date)} at {formatTime(noteModalBooking.start_time)}.
              </p>

              <textarea
                value={bookingNote}
                onChange={(e) => setBookingNote(e.target.value)}
                placeholder="E.g., Trainee brought Wilson Clash racket; focused on footwork and baseline deep balls..."
                rows={4}
                className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-xs focus:ring-2 focus:ring-[#E27396]/20 focus:border-[#E27396] outline-none font-medium mb-4"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setNoteModalBooking(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="btn-hover-pink px-5 py-2 bg-[#E27396] hover:bg-[#cf5479] text-white text-xs font-bold rounded-xl shadow-soft-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
