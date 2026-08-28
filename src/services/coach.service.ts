import api from './api';
import { CoachProfile, Session, DashboardSummary } from '../types/coach.types';

export const coachService = {
  getProfile: async (): Promise<CoachProfile> => {
    const response = await api.get('/coach/profile');
    return response.data;
  },

  updateProfile: async (formData: FormData): Promise<CoachProfile> => {
    // Let axios derive multipart/form-data + boundary from the FormData body.
    const response = await api.patch('/coach/profile', formData, {
      headers: { 'Content-Type': undefined },
    });
    return response.data;
  },

  getSessions: async (params?: { startDate?: string; endDate?: string }): Promise<{
    bookedToday: Session[];
    upcoming: Session[];
    todayLive: Session[];
    history: Session[];
  }> => {
    const response = await api.get('/coach/sessions', { params });
    return response.data;
  },

  getDashboardStats: async (): Promise<DashboardSummary> => {
    const response = await api.get('/coach/dashboard');
    return response.data;
  },

  updateSessionStatus: async (sessionId: string, status: string) => {
    if (status === 'COMPLETED') {
      const response = await api.patch(`/coach/consultations/${sessionId}/complete`);
      return response.data;
    }

    if (status === 'CANCELLED') {
      const response = await api.patch(`/coach/consultations/${sessionId}/cancel`, {});
      return response.data;
    }

    throw new Error(`Unsupported session status update: ${status}`);
  },

  updateSessionNotes: async (sessionId: string, notes: string, visibility: 'PRIVATE' | 'SHARED' = 'PRIVATE') => {
    const response = await api.post(`/sessions/${sessionId}/coach-notes`, {
      notes,
      visibility,
    });
    return response.data;
  },

  getCoachNote: async (sessionId: string): Promise<any> => {
    const response = await api.get(`/sessions/${sessionId}/coach-notes`);
    return response.data;
  },

  getSessionFeedback: async (sessionId: string): Promise<any> => {
    const response = await api.get(`/sessions/${sessionId}/employee-feedback`);
    return response.data;
  },

  saveWeeklyAvailability: async (payload: {
    slotDurationMinutes: number;
    weeksToGenerate: number;
    weeklySchedule: Record<string, { start: string; end: string }[]>;
  }): Promise<any> => {
    const response = await api.post('/coach/slots', payload);
    return response.data;
  },

  getWeeklySchedule: async (weeks = 1): Promise<any> => {
    const response = await api.get('/coach/slots/weekly', { params: { weeks } });
    return response.data;
  },
};
