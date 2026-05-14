import client from './client';

export const createSubscription = async (payload) => {
  const { data } = await client.post('/subscriptions', payload);
  return data.data;
};

export const fetchMySubscriptions = async () => {
  const { data } = await client.get('/subscriptions/me');
  return data.data;
};

export const fetchSubscriptionById = async (id) => {
  const { data } = await client.get(`/subscriptions/${id}`);
  return data.data;
};

export const pauseSubscription = async (id, reason = '') => {
  const { data } = await client.post(`/subscriptions/${id}/pause`, { reason });
  return data.data;
};

export const resumeSubscription = async (id, payload = {}) => {
  const { data } = await client.post(`/subscriptions/${id}/resume`, payload);
  return data.data;
};

export const cancelSubscription = async (id, reason = '') => {
  const { data } = await client.post(`/subscriptions/${id}/cancel`, { reason });
  return data.data;
};

export const renewSubscription = async (id, payload = {}) => {
  const { data } = await client.post(`/subscriptions/${id}/renew`, payload);
  return data.data;
};
