import api from './api';
import { 
  CoachProfile, 
  Session, 
  Client, 
  TimeSlot, 
  PaymentStats, 
  Invoice,
  DashboardSummary 
} from '../types/coach.types';

export const coachService = {
  getProfile: async (): Promise<CoachProfile> => {
    const response = await api.get('/coach/profile');
    return response.data;
  },

  updateProfile: async (formData: FormData): Promise<CoachProfile> => {
    const response = await api.patch('/coach/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
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

  getClients: async (): Promise<Client[]> => {
    const response = await api.get('/coach/clients');
    return response.data;
  },

  getConsultationStats: async (): Promise<any> => {
    const response = await api.get('/coach/consultations/stats');
    return response.data;
  },

  getSlots: async (date?: string): Promise<TimeSlot[]> => {
    const params = date ? { date } : {};
    const response = await api.get('/coach/slots', { params });
    return response.data;
  },

  createSlots: async (date: string, timeSlots: { startTime: string; endTime: string }[]): Promise<void> => {
    await api.post('/coach/slots', { date, timeSlots });
  },

  deleteSlot: async (slotId: string): Promise<void> => {
    await api.delete(`/coach/slots/${slotId}`);
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

  updateTimezone: async (timezone: string): Promise<any> => {
    const response = await api.patch('/coach/profile/timezone', { timezone });
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
