import client from './client';

export const updateProfile = async (payload) => {
  const { data } = await client.patch('/users/me', payload);
  return data.data.user;
};

export const changePassword = async (payload) => {
  const { data } = await client.post('/users/me/change-password', payload);
  return data;
};

export const toggleFavorite = async (expertId) => {
  const { data } = await client.post(`/users/me/favorites/${expertId}`);
  return data.data.favorites;
};

export const listFavorites = async () => {
  const { data } = await client.get('/users/me/favorites');
  return data.data;
};

export const trackView = async (expertId) => {
  try {
    await client.post(`/users/me/recently-viewed/${expertId}`);
  } catch {
    /* non-blocking */
  }
};
