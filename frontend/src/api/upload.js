import client from './client';

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post('/uploads/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};
