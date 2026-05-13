import client from './client';

export const fetchNotifications = async ({ limit = 20, unreadOnly = false } = {}) => {
  const params = { limit };
  if (unreadOnly) params.unread = 'true';
  const { data } = await client.get('/notifications', { params });
  return data.data;
};

export const markNotificationRead = async (id) => {
  const { data } = await client.post(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await client.post('/notifications/read-all');
  return data;
};
