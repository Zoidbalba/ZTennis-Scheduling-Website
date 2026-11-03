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
  const [deleteModalBooking, setDeleteModalBooking] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [noteModalBooking, setNoteModalBooking] = useState(null);
  const [bookingNote, setBookingNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

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

  const handleStatusUpdate = async (id, status) => {
    try {
      setActionLoading(id);
      await api.updateBookingStatus(id, status);
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
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Coach Management Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bookings & Schedule Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Review incoming lesson requests, confirm sessions, and manage trainees at Malaybalay Public Court
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/trainees"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-soft-xs flex items-center gap-2"
            >
              <span>View Trainee Directory</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Overview Stat Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Requests</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{counts.all}</p>
            <p className="text-[11px] text-slate-400 mt-1">All-time bookings</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Action</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{counts.pending}</p>
            <p className="text-[11px] text-slate-400 mt-1">Needs coach reply</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmed Lessons</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{counts.confirmed}</p>
            <p className="text-[11px] text-slate-400 mt-1">Scheduled on calendar</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Court Location</p>
            <p className="text-sm font-extrabold text-slate-900 mt-2 truncate">Public Tennis Court</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Malaybalay City (6am–9am)</p>
          </div>
        </div>

        {/* Tab Navigation Pill Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Link
            to="/dashboard/bookings"
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-900 text-white shadow-soft-xs"
          >
            Schedule & Bookings ({counts.all})
          </Link>
          <Link
            to="/dashboard/trainees"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            Trainees Directory
          </Link>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-2xl shadow-soft-sm border border-slate-200/80 p-4 space-y-3">
          {/* Status Tabs & Timeframe */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All', count: counts.all },
                { id: 'pending', label: 'Pending', count: counts.pending, alert: counts.pending > 0 },
                { id: 'confirmed', label: 'Confirmed', count: counts.confirmed },
                { id: 'declined', label: 'Declined', count: counts.declined },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    filter === tab.id
                      ? 'bg-slate-900 text-white shadow-soft-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded-full ${
                      filter === tab.id
                        ? 'bg-white/20 text-white'
                        : tab.alert
                        ? 'bg-amber-100 text-amber-900 font-extrabold'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Timeframe Chips */}
            <div className="flex items-center gap-1.5 self-start lg:self-auto">
              {[
                { id: 'all', label: 'All Dates' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'today', label: 'Today' },
                { id: 'past', label: 'Past' },
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setDateFilter(tf.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    dateFilter === tf.id
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="pt-2 border-t border-slate-100">
            <input
              type="text"
              placeholder="Search by trainee name, contact number, email, or date (YYYY-MM-DD)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all"
            />
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-soft-sm border border-slate-200">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
              Loading scheduled bookings...
            </p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-soft-sm border border-slate-200 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 font-black text-lg flex items-center justify-center mx-auto mb-3">
              Z
            </div>
            <h3 className="text-base font-bold text-slate-900">No bookings match your filter</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
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
                className="bg-white rounded-3xl shadow-soft-sm border border-slate-200/80 p-5 sm:p-6 hover:border-slate-400 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left Column: Player, Date, Court & Notes */}
                  <div className="space-y-3 flex-1">
                    {/* Header Row: Initials + Name + Badges */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shadow-soft-xs">
                        {getInitials(b.player_name)}
                      </div>

                      <span className="text-base font-extrabold text-slate-900">
                        {b.player_name}
                      </span>

                      {b.skill_level && (
                        <span className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {b.skill_level}
                        </span>
                      )}

                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : b.status === 'declined'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    {/* Schedule Time & Location Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 font-medium">Session Date:</span>{' '}
                        <span className="font-bold text-slate-900">{formatDate(b.booking_date)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Time:</span>{' '}
                        <span className="font-bold text-slate-900">
                          {formatTime(b.start_time)} – {formatTime(b.end_time)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Court:</span>{' '}
                        <span className="font-semibold text-slate-800">Malaybalay Public Court</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Duration:</span>{' '}
                        <span className="font-semibold text-slate-800">1.5 - 2 Hours</span>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Phone:</span>{' '}
                        <a
                          href={`tel:${b.player_contact}`}
                          className="text-slate-900 font-bold hover:underline"
                        >
                          {b.player_contact}
                        </a>
                      </div>
                      {b.player_email && (
                        <div>
                          <span className="text-slate-400">Email:</span>{' '}
                          <a
                            href={`mailto:${b.player_email}`}
                            className="text-slate-700 hover:text-slate-900 font-medium"
                          >
                            {b.player_email}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Trainee Message */}
                    {b.message && (
                      <p className="text-xs bg-slate-50 text-slate-700 p-3 rounded-xl border border-slate-200 italic">
                        <span className="font-semibold not-italic text-slate-900">Trainee message:</span> "{b.message}"
                      </p>
                    )}

                    {/* Coach Private Notes */}
                    {b.coach_notes ? (
                      <div className="text-xs bg-amber-50/70 border border-amber-200/80 text-amber-900 p-3 rounded-xl">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800">
                            Coach Note
                          </span>
                          <button
                            onClick={() => handleOpenNote(b)}
                            className="text-[10px] font-bold text-amber-800 hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                        <p>{b.coach_notes}</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Right Column: Direct Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${b.player_contact}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                        title="Call Trainee"
                      >
                        Call
                      </a>
                      <a
                        href={`sms:${b.player_contact}?body=Hi ${encodeURIComponent(
                          b.player_name
                        )}, Coach Zoid here regarding your tennis session on ${formatDate(
                          b.booking_date
                        )} at Malaybalay Public Court...`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                        title="SMS Trainee"
                      >
                        SMS
                      </a>
                      <button
                        onClick={() => handleOpenNote(b)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                        title="Add/Edit Note"
                      >
                        {b.coach_notes ? 'Note' : '+ Note'}
                      </button>
                    </div>

                    {/* Status Management Actions */}
                    <div className="flex items-center gap-2 mt-2">
                      {b.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(b.id, 'confirmed')}
                            disabled={actionLoading === b.id}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-soft-xs transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(b.id, 'declined')}
                            disabled={actionLoading === b.id}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Decline
                          </button>
                        </>
                      ) : b.status === 'confirmed' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStatusUpdate(b.id, 'declined')}
                            disabled={actionLoading === b.id}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStatusUpdate(b.id, 'confirmed')}
                          disabled={actionLoading === b.id}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Re-activate
                        </button>
                      )}

                      {/* Delete Booking Option */}
                      <button
                        onClick={() => setDeleteModalBooking(b)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-xs"
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

        {/* Delete Confirmation Modal */}
        {deleteModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-soft-xl max-w-sm w-full p-6 border border-slate-200">
              <h3 className="text-lg font-extrabold text-slate-900 mb-1">Delete Booking?</h3>
              <p className="text-xs text-slate-500 mb-4">
                Are you sure you want to remove the booking for{' '}
                <strong className="text-slate-800">{deleteModalBooking.player_name}</strong> on{' '}
                {formatDate(deleteModalBooking.booking_date)}? This cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setDeleteModalBooking(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-soft-xl max-w-md w-full p-6 border border-slate-200">
              <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                Coach Notes ({noteModalBooking.player_name})
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Session: {formatDate(noteModalBooking.booking_date)} at {formatTime(noteModalBooking.start_time)}.
              </p>

              <textarea
                value={bookingNote}
                onChange={(e) => setBookingNote(e.target.value)}
                placeholder="E.g., Trainee brought Wilson Clash racket; focused on footwork and baseline deep balls..."
                rows={4}
                className="w-full p-3 border border-slate-300 rounded-2xl text-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none font-medium mb-4"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setNoteModalBooking(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-soft-xs transition-colors cursor-pointer disabled:opacity-50"
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
