import axios from 'axios';

// Create a configured Axios instance pointing to the FastAPI backend
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-inject JWT access token into the request headers if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cognitive_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept unauthorized requests and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('cognitive_token');
      localStorage.removeItem('cognitive_user');
      // Redirect to login page if window is defined
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const parseError = (err: any): string => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => {
      const field = d.loc && d.loc.length > 1 ? d.loc.slice(1).join('.') : (d.loc ? d.loc.join('.') : '');
      return `${field ? field + ': ' : ''}${d.msg}`;
    }).join(', ');
  }
  if (detail && typeof detail === 'object') {
    return JSON.stringify(detail);
  }
  return err?.message || 'An error occurred';
};

export default api;
