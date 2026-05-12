export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'COACH' | 'EMPLOYEE' | 'ADMIN';
  avatar?: string;
  timezone?: string;
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
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  phone?: string;
  organization?: string;
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
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'AVAILABLE' | 'BOOKED' | 'LIVE';
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
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'LIVE';
  meetingLink?: string;
  notes?: string;
  sessionType: 'Virtual' | 'In-person';
  clientId: string;
  lane?: number;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  date: string;
}

export interface WeeklyAvailability {
  day: string;
  slots: {
    startTime: string;
    endTime: string;
  }[];
}

export interface PaymentStats {
  totalEarnings: number;
  pendingEarnings: number;
  completedSessions: number;
  avgRating: number;
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

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  clientName: string;
}
