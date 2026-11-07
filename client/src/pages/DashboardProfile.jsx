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
    <DashboardLayout
      title="Coach Profile"
      subtitle="Update your coaching bio, credentials, court details, and trainee contact channels."
      headerAction={
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-[#E27396] hover:bg-[#cf5479] text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-soft-xs hover:shadow-soft-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <span>{saving ? 'Saving...' : 'Save profile changes'}</span>
        </button>
      }
    >
      <div className="max-w-3xl space-y-6">
        {error && (
          <div className="bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 p-4 rounded-2xl text-xs font-semibold shadow-soft-xs">{error}</div>
        )}
        {success && (
          <div className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 p-4 rounded-2xl text-xs font-semibold shadow-soft-xs">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile photo preview */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-sm p-6 sm:p-7">
            <div className="flex items-center gap-6">
              {formData.photo_url ? (
                <img
                  src={formData.photo_url}
                  alt="Coach"
                  className="w-20 h-20 rounded-full object-cover shadow-soft-md ring-4 ring-[#FFDBE5] dark:ring-[#20101a]"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#E27396] text-white flex items-center justify-center font-black text-2xl shadow-soft-md ring-4 ring-[#FFDBE5] dark:ring-[#20101a]">
                  Z
                </div>
              )}
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">{formData.name || 'Coach Name'}</h3>
                <p className="text-[#92334f] dark:text-[#FFDBE5] text-xs font-bold mt-0.5">{formData.location || 'Malaybalay City'}</p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-sm p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
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
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-[#E27396] outline-none resize-none border-0"
                  />
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-[#E27396] outline-none border-0"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Contact & Social Info */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-sm p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
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
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-[#E27396] outline-none border-0"
                />
              </div>
            ))}
          </div>

          {/* Account Security */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft-sm p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Account Security & Login Password
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
              Change the password you use to log in to the Coach Dashboard. Leave blank if you don't want to change it.
            </p>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">New Password</label>
              <input
                type="password"
                name="password"
                value={formData.password || ''}
                onChange={handleChange}
                placeholder="Enter at least 6 characters to update password"
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-[#E27396] outline-none border-0"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-hover-pink bg-[#E27396] hover:bg-[#cf5479] text-white px-8 py-3.5 rounded-xl font-bold text-xs shadow-soft-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Profile Changes →'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
