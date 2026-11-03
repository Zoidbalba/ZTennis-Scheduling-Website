import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Standard Monday-to-Sunday order
const MON_TO_SUN = [1, 2, 3, 4, 5, 6, 0];

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function getNextDateForDay(dayOfWeek) {
  const today = new Date();
  const todayDay = today.getDay();
  let diff = dayOfWeek - todayDay;
  if (diff < 0) diff += 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + diff);
  return nextDate;
}

export default function CalendarSection({
  slots = [],
  onSlotSelect,
  onSlotsChange,
}) {
  const { isAuthenticated } = useAuth();

  // Active view: 'tabs' (day-by-day) or 'week' (full Mon-Sun overview)
  const [viewMode, setViewMode] = useState('tabs');

  // Active day in tab view
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().getDay();
    return MON_TO_SUN.includes(today) ? today : 1;
  });

  // Modal State for CRUD
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

  // Group slots by day (1..6, 0)
  const slotsByDay = useMemo(() => {
    const grouped = {};
    for (const d of MON_TO_SUN) grouped[d] = [];
    for (const slot of slots) {
      const day = Number(slot.day_of_week);
      if (grouped[day]) {
        grouped[day].push(slot);
      }
    }
    for (const d of MON_TO_SUN) {
      grouped[d].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    }
    return grouped;
  }, [slots]);

  const handleSlotClick = (slot) => {
    if (slot.is_blocked) return;
    const bookingDate = getNextDateForDay(slot.day_of_week);
    onSlotSelect?.({ ...slot, booking_date: bookingDate });
  };

  // --- CRUD HANDLERS (Coach Only) ---

  const handleOpenAdd = (dayValue = activeDay) => {
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

  return (
    <section id="schedule" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto scroll-mt-20">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 border border-primary-200/60 dark:border-primary-800 px-3.5 py-1 rounded-full shadow-soft-xs">
          Weekly Availability
        </span>
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mt-2.5 sm:mt-3.5 mb-2 sm:mb-3 tracking-tight">
          Coaching Schedule
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-base leading-relaxed max-w-xl mx-auto">
          Choose an open morning slot below to reserve your coaching session. Regular training hours: <strong>6:00 AM – 9:00 AM</strong>.
        </p>

        {/* Public Court & Duration Highlights Callout */}
        <div className="mt-4 sm:mt-5 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl shadow-soft-xs">
          <span className="font-semibold text-slate-900 dark:text-white">Venue: Public Tennis Court</span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
          <span>1.5 – 2 Hours (court extendable)</span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
          <span className="font-bold text-slate-900 dark:text-white">M · T · TH · F · SAT</span>
        </div>
      </div>

      {/* CRUD Success Notice */}
      {crudSuccess && (
        <div className="mb-6 sm:mb-8 p-3.5 sm:p-5 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-soft-xs animate-fade-in">
          <span>{crudSuccess}</span>
          <button
            onClick={() => setCrudSuccess('')}
            className="text-slate-400 hover:text-white font-bold px-2 py-1"
          >
            Close
          </button>
        </div>
      )}

      {/* COACH CRUD TOOLBAR (Visible when Coach is logged in) */}
      {isAuthenticated && (
        <div className="mb-6 sm:mb-10 p-4 sm:p-7 bg-slate-900 dark:bg-slate-900/90 text-white rounded-2xl sm:rounded-3xl shadow-soft-md border border-slate-800 dark:border-slate-700 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-white/10 text-[10px] sm:text-[11px] font-bold uppercase px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full tracking-wider text-slate-200">
                  Coach Admin Mode
                </span>
                <h3 className="font-bold text-sm sm:text-lg">Schedule Manager Active</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Add, edit, block, or delete slots directly on this Monday–Sunday calendar.
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => handleOpenAdd(activeDay)}
                className="btn-hover-glow flex-1 sm:flex-none justify-center bg-white text-slate-900 hover:bg-slate-100 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm shadow-soft-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span> Add Time Slot
              </button>
              <a
                href="/dashboard/availability"
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs font-semibold text-white transition-colors"
              >
                Dashboard →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* View Switcher: Tabs vs Week Grid */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Monday to Sunday Day Tabs */}
        <div className="flex overflow-x-auto gap-2 sm:gap-2.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 w-auto no-scrollbar scroll-smooth">
          {MON_TO_SUN.map((day) => {
            const nextDate = getNextDateForDay(day);
            const dateStr = nextDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
            const daySlotCount = slotsByDay[day]?.length || 0;
            const isSelected = activeDay === day && viewMode === 'tabs';

            return (
              <button
                key={day}
                onClick={() => {
                  setActiveDay(day);
                  setViewMode('tabs');
                }}
                className={`flex-shrink-0 px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl text-center transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#022414] dark:bg-[#5e8d66] text-white shadow-soft-md font-bold scale-[1.02] border border-[#5e8d66]/50'
                    : 'bg-white dark:bg-slate-900 hover:bg-[#ffe5f4]/30 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-semibold hover:border-[#f1a6bc]/50 dark:hover:border-[#5e8d66]/40'
                }`}
              >
                <div className="text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2">
                  <span>{DAY_SHORT[day]}</span>
                  {daySlotCount > 0 && (
                    <span
                      className={`text-[9px] sm:text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold ${
                        isSelected ? 'bg-[#f1a6bc] text-[#022414] font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {daySlotCount}
                    </span>
                  )}
                </div>
                <div className="text-[10px] sm:text-xs opacity-75 mt-0.5 font-normal">{dateStr}</div>
              </button>
            );
          })}
        </div>

        {/* View toggle */}
        <div className="inline-flex rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 p-1 text-xs font-semibold self-center sm:self-center shadow-inner">
          <button
            onClick={() => setViewMode('tabs')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer ${
              viewMode === 'tabs'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-soft-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Day View
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer ${
              viewMode === 'week'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-soft-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Full Week (7 Days)
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: DAY-BY-DAY TAB VIEW (Spacious & Clean Cards) */}
      {viewMode === 'tabs' && (
        <div key={activeDay} className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-soft-md border border-slate-200/90 dark:border-slate-800 p-4 sm:p-8 md:p-10 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-6 border-b border-slate-100 dark:border-slate-800 gap-2 sm:gap-3 mb-6 sm:mb-8">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {DAY_NAMES[activeDay]} Schedule
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium">
                Upcoming Date: {getNextDateForDay(activeDay).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {isAuthenticated && (
              <button
                onClick={() => handleOpenAdd(activeDay)}
                className="text-xs text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 font-bold self-start sm:self-auto flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                + Add slot for {DAY_NAMES[activeDay]}
              </button>
            )}
          </div>

          {slotsByDay[activeDay]?.length > 0 ? (
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-1 md:grid-cols-2">
              {slotsByDay[activeDay].map((slot) => (
                <div
                  key={slot.id || `${slot.day_of_week}-${slot.start_time}`}
                  onClick={() => handleSlotClick(slot)}
                  className={`card-hover-lift p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border-2 flex flex-col justify-between transition-all duration-300 min-h-[220px] sm:min-h-[260px] ${
                    slot.is_blocked
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80 hover:border-slate-900 dark:hover:border-primary-500 text-slate-900 dark:text-white cursor-pointer shadow-soft-sm hover:shadow-soft-xl'
                  }`}
                >
                  {/* Top Badges */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3 sm:mb-5">
                      <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider px-2.5 sm:px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Morning Coaching Session
                      </span>

                      {slot.is_blocked ? (
                        <span className="text-xs text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 px-2.5 sm:px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900">
                          Unavailable
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 sm:px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 sm:mr-2"></span>
                          Open
                        </span>
                      )}
                    </div>

                    {/* Big Time Display */}
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight my-2 sm:my-4">
                      {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                    </div>

                    {/* Session Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 sm:pt-3 pb-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/60">
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold block">Venue</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Public Tennis Court</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold block">Duration</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">1.5 – 2 Hours</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Area */}
                  {isAuthenticated ? (
                    <div
                      className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => handleToggleBlock(slot, e)}
                        className={`font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                          slot.is_blocked
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {slot.is_blocked ? 'Unblock Slot' : 'Block Slot'}
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleOpenEdit(slot, e)}
                          className="text-slate-900 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg font-bold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDeleteSlot(slot.id, e)}
                          className="text-rose-600 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg font-bold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Tap to reserve</span>
                      <span className="btn-hover-pink inline-flex items-center gap-1.5 bg-[#022414] hover:bg-[#5e8d66] dark:bg-[#5e8d66] dark:hover:bg-[#f1a6bc] text-white dark:hover:text-[#022414] font-black text-xs sm:text-sm px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-soft-xs transition-all">
                        <span>Reserve</span>
                        <span>→</span>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6 rounded-3xl bg-slate-50 border border-slate-200 max-w-2xl mx-auto">
              <h4 className="font-extrabold text-slate-900 text-lg">
                {activeDay === 3 || activeDay === 0 ? 'Rest Day Scheduled' : 'No Scheduled Slots for this Day'}
              </h4>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-md mx-auto">
                {activeDay === 3 || activeDay === 0
                  ? 'No regular morning slot on this day. If you need a special training schedule, reach out on Messenger, Facebook, or Instagram.'
                  : 'No morning session is currently open on this day. Browse other days or contact the coach directly.'}
              </p>
              {isAuthenticated && (
                <button
                  onClick={() => handleOpenAdd(activeDay)}
                  className="mt-6 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-soft-xs transition-all cursor-pointer"
                >
                  + Add Time Slot for {DAY_NAMES[activeDay]}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: FULL WEEK VIEW (Spacious Grid Layout) */}
      {viewMode === 'week' && (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {MON_TO_SUN.map((day) => {
              const daySlots = slotsByDay[day] || [];
              const isToday = new Date().getDay() === day;

              return (
                <div
                  key={day}
                  className={`bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-soft-sm border p-4 sm:p-6 flex flex-col justify-between transition-all duration-200 min-h-[240px] sm:min-h-[280px] ${
                    isToday ? 'border-slate-900 dark:border-primary-500 ring-2 ring-slate-200 dark:ring-primary-950' : 'border-slate-200/90 dark:border-slate-800'
                  }`}
                >
                  <div>
                    {/* Day Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white">{DAY_NAMES[day]}</span>
                        {isToday && (
                          <span className="text-[10px] bg-slate-900 dark:bg-primary-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Today
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                        {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {daySlots.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          {day === 3 || day === 0 ? 'Rest day' : 'No morning slots'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            onClick={() => handleSlotClick(slot)}
                            className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
                              slot.is_blocked
                                ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                : 'bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-slate-900 dark:hover:border-primary-500 hover:bg-white dark:hover:bg-slate-800 text-slate-900 dark:text-white cursor-pointer shadow-soft-xs hover:shadow-soft-sm'
                            }`}
                          >
                            <div className="font-extrabold text-base text-slate-900 dark:text-white">
                              {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                            </div>
                            <div className="text-xs mt-1.5 flex items-center justify-between text-slate-500 dark:text-slate-400">
                              <span className={slot.is_blocked ? 'text-slate-400 dark:text-slate-500 font-medium' : 'text-emerald-700 dark:text-emerald-400 font-bold'}>
                                {slot.is_blocked ? 'Blocked' : 'Available'}
                              </span>
                              {!isAuthenticated && !slot.is_blocked && (
                                <span className="text-slate-900 dark:text-primary-400 font-bold hover:underline">Book →</span>
                              )}
                            </div>

                            {/* Inline CRUD actions for week view */}
                            {isAuthenticated && (
                              <div
                                className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => handleOpenEdit(slot, e)}
                                  className="text-slate-900 dark:text-white hover:underline font-bold"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => handleToggleBlock(slot, e)}
                                  className="text-slate-600 dark:text-slate-400 hover:underline font-medium"
                                >
                                  {slot.is_blocked ? 'Unblock' : 'Block'}
                                </button>
                                <button
                                  onClick={(e) => handleDeleteSlot(slot.id, e)}
                                  className="text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isAuthenticated && (
                    <button
                      onClick={() => handleOpenAdd(day)}
                      className="mt-4 text-xs text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 font-bold text-center w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl w-full max-w-md overflow-hidden animate-scale-up border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg">
                  {editingSlot ? 'Edit Schedule Slot' : 'Add Coaching Slot'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage weekly coaching availability (Monday to Sunday)
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-6 sm:p-7 space-y-4">
              {crudError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-semibold">
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
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-primary-500 outline-none transition-all font-medium"
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
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-primary-500 outline-none transition-all font-medium"
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
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-primary-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 leading-relaxed">
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
                    className="w-4 h-4 text-slate-900 dark:text-primary-500 rounded border-slate-300 dark:border-slate-700 focus:ring-slate-900"
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
                  className="flex-1 py-3 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-hover-glow flex-1 py-3 bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow-soft-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingSlot ? 'Update Slot' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
