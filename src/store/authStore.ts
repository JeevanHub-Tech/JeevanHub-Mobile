// src/store/authStore.ts
import { create } from 'zustand';
import { authApi } from '../api/auth';
import { User, UserRole } from '../types/auth';
import { storage } from '../utils/storage';

interface AuthState {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  isBootstrapping: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  setAuth: (token: string, user: User) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  role: null,
  isLoading: false,
  isBootstrapping: true,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email: string, password: string, role: UserRole) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(email, password, role);
      await storage.setItem('token', data.token);
      await storage.setItem('role', role);

      set({
        token: data.token,
        user: data.user,
        role: role,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Login failed. Please check your credentials.',
      });
      throw err;
    }
  },

  setAuth: async (token: string, user: User) => {
    await storage.setItem('token', token);
    await storage.setItem('role', user.role);

    set({
      token,
      user,
      role: user.role,
      isLoading: false,
      error: null,
    });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      await storage.removeItem('token');
      await storage.removeItem('role');
      set({
        token: null,
        user: null,
        role: null,
        error: null,
      });
    }
  },

  bootstrap: async () => {
    try {
      const token = await storage.getItem('token');
      if (token) {
        const user = await authApi.getCurrentUser();
        set({
          token,
          user,
          role: user.role,
          isBootstrapping: false,
        });
        return;
      }
    } catch (e) {
      // Token expired or invalid
      await storage.removeItem('token');
      await storage.removeItem('role');
    }
    set({
      token: null,
      user: null,
      role: null,
      isBootstrapping: false,
    });
  },
}));
