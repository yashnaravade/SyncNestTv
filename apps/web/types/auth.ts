/**
 * User type definition
 */
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Auth response from login/register
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Register data
 */
export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

/**
 * Auth state
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}