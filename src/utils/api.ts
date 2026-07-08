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

// Intercept unauthorized requests: fully log out, then redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl: string = error.config?.url || '';

      // Do NOT intercept 401s from the login endpoint itself or /auth/me —
      // those are expected "wrong credentials" or "not yet authenticated"
      // responses and should propagate to the calling code normally.
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/me') ||
        requestUrl.includes('/auth/refresh');

      if (!isAuthEndpoint) {
        // Delegate to the auth store's logout so the SAME teardown runs as a
        // manual logout: clears cognitive_token/user/profile, resets the
        // persisted `cognitive-auth` (isAuthenticated/permissions), wipes the
        // persisted HR store, and clears the React Query cache. Leaving
        // `cognitive-auth` alive here previously kept isAuthenticated:true and
        // stale permissions after a 401.
        // Dynamic import avoids a circular dependency (useAuthStore imports api).
        void import('../store/useAuthStore')
          .then(({ useAuthStore }) => useAuthStore.getState().logout())
          .catch(() => {
            // Fallback: at minimum drop the raw token keys.
            localStorage.removeItem('cognitive_token');
            localStorage.removeItem('cognitive_user');
            localStorage.removeItem('cognitive_profile');
          })
          .finally(() => {
            // Redirect to login page if not already there
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          });
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
