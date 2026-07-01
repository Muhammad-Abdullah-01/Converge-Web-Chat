import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and check current auth session
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/users/profile');
        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
        localStorage.removeItem('accessToken');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen to token expiration event from Axios interceptor
    const handleAuthExpired = () => {
      setUser(null);
      localStorage.removeItem('accessToken');
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { accessToken, user } = response.data;
        localStorage.setItem('accessToken', accessToken);
        setUser(user);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', { username, email, password });
      if (response.data.success) {
        const { accessToken, user } = response.data;
        localStorage.setItem('accessToken', accessToken);
        setUser(user);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Try a different username/email.',
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error on server:', error);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      if (response.data.success) {
        setUser(response.data.user);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed.',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
