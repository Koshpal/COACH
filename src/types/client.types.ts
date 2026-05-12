export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  phone?: string;
  organization?: string;
  totalSessions?: number;
  upcomingSession?: string; // ISO date string
  lastSession?: string; // ISO date string
}

export type ClientStatus = 'active' | 'inactive';
