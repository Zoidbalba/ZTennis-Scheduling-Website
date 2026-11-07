import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Monday-to-Sunday order: Mon(1), Tue(2), Wed(3), Thu(4), Fri(5), Sat(6), Sun(0)
const MON_TO_SUN = [1, 2, 3, 4, 5, 6, 0];

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function CalendarSection({ slots = [], onSlotSelect, onSlotsChange }) {
  const { isAuthenticated } = useAuth();

  // Current week offset (0 = current week, +1 = next week, -1 = last week)
  const [weekOffset, setWeekOffset] = useState(0);

  // Coach modal state for managing availability
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: '06:00',
    end_time: '09:00',
    is_blocked: false,
  });

  // Calculate the 7 days (Mon-Sun) of the currently selected week
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDayOfWeek = (today.getDay() + 6) % 7;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayOfWeek + weekOffset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);

      const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();

      days.push({
        date: d,
        dayOfWeek: d.getDay(),
        dayNumber: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        isToday,
      });
    }
    return days;
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    if (currentWeekDays.length === 0) return '';
    const start = currentWeekDays[0].date;
    const end = currentWeekDays[6].date;

    const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startMonth === endMonth && startYear === endYear) {
      return `${startMonth} ${start.getDate()}–${end.getDate()}, ${startYear}`;
    }
    if (startYear === endYear) {
      return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${startYear}`;
    }
    return `${startMonth} ${start.getDate()}, ${startYear} – ${endMonth} ${end.getDate()}, ${endYear}`;
  }, [currentWeekDays]);

  const slotsByDay = useMemo(() => {
    const map = {};
    for (let d = 0; d < 7; d++) map[d] = [];

    for (const slot of slots) {
      if (slot.is_blocked) continue;
      const day = Number(slot.day_of_week);
      if (map[day]) {
        map[day].push(slot);
      }
    }

    for (let d = 0; d < 7; d++) {
      map[d].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    }
    return map;
  }, [slots]);

  const handleSlotClick = (slot, dayInfo) => {
    if (onSlotSelect) {
      onSlotSelect({
        ...slot,
        booking_date: dayInfo.date,
      });
    }
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createSlot(formData);
      setIsModalOpen(false);
      onSlotsChange?.();
    } catch (err) {
      alert(err.message || 'Failed to save slot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="availability"
      className="py-16 sm:py-24 bg-[#F4F8F5] dark:bg-[#0A1612] transition-colors scroll-mt-10"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section matching Figma Screenshot 3 */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <span className="text-xs font-black tracking-widest text-[#E27396] uppercase mb-2 block">
              WEEKLY AVAILABILITY
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Pick a morning. Let's play.
            </h2>
          </div>

          {/* Week Navigator Pill */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 px-4 py-2.5 rounded-2xl shadow-soft-xs self-start sm:self-auto">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Previous week"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[150px] sm:min-w-[170px] text-center">
              {weekLabel}
            </span>
            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Next week"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main 7-Day Calendar Card matching Figma Screenshot 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <div className="grid grid-cols-7 min-w-[700px] divide-x divide-slate-100 dark:divide-slate-800">
              {currentWeekDays.map((dayInfo, idx) => {
                const daySlots = slotsByDay[dayInfo.dayOfWeek] || [];
                const dayNameShort = DAY_SHORT[dayInfo.dayOfWeek];

                return (
                  <div key={idx} className="flex flex-col min-h-[300px]">
                    {/* Day Column Header */}
                    <div className="p-4 sm:p-5 text-center border-b border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        {dayNameShort}
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block mt-1">
                        {dayInfo.dayNumber}
                      </span>
                      {dayInfo.isToday && (
                        <span className="inline-block bg-[#FFF0F5] dark:bg-[#20101a] text-[#E27396] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 shadow-soft-xs">
                          TODAY
                        </span>
                      )}
                    </div>

                    {/* Slots inside Column */}
                    <div className="p-3 sm:p-4 flex-1 space-y-2.5">
                      {daySlots.length > 0 ? (
                        daySlots.map((slot) => {
                          const formattedStart = formatTime(slot.start_time);
                          return (
                            <button
                              key={slot.id}
                              onClick={() => handleSlotClick(slot, dayInfo)}
                              className="w-full bg-white dark:bg-slate-850 hover:bg-[#FFF0F5] dark:hover:bg-[#20101a] border border-pink-200/90 dark:border-pink-900/50 hover:border-[#E27396] p-3 rounded-2xl text-center transition-all shadow-soft-xs group cursor-pointer block"
                            >
                              <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-[#E27396] transition-colors block">
                                {formattedStart}
                              </span>
                              <span className="text-[10px] font-bold text-[#E27396] tracking-wider uppercase mt-0.5 block">
                                OPEN
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="h-full flex items-center justify-center py-8">
                          <span className="text-[11px] font-semibold text-slate-300 dark:text-slate-600 italic">
                            Rest day
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Legend Bar */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E27396]"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Available times</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Morning sessions only · 6:00 AM–9:00 AM</span>
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#2D5A43] hover:bg-[#234835] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-soft-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>+ Add Weekly Time Slot</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-soft-xl">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Add Weekly Availability</h3>
            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Day of the Week</label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: Number(e.target.value) })}
                  className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold"
                >
                  {MON_TO_SUN.map((d) => (
                    <option key={d} value={d}>{DAY_NAMES[d]}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#E27396] hover:bg-[#cf5479] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-soft-xs"
                >
                  {submitting ? 'Saving...' : 'Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
