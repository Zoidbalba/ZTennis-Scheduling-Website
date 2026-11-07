import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../api/client';

function formatPrice(price) {
  return `₱${Number(price).toLocaleString('en-PH')}`;
}

export default function DashboardRates() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    session_type: '',
    duration_minutes: 60,
    price: '',
    description: '',
    is_package: false,
    package_sessions: 1,
  });

  const fetchRates = async () => {
    try {
      setLoading(true);
      const data = await api.getRates();
      setRates(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load rates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const openAddModal = () => {
    setEditingRate(null);
    setFormData({
      session_type: '',
      duration_minutes: 60,
      price: '',
      description: '',
      is_package: false,
      package_sessions: 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rate) => {
    setEditingRate(rate);
    setFormData({
      session_type: rate.session_type || '',
      duration_minutes: rate.duration_minutes || 60,
      price: rate.price || '',
      description: rate.description || '',
      is_package: Boolean(rate.is_package),
      package_sessions: rate.package_sessions || 1,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        duration_minutes: Number(formData.duration_minutes),
        package_sessions: formData.is_package ? Number(formData.package_sessions) : 1,
      };
      if (editingRate) {
        await api.updateRate(editingRate.id, payload);
      } else {
        await api.createRate(payload);
      }
      setIsModalOpen(false);
      await fetchRates();
    } catch (err) {
      alert(err.message || 'Failed to save rate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rate?')) return;
    try {
      await api.deleteRate(id);
      await fetchRates();
    } catch (err) {
      alert(err.message || 'Failed to delete rate');
    }
  };

  return (
    <DashboardLayout
      title="Rates & Pricing"
      subtitle="Manage public coaching session rates, durations, and packages."
      headerAction={
        <button
          onClick={openAddModal}
          className="bg-[#E27396] hover:bg-[#cf5479] text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-soft-xs hover:shadow-soft-sm transition-all cursor-pointer flex items-center gap-2"
        >
          <span>+ Add new rate</span>
        </button>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 p-4 rounded-2xl text-xs font-semibold shadow-soft-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl shadow-sm">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Loading rates...</p>
          </div>
        ) : rates.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl shadow-sm">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mt-2">No rates yet</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Add your first session rate to get started.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rates.map((rate) => (
              <div
                key={rate.id}
                className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 p-7 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                {rate.is_package ? (
                  <div className="absolute top-0 right-0 bg-[#FFF0F5] text-[#E27396] dark:bg-[#20101a] text-[10px] font-black px-3.5 py-1 rounded-bl-2xl uppercase tracking-wider">
                    Package
                  </div>
                ) : null}

                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">{rate.session_type}</h3>
                  <p className="text-xs text-slate-400 mb-4 font-medium">
                    {rate.duration_minutes} minutes
                    {rate.is_package && rate.package_sessions > 1
                      ? ` · ${rate.package_sessions} sessions`
                      : ''}
                  </p>

                  <div className="mb-4">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {formatPrice(rate.price)}
                    </span>
                    {rate.is_package && rate.package_sessions > 1 && (
                      <span className="text-xs text-slate-400 ml-2 font-medium">
                        ({formatPrice(Math.round(rate.price / rate.package_sessions))}/session)
                      </span>
                    )}
                  </div>

                  {rate.description && (
                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed mb-4">{rate.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => openEditModal(rate)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(rate.id)}
                    className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-xl w-full max-w-md overflow-hidden animate-scale-up">
              <div className="bg-[#163829] text-white p-6 flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-white">{editingRate ? 'Edit Rate' : 'Add New Rate'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white cursor-pointer font-bold text-lg">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Session Title
                  </label>
                  <input
                    type="text"
                    value={formData.session_type}
                    onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
                    required
                    placeholder="e.g. Individual Session"
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#E27396] outline-none border-0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Price (₱)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      placeholder="300"
                      min="0"
                      className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#E27396] outline-none border-0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Duration (Mins)
                    </label>
                    <input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                      required
                      placeholder="120"
                      min="15"
                      step="15"
                      className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#E27396] outline-none border-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Description / Highlights
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="1-on-1 focused coaching with technique breakdown"
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#E27396] outline-none border-0"
                  />
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
                    {submitting ? 'Saving...' : editingRate ? 'Update Rate' : 'Add Rate'}
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
