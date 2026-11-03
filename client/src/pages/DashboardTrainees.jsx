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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Coach Management Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Trainees & Player Roster
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Manage players, view lesson histories, contact trainees, and record coaching notes
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/dashboard/bookings"
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-soft-xs"
            >
              View Booking Requests →
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Trainees</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{trainees.length}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Registered in roster</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirmed Sessions</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalConfirmedCount}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Ready for court play</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Requests</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{totalPendingCount}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Awaiting confirmation</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Booked Hours</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {totalSessionsCount * 2} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">hrs</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Malaybalay Public Court</p>
          </div>
        </div>

        {/* Navigation Switcher Pills */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Link
            to="/dashboard/trainees"
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-900 dark:bg-primary-600 text-white shadow-soft-xs"
          >
            Trainees Directory ({trainees.length})
          </Link>
          <Link
            to="/dashboard/bookings"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            Schedule & Bookings
          </Link>
        </div>

        {/* Search & Skill Level Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft-sm border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Skill Filter Tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {['all', 'beginner', 'intermediate', 'advanced'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSkillFilter(lvl)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  skillFilter === lvl
                    ? 'bg-slate-900 dark:bg-primary-600 text-white shadow-soft-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
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
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 p-4 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Trainees List / Grid */}
        {loading ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl shadow-soft-sm border border-slate-200 dark:border-slate-800">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider animate-pulse">
              Loading trainees roster...
            </p>
          </div>
        ) : filteredTrainees.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl shadow-soft-sm border border-slate-200 dark:border-slate-800 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-black text-lg flex items-center justify-center mx-auto mb-3">
              Z
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No trainees found</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-sm mx-auto">
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
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-sm border border-slate-200/80 dark:border-slate-800 p-6 hover:border-slate-400 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar of Card: Initials + Name + Skill */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-900 dark:bg-primary-600 text-white font-extrabold text-sm flex items-center justify-center shadow-soft-xs">
                        {getInitials(trainee.name)}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                          {trainee.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {trainee.total_sessions} session{trainee.total_sessions > 1 ? 's' : ''} requested
                        </p>
                      </div>
                    </div>

                    <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {trainee.skill_level || 'Beginner'}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Contact:</span>
                      <a
                        href={`tel:${trainee.contact}`}
                        className="font-bold text-slate-900 dark:text-primary-400 hover:underline"
                      >
                        {trainee.contact}
                      </a>
                    </div>
                    {trainee.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Email:</span>
                        <a
                          href={`mailto:${trainee.email}`}
                          className="font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white truncate max-w-[180px]"
                        >
                          {trainee.email}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Last Scheduled:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatDate(trainee.last_session_date)}
                      </span>
                    </div>
                  </div>

                  {/* Coach Notes Preview */}
                  {trainee.coach_notes ? (
                    <div className="mt-3 p-3 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/80 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                      <p className="font-bold text-[10px] uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-0.5">
                        Coach Note:
                      </p>
                      <p className="italic">"{trainee.coach_notes}"</p>
                    </div>
                  ) : null}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${trainee.contact}`}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
                      title="Call Trainee"
                    >
                      Call
                    </a>
                    <a
                      href={`sms:${trainee.contact}?body=Hi ${encodeURIComponent(
                        trainee.name
                      )}, Coach Zoid here from Z Tennis Malaybalay City. Regarding your scheduled training...`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-primary-600 dark:hover:bg-primary-500 text-white text-xs font-bold rounded-xl shadow-soft-xs transition-colors"
                      title="SMS Trainee"
                    >
                      SMS
                    </a>
                    <button
                      onClick={() => handleOpenNotes(trainee)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      {trainee.coach_notes ? 'Edit Note' : '+ Note'}
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedTrainee(trainee)}
                    className="text-xs font-bold text-slate-900 dark:text-primary-400 hover:text-slate-700 dark:hover:text-primary-300 underline underline-offset-4 cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {selectedTrainee.name}'s Sessions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Phone: {selectedTrainee.contact} • Level: {selectedTrainee.skill_level}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTrainee(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {selectedTrainee.sessions && selectedTrainee.sessions.length > 0 ? (
                  selectedTrainee.sessions.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {formatDate(s.booking_date)}
                        </span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            s.status === 'confirmed'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : s.status === 'declined'
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Time: {formatTime(s.start_time)} – {formatTime(s.end_time)}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Court: Malaybalay Public Court
                      </p>
                      {s.message && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700 italic">
                          "{s.message}"
                        </p>
                      )}
                      {s.coach_notes && (
                        <p className="text-xs text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800">
                          <span className="font-bold">Coach Note:</span> {s.coach_notes}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No session records found.</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedTrainee(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-primary-600 dark:hover:bg-primary-500 text-white text-xs font-bold rounded-xl shadow-soft-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Coach Note Edit Modal */}
        {notesModalTrainee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">
                Coach Notes for {notesModalTrainee.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Record training goals, racket specs, progress observations, or scheduling reminders.
              </p>

              <textarea
                value={traineeNote}
                onChange={(e) => setTraineeNote(e.target.value)}
                placeholder="E.g., Baseline topspin drill focus; recommended 52lbs string tension; preparing for upcoming regional tournament..."
                rows={4}
                className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-medium mb-4"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setNotesModalTrainee(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-primary-600 dark:hover:bg-primary-500 text-white text-xs font-bold rounded-xl shadow-soft-xs transition-colors cursor-pointer disabled:opacity-50"
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

