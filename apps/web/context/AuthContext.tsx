'use client';

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { authApi, tokenUtils } from '@/lib/api';
import { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.me();
      setUser(response.user);
    } catch {
      try {
        const { accessToken } = await authApi.refresh();
        tokenUtils.setTokens(accessToken);
        const response = await authApi.me();
        setUser(response.user);
      } catch {
        setUser(null);
        tokenUtils.clearTokens();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    const response: AuthResponse = await authApi.login(credentials);
    tokenUtils.setTokens(response.accessToken);
    setUser(response.user);
  };

  // Register function
  const register = async (data: RegisterData) => {
    const response: AuthResponse = await authApi.register(data);
    tokenUtils.setTokens(response.accessToken);
    setUser(response.user);
  };

  // Logout function
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors, just clear tokens
    } finally {
      tokenUtils.clearTokens();
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}