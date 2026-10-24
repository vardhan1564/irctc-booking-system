import axios from 'axios';

/**
 * One axios instance for the whole app.
 * - In dev, baseURL is "/api" and Vite proxies it to Spring Boot (vite.config.js).
 * - In prod, set VITE_API_BASE_URL to the backend origin.
 * The request interceptor attaches the right JWT: admin token for /admin/* calls, user token otherwise.
 */
const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const USER_TOKEN_KEY = 'irctc_token';
export const USER_KEY = 'irctc_user';
export const ADMIN_TOKEN_KEY = 'irctc_admin_token';
export const ADMIN_KEY = 'irctc_admin';

const api = axios.create({ baseURL: `${base}/api`, timeout: 30000 });

api.interceptors.request.use((config) => {
  const isAdmin = config.url?.startsWith('/admin');
  const token = localStorage.getItem(isAdmin ? ADMIN_TOKEN_KEY : USER_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || '';
    const isLoginCall = url.includes('/auth/');
    // An expired/invalid token: log the right side out (user vs admin) and let the guards redirect.
    if (status === 401 && !isLoginCall) {
      window.dispatchEvent(new CustomEvent(url.startsWith('/admin') ? 'admin:expired' : 'auth:expired'));
    }
    return Promise.reject(err);
  }
);

/** Turns any axios error into a human-readable sentence from the backend's {"message": "..."} body. */
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (err?.request && !err.response) return 'Cannot reach the server. Is the backend running?';
  return fallback;
}

export default api;
