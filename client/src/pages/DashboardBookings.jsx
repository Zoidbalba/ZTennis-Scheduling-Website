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

function formatLongDate(dateObj) {
  if (!dateObj) return '';
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
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

const CALENDAR_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DashboardBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [actionLoading, setActionLoading] = useState(null);
  const [emailToast, setEmailToast] = useState(null);

  // Month Calendar Navigation State
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Selected date on the admin calendar
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    session_type: 'Individual Session',
    member_count: 1,
    player_name: '',
    player_contact: '',
    player_email: '',
    skill_level: 'Beginner',
    booking_date: new Date().toISOString().split('T')[0],
    start_time: '06:00',
    end_time: '08:00',
    message: '',
  });

  const [emailModalBooking, setEmailModalBooking] = useState(null);
  const [emailCustomText, setEmailCustomText] = useState('');

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

      if (res.email) {
        if (res.email.sent && !res.email.simulated) {
          setEmailToast({
            type: 'success',
            title: `Email Sent to ${res.booking.player_name}!`,
            message: `Official schedule confirmation delivered to ${res.booking.player_email || res.booking.player_contact}.`,
          });
        } else if (res.email.simulated) {
          setEmailToast({
            type: 'info',
            title: `Status: ${status === 'confirmed' ? 'Accepted' : 'Declined'}`,
            message: `Schedule updated! Email confirmation prepared for ${res.booking.player_email || res.booking.player_name}.`,
          });
        } else if (res.email.error) {
          setEmailToast({
            type: 'warning',
            title: `Schedule updated, but email delivery issue`,
            message: res.email.error,
          });
        }
      } else {
        setEmailToast({
          type: 'success',
          title: `Status Updated to ${status}`,
          message: `Booking has been marked as ${status}.`,
        });
      }

      await fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to update booking status');
    } finally {
      setActionLoading(null);
      setTimeout(() => setEmailToast(null), 6000);
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

  // Group bookings by date string (YYYY-MM-DD)
  const bookingsByDate = useMemo(() => {
    const map = {};
    for (const b of filteredBookings) {
      if (!b.booking_date) continue;
      const dateKey = String(b.booking_date).split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(b);
    }
    return map;
  }, [filteredBookings]);

  // Calendar calculation
  const calendarData = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);
    const monthDays = Array.from({ length: totalDays }, (_, i) => i + 1);

    return { year, month, blankDays, monthDays };
  }, [calendarMonth]);

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToday = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  // Selected date key formatted as YYYY-MM-DD
  const selectedDateKey = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  const selectedDateBookings = bookingsByDate[selectedDateKey] || [];

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      await api.createBooking(newBooking);
      setAddModalOpen(false);
      setNewBooking({
        session_type: 'Individual Session',
        member_count: 1,
        player_name: '',
        player_contact: '',
        player_email: '',
        skill_level: 'Beginner',
        booking_date: new Date().toISOString().split('T')[0],
        start_time: '06:00',
        end_time: '08:00',
        message: '',
      });
      await fetchBookings();
      setEmailToast({
        type: 'success',
        title: 'Booking Created',
        message: 'New lesson booking added to schedule.',
      });
      setTimeout(() => setEmailToast(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to create booking');
    }
  };

  const handleSendCustomEmail = async () => {
    if (!emailModalBooking) return;
    try {
      const res = await api.sendBookingEmail(emailModalBooking.id, { message: emailCustomText });
      setEmailModalBooking(null);
      if (res.email?.simulated) {
        setEmailToast({
          type: 'warning',
          title: 'Email Simulated (Setup Needed)',
          message: 'Website is currently in simulation mode. To deliver real live emails to Gmail, add GMAIL_USER and GMAIL_APP_PASSWORD in Render Environment variables.',
        });
      } else {
        setEmailToast({
          type: 'success',
          title: 'Email Delivered',
          message: res.message || 'Email successfully dispatched to trainee.',
        });
      }
      setTimeout(() => setEmailToast(null), 6000);
      await fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to send email');
    }
  };

  return (
    <DashboardLayout
      title="Schedule & Bookings"
      subtitle="View all scheduled dates on the calendar and manage trainee lesson requests."
      headerAction={
        <button
          onClick={() => {
            setNewBooking((prev) => ({
              ...prev,
              booking_date: selectedDateKey,
            }));
            setAddModalOpen(true);
          }}
          className="bg-[#E0749A] hover:bg-[#cf5479] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-soft-xs flex items-center gap-2 cursor-pointer transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add booking</span>
        </button>
      }
    >
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 sm:gap-5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 sm:gap-5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 sm:gap-5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* View Switcher Bar (Calendar vs List) & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {/* Calendar / List Toggle Pills */}
          <div className="inline-flex rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 text-xs font-semibold shadow-soft-xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
                viewMode === 'calendar'
                  ? 'bg-[#E0749A] text-white shadow-soft-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>📅</span>
              <span className="hidden sm:inline">Calendar View</span>
              <span className="sm:hidden">Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
                viewMode === 'list'
                  ? 'bg-[#E0749A] text-white shadow-soft-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>📋</span>
              <span className="hidden sm:inline">All Requests (List)</span>
              <span className="sm:hidden">Requests</span>
              {metrics.pending > 0 && (
                <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[9px] sm:text-[10px] font-black flex items-center justify-center ${
                  viewMode === 'list' ? 'bg-white text-[#E0749A]' : 'bg-[#E0749A] text-white'
                }`}>
                  {metrics.pending}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
          <span className="text-xs font-bold text-slate-400">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2.5 pr-8 shadow-soft-xs outline-none cursor-pointer"
          >
            <option value="all">All requests & sessions</option>
            <option value="pending">Pending only</option>
            <option value="confirmed">Confirmed only</option>
            <option value="completed">Completed only</option>
            <option value="declined">Declined only</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE ADMIN SCHEDULE CALENDAR */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 xl:gap-10 items-start animate-fade-in">
          {/* LEFT: MONTHLY CALENDAR GRID SHOWING SCHEDULED DATES */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-7 lg:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
            {/* Calendar Navigation Header */}
            <div className="flex items-center justify-between pb-4 sm:pb-5 mb-3 sm:mb-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">
                  Dates with scheduled coaching lessons are highlighted with session badges
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={handleJumpToday}
                  className="text-xs font-bold text-[#E0749A] hover:bg-pink-50 dark:hover:bg-pink-950/40 border border-pink-200 dark:border-pink-900/40 px-2.5 sm:px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/40 text-slate-700 dark:text-slate-300 hover:text-[#E0749A] flex items-center justify-center font-bold text-base transition-colors shadow-soft-xs cursor-pointer border border-slate-100 dark:border-slate-800"
                >
                  ‹
                </button>
                <button
                  onClick={handleNextMonth}
                  aria-label="Next month"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/40 text-slate-700 dark:text-slate-300 hover:text-[#E0749A] flex items-center justify-center font-bold text-base transition-colors shadow-soft-xs cursor-pointer border border-slate-100 dark:border-slate-800"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
              {CALENDAR_DAY_NAMES.map((d, i) => (
                <div
                  key={d}
                  className={`text-[9.5px] sm:text-xs font-black uppercase tracking-wider py-1 ${
                    i === 0 || i === 3 ? 'text-slate-400' : 'text-[#E0749A]'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Preceding Blank Days */}
              {calendarData.blankDays.map((i) => (
                <div key={`blank-${i}`} className="min-h-[52px] sm:min-h-[82px] rounded-xl sm:rounded-2xl opacity-15" />
              ))}

              {/* Month Days */}
              {calendarData.monthDays.map((dayNum) => {
                const dayDate = new Date(calendarData.year, calendarData.month, dayNum);
                dayDate.setHours(0, 0, 0, 0);

                const dateStr = `${calendarData.year}-${String(calendarData.month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayBookings = bookingsByDate[dateStr] || [];

                const isToday =
                  dayDate.getDate() === new Date().getDate() &&
                  dayDate.getMonth() === new Date().getMonth() &&
                  dayDate.getFullYear() === new Date().getFullYear();

                const isSelected = dayDate.getTime() === selectedDate.getTime();

                const pendingCount = dayBookings.filter((b) => b.status === 'pending').length;
                const confirmedCount = dayBookings.filter((b) => b.status === 'confirmed').length;
                const completedCount = dayBookings.filter((b) => b.status === 'completed').length;

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDate(dayDate)}
                    className={`relative min-h-[54px] sm:min-h-[86px] p-1 sm:p-2 rounded-xl sm:rounded-2xl flex flex-col justify-between text-left transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? 'border-[#E0749A] ring-2 ring-[#E0749A] bg-pink-50/50 dark:bg-pink-950/30'
                        : dayBookings.length > 0
                        ? 'bg-white dark:bg-slate-850 border-emerald-200/80 dark:border-emerald-900/50 hover:border-[#E0749A] shadow-soft-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Date Number and Today Tag */}
                    <div className="w-full flex items-center justify-between">
                      <span className={`text-[11px] sm:text-sm font-black ${
                        isSelected ? 'text-[#E0749A]' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="text-[7.5px] sm:text-[8px] bg-[#E0749A] text-white px-1 sm:px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider">
                          <span className="hidden sm:inline">Today</span>
                          <span className="sm:hidden">●</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom Scheduled Badges */}
                    <div className="w-full mt-1 space-y-0.5 sm:space-y-1">
                      {dayBookings.length > 0 ? (
                        <>
                          {confirmedCount > 0 && (
                            <div className="flex items-center justify-center sm:justify-start gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[8px] sm:text-[9px] font-extrabold px-1 sm:px-1.5 py-0.5 rounded-md truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                              <span className="hidden sm:inline truncate">{confirmedCount} confirmed</span>
                              <span className="sm:hidden font-black">{confirmedCount}</span>
                            </div>
                          )}
                          {pendingCount > 0 && (
                            <div className="flex items-center justify-center sm:justify-start gap-1 bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-[8px] sm:text-[9px] font-extrabold px-1 sm:px-1.5 py-0.5 rounded-md truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E0749A] shrink-0"></span>
                              <span className="hidden sm:inline truncate">{pendingCount} pending</span>
                              <span className="sm:hidden font-black">{pendingCount}</span>
                            </div>
                          )}
                          {completedCount > 0 && confirmedCount === 0 && pendingCount === 0 && (
                            <div className="flex items-center justify-center sm:justify-start gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[8px] sm:text-[9px] font-bold px-1 py-0.5 rounded-md truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                              <span className="hidden sm:inline truncate">{completedCount} completed</span>
                              <span className="sm:hidden font-black">{completedCount}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-[8px] sm:text-[9px] text-slate-300 dark:text-slate-600 font-medium block text-center sm:text-left">
                          —
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend Bar - 2x2 grid on mobile, row on tablet/desktop */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 gap-2 sm:gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Confirmed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E0749A] shrink-0"></span>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full ring-2 ring-[#E0749A] bg-transparent shrink-0"></span>
                <span>Selected</span>
              </div>
            </div>
          </div>

          {/* RIGHT: SELECTED DATE SESSIONS DRAWER / INSPECTOR */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-7 lg:p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5 sm:space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#E0749A] bg-[#FFF0F5] dark:bg-[#20101a] px-3 py-1 rounded-full">
                Scheduled for Date
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
                {formatLongDate(selectedDate)}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedDateBookings.length} {selectedDateBookings.length === 1 ? 'lesson scheduled' : 'lessons scheduled'}
              </p>
            </div>

            {/* Session Cards for Selected Date */}
            {selectedDateBookings.length > 0 ? (
              <div className="space-y-4">
                {selectedDateBookings.map((b, idx) => {
                  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  return (
                    <div
                      key={b.id}
                      className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 space-y-3.5 shadow-soft-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-9 h-9 rounded-full ${avatarColor} font-black text-xs flex items-center justify-center shrink-0`}>
                            {getInitials(b.player_name)}
                          </span>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {b.player_name}
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              <a
                                href={`tel:${b.player_contact}`}
                                className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                              >
                                {b.player_contact}
                              </a>
                              {b.player_email && (
                                <a
                                  href={`mailto:${b.player_email}`}
                                  className="text-[11px] text-[#E0749A] hover:underline font-medium truncate max-w-[170px]"
                                  title={b.player_email}
                                >
                                  ✉️ {b.player_email}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : b.status === 'completed'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : b.status === 'pending'
                            ? 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {b.status}
                        </span>
                      </div>

                      {/* Time and Session Type */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-xs bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="font-black text-slate-900 dark:text-white">
                          ⏰ {formatTime(b.start_time)} – {formatTime(b.end_time)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md self-start sm:self-auto ${
                          (b.session_type || '').toLowerCase().includes('group')
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#1F7A5A] dark:text-emerald-400'
                            : 'bg-[#FFF0F5] dark:bg-[#E0749A]/20 text-[#E0749A]'
                        }`}>
                          {(b.session_type || '').toLowerCase().includes('group')
                            ? `👥 Group (${b.member_count || 2} players · ₱${250 * (b.member_count || 2)})`
                            : '👤 Individual (₱300)'}
                        </span>
                      </div>

                      {/* Trainee Initial Booking Message */}
                      {b.message && (
                        <p className="text-xs italic text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border-l-2 border-[#E0749A]">
                          "{b.message}"
                        </p>
                      )}

                      {/* Trainee Follow-Up Reminder Alert */}
                      {b.follow_up_message && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1">
                              <span>🔔 Trainee Follow-Up</span>
                            </span>
                            {b.follow_up_sent_at && (
                              <span className="text-[9.5px] font-semibold text-amber-600/80 dark:text-amber-400/80">
                                {new Date(b.follow_up_sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-amber-950 dark:text-amber-100 font-medium italic">
                            "{b.follow_up_message}"
                          </p>
                        </div>
                      )}

                      {/* Quick Action Buttons */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1">
                        {b.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(b.id, 'confirmed')}
                              disabled={actionLoading === b.id}
                              className="flex-1 bg-[#1F7A5A] hover:bg-[#165a42] text-white font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <span>✓</span>
                              <span>{actionLoading === b.id ? 'Confirming...' : 'Accept & Email'}</span>
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(b.id, 'declined')}
                              disabled={actionLoading === b.id}
                              className="bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(b.id, 'completed')}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer"
                          >
                            Mark Completed
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSmsModalBooking(b);
                            setSmsCustomText(`Hi ${b.player_name}! This is Coach Zoid regarding our tennis session on ${formatDate(b.booking_date)} at ${formatTime(b.start_time)}.`);
                          }}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          title="Message trainee"
                        >
                          💬 SMS
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 space-y-3">
                <span className="text-3xl">🎾</span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  No sessions scheduled
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  There are no coaching bookings recorded for {formatDate(selectedDateKey)}.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setNewBooking((prev) => ({
                        ...prev,
                        booking_date: selectedDateKey,
                      }));
                      setAddModalOpen(true);
                    }}
                    className="text-xs font-bold text-[#E0749A] hover:underline cursor-pointer"
                  >
                    + Add a booking for this date
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: CLASSIC REQUESTS LIST VIEW matching Figma Screenshot 4 */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-fade-in">
          {loading ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading booking requests...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-800 dark:text-white">No requests found</p>
              <p className="text-xs text-slate-400 mt-1">There are no bookings matching the current filter.</p>
            </div>
          ) : (
            filteredBookings.map((b, idx) => {
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const isIndividual = b.session_type
                ? !b.session_type.toLowerCase().includes('group')
                : !b.message?.toLowerCase().includes('group');

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
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <a
                            href={`tel:${b.player_contact}`}
                            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5 font-semibold"
                          >
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{b.player_contact}</span>
                          </a>
                          {b.player_email && (
                            <a
                              href={`mailto:${b.player_email}`}
                              className="text-xs text-[#E0749A] hover:underline font-semibold flex items-center gap-1"
                              title={b.player_email}
                            >
                              <span>✉️</span>
                              <span className="truncate max-w-[150px]">{b.player_email}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle Column: Date & Session */}
                    <div className="space-y-1.5 min-w-[190px]">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#E0749A]">
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
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isIndividual
                            ? 'bg-[#FFF0F5] dark:bg-[#E0749A]/20 text-[#E0749A]'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-[#1F7A5A] dark:text-emerald-400'
                        }`}>
                          {isIndividual
                            ? '👤 Individual (₱300)'
                            : `👥 Group (${b.member_count || 2} players · ₱${250 * (b.member_count || 2)})`}
                        </span>
                      </div>
                    </div>

                    {/* Quote / Message Box & Trainee Follow-Up */}
                    <div className="flex-1 max-w-md space-y-2">
                      {b.message ? (
                        <p className="text-xs italic text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border-l-2 border-[#E0749A]">
                          "{b.message}"
                        </p>
                      ) : (
                        <p className="text-xs italic text-slate-300 dark:text-slate-600">No message provided</p>
                      )}

                      {b.follow_up_message && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1">
                              <span>🔔 Trainee Follow-Up Reminder</span>
                            </span>
                            {b.follow_up_sent_at && (
                              <span className="text-[9.5px] font-semibold text-amber-600/80 dark:text-amber-400/80">
                                {new Date(b.follow_up_sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-amber-950 dark:text-amber-100 font-medium italic">
                            "{b.follow_up_message}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 min-w-[150px]">
                      {b.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(b.id, 'confirmed')}
                            disabled={actionLoading === b.id}
                            className="w-full bg-[#1F7A5A] hover:bg-[#165a42] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-soft-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{actionLoading === b.id ? 'Updating...' : 'Accept & Send Email'}</span>
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
                              setEmailModalBooking(b);
                              setEmailCustomText(`Hi ${b.player_name}! This is Coach Zoid regarding our tennis lesson on ${formatDate(b.booking_date)} at ${formatTime(b.start_time)}.`);
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-[#E0749A] hover:bg-pink-50 dark:hover:bg-pink-950/40 text-xs font-bold transition-colors cursor-pointer"
                            title="Send email note to trainee"
                          >
                            ✉️ Send Email
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
      )}

      {/* Confirmation / Email Result Toast */}
      {emailToast && (
        <div className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-soft-xl flex items-start gap-3 animate-fade-in-up text-white ${
          emailToast.type === 'success'
            ? 'bg-emerald-600'
            : emailToast.type === 'warning'
            ? 'bg-[#1A1118] border border-amber-500/50'
            : 'bg-slate-800'
        }`}>
          <span className="text-xl shrink-0">
            {emailToast.type === 'success' ? '✓' : emailToast.type === 'warning' ? '⚠️' : '✉️'}
          </span>
          <div className="flex-1 text-xs">
            <p className={`font-black uppercase tracking-wider ${emailToast.type === 'warning' ? 'text-amber-400' : 'text-white'}`}>
              {emailToast.title}
            </p>
            <p className="mt-1 opacity-90 leading-relaxed text-slate-200">{emailToast.message}</p>
          </div>
          <button onClick={() => setEmailToast(null)} className="opacity-70 hover:opacity-100 cursor-pointer text-sm font-bold">✕</button>
        </div>
      )}

      {/* Add Booking Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="bg-[#163829] text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-white">Add Booking</h3>
                <p className="text-xs text-emerald-200/80 mt-0.5">Manually reserve a coaching session</p>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 sm:p-7 space-y-4">
              {/* Session Type: Individual vs Group */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Session Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewBooking({ ...newBooking, session_type: 'Individual Session', member_count: 1 })}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newBooking.session_type === 'Individual Session'
                        ? 'border-[#E0749A] bg-[#FFF0F5] dark:bg-[#E0749A]/15 text-[#E0749A] font-bold ring-1 ring-[#E0749A]'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-black">👤 Individual</div>
                    <div className="text-[10px] opacity-80">₱300 / 120 min</div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewBooking({
                        ...newBooking,
                        session_type: 'Group Session',
                        member_count: newBooking.member_count > 1 ? newBooking.member_count : 2,
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newBooking.session_type === 'Group Session'
                        ? 'border-[#1F7A5A] bg-emerald-50 dark:bg-[#1F7A5A]/20 text-[#1F7A5A] dark:text-emerald-400 font-bold ring-1 ring-[#1F7A5A]'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-black">👥 Group Session</div>
                    <div className="text-[10px] opacity-80">₱250 / player</div>
                  </button>
                </div>

                {/* Group Member Count Stepper in Admin Modal */}
                {newBooking.session_type === 'Group Session' && (
                  <div className="mt-2.5 p-3 bg-emerald-50/70 dark:bg-[#1F7A5A]/15 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-xs animate-fade-in">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white">Players in Group:</span>
                      <span className="block text-[10px] text-slate-500">
                        ₱250 × {newBooking.member_count || 2} = ₱{250 * (newBooking.member_count || 2)} total
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <button
                        type="button"
                        onClick={() =>
                          setNewBooking((prev) => ({
                            ...prev,
                            member_count: Math.max(2, (Number(prev.member_count) || 2) - 1),
                          }))
                        }
                        className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold"
                      >
                        −
                      </button>
                      <span className="w-5 text-center font-black text-[#1F7A5A] dark:text-emerald-400">
                        {newBooking.member_count || 2}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setNewBooking((prev) => ({
                            ...prev,
                            member_count: Math.min(6, (Number(prev.member_count) || 2) + 1),
                          }))
                        }
                        className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Trainee Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan dela Cruz"
                  value={newBooking.player_name}
                  onChange={(e) => setNewBooking({ ...newBooking, player_name: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#E0749A] outline-none border-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Phone (SMS)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="09xxxxxxxxx"
                    value={newBooking.player_contact}
                    onChange={(e) => setNewBooking({ ...newBooking, player_contact: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#E0749A] outline-none border-0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Skill Level
                  </label>
                  <select
                    value={newBooking.skill_level}
                    onChange={(e) => setNewBooking({ ...newBooking, skill_level: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#E0749A] outline-none border-0"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Booking Date
                </label>
                <input
                  type="date"
                  required
                  value={newBooking.booking_date}
                  onChange={(e) => setNewBooking({ ...newBooking, booking_date: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#E0749A] outline-none border-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newBooking.start_time}
                    onChange={(e) => setNewBooking({ ...newBooking, start_time: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#E0749A] outline-none border-0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newBooking.end_time}
                    onChange={(e) => setNewBooking({ ...newBooking, end_time: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#E0749A] outline-none border-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Coach Notes / Goals (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Focus on forehand rally depth..."
                  value={newBooking.message}
                  onChange={(e) => setNewBooking({ ...newBooking, message: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#E0749A] outline-none border-0"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-[#E0749A] hover:bg-[#cf5479] shadow-soft-xs transition-colors cursor-pointer"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Email Composer Modal */}
      {emailModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="bg-[#1A1118] text-white p-6 flex items-center justify-between border-b border-white/10">
              <div>
                <h3 className="font-extrabold text-lg text-white">Send Email to Trainee</h3>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  To: {emailModalBooking.player_name} ({emailModalBooking.player_email || emailModalBooking.player_contact})
                </p>
              </div>
              <button
                onClick={() => setEmailModalBooking(null)}
                className="text-slate-300 hover:text-white cursor-pointer font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 sm:p-7 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Email Message Body
                </label>
                <textarea
                  rows={4}
                  value={emailCustomText}
                  onChange={(e) => setEmailCustomText(e.target.value)}
                  placeholder="Write a message to the trainee..."
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl p-4 text-xs font-semibold focus:ring-2 focus:ring-[#E0749A] outline-none border-0"
                />
              </div>

              {/* Direct Gmail Shortcut */}
              <div className="p-3 bg-pink-50/70 dark:bg-[#20101a] border border-pink-200/60 dark:border-pink-900/40 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Send directly from your Gmail:</span>
                  <span className="text-[11px] text-slate-500">Opens Gmail with this message prefilled</span>
                </div>
                {emailModalBooking.player_email && (
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailModalBooking.player_email)}&su=${encodeURIComponent(`🎾 ZTennis Lesson Update — Coach Zoid`)}&body=${encodeURIComponent(emailCustomText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 text-[#E0749A] border border-pink-300 dark:border-pink-800 rounded-lg font-bold text-xs shadow-soft-xs transition-colors shrink-0"
                  >
                    Open in Gmail ↗
                  </a>
                )}
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEmailModalBooking(null)}
                  className="py-3 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendCustomEmail}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#E0749A] hover:bg-[#cf5479] shadow-soft-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Send via Website Server →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
