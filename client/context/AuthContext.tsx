import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isPremium: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends Omit<AuthState, 'refreshToken'> {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [accessToken, refreshToken, userData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
      ]);

      if (accessToken && refreshToken && userData) {
        const user = JSON.parse(userData);
        setAuthState({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error loading stored auth data:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const storeAuthData = async (user: User, accessToken: string, refreshToken: string) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
      ]);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  };

  const clearAuthData = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authState.accessToken && { Authorization: `Bearer ${authState.accessToken}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const { data } = response;
      const { user, accessToken, refreshToken } = data;

      await storeAuthData(user, accessToken, refreshToken);

      setAuthState({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      const { data } = response;
      const { user, accessToken, refreshToken } = data;

      await storeAuthData(user, accessToken, refreshToken);

      setAuthState({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (authState.accessToken) {
        await apiCall('/api/auth/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await clearAuthData();
      setAuthState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const refreshAccessToken = async () => {
    try {
      if (!authState.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiCall('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: authState.refreshToken }),
      });

      const { data } = response;
      const { user, accessToken, refreshToken } = data;

      await storeAuthData(user, accessToken, refreshToken);

      setAuthState(prev => ({
        ...prev,
        user,
        accessToken,
        refreshToken,
      }));
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, logout the user
      await logout();
      throw error;
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      // In a real implementation, you would call the update profile API
      // For now, we'll just update the local state
      if (authState.user) {
        const updatedUser = { ...authState.user, ...userData };
        
        await storeAuthData(
          updatedUser,
          authState.accessToken!,
          authState.refreshToken!
        );

        setAuthState(prev => ({
          ...prev,
          user: updatedUser,
        }));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshToken: refreshAccessToken,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
