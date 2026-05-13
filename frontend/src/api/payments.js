import client from './client';

export const createBookingOrder = async (bookingId) => {
  const { data } = await client.post('/payments/booking-order', { bookingId });
  return data.data;
};

export const verifyPayment = async (payload) => {
  const { data } = await client.post('/payments/verify', payload);
  return data.data;
};

export const createPromotion = async (plan) => {
  const { data } = await client.post('/payments/promotion', { plan });
  return data.data;
};
