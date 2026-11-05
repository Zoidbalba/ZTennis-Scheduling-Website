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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
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
    } catch (err) {
      alert(err.message || 'Failed to toggle slot availability');
    }
  };

  // Group slots by day
  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day.value] = slots
      .filter((s) => Number(s.day_of_week) === day.value)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Weekly Schedule & Availability</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Manage your regular Monday to Sunday schedule. Morning sessions: 6:00 AM – 9:00 AM (M, T, TH, F, SAT).
            </p>
          </div>
          <button
            onClick={() => openAddModal(1)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-primary-600 dark:hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-soft-xs transition-all cursor-pointer"
          >
            <span>+</span> Add Time Slot
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 p-4 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl shadow-soft-sm">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Loading schedule...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {DAYS.map((day) => {
              const daySlots = slotsByDay[day.value] || [];
              const isRestDay = day.value === 3 || day.value === 0;

              return (
                <div key={day.value} className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-sm p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">{day.name}</span>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                        daySlots.length > 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500'
                      }`}>
                        {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                      </span>
                      {isRestDay && daySlots.length === 0 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-0.5 rounded-full font-medium">
                          (Rest Day)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => openAddModal(day.value)}
                      className="text-xs text-[#E27396] hover:text-[#cf5479] font-bold transition-colors cursor-pointer"
                    >
                      + Add slot
                    </button>
                  </div>

                  {daySlots.length === 0 ? (
                    <p className="text-slate-400 dark:text-slate-500 text-xs italic py-2">
                      No coaching slots scheduled for {day.name} {isRestDay ? '(Rest Day)' : ''}
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`p-4 rounded-2xl transition-all flex flex-col justify-between ${
                            slot.is_blocked
                              ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400'
                              : 'bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white shadow-soft-xs hover:shadow-soft-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-sm">
                                {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                              </div>
                              <div className="mt-1">
                                {slot.is_blocked ? (
                                  <span className="inline-flex items-center text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70 px-2.5 py-0.5 rounded-full">
                                    Blocked
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded-full">
                                    Open
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 mt-3 text-xs">
                            <button
                              onClick={() => handleToggleBlock(slot)}
                              className={`font-semibold hover:underline cursor-pointer ${
                                slot.is_blocked ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {slot.is_blocked ? 'Unblock' : 'Block'}
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(slot)}
                                className="text-slate-900 dark:text-primary-400 hover:underline font-bold cursor-pointer"
                              >
                                Edit
                              </button>
                              <span className="text-slate-300 dark:text-slate-600">|</span>
                              <button
                                onClick={() => handleDelete(slot.id)}
                                className="text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for Add / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl w-full max-w-md overflow-hidden animate-scale-up border border-slate-200 dark:border-slate-800">
              <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <h3 className="font-bold text-base">
                  {editingSlot ? 'Edit Time Slot' : 'Add Availability Slot'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Day of the Week (Monday to Sunday)
                  </label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) =>
                      setFormData({ ...formData, day_of_week: Number(e.target.value) })
                    }
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      required
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      required
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_blocked}
                      onChange={(e) =>
                        setFormData({ ...formData, is_blocked: e.target.checked })
                      }
                      className="w-4 h-4 text-slate-900 rounded border-slate-300 dark:border-slate-700 focus:ring-primary-500"
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
                    className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-primary-600 dark:hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
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
