import client from './client';

export const createProgram = async (payload) => {
  const { data } = await client.post('/programs', payload);
  return data.data;
};

export const fetchMyPrograms = async () => {
  const { data } = await client.get('/programs/me');
  return data.data;
};

export const fetchProgramById = async (id) => {
  const { data } = await client.get(`/programs/${id}`);
  return data.data;
};

export const scheduleProgramSession = async (id, index, payload) => {
  const { data } = await client.post(`/programs/${id}/sessions/${index}/schedule`, payload);
  return data.data;
};

export const completeProgramSession = async (id, index) => {
  const { data } = await client.patch(`/programs/${id}/sessions/${index}/complete`);
  return data.data;
};
