import client from './client';

export const submitApplication = async (payload) => {
  const { data } = await client.post('/applications', payload);
  return data.data;
};

export const fetchMyApplications = async () => {
  const { data } = await client.get('/applications/me');
  return data.data;
};
