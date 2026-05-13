import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'confer:token';

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

const client = axios.create({ baseURL, timeout: 15000 });

client.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      // Clear stale token; AuthProvider will pick this up on next render
      setStoredToken(null);
      // Hard redirect only if we're not already on a public auth route
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const onAuthPage = path === '/login' || path === '/signup';
        if (!onAuthPage) {
          // Soft signal — emit event so AuthContext can react
          window.dispatchEvent(new CustomEvent('confer:unauthorized'));
        }
      }
    }

    const enriched = new Error(data?.message || error.message || 'Request failed');
    enriched.status = status;
    enriched.errors = data?.errors || [];
    enriched.original = error;
    return Promise.reject(enriched);
  }
);

export default client;
