'use client';

import { create } from 'zustand';
import { authApi, tokenUtils } from '@/lib/api';
import type { AuthResponse, LoginCredentials, RegisterData, User } from '@/types/auth';

interface AuthStoreState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  accessToken: tokenUtils.getAccessToken() ?? null,
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response: AuthResponse = await authApi.login(credentials);
      tokenUtils.setAccessToken(response.accessToken);
      set({ user: response.user, accessToken: response.accessToken, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const response: AuthResponse = await authApi.register(data);
      tokenUtils.setAccessToken(response.accessToken);
      set({ user: response.user, accessToken: response.accessToken, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors; clear local auth state anyway
    } finally {
      tokenUtils.clearAccessToken();
      set({ user: null, accessToken: null, isLoading: false });
    }
  },

  refreshUser: async () => {
    set({ isLoading: true });
    try {
      const meResponse = await authApi.me();
      set({ user: meResponse.user });
    } catch {
      try {
        const refreshResponse = await authApi.refresh();
        tokenUtils.setAccessToken(refreshResponse.accessToken);
        const meResponse = await authApi.me();
        set({ user: meResponse.user });
      } catch {
        tokenUtils.clearAccessToken();
        set({ user: null, accessToken: null });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
