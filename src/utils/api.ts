import axios from 'axios';

// ─── Resolve API base URL ──────────────────────────────────────────────────────
// Priority: VITE_API_URL env var (set in .env or .env.local) → localhost fallback
// For ngrok/remote access: set VITE_API_URL=https://your-backend.ngrok-free.app/api/v1
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

if (!import.meta.env.VITE_API_URL && import.meta.env.DEV) {
  console.warn(
    '[API] VITE_API_URL is not set. Falling back to http://127.0.0.1:8000/api/v1.\n' +
    'For ngrok/remote access, create a .env.local file with:\n' +
    '  VITE_API_URL=https://your-backend.ngrok-free.app/api/v1'
  );
}

// Create a configured Axios instance pointing to the FastAPI backend
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
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
