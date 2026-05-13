import client from './client';

export const fetchReviews = async (expertId, sort = 'recent') => {
  const { data } = await client.get('/reviews', { params: { expertId, sort } });
  return data.data;
};

export const submitReview = async (payload) => {
  const { data } = await client.post('/reviews', payload);
  return data.data;
};

export const replyToReview = async (id, text) => {
  const { data } = await client.post(`/reviews/${id}/reply`, { text });
  return data.data;
};
