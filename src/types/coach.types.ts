export interface User {
  id: string;
  email: string;
  /** Single display name — matches what /auth/me returns. */
  name?: string;
  role: 'COACH' | 'EMPLOYEE' | 'ADMIN';
  phone?: string;
  isActive?: boolean;
  avatar?: string;
}

export interface CoachProfile extends User {
  bio?: string;
  specialization?: string[];
  experienceYears?: number;
  rating?: number;
  totalSessions?: number;
  profilePhoto?: string;
}

export interface Client {
  id: string;
  /** Single display name — clients come from session data as one `fullName` string. */
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  organization?: string;
  company?: string;
  totalSessions?: number;
  upcomingSession?: string;
  lastSession?: string;
}

export interface Session {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  startTime: string;
  endTime: string;
  /** Raw booking status. "Live now" is a separate flag. */
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  isLive?: boolean;
  meetingLink?: string;
  notes?: string;
  type: 'INDIVIDUAL' | 'GROUP';
}

export interface CalendarEvent {
  id: string;
  title: string;
  company?: string;
  startTime: string;
  endTime: string;
  // 'LIVE' is synthesized client-side from a session's isLive flag.
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'LIVE';
  meetingLink?: string;
  notes?: string;
  sessionType: 'Virtual' | 'In-person';
  clientId: string;
  lane?: number;
}

export interface DashboardSummary {
  totalSessions: number;
  activeClients: number;
  totalHours: number;
  avgRating: number;
  past: number;
  upcoming: number;
  thisMonth: number;
  todaySessions: Session[];
  upcomingSessions: Session[];
  generatedAt: string;
}
