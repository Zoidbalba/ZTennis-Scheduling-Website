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

export default function DashboardTrainees() {
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('all');
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [notesModalTrainee, setNotesModalTrainee] = useState(null);
  const [traineeNote, setTraineeNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchTrainees = async () => {
    try {
      setLoading(true);
      const data = await api.getTrainees();
      setTrainees(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load trainees roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainees();
  }, []);

  const handleOpenNotes = (trainee) => {
    setNotesModalTrainee(trainee);
    setTraineeNote(trainee.coach_notes || '');
  };

  const handleSaveNote = async () => {
    if (!notesModalTrainee) return;
    try {
      setSavingNote(true);
      // Update note on the latest booking for this trainee
      const latestBooking = notesModalTrainee.sessions?.[0] || { id: notesModalTrainee.id };
      await api.updateBooking(latestBooking.id, { coach_notes: traineeNote });
      await fetchTrainees();
      setNotesModalTrainee(null);
    } catch (err) {
      alert(err.message || 'Failed to save coach notes');
    } finally {
      setSavingNote(false);
    }
  };

  const totalSessionsCount = trainees.reduce((sum, t) => sum + (t.total_sessions || 0), 0);
  const totalConfirmedCount = trainees.reduce((sum, t) => sum + (t.confirmed_sessions || 0), 0);
  const totalPendingCount = trainees.reduce((sum, t) => sum + (t.pending_sessions || 0), 0);

  const filteredTrainees = trainees.filter((t) => {
    const matchesSearch =
      (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.contact || '').includes(searchTerm) ||
      (t.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSkill = skillFilter === 'all' || (t.skill_level || '').toLowerCase() === skillFilter.toLowerCase();

    return matchesSearch && matchesSkill;
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
                Coach Management Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trainees & Player Roster
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage players, view lesson histories, contact trainees, and record coaching notes
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/dashboard/bookings"
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all shadow-soft-xs"
            >
              View Booking Requests →
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Trainees</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{trainees.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Registered in roster</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmed Sessions</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{totalConfirmedCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">Ready for court play</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Requests</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{totalPendingCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting confirmation</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Booked Hours</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {totalSessionsCount * 2} <span className="text-sm font-semibold text-slate-500">hrs</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Malaybalay Public Court</p>
          </div>
        </div>

        {/* Navigation Switcher Pills */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Link
            to="/dashboard/trainees"
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-900 text-white shadow-soft-xs"
          >
            Trainees Directory ({trainees.length})
          </Link>
          <Link
            to="/dashboard/bookings"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            Schedule & Bookings
          </Link>
        </div>

        {/* Search & Skill Level Filters */}
        <div className="bg-white rounded-2xl shadow-soft-sm border border-slate-200/80 p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Skill Filter Tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {['all', 'beginner', 'intermediate', 'advanced'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSkillFilter(lvl)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  skillFilter === lvl
                    ? 'bg-slate-900 text-white shadow-soft-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {lvl === 'all' ? 'All Skill Levels' : lvl}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all"
            />
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Trainees List / Grid */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-soft-sm border border-slate-200">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
              Loading trainees roster...
            </p>
          </div>
        ) : filteredTrainees.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-soft-sm border border-slate-200 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 font-black text-lg flex items-center justify-center mx-auto mb-3">
              Z
            </div>
            <h3 className="text-base font-bold text-slate-900">No trainees found</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              {searchTerm || skillFilter !== 'all'
                ? 'Try adjusting your search criteria or skill level filter.'
                : 'No players have submitted booking requests yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTrainees.map((trainee) => (
              <div
                key={`${trainee.name}_${trainee.contact}`}
                className="bg-white rounded-3xl shadow-soft-sm border border-slate-200/80 p-6 hover:border-slate-400 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar of Card: Initials + Name + Skill */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center shadow-soft-xs">
                        {getInitials(trainee.name)}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                          {trainee.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {trainee.total_sessions} session{trainee.total_sessions > 1 ? 's' : ''} requested
                        </p>
                      </div>
                    </div>

                    <span className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {trainee.skill_level || 'Beginner'}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Contact:</span>
                      <a
                        href={`tel:${trainee.contact}`}
                        className="font-bold text-slate-900 hover:underline"
                      >
                        {trainee.contact}
                      </a>
                    </div>
                    {trainee.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Email:</span>
                        <a
                          href={`mailto:${trainee.email}`}
                          className="font-medium text-slate-700 hover:text-slate-900 truncate max-w-[180px]"
                        >
                          {trainee.email}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Last Scheduled:</span>
                      <span className="font-semibold text-slate-900">
                        {formatDate(trainee.last_session_date)}
                      </span>
                    </div>
                  </div>

                  {/* Coach Notes Preview */}
                  {trainee.coach_notes ? (
                    <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-900">
                      <p className="font-bold text-[10px] uppercase tracking-wider text-amber-800 mb-0.5">
                        Coach Note:
                      </p>
                      <p className="italic">"{trainee.coach_notes}"</p>
                    </div>
                  ) : null}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${trainee.contact}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                      title="Call Trainee"
                    >
                      Call
                    </a>
                    <a
                      href={`sms:${trainee.contact}?body=Hi ${encodeURIComponent(
                        trainee.name
                      )}, Coach Zoid here from Z Tennis Malaybalay City. Regarding your scheduled training...`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-soft-xs transition-colors"
                      title="SMS Trainee"
                    >
                      SMS
                    </a>
                    <button
                      onClick={() => handleOpenNotes(trainee)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      {trainee.coach_notes ? 'Edit Note' : '+ Note'}
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedTrainee(trainee)}
                    className="text-xs font-bold text-slate-900 hover:text-slate-700 underline underline-offset-4 cursor-pointer"
                  >
                    View History ({trainee.sessions?.length || 0}) →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sessions History Modal */}
        {selectedTrainee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-soft-xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {selectedTrainee.name}'s Sessions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Phone: {selectedTrainee.contact} • Level: {selectedTrainee.skill_level}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTrainee(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {selectedTrainee.sessions && selectedTrainee.sessions.length > 0 ? (
                  selectedTrainee.sessions.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">
                          {formatDate(s.booking_date)}
                        </span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            s.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : s.status === 'declined'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Time: {formatTime(s.start_time)} – {formatTime(s.end_time)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Court: Malaybalay Public Court
                      </p>
                      {s.message && (
                        <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/60 italic">
                          "{s.message}"
                        </p>
                      )}
                      {s.coach_notes && (
                        <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60">
                          <span className="font-bold">Coach Note:</span> {s.coach_notes}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">No session records found.</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedTrainee(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-soft-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Coach Note Edit Modal */}
        {notesModalTrainee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-soft-xl max-w-md w-full p-6 border border-slate-200">
              <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                Coach Notes for {notesModalTrainee.name}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Record training goals, racket specs, progress observations, or scheduling reminders.
              </p>

              <textarea
                value={traineeNote}
                onChange={(e) => setTraineeNote(e.target.value)}
                placeholder="E.g., Baseline topspin drill focus; recommended 52lbs string tension; preparing for upcoming regional tournament..."
                rows={4}
                className="w-full p-3 border border-slate-300 rounded-2xl text-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none font-medium mb-4"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setNotesModalTrainee(null)}
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

