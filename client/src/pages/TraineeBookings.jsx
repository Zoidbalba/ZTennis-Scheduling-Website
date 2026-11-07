import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Navbar from '../components/Navbar';
import ZTennisLogo from '../components/ZTennisLogo';
import GoogleSignInModal from '../components/GoogleSignInModal';
import FollowUpModal from '../components/FollowUpModal';

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TraineeBookings() {
  const { trainee, isTraineeAuthenticated, logoutTrainee } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [followUpBooking, setFollowUpBooking] = useState(null);

  const activeEmail = trainee?.email || lookupEmail;

  const fetchBookings = useCallback(async (targetEmail) => {
    const emailToUse = targetEmail || trainee?.email;
    if (!emailToUse) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await api.getMyBookings(emailToUse);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [trainee?.email]);

  useEffect(() => {
    if (trainee?.email) {
      fetchBookings(trainee.email);
    } else {
      setLoading(false);
    }
  }, [trainee?.email, fetchBookings]);

  const handleManualLookup = (e) => {
    e.preventDefault();
    if (lookupEmail) {
      fetchBookings(lookupEmail);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <div>
        <Navbar />

        <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
          {/* Header Banner */}
          <div className="bg-[#1A1118] text-white rounded-3xl p-6 sm:p-10 shadow-soft-md relative overflow-hidden">
            {/* Subtle Pink Ambient Glow */}
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#E0749A]/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 bg-[#E0749A] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-soft-xs">
                  <span>🎾</span>
                  <span>Trainee Schedule Portal</span>
                </span>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  {trainee?.name ? `Welcome back, ${trainee.name}!` : 'My Scheduled Lessons'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  Track whether your booking request has been accepted by Coach Zoid, verify confirmation details, and send follow-up notes.
                </p>
              </div>

              {/* Trainee Auth Card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 min-w-[260px] self-start md:self-auto">
                {isTraineeAuthenticated ? (
                  <div>
                    <div className="flex items-center gap-3">
                      {trainee.picture ? (
                        <img
                          src={trainee.picture}
                          alt={trainee.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-[#E0749A]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#E0749A] text-white font-black text-sm flex items-center justify-center">
                          {(trainee.name || 'T')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-white truncate">{trainee.name}</p>
                        <p className="text-[11px] text-emerald-300 truncate font-mono">{trainee.email}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-300">Gmail Connected</span>
                      <button
                        onClick={logoutTrainee}
                        className="text-rose-300 hover:text-rose-200 font-bold hover:underline cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-200 mb-2">
                      Connect your Gmail to auto-sync your schedules:
                    </p>
                    <button
                      onClick={() => setAuthModalOpen(true)}
                      className="w-full py-2.5 px-4 bg-[#E0749A] hover:bg-[#cf5479] text-white rounded-xl font-black text-xs shadow-soft-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Sign in with Google / Gmail</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* If NOT authenticated and no active email, offer simple lookup */}
          {!isTraineeAuthenticated && !activeEmail && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF0F5] dark:bg-[#20101a] text-[#E0749A] flex items-center justify-center mx-auto text-2xl font-black">
                ✉️
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Find Your Booking Schedule</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Enter the email address you provided when reserving a slot to view your lesson status.
                </p>
              </div>

              <form onSubmit={handleManualLookup} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  required
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium rounded-xl outline-none focus:ring-2 focus:ring-[#E0749A] border-0"
                />
                <button
                  type="submit"
                  className="py-3 px-5 bg-[#1F7A5A] hover:bg-[#165a42] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Lookup →
                </button>
              </form>

              <div className="pt-2">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="text-xs text-[#E0749A] font-bold hover:underline cursor-pointer"
                >
                  Or sign in with Google for 1-click access
                </button>
              </div>
            </div>
          )}

          {/* Bookings List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Scheduled Lessons
                </h2>
                {activeEmail && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Showing sessions for <span className="font-semibold text-slate-600 dark:text-slate-300">{activeEmail}</span>
                  </p>
                )}
              </div>

              <Link
                to="/#availability"
                className="py-2.5 px-4 bg-[#E0749A] hover:bg-[#cf5479] text-white rounded-xl font-bold text-xs shadow-soft-xs transition-colors flex items-center gap-1.5"
              >
                <span>+ Book New Session</span>
              </Link>
            </div>

            {loading ? (
              <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 border-2 border-[#E0749A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading your sessions...</p>
              </div>
            ) : error ? (
              <div className="p-5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 rounded-2xl text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {error}
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-2xl font-black">
                  🎾
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">No Scheduled Lessons Found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    You don't have any booked sessions under this email yet. Pick an open morning on the calendar to start training with Coach Zoid!
                  </p>
                </div>
                <Link
                  to="/#availability"
                  className="inline-block py-3 px-6 bg-[#E0749A] hover:bg-[#cf5479] text-white rounded-xl font-bold text-xs shadow-soft-xs transition-colors"
                >
                  View Open Mornings & Book →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => {
                  const isConfirmed = b.status === 'confirmed';
                  const isCompleted = b.status === 'completed';
                  const isPending = b.status === 'pending';
                  const isDeclined = b.status === 'declined';

                  const isGroup = (b.session_type || '').toLowerCase().includes('group');
                  const count = b.member_count || (isGroup ? 2 : 1);
                  const fee = isGroup ? 250 * count : 300;

                  return (
                    <div
                      key={b.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow space-y-4"
                    >
                      {/* Top Row: Date, Time & Status Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#E0749A]">
                            MORNING COACHING SESSION
                          </span>
                          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                            {formatDate(b.booking_date)}
                          </h3>
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                            <span>⏰ {formatTime(b.start_time)} – {formatTime(b.end_time)}</span>
                            <span>•</span>
                            <span>📍 Malaybalay City Public Court</span>
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="self-start sm:self-auto">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                              isConfirmed
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60'
                                : isCompleted
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300/60'
                                : isPending
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/60'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300/60'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isConfirmed
                                  ? 'bg-emerald-500'
                                  : isCompleted
                                  ? 'bg-blue-500'
                                  : isPending
                                  ? 'bg-amber-500 animate-pulse'
                                  : 'bg-rose-500'
                              }`}
                            />
                            <span>
                              {isConfirmed
                                ? 'Accepted & Confirmed'
                                : isCompleted
                                ? 'Session Completed'
                                : isPending
                                ? 'Pending Coach Review'
                                : 'Declined'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Middle Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            SESSION TYPE & PLAYERS
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {isGroup ? `👥 Group Session (${count} players)` : '👤 Individual Session (1 player)'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            COACHING FEE
                          </span>
                          <span className="font-black text-[#1F7A5A] dark:text-emerald-400 text-sm">
                            ₱{fee}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            EMAIL NOTIFICATION
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <span>✉️</span>
                            <span>{b.email_status?.includes('sent') ? 'Delivered to Gmail' : 'Sent upon confirmation'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Coach Notes */}
                      {b.coach_notes && (
                        <div className="bg-[#FFF0F5] dark:bg-[#20101a] p-3.5 rounded-xl border border-pink-200/60 dark:border-pink-900/40 text-xs">
                          <span className="font-black text-[#E0749A] uppercase tracking-wider text-[10px] block mb-0.5">
                            COACH'S NOTE
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 italic">"{b.coach_notes}"</p>
                        </div>
                      )}

                      {/* Follow-Up Message Sent History (if trainee previously sent a follow up) */}
                      {b.follow_up_message && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 text-xs">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-black text-[#1F7A5A] dark:text-emerald-400 uppercase tracking-wider text-[10px]">
                              YOUR FOLLOW-UP NOTE TO COACH
                            </span>
                            {b.follow_up_sent_at && (
                              <span className="text-[10px] text-slate-400">
                                {new Date(b.follow_up_sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 italic">"{b.follow_up_message}"</p>
                        </div>
                      )}

                      {/* Bottom Status Explainer & Follow-Up Action */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                          {isPending && (
                            <span>
                              ⏳ Coach Zoid has received your booking. Once accepted, you will receive an email confirmation. Want to notify the coach? Send a quick follow-up note below.
                            </span>
                          )}
                          {isConfirmed && (
                            <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                              ✓ Your slot is locked in! Please arrive 10 minutes early at Malaybalay Public Court.
                            </span>
                          )}
                          {isCompleted && (
                            <span>Session completed. Thank you for playing!</span>
                          )}
                          {isDeclined && (
                            <span className="text-rose-600 dark:text-rose-400">
                              This slot could not be accommodated. Please choose another open date on the calendar.
                            </span>
                          )}
                        </div>

                        {/* Interactive Follow-Up Button */}
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          <button
                            onClick={() => setFollowUpBooking(b)}
                            className="py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs shadow-soft-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>💬</span>
                            <span>{b.follow_up_message ? 'Update Follow-Up' : 'Send Follow-Up Note'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800 py-6 px-4 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} ZTennis • Coach Zoid • Malaybalay City, Bukidnon</p>
      </footer>

      {/* Google Sign-In Modal */}
      <GoogleSignInModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          if (trainee?.email) fetchBookings(trainee.email);
        }}
      />

      {/* Trainee Follow-Up Modal */}
      <FollowUpModal
        booking={followUpBooking}
        isOpen={Boolean(followUpBooking)}
        onClose={() => setFollowUpBooking(null)}
        onSuccess={() => {
          if (activeEmail) fetchBookings(activeEmail);
        }}
      />
    </div>
  );
}
