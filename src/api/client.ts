// src/api/client.ts
import axios from 'axios';
import { BACKEND_URL, API_TIMEOUT } from '../config';
import { storage } from '../utils/storage';

export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if available
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format error messages & handle session expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If the server returns 401 (Invalid/expired token), evict stale credentials
    if (error.response?.status === 401) {
      try {
        const { useAuthStore } = await import('../store/authStore');
        const logout = useAuthStore.getState().logout;
        if (logout) {
          await logout();
        }
      } catch (logoutErr) {
        console.warn('Failed to auto-logout on 401:', logoutErr);
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);
