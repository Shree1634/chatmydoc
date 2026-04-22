import axios from 'axios';
import useAuthStore from '../store/authStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

// Confirm active backend URL in browser DevTools console
console.log(`🔗 [API] Backend: ${BACKEND_URL}`);

const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Request: attach Bearer token from Zustand store ──────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response: hydration-aware 401 handler ────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh');

    if (status === 401 && !isAuthRoute) {
      const store = useAuthStore.getState();

      if (store._hasHydrated && store.token) {
        // Token exists but server rejected it — clear and redirect
        console.warn('[Auth] Token rejected by server, logging out');
        store.logout();
        window.location.href = '/login';
        return new Promise(() => {}); // Swallow error — prevent any toast
      } else if (store._hasHydrated && !store.token) {
        // No token at all — redirect silently
        window.location.href = '/login';
        return new Promise(() => {}); // Swallow error — prevent any toast
      }
      // Not hydrated yet — let ProtectedRoute handle it via its own check
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
