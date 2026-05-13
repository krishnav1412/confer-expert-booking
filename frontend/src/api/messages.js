import client from './client';

export const startConversation = async (payload) => {
  const { data } = await client.post('/messages/conversations', payload);
  return data.data;
};

export const listConversations = async (role = 'user') => {
  const { data } = await client.get('/messages/conversations', { params: { role } });
  return data.data;
};

export const getConversation = async (id) => {
  const { data } = await client.get(`/messages/conversations/${id}`);
  return data.data;
};

export const replyToConversation = async (id, text) => {
  const { data } = await client.post(`/messages/conversations/${id}/reply`, { text });
  return data.data;
};

export const markConversationRead = async (id) => {
  const { data } = await client.post(`/messages/conversations/${id}/read`);
  return data.data;
};
