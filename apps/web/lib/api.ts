import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import type { Room, RoomMember, RoomRole } from '@/types/room';

// API base URL - can be configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Cookie names
const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing the token
let isRefreshing = false;

// Queue of requests waiting for token refresh
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

// Process the queue after token refresh
const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - add access token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is not 401 or we've already retried, reject
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // If this is a refresh token request, reject
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // If already retrying, add to queue
    if (originalRequest._retry) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    // Mark as retrying
    originalRequest._retry = true;

    // If not currently refreshing, start the refresh process
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        // Try to refresh the token
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true}
        );

        const { accessToken } = response.data;

        // Store the new access token
        Cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
          expires: 1 / 24, // 1 hour
          sameSite: 'lax',
        });

        // Process the queue with the new token
        processQueue(null, accessToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and reject all queued requests
        processQueue(refreshError as AxiosError, null);
        Cookies.remove(ACCESS_TOKEN_COOKIE);
        Cookies.remove(REFRESH_TOKEN_COOKIE);

        // Redirect to login or dispatch logout event
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Add to queue if already refreshing
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }
);

// Rooms API
export const roomsApi = {
  list: async (): Promise<Room[]> => {
    const response = await api.get<Room[]>('/api/rooms');
    return response.data;
  },

  get: async (id: string): Promise<Room> => {
    const response = await api.get<Room>(`/api/rooms/${id}`);
    return response.data;
  },

  create: async (data: { name: string; description?: string }): Promise<Room> => {
    const response = await api.post<Room>('/api/rooms', data);
    return response.data;
  },

  update: async (
    id: string,
    data: { name?: string; description?: string; isActive?: boolean },
  ): Promise<Room> => {
    const response = await api.patch<Room>(`/api/rooms/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<Room> => {
    const response = await api.delete<Room>(`/api/rooms/${id}`);
    return response.data;
  },

  addMember: async (roomId: string, userId: string, role: RoomRole): Promise<RoomMember> => {
    const response = await api.post<RoomMember>(`/api/rooms/${roomId}/members`, { userId, role });
    return response.data;
  },
};

// Auth API
export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: { email: string; username: string; password: string }) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  /**
   * Login user
   */
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    Cookies.remove(ACCESS_TOKEN_COOKIE);
    Cookies.remove(REFRESH_TOKEN_COOKIE);
    return response.data;
  },

  /**
   * Get current user profile
   */
  me: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  /**
   * Refresh access token
   */
  refresh: async () => {
    const response = await api.post('/api/auth/refresh');
    return response.data;
  },
};

// Helper functions for token management
export const tokenUtils = {
  /**
   * Set access and refresh tokens in cookies
   */
  setTokens: (accessToken: string) => {
    Cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
      expires: 1 / 24, // 1 hour
      sameSite: 'lax',
    });
  },

  /**
   * Get access token from cookie
   */
  getAccessToken: () => {
    return Cookies.get(ACCESS_TOKEN_COOKIE);
  },

  /**
   * Remove all tokens
   */
  clearTokens: () => {
    Cookies.remove(ACCESS_TOKEN_COOKIE);
    Cookies.remove(REFRESH_TOKEN_COOKIE);
  },
};

export default api;