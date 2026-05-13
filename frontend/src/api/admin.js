import client from './client';

const buildParams = (filters = {}) => {
  const params = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'all') params[k] = v;
  });
  return params;
};

// ─── Stats ────────────────────────────────────────────────────────────
export const fetchAdminStats = async () => {
  const { data } = await client.get('/admin/stats');
  return data.data;
};

// ─── Users ────────────────────────────────────────────────────────────
export const fetchAdminUsers = async (filters = {}) => {
  const { data } = await client.get('/admin/users', { params: buildParams(filters) });
  return data;
};

export const fetchAdminUserDetail = async (id) => {
  const { data } = await client.get(`/admin/users/${id}`);
  return data.data;
};

export const suspendAdminUser = async (id, reason = '') => {
  const { data } = await client.post(`/admin/users/${id}/suspend`, { reason });
  return data.data;
};

export const unsuspendAdminUser = async (id) => {
  const { data } = await client.post(`/admin/users/${id}/unsuspend`);
  return data.data;
};

export const deleteAdminUser = async (id) => {
  const { data } = await client.delete(`/admin/users/${id}`);
  return data.data;
};

// ─── Experts ──────────────────────────────────────────────────────────
export const fetchAdminExperts = async (filters = {}) => {
  const { data } = await client.get('/admin/experts', { params: buildParams(filters) });
  return data;
};

export const toggleFeaturedExpert = async (id) => {
  const { data } = await client.post(`/admin/experts/${id}/toggle-featured`);
  return data.data;
};

export const suspendAdminExpert = async (id) => {
  const { data } = await client.post(`/admin/experts/${id}/suspend`);
  return data.data;
};

export const unsuspendAdminExpert = async (id) => {
  const { data } = await client.post(`/admin/experts/${id}/unsuspend`);
  return data.data;
};

// ─── Reviews ──────────────────────────────────────────────────────────
export const fetchAdminReviews = async (filters = {}) => {
  const { data } = await client.get('/admin/reviews', { params: buildParams(filters) });
  return data;
};

export const deleteAdminReview = async (id) => {
  const { data } = await client.delete(`/admin/reviews/${id}`);
  return data.data;
};

// ─── Bookings ─────────────────────────────────────────────────────────
export const fetchAdminBookings = async (filters = {}) => {
  const { data } = await client.get('/admin/bookings', { params: buildParams(filters) });
  return data;
};

// ─── Applications (re-exports from existing routes) ───────────────────
export const fetchAdminApplications = async (status = 'Under Review') => {
  const { data } = await client.get('/applications', { params: status === 'all' ? {} : { status } });
  return data.data;
};

export const approveApplication = async (id) => {
  const { data } = await client.post(`/applications/${id}/approve`);
  return data.data;
};

export const rejectApplication = async (id, notes = '') => {
  const { data } = await client.post(`/applications/${id}/reject`, { notes });
  return data.data;
};
