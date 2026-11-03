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
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Session Rates</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your pricing for different session types</p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-soft-xs transition-all cursor-pointer"
          >
            <span>+</span> Add Rate
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs font-semibold">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-soft-sm border border-slate-200">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Loading rates...</p>
          </div>
        ) : rates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-soft-sm border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mt-2">No rates yet</h3>
            <p className="text-slate-400 text-xs mt-1">Add your first session rate to get started.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rates.map((rate) => (
              <div
                key={rate.id}
                className="relative bg-white rounded-2xl shadow-soft-sm border border-slate-200 overflow-hidden transition-all hover:shadow-soft-md"
              >
                {rate.is_package ? (
                  <div className="absolute top-0 right-0 bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    Package
                  </div>
                ) : null}

                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{rate.session_type}</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    {rate.duration_minutes} minutes
                    {rate.is_package && rate.package_sessions > 1
                      ? ` · ${rate.package_sessions} sessions`
                      : ''}
                  </p>

                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {formatPrice(rate.price)}
                    </span>
                    {rate.is_package && rate.package_sessions > 1 && (
                      <span className="text-xs text-slate-400 ml-2">
                        ({formatPrice(Math.round(rate.price / rate.package_sessions))}/session)
                      </span>
                    )}
                  </div>

                  {rate.description && (
                    <p className="text-slate-600 text-xs leading-relaxed mb-4">{rate.description}</p>
                  )}

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => openEditModal(rate)}
                      className="text-xs text-slate-900 hover:text-primary-600 font-bold"
                    >
                      Edit
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => handleDelete(rate.id)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-soft-xl w-full max-w-md overflow-hidden animate-scale-up border border-slate-200">
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <h3 className="font-bold text-base">{editingRate ? 'Edit Rate' : 'Add New Rate'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Session Type</label>
                  <input
                    type="text"
                    value={formData.session_type}
                    onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
                    required
                    placeholder="e.g. Individual Session"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                      required
                      min="15"
                      step="15"
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Price (₱)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0"
                      step="50"
                      placeholder="300"
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Brief description of the session..."
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none resize-none"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_package}
                      onChange={(e) => setFormData({ ...formData, is_package: e.target.checked })}
                      className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                    />
                    <span className="text-xs font-semibold text-slate-700">This is a package deal</span>
                  </label>

                  {formData.is_package && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Number of Sessions in Package
                      </label>
                      <input
                        type="number"
                        value={formData.package_sessions}
                        onChange={(e) => setFormData({ ...formData, package_sessions: e.target.value })}
                        min="2"
                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
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
