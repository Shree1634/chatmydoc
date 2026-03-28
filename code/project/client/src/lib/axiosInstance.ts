import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

// Confirm active backend URL in browser DevTools console
console.log(`🔗 [API] Backend: ${BACKEND_URL}`);

const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Request: attach Bearer token ─────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    // Read token directly from localStorage (avoids circular Zustand import)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response: log errors & handle 401 refresh ────────────
axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Log every API error so it's always visible in DevTools
    console.error('❌ [API] Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
    });

    // Auto-refresh on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BACKEND_URL}/api/auth/refresh`, { refreshToken });
          localStorage.setItem('token', data.token);
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
          return axiosInstance(originalRequest);
        } catch {
          // Refresh failed — purge auth and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('auth-store');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }

    // Always re-throw so callers can handle errors
    return Promise.reject(error);
  }
);

export default axiosInstance;
