const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('coach_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Profile
  getProfile: () => request('/profile'),
  updateProfile: (data) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

  // Availability
  getAvailability: () => request('/availability'),
  getAllAvailability: () => request('/availability/all'),
  createSlot: (data) => request('/availability', { method: 'POST', body: JSON.stringify(data) }),
  updateSlot: (id, data) => request(`/availability/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSlot: (id) => request(`/availability/${id}`, { method: 'DELETE' }),

  // Rates
  getRates: () => request('/rates'),
  createRate: (data) => request('/rates', { method: 'POST', body: JSON.stringify(data) }),
  updateRate: (id, data) => request(`/rates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRate: (id) => request(`/rates/${id}`, { method: 'DELETE' }),

  // Bookings
  createBooking: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getBookings: () => request('/bookings'),
  getTrainees: () => request('/bookings/trainees'),
  updateBookingStatus: (id, status) => request(`/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  updateBooking: (id, data) => request(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBooking: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),
};
