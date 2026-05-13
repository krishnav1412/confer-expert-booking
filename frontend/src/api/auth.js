import client from './client';

export const signup = async (payload) => {
  const { data } = await client.post('/auth/signup', payload);
  return data.data;
};

export const login = async (payload) => {
  const { data } = await client.post('/auth/login', payload);
  return data.data;
};

export const fetchMe = async () => {
  const { data } = await client.get('/auth/me');
  return data.data.user;
};

export const logout = async () => {
  try {
    await client.post('/auth/logout');
  } catch {
    /* ignore — client-side token clearing is the source of truth */
  }
};

export const forgotPassword = async (email) => {
  const { data } = await client.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async ({ token, newPassword }) => {
  const { data } = await client.post('/auth/reset-password', { token, newPassword });
  return data;
};
