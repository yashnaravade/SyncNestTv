import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import type { Room, RoomMember, RoomRole } from '@/types/room';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

function attachAccessToken(config: InternalAxiosRequestConfig) {
  const token = Cookies.get(ACCESS_TOKEN_COOKIE);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sessionApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => attachAccessToken(config),
  (error) => Promise.reject(error)
);
sessionApi.interceptors.request.use(
  (config) => attachAccessToken(config),
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const isPublicAuthRoute = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/login' || window.location.pathname === '/register';
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      originalRequest._retry = true;
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const { accessToken } = response.data;
      Cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
        expires: 1 / 24,
        sameSite: 'lax',
      });

      processQueue(null, accessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null);
      Cookies.remove(ACCESS_TOKEN_COOKIE);
      Cookies.remove(REFRESH_TOKEN_COOKIE);

      if (typeof window !== 'undefined' && !isPublicAuthRoute()) {
        window.location.href = '/login';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export const authApi = {
  register: async (data: { email: string; username: string; password: string }) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    Cookies.remove(ACCESS_TOKEN_COOKIE);
    Cookies.remove(REFRESH_TOKEN_COOKIE);
    return response.data;
  },

  me: async () => {
    const response = await sessionApi.get('/api/auth/me');
    return response.data;
  },

  refresh: async () => {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );
    return response.data;
  },
};

export const roomsApi = {
  list: async (): Promise<Room[]> => {
    const response = await api.get<Room[]>('/api/rooms');
    return response.data;
  },

  get: async (id: string): Promise<Room> => {
    const response = await api.get<Room>(`/api/rooms/${id}`);
    return response.data;
  },

  getByCode: async (code: string): Promise<Room> => {
    const response = await api.get<Room>(`/api/rooms/code/${code}`);
    return response.data;
  },

  joinRoom: async (
    inviteCode: string
  ): Promise<{ room: Room; member: RoomMember; message: string }> => {
    const response = await api.post<{ room: Room; member: RoomMember; message: string }>(
      '/api/invites/join',
      { inviteCode }
    );
    return response.data;
  },

  generateInvite: async (roomId: string): Promise<{ code: string }> => {
    const response = await api.post<{ code: string }>(`/api/invites/${roomId}`, {});
    return response.data;
  },

  create: async (data: { name: string; description?: string }): Promise<Room> => {
    const response = await api.post<Room>('/api/rooms', data);
    return response.data;
  },

  update: async (
    id: string,
    data: { name?: string; description?: string; isActive?: boolean }
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

export const tokenUtils = {
  setAccessToken: (accessToken: string) => {
    Cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
      expires: 1 / 24,
      sameSite: 'lax',
    });
  },
  setTokens: (accessToken: string) => {
    Cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
      expires: 1 / 24,
      sameSite: 'lax',
    });
  },
  getAccessToken: () => Cookies.get(ACCESS_TOKEN_COOKIE),
  clearAccessToken: () => Cookies.remove(ACCESS_TOKEN_COOKIE),
  clearTokens: () => {
    Cookies.remove(ACCESS_TOKEN_COOKIE);
    Cookies.remove(REFRESH_TOKEN_COOKIE);
  },
};

export default api;
