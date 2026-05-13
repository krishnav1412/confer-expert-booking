import client from './client';

export const createBooking = async (payload) => {
  const { data } = await client.post('/bookings', payload);
  return data.data;
};

export const fetchMyBookings = async () => {
  const { data } = await client.get('/bookings/me');
  return data.data;
};

export const fetchExpertBookings = async () => {
  const { data } = await client.get('/bookings/expert/me');
  return data.data;
};

export const updateBookingStatus = async (id, status) => {
  const { data } = await client.patch(`/bookings/${id}/status`, { status });
  return data.data;
};
