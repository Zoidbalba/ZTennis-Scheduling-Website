const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('coach_token') || localStorage.getItem('trainee_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    err.notRegistered = data.notRegistered;
    err.requiresAuth = data.requiresAuth;
    throw err;
  }
  return data;
}

export const api = {
  // Profile
  getProfile: () => request('/profile'),
  updateProfile: (data) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  traineeLogin: (credentials) => request('/auth/trainee/login', { method: 'POST', body: JSON.stringify(credentials) }),
  traineeSignup: (data) => request('/auth/trainee/signup', { method: 'POST', body: JSON.stringify(data) }),
  loginGoogle: (payload) => request('/auth/google', { method: 'POST', body: JSON.stringify(payload) }),
  getAuthMe: () => request('/auth/me'),

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
  getBookedDates: () => request('/bookings/booked-dates'),
  createBooking: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getBookings: () => request('/bookings'),
  getMyBookings: (email) => request('/bookings/my-bookings' + (email ? `?email=${encodeURIComponent(email)}` : '')),
  sendFollowUpMessage: (id, message) => request(`/bookings/${id}/follow-up`, { method: 'POST', body: JSON.stringify({ message }) }),
  getTrainees: () => request('/bookings/trainees'),
  updateBookingStatus: (id, status, extra = {}) => request(`/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, ...extra }) }),
  sendBookingSms: (id, data = {}) => request(`/bookings/${id}/send-sms`, { method: 'POST', body: JSON.stringify(data) }),
  updateBooking: (id, data) => request(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBooking: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),
};
