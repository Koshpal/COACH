import { CalendarEvent, Session } from '../../types/coach.types';

export type CalendarView = 'week' | 'month';

export interface CalendarRange {
  startDate: Date;
  endDate: Date;
}

export interface CalendarDay {
  date: Date;
  key: string;
  isToday: boolean;
  isCurrentMonth?: boolean;
}

export interface DayLaneEvent extends CalendarEvent {
  lane: number;
  top: number;
  height: number;
}

const TIME_BLOCK_MINUTES = 60;
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;

export const startOfWeek = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const startOfMonth = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const endOfMonth = (date: Date) => {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const getCalendarRange = (date: Date, view: CalendarView): CalendarRange => {
  if (view === 'month') {
    return {
      startDate: startOfMonth(date),
      endDate: endOfMonth(date),
    };
  }

  const startDate = startOfWeek(date);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

export const getCalendarDays = (date: Date, view: CalendarView): CalendarDay[] => {
  if (view === 'month') {
    const range = getCalendarRange(date, view);
    const days: CalendarDay[] = [];
    const cursor = new Date(range.startDate);

    while (cursor <= range.endDate) {
      days.push({
        date: new Date(cursor),
        key: cursor.toISOString().slice(0, 10),
        isToday: cursor.toDateString() === new Date().toDateString(),
        isCurrentMonth: cursor.getMonth() === date.getMonth(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }

  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return {
      date: day,
      key: day.toISOString().slice(0, 10),
      isToday: day.toDateString() === new Date().toDateString(),
    };
  });
};

const parseDate = (value?: string | Date) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const normalizeSessionsToEvents = (response: any): CalendarEvent[] => {
  const rawSessions = [
    ...(response?.bookedToday || []),
    ...(response?.upcoming || []),
    ...(response?.todayLive || []),
    ...(response?.history || []),
  ];

  return rawSessions
    .map((session: Session & { employee?: any; booking?: any; notes?: string; coachNotes?: string; isLive?: boolean }) => {
      const start = parseDate(session.startTime);
      const end = parseDate(session.endTime);
      if (!start || !end) return null;

      const employee = session.employee || session.booking?.employee;
      const title = session.clientName || employee?.fullName || 'Unknown Client';

      return {
        id: session.id,
        title,
        company: employee?.company || session.booking?.employee?.company || 'Koshpal',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: session.status === 'LIVE' || session.isLive ? 'LIVE' : session.status,
        meetingLink: session.meetingLink || session.booking?.meetingLink,
        notes: session.notes || session.coachNotes,
        sessionType: session.meetingLink || session.booking?.meetingLink ? 'Virtual' : 'In-person',
        clientId: session.clientId || employee?.id || session.booking?.employee?.id || '',
      } as CalendarEvent;
    })
    .filter(Boolean) as CalendarEvent[];
};

export const filterEventsByRange = (events: CalendarEvent[], range: CalendarRange) => {
  return events.filter((event) => {
    const start = new Date(event.startTime);
    return start >= range.startDate && start <= range.endDate;
  });
};

export const buildDayLaneEvents = (events: CalendarEvent[], day: Date) => {
  const sameDay = events
    .filter((event) => new Date(event.startTime).toDateString() === day.toDateString())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const assigned: DayLaneEvent[] = [];
  const laneEnds: Date[] = [];

  sameDay.forEach((event) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    let laneIndex = laneEnds.findIndex((laneEnd) => laneEnd <= eventStart);

    if (laneIndex === -1) {
      laneIndex = laneEnds.length;
      laneEnds.push(eventEnd);
    } else {
      laneEnds[laneIndex] = eventEnd;
    }

    const minutesFromStart = (eventStart.getHours() - DAY_START_HOUR) * 60 + eventStart.getMinutes();
    const durationMinutes = Math.max((eventEnd.getTime() - eventStart.getTime()) / 60000, TIME_BLOCK_MINUTES / 2);

    assigned.push({
      ...event,
      lane: laneIndex,
      top: Math.max(minutesFromStart, 0),
      height: durationMinutes,
    });
  });

  return assigned;
};

export const formatCalendarTime = (value: string) => {
  const parsed = new Date(value);
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getMonthGridDays = (date: Date) => {
  const firstOfMonth = startOfMonth(date);
  const startPadding = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(firstOfMonth);
  startDate.setDate(firstOfMonth.getDate() - startPadding);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + index);
    return {
      date: day,
      key: day.toISOString().slice(0, 10),
      isToday: day.toDateString() === new Date().toDateString(),
      isCurrentMonth: day.getMonth() === date.getMonth(),
    };
  });
};

export const getEventStatusLabel = (event: CalendarEvent) => {
  const now = new Date();
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  if (event.status === 'CANCELLED') return 'Cancelled';
  if (event.status === 'COMPLETED') return 'Completed';
  if (now >= start && now <= end) return 'Live';
  return 'Upcoming';
};

export const getDayColumns = () => {
  return Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, index) => {
    const hour = DAY_START_HOUR + index;
    return {
      hour,
      label: new Date(2000, 0, 1, hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  });
};
