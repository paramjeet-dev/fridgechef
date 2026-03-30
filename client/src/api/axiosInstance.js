import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,   // Send/receive httpOnly cookies automatically
  timeout: 30000,
});

// ── Response interceptor — handle 401 with token refresh ─────
let isRefreshing = false;
let failedQueue = [];     // Queue requests that failed while refreshing

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── 401: Try to refresh the access token once ──────────
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/')  // Don't retry auth endpoints
    ) {
      if (isRefreshing) {
        // Another request is already refreshing — queue this one
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');    // Sets new accessToken cookie
        processQueue(null);
        return api(originalRequest);        // Retry the original request
      } catch (refreshError) {
        processQueue(refreshError);
        // Refresh failed — user must log in again
        // Dynamically import to avoid circular dependency
        const { useAuthStore } = await import('../store/useAuthStore');
        useAuthStore.getState().clearAuth();
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
