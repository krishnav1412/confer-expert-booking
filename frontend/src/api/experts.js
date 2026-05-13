import client from './client';

export const fetchExperts = async ({
  page = 1,
  limit = 9,
  search = '',
  category = 'All',
  featured,
  minRating,
  minExp,
  maxPrice,
  sort,
} = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  if (category && category !== 'All') params.category = category;
  if (featured) params.featured = 'true';
  if (minRating) params.minRating = minRating;
  if (minExp) params.minExp = minExp;
  if (maxPrice) params.maxPrice = maxPrice;
  if (sort) params.sort = sort;
  const { data } = await client.get('/experts', { params });
  return data;
};

export const fetchFeaturedExperts = async (limit = 4) => {
  const { data } = await client.get('/experts/featured', { params: { limit } });
  return data.data;
};

export const fetchCategories = async () => {
  const { data } = await client.get('/experts/categories');
  return data.data;
};

export const fetchExpertById = async (id) => {
  const { data } = await client.get(`/experts/${id}`);
  return data.data;
};

// ---- Authenticated expert self-management ----

export const fetchMyExpertProfile = async () => {
  const { data } = await client.get('/experts/me');
  return data.data;
};

export const updateMyExpertProfile = async (payload) => {
  const { data } = await client.patch('/experts/me', payload);
  return data.data;
};

export const updateMyAvailability = async (payload) => {
  const { data } = await client.patch('/experts/me/availability', payload);
  return data.data;
};

export const fetchMyAnalytics = async () => {
  const { data } = await client.get('/experts/me/analytics');
  return data.data;
};
