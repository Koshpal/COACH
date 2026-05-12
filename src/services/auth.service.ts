import api from './api';
import { User } from '../types/coach.types';

export const authService = {
  login: async (email: string, password: string): Promise<{ user: User; accessToken: string }> => {
    const response = await api.post('/auth/login', {
      email,
      password,
      role: 'COACH',
    });
    
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    if (response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);
    }
    
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.patch('/auth/me/password', {
      currentPassword,
      newPassword,
    });
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post(`/auth/reset-password/${token}`, { newPassword });
  },
};
