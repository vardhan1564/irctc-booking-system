import api from './client';

// Thin wrappers so pages never hard-code URLs. Each maps 1:1 to a Spring controller method.
export const authApi = {
  register: (body) => api.post('/auth/register', body).then((r) => r.data),
  login: (body) => api.post('/auth/login', body).then((r) => r.data),
  verifyOtp: (body) => api.post('/auth/verify-otp', body).then((r) => r.data),
  resendOtp: (email) => api.post('/auth/resend-otp', { email }).then((r) => r.data),
  verifyEmail: (token) => api.get('/auth/verify-email', { params: { token } }).then((r) => r.data),
};

export const userApi = {
  me: () => api.get('/users/me').then((r) => r.data),
  update: (body) => api.put('/users/me', body).then((r) => r.data),
};

export const trainApi = {
  stations: (term) => api.get('/stations', { params: { term } }).then((r) => r.data),
  search: (source, destination) => api.get('/trains/search', { params: { source, destination } }).then((r) => r.data),
  quote: (trainId, params) => api.get(`/trains/${trainId}/quote`, { params }).then((r) => r.data),
  bookedSeats: (trainId, date, coach) =>
    api.get(`/trains/${trainId}/booked-seats`, { params: { date, coach } }).then((r) => r.data),
};

export const bookingApi = {
  create: (body) => api.post('/bookings', body).then((r) => r.data),
  mine: () => api.get('/bookings').then((r) => r.data),
  get: (id) => api.get(`/bookings/${id}`).then((r) => r.data),
  cancel: (id) => api.post(`/bookings/${id}/cancel`).then((r) => r.data),
  // PDF needs the JWT header, so it is fetched as a blob instead of a plain <a href>.
  downloadTicket: async (id) => {
    const res = await api.get(`/bookings/${id}/ticket`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `IRCTC_Ticket_PNR_${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
};

export const paymentApi = {
  dummy: (bookingId, seatNumbers) => api.post('/payments/dummy', { bookingId, seatNumbers }).then((r) => r.data),
  stripeSession: (bookingId, seatNumbers) =>
    api.post('/payments/stripe/session', { bookingId, seatNumbers }).then((r) => r.data),
  stripeConfirm: (sessionId) => api.post('/payments/stripe/confirm', { sessionId }).then((r) => r.data),
};

export const publicApi = {
  pnr: (pnr) => api.get(`/pnr/${encodeURIComponent(pnr)}`).then((r) => r.data),
  live: (trainNo, startDay = 0) => api.get(`/live-status/${encodeURIComponent(trainNo)}`, { params: { startDay } }).then((r) => r.data),
  chat: (message) => api.post('/chat', { message }).then((r) => r.data),
};

export const foodApi = {
  menu: (pnr, full) => api.get('/food/menu', { params: { pnr, full } }).then((r) => r.data),
  checkout: (body) => api.post('/food/checkout', body).then((r) => r.data),
  confirm: (sessionId) => api.post('/food/confirm', { sessionId }).then((r) => r.data),
};

export const adminApi = {
  login: (body) => api.post('/admin/auth/login', body).then((r) => r.data),
  dashboard: () => api.get('/admin/dashboard').then((r) => r.data),
  trains: () => api.get('/admin/trains').then((r) => r.data),
  train: (id) => api.get(`/admin/trains/${id}`).then((r) => r.data),
  createTrain: (body) => api.post('/admin/trains', body).then((r) => r.data),
  updateTrain: (id, body) => api.put(`/admin/trains/${id}`, body).then((r) => r.data),
  deleteTrain: (id) => api.delete(`/admin/trains/${id}`).then((r) => r.data),
  users: () => api.get('/admin/users').then((r) => r.data),
  block: (id) => api.post(`/admin/users/${id}/block`).then((r) => r.data),
  unblock: (id) => api.post(`/admin/users/${id}/unblock`).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  bookings: () => api.get('/admin/bookings').then((r) => r.data),
  forceCancel: (id) => api.post(`/admin/bookings/${id}/force-cancel`).then((r) => r.data),
};
