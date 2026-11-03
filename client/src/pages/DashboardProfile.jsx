import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../api/client';

export default function DashboardProfile() {
  const [formData, setFormData] = useState({
    name: '',
    photo_url: '',
    bio: '',
    experience: '',
    specialties: '',
    location: '',
    court_details: '',
    phone: '',
    email: '',
    messenger_link: '',
    facebook_link: '',
    instagram_link: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await api.getProfile();
        setFormData({
          name: profile.name || '',
          photo_url: profile.photo_url || '',
          bio: profile.bio || '',
          experience: profile.experience || '',
          specialties: profile.specialties || '',
          location: profile.location || '',
          court_details: profile.court_details || '',
          phone: profile.phone || '',
          email: profile.email || '',
          messenger_link: profile.messenger_link || '',
          facebook_link: profile.facebook_link || '',
          instagram_link: profile.instagram_link || '',
        });
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.updateProfile(formData);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  const fields = [
    { name: 'name', label: 'Coach Name', type: 'text', placeholder: 'Zoid' },
    { name: 'photo_url', label: 'Photo URL', type: 'url', placeholder: 'https://example.com/photo.jpg' },
    { name: 'bio', label: 'Bio', type: 'textarea', placeholder: 'Tell players about your background and coaching approach...', rows: 3 },
    { name: 'experience', label: 'Experience', type: 'textarea', placeholder: 'e.g. Active competitive playing & coaching experience...', rows: 2 },
    { name: 'specialties', label: 'Specialties', type: 'text', placeholder: 'e.g. Forehand, Backhand, Serve, Rally Drills (comma-separated)' },
    { name: 'location', label: 'Location', type: 'text', placeholder: 'Malaybalay City' },
    { name: 'court_details', label: 'Court Details', type: 'text', placeholder: 'e.g. Public Tennis Court (sessions last around 1.5 - 2 hrs)' },
  ];

  const contactFields = [
    { name: 'phone', label: 'Phone Number (Call / SMS)', type: 'tel', placeholder: '09350034792' },
    { name: 'messenger_link', label: 'Messenger Link', type: 'url', placeholder: 'https://m.me/yourusername' },
    { name: 'facebook_link', label: 'Facebook Profile / Page Link', type: 'url', placeholder: 'https://facebook.com/yourusername' },
    { name: 'instagram_link', label: 'Instagram Profile Link', type: 'url', placeholder: 'https://instagram.com/yourusername' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'coach@tennisph.com' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Edit Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Update your coaching profile, location, and social media channels</p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 p-4 rounded-xl text-xs font-semibold">{error}</div>
        )}
        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-xs font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile photo preview */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-6">
              {formData.photo_url ? (
                <img
                  src={formData.photo_url}
                  alt="Coach"
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-900 dark:bg-primary-600 flex items-center justify-center text-white font-black text-2xl">
                  Z
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{formData.name || 'Coach Name'}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{formData.location || 'Malaybalay City'}</p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Basic Information
            </h2>
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    rows={field.rows || 3}
                    placeholder={field.placeholder}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none"
                  />
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Contact & Social Info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Contact & Social Channels
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
              Trainees can reach you through these contact channels on your profile.
            </p>
            {contactFields.map((field) => (
              <div key={field.name}>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-hover-glow bg-slate-900 hover:bg-slate-800 dark:bg-primary-600 dark:hover:bg-primary-500 text-white px-8 py-3 rounded-xl font-bold text-xs shadow-soft-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
