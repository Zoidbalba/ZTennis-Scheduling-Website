import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON_TO_SUN = [1, 2, 3, 4, 5, 6, 0];

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function CalendarSection({
  slots = [],
  onSlotSelect,
  onSlotsChange,
}) {
  const { isAuthenticated } = useAuth();

  // Active view: 'calendar' (interactive monthly calendar) or 'week' (7-day overview)
  const [viewMode, setViewMode] = useState('calendar');

  // Today's date normalized to midnight
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Currently viewed month in the calendar (defaults to current month)
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Selected date on the calendar (defaults to today)
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  // Modal State for Coach CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [crudError, setCrudError] = useState('');
  const [crudSuccess, setCrudSuccess] = useState('');

  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: '06:00',
    end_time: '09:00',
    is_blocked: false,
  });

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Group slots by day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const slotsByDay = useMemo(() => {
    const grouped = {};
    for (let d = 0; d < 7; d++) grouped[d] = [];
    for (const slot of slots) {
      const day = Number(slot.day_of_week);
      if (grouped[day]) {
        grouped[day].push(slot);
      }
    }
    for (let d = 0; d < 7; d++) {
      grouped[d].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    }
    return grouped;
  }, [slots]);

  // Calendar month calculation
  const calendarData = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);
    const monthDays = Array.from({ length: totalDays }, (_, i) => i + 1);

    return { year, month, blankDays, monthDays };
  }, [currentMonthDate]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToday = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  // Find next upcoming day with open morning slots
  const handleJumpNextAvailable = () => {
    const candidate = new Date(selectedDate);
    for (let i = 1; i <= 14; i++) {
      candidate.setDate(candidate.getDate() + 1);
      const dayOfWeek = candidate.getDay();
      const openSlots = (slotsByDay[dayOfWeek] || []).filter((s) => !s.is_blocked);
      if (openSlots.length > 0) {
        setSelectedDate(new Date(candidate));
        setCurrentMonthDate(new Date(candidate.getFullYear(), candidate.getMonth(), 1));
        return;
      }
    }
  };

  // When a user books a slot
  const handleSlotBooking = (slot, date = selectedDate) => {
    if (slot.is_blocked) return;
    onSlotSelect?.({ ...slot, booking_date: date });
  };

  // --- CRUD HANDLERS (Coach Only) ---
  const handleOpenAdd = (dayValue = selectedDate.getDay()) => {
    setEditingSlot(null);
    setFormData({
      day_of_week: dayValue,
      start_time: '06:00',
      end_time: '09:00',
      is_blocked: false,
    });
    setCrudError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slot, e) => {
    e?.stopPropagation();
    setEditingSlot(slot);
    setFormData({
      day_of_week: Number(slot.day_of_week),
      start_time: slot.start_time || '06:00',
      end_time: slot.end_time || '09:00',
      is_blocked: Boolean(slot.is_blocked),
    });
    setCrudError('');
    setIsModalOpen(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setCrudError('');

    try {
      if (editingSlot) {
        await api.updateSlot(editingSlot.id, formData);
        setCrudSuccess('Schedule slot updated successfully.');
      } else {
        await api.createSlot(formData);
        setCrudSuccess('New schedule slot created.');
      }

      setIsModalOpen(false);
      onSlotsChange?.();
      setTimeout(() => setCrudSuccess(''), 3500);
    } catch (err) {
      setCrudError(err.message || 'Failed to save slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Delete this coaching slot from the schedule?')) return;

    try {
      await api.deleteSlot(id);
      setCrudSuccess('Slot deleted.');
      onSlotsChange?.();
      setTimeout(() => setCrudSuccess(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to delete slot');
    }
  };

  const handleToggleBlock = async (slot, e) => {
    e?.stopPropagation();
    try {
      await api.updateSlot(slot.id, { is_blocked: !slot.is_blocked });
      setCrudSuccess(slot.is_blocked ? 'Slot unblocked for booking.' : 'Slot blocked (unavailable).');
      onSlotsChange?.();
      setTimeout(() => setCrudSuccess(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to toggle slot');
    }
  };

  // Selected date details
  const selectedDayOfWeek = selectedDate.getDay();
  const selectedDaySlots = slotsByDay[selectedDayOfWeek] || [];
  const selectedAvailableSlots = selectedDaySlots.filter((s) => !s.is_blocked);
  const isSelectedPast = selectedDate < today;
  const isSelectedToday = selectedDate.getTime() === today.getTime();
  const isSelectedRestDay = (selectedDayOfWeek === 3 || selectedDayOfWeek === 0 || selectedDaySlots.length === 0) && !isSelectedPast;

  const monthTitle = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedDateFormatted = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <section
      id="availability"
      className="py-16 sm:py-24 bg-[#F4F8F5] dark:bg-[#0A1612] transition-colors scroll-mt-10"
    >
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        {/* Header Section matching Figma Design Style */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <span className="text-xs font-black tracking-widest text-[#E0749A] uppercase mb-2 block">
              WEEKLY AVAILABILITY
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Pick a morning. Let's play.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-lg">
              Tap any date on the calendar below to view free morning training slots and reserve your session.
            </p>
          </div>

          {/* Quick Controls: View Mode & Jump to Today */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div className="inline-flex rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1 text-xs font-semibold shadow-soft-xs">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'calendar'
                    ? 'bg-[#E0749A] text-white shadow-soft-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>📅</span>
                <span>Month Calendar</span>
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'week'
                    ? 'bg-[#E0749A] text-white shadow-soft-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>📋</span>
                <span>Week Overview</span>
              </button>
            </div>

            {viewMode === 'calendar' && (
              <button
                onClick={handleJumpToday}
                className="text-xs font-bold text-[#E0749A] hover:text-[#cf5479] px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-pink-200/80 dark:border-pink-950/60 shadow-soft-xs transition-colors cursor-pointer"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Coach Admin Toolbar (visible when coach is authenticated) */}
        {isAuthenticated && (
          <div className="mb-6 p-5 sm:p-6 bg-[#163829] text-white rounded-3xl shadow-soft-md animate-fade-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#E0749A] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-soft-xs">
                  Coach Admin Mode
                </span>
                <span className="font-bold text-sm">Schedule Manager Active</span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-1">
                Selected date: <strong>{selectedDateFormatted}</strong> ({DAY_NAMES[selectedDayOfWeek]}).
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleOpenAdd(selectedDayOfWeek)}
                className="bg-[#E0749A] hover:bg-[#cf5479] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-soft-xs transition-colors cursor-pointer"
              >
                + Add Slot for {DAY_SHORT[selectedDayOfWeek]}
              </button>
              <a
                href="/dashboard/availability"
                className="bg-emerald-950/50 hover:bg-emerald-950/80 border border-emerald-700/60 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
              >
                Dashboard Settings →
              </a>
            </div>
          </div>
        )}

        {/* Success toast from coach actions */}
        {crudSuccess && (
          <div className="mb-6 p-4 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-soft-xs flex items-center justify-between animate-fade-in">
            <span>{crudSuccess}</span>
            <button onClick={() => setCrudSuccess('')} className="text-white/80 hover:text-white cursor-pointer">✕</button>
          </div>
        )}

        {/* VIEW 1: INTERACTIVE MONTH CALENDAR TYPE (DEFAULT) */}
        {viewMode === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 xl:gap-10 items-start animate-fade-in">
            {/* LEFT: THE INTERACTIVE MONTHLY CALENDAR GRID (7 Cols) */}
            <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 p-6 sm:p-8">
              {/* Calendar Month Navigation Header */}
              <div className="flex items-center justify-between pb-4 sm:pb-5 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {monthTitle}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
                    Tap any day to view morning coaching slots
                  </p>
                </div>

                {/* Prev / Next Month Arrow Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                    className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/40 text-slate-700 dark:text-slate-300 hover:text-[#E27396] flex items-center justify-center font-bold text-base transition-colors shadow-soft-xs cursor-pointer border border-slate-100 dark:border-slate-800"
                  >
                    ‹
                  </button>
                  <button
                    onClick={handleNextMonth}
                    aria-label="Next month"
                    className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/40 text-slate-700 dark:text-slate-300 hover:text-[#E27396] flex items-center justify-center font-bold text-base transition-colors shadow-soft-xs cursor-pointer border border-slate-100 dark:border-slate-800"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Days of Week Column Headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
                {DAY_SHORT.map((d, i) => (
                  <div
                    key={d}
                    className={`text-[10px] sm:text-xs font-black uppercase tracking-wider py-1 ${
                      i === 0 || i === 3 ? 'text-slate-400 dark:text-slate-600' : 'text-[#E27396]'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Month Days Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Preceding Blank Days */}
                {calendarData.blankDays.map((i) => (
                  <div key={`blank-${i}`} className="min-h-[50px] sm:min-h-[68px] rounded-2xl opacity-20" />
                ))}

                {/* Active Month Days */}
                {calendarData.monthDays.map((dayNum) => {
                  const dayDate = new Date(calendarData.year, calendarData.month, dayNum);
                  dayDate.setHours(0, 0, 0, 0);

                  const isPast = dayDate < today;
                  const isTodayDate = dayDate.getTime() === today.getTime();
                  const isSelectedDay = dayDate.getTime() === selectedDate.getTime();
                  const dayOfWeek = dayDate.getDay();

                  const daySlots = slotsByDay[dayOfWeek] || [];
                  const openSlots = daySlots.filter((s) => !s.is_blocked);
                  const hasOpen = !isPast && openSlots.length > 0;
                  const isRest = (dayOfWeek === 3 || dayOfWeek === 0 || daySlots.length === 0) && !isPast;

                  return (
                    <button
                      key={dayNum}
                      onClick={() => setSelectedDate(dayDate)}
                      disabled={isPast}
                      className={`relative min-h-[52px] sm:min-h-[72px] p-1.5 sm:p-2 rounded-2xl flex flex-col justify-between items-center transition-all duration-200 cursor-pointer ${
                        isSelectedDay
                          ? 'bg-[#E27396] text-white shadow-soft-md scale-[1.03] z-10 font-black'
                          : isPast
                          ? 'bg-slate-50/50 dark:bg-slate-900/30 text-slate-300 dark:text-slate-700 cursor-not-allowed'
                          : hasOpen
                          ? 'bg-[#FFF0F5] dark:bg-[#20101a] hover:bg-[#FCE0EB] text-slate-900 dark:text-white border border-pink-200/80 dark:border-pink-900/50 shadow-soft-xs hover:scale-[1.02]'
                          : isRest
                          ? 'bg-slate-50/70 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500'
                          : 'bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      {/* Top Row: Date Number + Today Pill */}
                      <div className="w-full flex items-center justify-between">
                        <span className={`text-xs sm:text-sm font-bold ${isSelectedDay ? 'text-white' : ''}`}>
                          {dayNum}
                        </span>
                        {isTodayDate && (
                          <span
                            className={`text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase ${
                              isSelectedDay ? 'bg-white text-[#E27396]' : 'bg-[#E27396] text-white'
                            }`}
                          >
                            Today
                          </span>
                        )}
                      </div>

                      {/* Bottom Status Indicator Pill */}
                      <div className="w-full mt-1 flex justify-center">
                        {isSelectedDay ? (
                          <span className="text-[9px] sm:text-[10px] font-bold text-white/95">
                            Selected
                          </span>
                        ) : isPast ? (
                          <span className="text-[9px] text-slate-300 dark:text-slate-700 font-normal">Passed</span>
                        ) : hasOpen ? (
                          <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-[#2D5A43] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="hidden sm:inline">Open</span>
                          </span>
                        ) : isRest ? (
                          <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                            Rest
                          </span>
                        ) : (
                          <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium">Off</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Calendar Legend Bar */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Open Morning Slot</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E27396]"></span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Selected Date</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                  <span>Rest Day (Wed & Sun)</span>
                </div>
              </div>
            </div>

            {/* RIGHT: SELECTED DATE'S OPEN SESSIONS & RESERVATION CARD */}
            <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 p-6 sm:p-8 space-y-5">
              {/* Selected Date Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#E0749A] bg-[#FFF0F5] dark:bg-[#20101a] px-3 py-1 rounded-full shadow-soft-xs">
                    {isSelectedToday ? "Today's Schedule" : 'Selected Date'}
                  </span>

                  {selectedAvailableSlots.length > 0 && !isSelectedPast && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F7A5A] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200/60 shadow-soft-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Morning Session Open</span>
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {selectedDateFormatted}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Malaybalay City Public Tennis Court • Single-coach training
                </p>
              </div>

              {/* Content for this Date */}
              {isSelectedPast ? (
                <div className="py-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date Has Passed</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Please pick today or an upcoming day on the calendar to book your lesson.
                  </p>
                  <button
                    onClick={handleJumpToday}
                    className="mt-4 px-4 py-2 bg-[#E27396] hover:bg-[#cf5479] text-white rounded-xl text-xs font-bold shadow-soft-xs transition-colors cursor-pointer"
                  >
                    Jump to Today →
                  </button>
                </div>
              ) : selectedDaySlots.length > 0 ? (
                <div className="space-y-4">
                  {selectedDaySlots.map((slot) => (
                    <div
                      key={slot.id || `${slot.day_of_week}-${slot.start_time}`}
                      className={`p-5 rounded-2xl transition-all duration-200 border ${
                        slot.is_blocked
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                          : 'bg-white dark:bg-slate-850 border-pink-200/80 dark:border-pink-900/50 hover:border-[#E27396] text-slate-900 dark:text-white shadow-soft-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Regular Morning Schedule
                        </span>
                        {slot.is_blocked ? (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                            Unavailable
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full">
                            Available
                          </span>
                        )}
                      </div>

                      {/* Big Time Display */}
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight my-1.5">
                        {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 py-2.5 my-2 border-t border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Venue</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Public Tennis Court</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Duration</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">1.5 – 2 Hours (Extendable)</span>
                        </div>
                      </div>

                      {/* Booking Action / Coach Actions */}
                      {isAuthenticated ? (
                        <div className="pt-2 flex items-center justify-between text-xs gap-2">
                          <button
                            onClick={(e) => handleToggleBlock(slot, e)}
                            className="px-3.5 py-2 rounded-xl font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
                          >
                            {slot.is_blocked ? 'Unblock' : 'Block Slot'}
                          </button>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => handleOpenEdit(slot, e)}
                              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold hover:bg-slate-200 text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => handleDeleteSlot(slot.id, e)}
                              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 font-bold hover:bg-rose-100 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSlotBooking(slot, selectedDate)}
                          disabled={slot.is_blocked}
                          className="w-full mt-2 py-3.5 bg-[#E27396] hover:bg-[#cf5479] text-white rounded-xl font-bold text-xs sm:text-sm shadow-soft-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                        >
                          <span>Reserve This Morning Slot</span>
                          <span>→</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-6 space-y-3">
                  <span className="text-3xl">🎾</span>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {isSelectedRestDay ? 'Rest Day Scheduled' : 'No Morning Sessions on this Date'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                    {isSelectedRestDay
                      ? 'Coach is off on this day. Coaching takes place on Monday, Tuesday, Thursday, Friday, and Saturday mornings.'
                      : 'No regular session is open on this day. Select an alternate open day on the calendar.'}
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={handleJumpNextAvailable}
                      className="px-5 py-2.5 bg-[#E27396] hover:bg-[#cf5479] text-white rounded-xl text-xs font-bold shadow-soft-xs transition-colors cursor-pointer"
                    >
                      View Next Open Day →
                    </button>
                  </div>

                  {isAuthenticated && (
                    <div className="pt-2">
                      <button
                        onClick={() => handleOpenAdd(selectedDayOfWeek)}
                        className="text-xs text-[#E27396] font-bold hover:underline cursor-pointer"
                      >
                        + Add a slot for {DAY_NAMES[selectedDayOfWeek]}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: 7-DAY WEEK VIEW OVERVIEW (FOR TRAINEES WHO PREFER RECURRING SCHEDULE) */}
        {viewMode === 'week' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {MON_TO_SUN.map((day) => {
                const daySlots = slotsByDay[day] || [];
                const isTodayDay = today.getDay() === day;

                return (
                  <div
                    key={day}
                    className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 p-6 flex flex-col justify-between transition-all duration-200 min-h-[240px] ${
                      isTodayDay ? 'ring-2 ring-[#E27396]' : ''
                    }`}
                  >
                    <div>
                      {/* Day Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-slate-900 dark:text-white">{DAY_NAMES[day]}</span>
                          {isTodayDay && (
                            <span className="text-[10px] bg-[#E27396] text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-soft-xs">
                              Today
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-semibold">
                          {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {daySlots.length === 0 ? (
                        <div className="py-12 text-center">
                          <p className="text-xs font-semibold text-slate-400">
                            {day === 3 || day === 0 ? 'Rest day' : 'No morning slots'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {daySlots.map((slot) => (
                            <div
                              key={slot.id}
                              onClick={() => {
                                const diff = (day - today.getDay() + 7) % 7;
                                const targetDate = new Date(today);
                                targetDate.setDate(today.getDate() + (diff === 0 ? 0 : diff));
                                handleSlotBooking(slot, targetDate);
                              }}
                              className={`p-4 rounded-2xl text-left transition-all duration-200 border ${
                                slot.is_blocked
                                  ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 text-slate-400 cursor-not-allowed'
                                  : 'bg-white dark:bg-slate-850 hover:bg-[#FFF0F5] dark:hover:bg-[#20101a] border-pink-200/80 hover:border-[#E27396] text-slate-900 dark:text-white cursor-pointer shadow-soft-xs'
                              }`}
                            >
                              <div className="font-extrabold text-base text-slate-900 dark:text-white">
                                {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                              </div>
                              <div className="text-xs mt-1.5 flex items-center justify-between text-slate-500">
                                <span className={slot.is_blocked ? 'text-slate-400' : 'text-emerald-700 dark:text-emerald-400 font-bold'}>
                                  {slot.is_blocked ? 'Blocked' : 'Available'}
                                </span>
                                {!isAuthenticated && !slot.is_blocked && (
                                  <span className="text-[#E27396] font-bold hover:underline">Book →</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {isAuthenticated && (
                      <button
                        onClick={() => handleOpenAdd(day)}
                        className="mt-4 text-xs text-[#E27396] font-bold text-center w-full py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors cursor-pointer"
                      >
                        + Add slot
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CRUD MODAL: ADD / EDIT TIME SLOT */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl w-full max-w-md overflow-hidden animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#163829] text-white p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-white">
                    {editingSlot ? 'Edit Schedule Slot' : 'Add Coaching Slot'}
                  </h3>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    Manage weekly coaching availability (Monday to Sunday)
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-300 hover:text-white text-xl font-bold p-1 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSlot} className="p-6 sm:p-7 space-y-4">
                {crudError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-semibold">
                    {crudError}
                  </div>
                )}

                {/* Day of Week */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Day of the Week (Monday – Sunday)
                  </label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) =>
                      setFormData({ ...formData, day_of_week: Number(e.target.value) })
                    }
                    className="w-full rounded-xl p-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#E27396] outline-none transition-all font-medium border-0"
                  >
                    {MON_TO_SUN.map((d) => (
                      <option key={d} value={d}>
                        {DAY_NAMES[d]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      required
                      className="w-full rounded-xl p-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#E27396] outline-none transition-all font-medium border-0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      required
                      className="w-full rounded-xl p-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#E27396] outline-none transition-all font-medium border-0"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl leading-relaxed">
                  Default morning coaching hours: 06:00 – 09:00. Sessions typically last 1.5 – 2 hours.
                </p>

                {/* Blocked checkbox */}
                <div className="pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_blocked}
                      onChange={(e) =>
                        setFormData({ ...formData, is_blocked: e.target.checked })
                      }
                      className="w-4 h-4 text-[#E27396] rounded border-0 bg-slate-200 dark:bg-slate-700 focus:ring-[#E27396]"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Block this slot (make unavailable to players)
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-[#E27396] hover:bg-[#cf5479] shadow-soft-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Saving...' : editingSlot ? 'Update Slot' : 'Add Slot'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
