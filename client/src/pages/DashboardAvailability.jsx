import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../api/client';

const DAYS = [
  { value: 1, name: 'Monday' },
  { value: 2, name: 'Tuesday' },
  { value: 3, name: 'Wednesday' },
  { value: 4, name: 'Thursday' },
  { value: 5, name: 'Friday' },
  { value: 6, name: 'Saturday' },
  { value: 0, name: 'Sunday' },
];

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function DashboardAvailability() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [saveToast, setSaveToast] = useState(null);
  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: '06:00',
    end_time: '09:00',
    is_blocked: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await api.getAllAvailability();
      setSlots(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load availability slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const openAddModal = (defaultDay = 1) => {
    setEditingSlot(null);
    setFormData({
      day_of_week: defaultDay,
      start_time: '06:00',
      end_time: '09:00',
      is_blocked: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (slot) => {
    setEditingSlot(slot);
    setFormData({
      day_of_week: Number(slot.day_of_week),
      start_time: slot.start_time || '06:00',
      end_time: slot.end_time || '09:00',
      is_blocked: Boolean(slot.is_blocked),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSlot) {
        await api.updateSlot(editingSlot.id, formData);
      } else {
        await api.createSlot(formData);
      }
      setIsModalOpen(false);
      await fetchSlots();
      triggerToast('Availability schedule saved!');
    } catch (err) {
      alert(err.message || 'Failed to save slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) return;
    try {
      await api.deleteSlot(id);
      await fetchSlots();
      triggerToast('Time slot removed.');
    } catch (err) {
      alert(err.message || 'Failed to delete slot');
    }
  };

  const handleToggleBlock = async (slot) => {
    try {
      await api.updateSlot(slot.id, {
        is_blocked: !slot.is_blocked,
      });
      await fetchSlots();
      triggerToast(slot.is_blocked ? 'Slot unblocked for booking' : 'Slot blocked off');
    } catch (err) {
      alert(err.message || 'Failed to toggle slot availability');
    }
  };

  const triggerToast = (msg) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Group slots by day
  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day.value] = slots
      .filter((s) => Number(s.day_of_week) === day.value)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    return acc;
  }, {});

  const totalSlotsCount = slots.filter((s) => !s.is_blocked).length;

  return (
    <DashboardLayout
      title="Availability"
      subtitle="Manage your coaching business settings."
      headerAction={
        <button
          onClick={() => {
            setShowConfig(true);
            triggerToast('Availability settings up to date!');
          }}
          className="bg-[#E27396] hover:bg-[#cf5479] text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-soft-xs hover:shadow-soft-sm transition-all cursor-pointer flex items-center gap-2"
        >
          <span>Save changes</span>
        </button>
      }
    >
      <div className="space-y-8">
        {saveToast && (
          <div className="bg-emerald-600 text-white px-5 py-3.5 rounded-2xl text-xs font-bold shadow-soft-md flex items-center justify-between animate-fade-in-up">
            <div className="flex items-center gap-2.5">
              <span>✓</span>
              <span>{saveToast}</span>
            </div>
            <button onClick={() => setSaveToast(null)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {error && (
          <div className="bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 p-4 rounded-2xl text-xs font-semibold shadow-soft-xs">
            {error}
          </div>
        )}

        {/* Big White Card matching Figma Screenshot 5 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 sm:p-14 shadow-sm border border-slate-100 dark:border-slate-800/80 text-center">
          <div className="max-w-md mx-auto space-y-4">
            {/* Pink Clock Icon Box */}
            <div className="w-16 h-16 rounded-2xl bg-[#FFF0F5] dark:bg-[#20101a] text-[#E27396] flex items-center justify-center mx-auto shadow-soft-xs">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Availability management
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
              This workspace is ready for Coach Zoid to update availability. {totalSlotsCount} open morning slots currently active for trainees.
            </p>

            <div className="pt-2">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-[#E27396] text-[#E27396] hover:bg-[#FFF0F5] dark:hover:bg-[#20101a] font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <span>{showConfig ? 'Hide schedule list' : 'Configure availability'}</span>
                <span>{showConfig ? '↑' : '↓'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Regular Schedule Breakdown (shown or toggled) */}
        {showConfig && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Weekly Morning Hours
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Regular tennis lessons are scheduled between 6:00 AM – 9:00 AM.
                </p>
              </div>
              <button
                onClick={() => openAddModal(1)}
                className="bg-[#2D5A43] hover:bg-[#224533] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-colors self-start sm:self-auto cursor-pointer"
              >
                + Add Time Slot
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl shadow-sm">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Loading slots...</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {DAYS.map((day) => {
                  const daySlots = slotsByDay[day.value] || [];
                  const isRestDay = day.value === 3 || day.value === 0;

                  return (
                    <div
                      key={day.value}
                      className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {day.name}
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {daySlots.length} {daySlots.length === 1 ? 'slot' : 'slots'}
                          </span>
                        </div>

                        {daySlots.length === 0 ? (
                          <p className="text-slate-400 text-xs italic py-4">
                            {isRestDay ? 'Rest Day' : 'No slots set'}
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {daySlots.map((slot) => (
                              <div
                                key={slot.id}
                                className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                                  slot.is_blocked
                                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 text-slate-400'
                                    : 'bg-white dark:bg-slate-850 border-pink-100 dark:border-pink-900/40 text-slate-900 dark:text-white shadow-soft-xs'
                                }`}
                              >
                                <div>
                                  <p className="font-bold">
                                    {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                                  </p>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${slot.is_blocked ? 'text-rose-500' : 'text-[#E27396]'}`}>
                                    {slot.is_blocked ? 'Blocked' : 'Open'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleBlock(slot)}
                                    className="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                  >
                                    {slot.is_blocked ? 'Unblock' : 'Block'}
                                  </button>
                                  <button
                                    onClick={() => openEditModal(slot)}
                                    className="text-[11px] font-bold text-[#E27396] hover:underline cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(slot.id)}
                                    className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                          onClick={() => openAddModal(day.value)}
                          className="text-[11px] font-bold text-[#E27396] hover:text-[#cf5479] cursor-pointer"
                        >
                          + Add slot
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal for Add / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl w-full max-w-md overflow-hidden animate-scale-up">
              <div className="bg-[#163829] text-white p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-white">
                    {editingSlot ? 'Edit Time Slot' : 'Add Availability Slot'}
                  </h3>
                  <p className="text-xs text-emerald-200/80 mt-0.5">Configure regular coaching availability</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-300 hover:text-white cursor-pointer font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Day of the Week
                  </label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) =>
                      setFormData({ ...formData, day_of_week: Number(e.target.value) })
                    }
                    className="w-full rounded-xl px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#E27396] outline-none border-0"
                  >
                    {DAYS.map((d) => (
                      <option key={d.value} value={d.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

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
                      className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#E27396] outline-none border-0"
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
                      className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#E27396] outline-none border-0"
                    />
                  </div>
                </div>

                <div className="pt-2">
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
                      Block off this slot (unavailable for bookings)
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-[#E27396] hover:bg-[#cf5479] text-white rounded-xl text-xs font-bold shadow-soft-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Saving...' : editingSlot ? 'Update Slot' : 'Add Slot'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
