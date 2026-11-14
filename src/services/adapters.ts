/**
 * Adapters — transform BACKEND API payloads into the prop shapes the
 * (pixel-perfect, Figma-derived) presentational components already expect.
 * Keeping this seam means the components never had to change.
 */
import { format } from "date-fns";
import type {
  MockSession,
  MockClient,
  SummaryStat,
  EditorDay,
  CalDay,
} from "../mock/data";
import { sessionDetail } from "../mock/data";
import { utcToIST as toIst } from "../utils/timezone";
const istNow = () => toIst(new Date());

export type SessionDetailData = typeof sessionDetail;

/* ------------------------------------------------------------------ */
/* API shapes (loose)                                                  */
/* ------------------------------------------------------------------ */
export interface ApiEmployee {
  id: string;
  email?: string;
  fullName?: string;
  phone?: string;
  department?: string | null;
  company?: string;
}
export interface ApiSession {
  id: string;
  slotId?: string | null;
  date?: string;
  startTime: string;
  endTime: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
  meetingLink?: string;
  employee?: ApiEmployee | null;
  booking?: { employee?: ApiEmployee | null } | null;
  hasNote?: boolean;
  coachNotes?: string;
  hasFeedback?: boolean;
  rating?: number | null;
  isLive?: boolean;
  // dashboard-shaped sessions use these instead of `employee`
  clientId?: string;
  clientName?: string;
  clientDepartment?: string | null;
  clientAvatar?: string | null;
}
export interface ApiDashboard {
  totalSessions: number;
  activeClients: number;
  totalHours: number;
  avgRating: number;
  upcomingCount: number;
  pastCount: number;
  thisMonthCount: number;
  todaySessions: ApiSession[];
  upcomingSessions: ApiSession[];
  generatedAt: string;
}
export type ApiWeekly = Record<
  string,
  { id: string; start: string; end: string; status: string; date: string }[]
>;
export interface ApiSlot {
  id: string;
  coachId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED";
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
const clientOf = (s: ApiSession): ApiEmployee => ({
  id: s.employee?.id ?? s.booking?.employee?.id ?? s.clientId ?? s.id,
  fullName:
    s.employee?.fullName ??
    s.booking?.employee?.fullName ??
    s.clientName ??
    "Client",
  department:
    s.employee?.department ??
    s.booking?.employee?.department ??
    s.clientDepartment ??
    null,
  company: s.employee?.company ?? s.booking?.employee?.company,
});

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const DEFAULT_ROLE = "Employee";

/* ------------------------------------------------------------------ */
/* session card                                                        */
/* ------------------------------------------------------------------ */
export function toSessionCard(s: ApiSession, roleHint?: string): MockSession {
  const start = toIst(s.startTime);
  const end = toIst(s.endTime);
  const c = clientOf(s);

  let status: MockSession["status"] = "upcoming";
  if (s.status === "COMPLETED") status = "past";
  else if (s.status === "CANCELLED") status = "cancelled";
  else if (s.isLive) status = "ready";

  const today = istNow();
  let group: string;
  if (status === "past" || status === "cancelled") group = String(start.getFullYear());
  else if (isSameDay(start, today)) group = "today";
  else group = "next-week";

  return {
    id: s.id,
    clientId: c.id,
    clientName: c.fullName ?? "Client",
    clientRole: c.department ?? roleHint ?? DEFAULT_ROLE,
    clientAvatar: s.clientAvatar ?? "",
    month: format(start, "MMM").toUpperCase(),
    day: format(start, "dd"),
    weekday: format(start, "EEEE"),
    timeRange: `${format(start, "hh:mm a")}-${format(end, "hh:mm a")}`,
    status,
    rating: s.rating ?? null,
    group,
    meetingLink: s.meetingLink,
    startTime: s.startTime,
  };
}

export function toSessionDetail(
  s: ApiSession,
  opts: {
    note?: { notes?: string } | null;
    feedback?: { rating?: number; feedbackText?: string } | null;
    credential?: string;
  } = {},
): SessionDetailData {
  const start = toIst(s.startTime);
  const end = toIst(s.endTime);
  const c = clientOf(s);
  const topics = s.coachNotes
    ? []
    : (s as any).notes
      ? String((s as any).notes)
          .split(/[·,]/)
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [];

  const credential =
    opts.credential ?? [c.department, c.company].filter(Boolean).join(" | ");

  return {
    clientId: c.id,
    meetingLink: s.meetingLink ?? "",
    clientName: c.fullName ?? "Client",
    credential,
    clientAvatar: s.clientAvatar ?? "",
    dateLabel: format(start, "MMM dd").toUpperCase(),
    weekday: format(start, "EEEE"),
    timeRange: `${format(start, "hh:mm a")}-${format(end, "hh:mm a")}`,
    longDate: format(start, "MMMM d"),
    topics,
    // The backend stores ONE note per session — surface it once as the summary.
    summary: opts.note?.notes ?? "",
    privateNotes: "",
    feedback: {
      rating: opts.feedback?.rating ?? 0,
      quote: opts.feedback?.feedbackText ?? "",
    },
    timer: "0:03",
  };
}

/* ------------------------------------------------------------------ */
/* dashboard                                                           */
/* ------------------------------------------------------------------ */
export function toSummaryStats(d: ApiDashboard): SummaryStat[] {
  return [
    {
      key: "today",
      label: "Session Today",
      value: String(d.todaySessions?.length ?? 0),
      delta: `${d.upcomingCount ?? 0} upcoming this week`,
      deltaKind: "up",
      tone: "green",
      icon: "check",
    },
    {
      key: "rating",
      label: "AVG. RATING",
      value: d.avgRating ? Number(d.avgRating).toFixed(1) : "0.0",
      delta: "Across all sessions",
      deltaKind: "flat",
      tone: "indigo",
      icon: "rating",
    },
    {
      key: "taken",
      label: "SESSIONS TAKEN",
      value: String(d.totalSessions ?? 0),
      delta: `${d.thisMonthCount ?? 0} this month`,
      deltaKind: "up",
      tone: "teal",
      icon: "clock",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* sessions page grouping                                              */
/* ------------------------------------------------------------------ */
export interface GroupedSessions {
  today: MockSession[];
  nextWeek: MockSession[];
  pastByYear: Record<string, MockSession[]>;
  cancelled: MockSession[];
}

export function groupSessions(list: ApiSession[]): GroupedSessions {
  const out: GroupedSessions = {
    today: [],
    nextWeek: [],
    pastByYear: {},
    cancelled: [],
  };
  for (const s of list) {
    const card = toSessionCard(s);
    if (card.status === "cancelled") out.cancelled.push(card);
    else if (card.status === "past") {
      (out.pastByYear[card.group] ||= []).push(card);
    } else if (card.group === "today") out.today.push(card);
    else out.nextWeek.push(card);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* clients                                                             */
/* ------------------------------------------------------------------ */
export function toClients(list: ApiSession[], topics: string[]): MockClient[] {
  const byClient = new Map<string, { c: ApiEmployee; sessions: ApiSession[] }>();
  for (const s of list) {
    const c = clientOf(s);
    const entry = byClient.get(c.id) ?? { c, sessions: [] };
    entry.sessions.push(s);
    byClient.set(c.id, entry);
  }

  return Array.from(byClient.values()).map(({ c, sessions }, i) => {
    const completed = sessions.filter((s) => s.status === "COMPLETED");
    const ratings = completed
      .map((s) => s.rating)
      .filter((r): r is number => typeof r === "number");
    const last = sessions
      .map((s) => toIst(s.startTime))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return {
      id: c.id,
      name: c.fullName ?? "Client",
      role: c.department ?? DEFAULT_ROLE,
      org: c.company ?? "Koshpal",
      avatar: "",
      rating: ratings.length
        ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
        : completed.length || i + 1,
      topics: topics.length ? topics : ["Investment Planning", "Retirement", "Investments"],
      sessionsAttended: completed.length,
      lastSession: last ? format(last, "d MMM yy") : "—",
    };
  });
}

export function toClientProfile(
  list: ApiSession[],
  employeeId: string,
  topics: string[],
) {
  const mine = list.filter((s) => clientOf(s).id === employeeId);
  const c = mine.length ? clientOf(mine[0]) : { id: employeeId, fullName: "Client" };
  const completed = mine.filter((s) => s.status === "COMPLETED");
  const upcoming = mine
    .filter((s) => s.status === "CONFIRMED")
    .sort((a, b) => +toIst(a.startTime) - +toIst(b.startTime));
  const past = [...completed].sort(
    (a, b) => +toIst(b.startTime) - +toIst(a.startTime),
  );
  const ratings = completed
    .map((s) => s.rating)
    .filter((r): r is number => typeof r === "number");

  return {
    id: employeeId,
    name: c.fullName ?? "Client",
    role: (c as ApiEmployee).department ?? DEFAULT_ROLE,
    org: c.company ?? "Koshpal",
    avatar: "",
    rating: ratings.length
      ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
      : completed.length,
    topics: topics.length ? topics : ["Investment Planning", "Retirement", "Investments"],
    sessionsAttended: completed.length,
    lastSession: past[0] ? format(toIst(past[0].startTime), "d MMM yy") : "—",
    stats: [
      {
        key: "total",
        label: "TOTAL SESSIONS",
        value: String(mine.length),
        sub: `${completed.length} completed`,
        tone: "amber" as const,
      },
      {
        key: "engagement",
        label: "ENGAGEMENT",
        value: upcoming.length ? "Active" : "Idle",
        sub: past[0]
          ? `Last session: ${format(toIst(past[0].startTime), "MMM d")}`
          : "No sessions yet",
        tone: "indigo" as const,
      },
      {
        key: "upcoming",
        label: "UPCOMING SESSIONS",
        value: upcoming[0] ? format(toIst(upcoming[0].startTime), "d MMM") : "—",
        sub: upcoming[0] ? format(toIst(upcoming[0].startTime), "hh:mm a") : "",
        tone: "teal" as const,
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* availability editor                                                 */
/* ------------------------------------------------------------------ */
const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Merge contiguous 1-hour slots into working ranges. */
function mergeRanges(slots: { start: string; end: string }[]): { start: string; end: string }[] {
  const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));
  const out: { start: string; end: string }[] = [];
  for (const s of sorted) {
    const prev = out[out.length - 1];
    if (prev && prev.end === s.start) prev.end = s.end;
    else out.push({ ...s });
  }
  return out;
}

export function toEditorDays(weekly: ApiWeekly): EditorDay[] {
  return DAY_ORDER.map((day) => {
    const key = day.toUpperCase();
    const raw = (weekly[key] ?? []).filter(
      (s) => s.status === "AVAILABLE" || s.status === "BOOKED",
    );
    // dedupe identical start/end across the weeks the API returned; drop any
    // range longer than a single working block (e.g. a stray full-day slot).
    const seen = new Set<string>();
    const uniq: { start: string; end: string }[] = [];
    for (const s of raw) {
      const hours = Number(s.end.split(":")[0]) - Number(s.start.split(":")[0]);
      if (hours <= 0 || hours > 6) continue;
      const k = `${s.start}-${s.end}`;
      if (!seen.has(k)) {
        seen.add(k);
        uniq.push({ start: s.start, end: s.end });
      }
    }
    const merged = mergeRanges(uniq);
    return { day, enabled: merged.length > 0, slots: merged };
  });
}

/** editor state -> POST /coach/slots payload */
export function toWeeklySchedulePayload(days: EditorDay[]) {
  const weeklySchedule: Record<string, { start: string; end: string }[]> = {};
  for (const d of days) {
    if (d.enabled && d.slots.length) {
      weeklySchedule[d.day.toUpperCase()] = d.slots.map((s) => ({
        start: s.start,
        end: s.end,
      }));
    }
  }
  return { slotDurationMinutes: 60, weeksToGenerate: 5, weeklySchedule };
}

/* ------------------------------------------------------------------ */
/* availability month calendar                                         */
/* ------------------------------------------------------------------ */
const to12h = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h < 12 ? "am" : "pm";
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
};

export function toCalendarMonth(slots: ApiSlot[], monthAnchor = istNow()) {
  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 Sun

  // group slots by calendar day
  const byDay = new Map<number, { start: string; end: string; blocked: boolean }[]>();
  for (const s of slots) {
    const d = toIst(s.startTime);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    const arr = byDay.get(d.getDate()) ?? [];
    arr.push({
      start: format(d, "HH:mm"),
      end: format(toIst(s.endTime), "HH:mm"),
      blocked: s.status === "BLOCKED",
    });
    byDay.set(d.getDate(), arr);
  }

  const days: CalDay[] = [];
  for (let i = 0; i < firstWeekday; i++) days.push({ day: null });
  const todayNum =
    istNow().getFullYear() === year && istNow().getMonth() === month
      ? istNow().getDate()
      : -1;
  for (let d = 1; d <= daysInMonth; d++) {
    const raw = byDay.get(d) ?? [];
    const blocked = raw.length > 0 && raw.every((r) => r.blocked);
    const ranges = mergeRanges(
      raw.filter((r) => !r.blocked).map((r) => ({ start: r.start, end: r.end })),
    );
    days.push({
      day: d,
      holiday: blocked,
      selected: d === todayNum,
      slots: ranges.slice(0, 3).map((r) => `${to12h(r.start)}-${to12h(r.end)}`),
    });
  }

  return {
    label: format(new Date(year, month, 1), "MMMM yyyy"),
    weekdays: ["SUN", "MON", "TUE", "WED", "THUR", "FRI", "SAT"],
    days,
  };
}
