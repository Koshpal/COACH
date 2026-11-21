/* =========================================================================
   Mock data for the Coach Portal. Mirrors the Figma copy 1:1 so the UI can be
   verified pixel-for-pixel without a backend. Swap these for real API calls by
   restoring the axios bodies in src/services/*.
   ========================================================================= */

export interface MockCoach {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface MockSession {
  id: string;
  clientId?: string;
  clientName: string;
  clientRole: string;
  clientAvatar: string;
  month: string; // "DEC"
  day: string; // "15"
  weekday: string; // "Thursday"
  timeRange: string; // "10:00 AM-01:00 PM"
  status: "ready" | "upcoming" | "past" | "cancelled";
  rating?: number | null; // null => "Rate now"
  group: "today" | "next-week" | string; // or a year for past
  meetingLink?: string;
  /** raw ISO start — used for date-range filtering (Day/Week/Month) */
  startTime?: string;
  /** a confirmed session whose time has passed and that was never closed out */
  needsCloseOut?: boolean;
  /** false = the employee is not on this coach's list; undefined = unknown */
  isAssigned?: boolean;
}

export interface MockClient {
  id: string;
  name: string;
  role: string;
  org: string;
  avatar: string;
  rating: number;
  topics: string[];
  sessionsAttended: number;
  lastSession: string;
}

const AV_1 =
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Parth&backgroundColor=b6e3f4";
const AV_2 =
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Pranav&backgroundColor=c0aede";
const AV_3 =
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Priya&backgroundColor=ffdfbf";

export const coach: MockCoach = {
  id: "coach-1",
  name: "Parth Jain",
  role: "Employee",
  avatar: AV_1,
};

export const mockUser = {
  id: "coach-1",
  email: "parth.jain@koshpal.com",
  name: "Parth Jain",
  role: "COACH" as const,
  avatar: AV_1,
};

/* ---- Dashboard summary (per period) ---- */
export interface SummaryStat {
  key: string;
  label: string;
  value: string;
  delta: string;
  deltaKind: "up" | "flat" | "down";
  tone: "green" | "indigo" | "teal" | "amber";
  icon: "check" | "rating" | "attended" | "clock";
}

export const summaryByPeriod: Record<string, SummaryStat[]> = {
  Monthly: [
    { key: "today", label: "Session Today", value: "10", delta: "15% more than last month", deltaKind: "up", tone: "green", icon: "check" },
    { key: "rating", label: "AVG. RATING", value: "60,000", delta: "Similar to last month", deltaKind: "flat", tone: "indigo", icon: "rating" },
    { key: "taken", label: "SESSIONS TAKEN", value: "20,000", delta: "2% increase from last month", deltaKind: "up", tone: "teal", icon: "clock" },
  ],
  Weekly: [
    { key: "today", label: "Session Today", value: "3", delta: "1 more than last week", deltaKind: "up", tone: "green", icon: "check" },
    { key: "rating", label: "AVG. RATING", value: "14,200", delta: "Similar to last week", deltaKind: "flat", tone: "indigo", icon: "rating" },
    { key: "taken", label: "SESSIONS TAKEN", value: "4,800", delta: "5% increase from last week", deltaKind: "up", tone: "teal", icon: "clock" },
  ],
};

/* ---- Client-scoped summary (View details screen) ---- */
export const clientSummary: SummaryStat[] = [
  { key: "total", label: "Total Sessions", value: "3", delta: "15% more than last month", deltaKind: "up", tone: "green", icon: "check" },
  { key: "rating", label: "Avg Rating", value: "4.6", delta: "12 remaining", deltaKind: "flat", tone: "indigo", icon: "rating" },
  { key: "attended", label: "SESSIONS ATTENDED", value: "1", delta: "of 35", deltaKind: "flat", tone: "amber", icon: "attended" },
  { key: "savings", label: "SAVINGS", value: "40,000", delta: "2% increase from last month", deltaKind: "up", tone: "teal", icon: "clock" },
];

/* ---- Sessions ---- */
export const todaySessions: MockSession[] = [
  { id: "s1", clientName: "Pranav Wadhwa", clientRole: "Product Manager", clientAvatar: AV_2, month: "DEC", day: "15", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "ready", group: "today", meetingLink: "https://meet.example.com/abc" },
  { id: "s2", clientName: "Pranav Wadhwa", clientRole: "Product Manager", clientAvatar: AV_2, month: "DEC", day: "15", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "upcoming", group: "today" },
];

export const scheduleSessions: MockSession[] = [
  { id: "sc1", clientName: "Parth Jain", clientRole: "Product Manager", clientAvatar: AV_1, month: "DEC", day: "25", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "upcoming", group: "week" },
  { id: "sc2", clientName: "Parth Jain", clientRole: "Product Manager", clientAvatar: AV_1, month: "DEC", day: "25", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "upcoming", group: "week" },
  { id: "sc3", clientName: "Parth Jain", clientRole: "Product Manager", clientAvatar: AV_1, month: "DEC", day: "30", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "upcoming", group: "week" },
];

export const upcomingAppointments: MockSession[] = [
  { id: "u1", clientName: "Parth Jain", clientRole: "Product Manager", clientAvatar: AV_1, month: "DEC", day: "15", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "upcoming", group: "week" },
  { id: "u2", clientName: "Parth Jain", clientRole: "Product Manager", clientAvatar: AV_1, month: "DEC", day: "15", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "upcoming", group: "week" },
  { id: "u3", clientName: "Parth Jain", clientRole: "Product Manager", clientAvatar: AV_1, month: "DEC", day: "15", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "upcoming", group: "week" },
];

export const sessionsUpcoming: MockSession[] = [
  { id: "up1", clientName: "Pranav Wadhwa", clientRole: "Product Manager", clientAvatar: AV_2, month: "DEC", day: "15", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "ready", group: "today", meetingLink: "https://meet.example.com/abc" },
  { id: "up2", clientName: "Pranav Wadhwa", clientRole: "Product Manager", clientAvatar: AV_2, month: "DEC", day: "15", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "upcoming", group: "today" },
  { id: "up3", clientName: "Pranav Wadhwa", clientRole: "Data Analyst", clientAvatar: AV_2, month: "DEC", day: "27", weekday: "Saturday", timeRange: "09:00 AM-12:00 PM", status: "upcoming", group: "next-week" },
  { id: "up4", clientName: "Pranav Wadhwa", clientRole: "Data Analyst", clientAvatar: AV_2, month: "DEC", day: "27", weekday: "Saturday", timeRange: "09:00 AM-12:00 PM", status: "upcoming", group: "next-week" },
  { id: "up5", clientName: "Pranav Wadhwa", clientRole: "Data Analyst", clientAvatar: AV_2, month: "DEC", day: "27", weekday: "Saturday", timeRange: "09:00 AM-12:00 PM", status: "upcoming", group: "next-week" },
  { id: "up6", clientName: "Pranav Wadhwa", clientRole: "Product Manager", clientAvatar: AV_2, month: "DEC", day: "25", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "upcoming", group: "next-week" },
];

export const sessionsPast: MockSession[] = [
  { id: "p1", clientName: "Pranav Wadhwa", clientRole: "Product Manager", clientAvatar: AV_2, month: "DEC", day: "15", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "past", rating: 4.2, group: "2026" },
  { id: "p2", clientName: "Pranav Wadhwa", clientRole: "Product Manager", clientAvatar: AV_2, month: "DEC", day: "15", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "past", rating: 4.6, group: "2026" },
  { id: "p3", clientName: "Pranav Wadhwa", clientRole: "Product Manager", clientAvatar: AV_2, month: "DEC", day: "15", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "past", rating: null, group: "2026" },
  { id: "p4", clientName: "Pranav Wadhwa", clientRole: "Product Manager", clientAvatar: AV_2, month: "DEC", day: "15", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "past", rating: null, group: "2025" },
  { id: "p5", clientName: "Pranav Wadhwa", clientRole: "Product Manager", clientAvatar: AV_2, month: "DEC", day: "15", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "past", rating: 5, group: "2025" },
  { id: "p6", clientName: "Pranav Wadhwa", clientRole: "Product Manager", clientAvatar: AV_2, month: "DEC", day: "15", weekday: "Thursday", timeRange: "10:00 AM-01:00 PM", status: "past", rating: 4.4, group: "2025" },
];

export const sessionsCancelled: MockSession[] = [
  { id: "c1", clientName: "Pranav Wadhwa", clientRole: "Product Manager", clientAvatar: AV_2, month: "DEC", day: "18", weekday: "Monday", timeRange: "10:00 AM-01:00 PM", status: "cancelled", group: "2026" },
  { id: "c2", clientName: "Pranav Wadhwa", clientRole: "Data Analyst", clientAvatar: AV_2, month: "DEC", day: "02", weekday: "Tuesday", timeRange: "09:00 AM-12:00 PM", status: "cancelled", group: "2026" },
];

/* ---- Session detail (modals) ---- */
export const sessionDetail = {
  clientId: "1",
  meetingLink: "",
  clientName: "Parth Jain",
  credential: "Marketing Manager | Salesforce",
  clientAvatar: AV_1,
  dateLabel: "DEC 15",
  weekday: "Tuesday",
  timeRange: "10:00 AM-01:00 PM",
  longDate: "December 15",
  topics: ["Retirement planning", "Finance management"],
  summary:
    "Crafting a video that captures attention instantly, keeps people watching, and better inspires them to share.",
  privateNotes:
    "Crafting a video that captures attention instantly, keeps people watching, and better inspires them to share.",
  feedback: {
    rating: 5,
    quote:
      "Excellent session! Really helped me understand my leadership blind spots. The practical frameworks were immediately actionable.",
  },
  timer: "0:03",
};

/* ---- Clients ---- */
const CLIENT_TOPICS = ["Investment Planning", "Salary Management", "Salary Growth"];

export const clients: MockClient[] = Array.from({ length: 9 }).map((_, i) => ({
  id: String(i + 1),
  name: "Pranav Wadhwa",
  role: "Marketing Manager",
  org: "Salesforce",
  avatar: [AV_2, AV_3, AV_1][i % 3],
  rating: 8,
  topics: CLIENT_TOPICS,
  sessionsAttended: 8,
  lastSession: "2 May 26",
}));

export const clientProfile = {
  id: "1",
  name: "Pranav Wadhwa",
  role: "Marketing Manager",
  org: "Salesforce",
  avatar: AV_3,
  rating: 8,
  topics: ["Investment Planning", "Retirement", "Investments"],
  sessionsAttended: 8,
  lastSession: "2 May 26",
  stats: [
    { key: "total", label: "TOTAL SESSIONS", value: "12", sub: "12 completed", tone: "amber" as const },
    { key: "engagement", label: "ENGAGEMENT", value: "Active", sub: "Last session: Oct 20", tone: "indigo" as const },
    { key: "upcoming", label: "UPCOMING SESSIONS", value: "12 May", sub: "10:20 AM", tone: "teal" as const },
  ],
};

/* Progress bar chart — 3 series across 12 months (values 0-100) */
export const progressChart = {
  series: [
    { key: "Home", color: "#12E4FF" },
    { key: "Car", color: "#2B4394" },
    { key: "Watch", color: "#FF9800" },
  ],
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Nov"],
  data: [
    [30, 42, 66], [22, 35, 58], [46, 58, 30], [100, 40, 8], [38, 12, 62],
    [12, 20, 66], [24, 96, 12], [40, 30, 20], [88, 52, 60], [16, 26, 58],
    [90, 58, 20], [96, 62, 40],
  ],
  tooltip: { at: 2, progress: 58, goal: 12 },
};

/* ---- Availability month calendar ---- */
export interface CalDay {
  day: number | null;
  holiday?: boolean;
  slots?: string[];
  selected?: boolean;
}

const STD_SLOTS = ["4:00-8:00 pm", "4:00-8:00 pm", "4:00-8:00 pm"];
export const availabilityMonth = {
  label: "November 2022",
  weekdays: ["SUN", "MON", "TUE", "WED", "THUR", "FRI", "SAT"],
  days: [
    { day: 1, slots: STD_SLOTS }, { day: 2, slots: STD_SLOTS }, { day: 3, slots: STD_SLOTS },
    { day: 4, slots: STD_SLOTS }, { day: 5, slots: STD_SLOTS }, { day: 6, slots: STD_SLOTS }, { day: 7, slots: STD_SLOTS },
    { day: 8, slots: STD_SLOTS }, { day: 9, holiday: true }, { day: 10, selected: true, slots: ["12:00-4:00 pm", "8:00-12:00 pm", "4:00-8:00 pm"] },
    { day: 11, slots: STD_SLOTS }, { day: 12, slots: STD_SLOTS }, { day: 13, slots: STD_SLOTS }, { day: 14, slots: STD_SLOTS },
    { day: 15, slots: STD_SLOTS }, { day: 16, slots: STD_SLOTS }, { day: 17, slots: STD_SLOTS }, { day: 18, slots: STD_SLOTS },
    { day: 19, holiday: true }, { day: 20, slots: STD_SLOTS }, { day: 21, slots: STD_SLOTS },
    { day: 22, slots: STD_SLOTS }, { day: 23, slots: STD_SLOTS }, { day: 24, slots: STD_SLOTS }, { day: 25, slots: STD_SLOTS },
    { day: 26, slots: STD_SLOTS }, { day: 27, slots: STD_SLOTS }, { day: 29, slots: STD_SLOTS },
  ] as CalDay[],
};

/* ---- Availability editor ---- */
export interface EditorSlot { start: string; end: string; }
export interface EditorDay { day: string; enabled: boolean; slots: EditorSlot[]; }

export const weeklyAvailability: EditorDay[] = [
  { day: "Monday", enabled: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
  { day: "Tuesday", enabled: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
  { day: "Wednesday", enabled: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
  { day: "Thursday", enabled: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
  { day: "Friday", enabled: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
  { day: "Saturday", enabled: true, slots: [] },
  { day: "Sunday", enabled: false, slots: [] },
];

export const quickPresets = [
  { label: "Morning (8-12)", start: "08:00", end: "12:00" },
  { label: "Afternoon (1-5)", start: "13:00", end: "17:00" },
  { label: "Evening (5-9)", start: "17:00", end: "21:00" },
  { label: "Full Day (9-5)", start: "09:00", end: "17:00" },
];

export const timeOptions = Array.from({ length: 24 }).map((_, h) =>
  `${String(h).padStart(2, "0")}:00`,
);
