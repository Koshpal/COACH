import api from './api';
import { User } from '../types/coach.types';

export const authService = {
  login: async (email: string, password: string): Promise<{ user: User }> => {
    const response = await api.post('/auth/login', {
      email,
      password,
      role: 'COACH',
    });

    // Hydrate from /auth/me so `user` has one consistent shape (name, phone,
    // isActive) rather than the leaner login-response shape.
    let user = response.data.user;
    try {
      const me = await api.get('/auth/me');
      if (me.data) user = me.data;
    } catch {
      /* fall back to the login response */
    }
    if (user) localStorage.setItem('user', JSON.stringify(user));
    return { ...response.data, user };
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('user');
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
    await api.post('/auth/forgot-password', { email, portal: 'COACH' });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post(`/auth/reset-password/${token}`, { newPassword });
  },
};
