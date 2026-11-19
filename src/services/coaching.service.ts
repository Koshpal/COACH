import api from './api';

/* ───────────────────────── types (mirror the backend payloads) ───────────────────────── */

export type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Paged<T> { total: number; page: number; pageSize: number; items: T[] }

export interface TodaySession {
  bookingId: string; sessionId: string | null; employeeId: string; employeeName: string; profileLink: string;
  sessionNumber: number | null; scheduledStart: string; scheduledEnd: string; status: SessionStatus;
  previousNotesAvailable: boolean; pendingActionItems: number; nextSessionAt: string | null; meetingLink: string;
}
export interface DashboardTask {
  type: 'SESSION_NOT_CLOSED' | 'SESSION_NOT_HELD' | 'OVERDUE_ACTION_ITEM' | 'HOMEWORK_DUE' | 'HOMEWORK_TO_REVIEW' | 'NEXT_SESSION_NOT_BOOKED' | 'ESCALATION_UPDATE';
  title: string; subtitle: string; employeeId: string; link: string; dueAt: string | null;
  /** A booking that was never opened: the portal creates its session when the task is clicked. */
  bookingId?: string;
}
export interface ProgressRow {
  employeeId: string; employeeName: string; program: string | null; currentSession: number | null;
  sessionsCompleted: number; totalSessions: number | null; programStatus: string;
  nextActivity: { type: string; at: string } | null; pendingTasks: number;
}
export type Metric<T = number | null> = { available: true; percent?: T; averageRating?: number | null; count?: number; basis?: string } | { available: false; reason: string };
export interface Performance {
  sessionsCompleted: { total: number; thisMonth: number };
  notesCompletionRate: { available: boolean; percent: number | null; basis: string };
  followUpCompletionRate: { available: boolean; percent: number | null; basis: string };
  averageQualityScore: { available: boolean; average?: number | null; count?: number; reason?: string };
  employeeFeedback: { available: boolean; averageRating: number | null; count: number };
  openEscalations: { available: boolean; count?: number; reason?: string };
}
export interface EmployeeRow { id: string; name: string; department: string | null; company: string | null; photo: string | null }

export interface TemplateStep {
  key: string; title: string; minutes: number; instructions: string;
  questions: string[]; discussionPoints: string[]; recommendedTools: string[];
}
export interface ChecklistItem { key: string; label: string; required: boolean }
export interface TemplateSnapshot {
  title: string; objective: string; durationMinutes: number; steps: TemplateStep[]; expectedOutcomes: string[];
  closingChecklist: ChecklistItem[]; requiredNoteFields: string[]; version: number; isPlaceholderContent: boolean;
}
export const NOTE_FIELDS = [
  'sessionObjective', 'employeeConcerns', 'keyDiscussion', 'financialObservations', 'toolsUsed', 'decisionsMade',
  'employeeCommitments', 'coachRecommendations', 'escalationStatus', 'nextSessionObjective', 'coachPrivateNotes',
] as const;
export type NoteField = (typeof NOTE_FIELDS)[number];
export type NoteFields = Record<NoteField, string>;

export interface ActionItem {
  id: string; kind: 'ACTION' | 'HOMEWORK'; title: string; description: string | null;
  ownerType: 'EMPLOYEE' | 'COACH'; ownerUserId: string; dueDate: string | null; status: string;
}
export interface RunnerState {
  serverNow: string;
  session: {
    id: string; bookingId: string; status: SessionStatus; sessionNumber: number; scheduledStart: string; scheduledEnd: string;
    startedAt: string | null; completedAt: string | null; currentStepIndex: number; version: number;
    escalationAnswer: 'NONE_NEEDED' | 'RAISED' | null; homeworkDecision: 'ASSIGNED' | 'NOT_REQUIRED' | null;
    homeworkNotRequiredReason: string | null; actionPlanException: string | null; nextSessionException: string | null;
    checklistAnswers: Record<string, boolean>;
  };
  employee: { id: string; name: string; department: string | null; company: string | null };
  consent: { active: boolean; textVersion: number | null };
  template: TemplateSnapshot;
  stepProgress: { stepIndex: number; stepKey: string; startedAt: string; completedAt: string | null }[];
  note: { version: number; finalizedAt: string | null; fields: NoteFields } | null;
  actionItems: ActionItem[];
}
export interface ClosureRequirement { code: string; message: string; ref?: string }
export interface ClosureCheck { canComplete: boolean; outstanding: ClosureRequirement[] }

/** Extracts the backend's structured error ({ message, code, outstanding, server… }). */
export interface ApiErrorInfo {
  status: number | null; code?: string; message: string; offline: boolean;
  outstanding?: ClosureRequirement[]; server?: { version: number; fields: NoteFields }; conflictingFields?: string[];
}
export function parseApiError(e: unknown): ApiErrorInfo {
  const err = e as { response?: { status: number; data?: any }; message?: string };
  if (!err?.response) return { status: null, message: 'No connection to the server', offline: true };
  const d = err.response.data ?? {};
  const message = Array.isArray(d.message) ? d.message.join(', ') : d.message ?? 'Something went wrong';
  return { status: err.response.status, code: d.code, message, offline: false, outstanding: d.outstanding, server: d.server, conflictingFields: d.conflictingFields };
}

/* ───────────────────────── API ───────────────────────── */

const B = '/coach/coaching';
const page = (p?: { page?: number; pageSize?: number; search?: string }) => ({ params: p });

export const coachingService = {
  today: () => api.get<{ items: TodaySession[] }>(`${B}/dashboard/today`).then((r) => r.data),
  tasks: (p?: { page?: number; pageSize?: number }) => api.get<Paged<DashboardTask>>(`${B}/dashboard/tasks`, page(p)).then((r) => r.data),
  progress: (p?: { page?: number; pageSize?: number }) => api.get<Paged<ProgressRow>>(`${B}/dashboard/progress`, page(p)).then((r) => r.data),
  performance: () => api.get<Performance>(`${B}/dashboard/performance`).then((r) => r.data),
  employees: (p?: { page?: number; pageSize?: number; search?: string }) => api.get<Paged<EmployeeRow>>(`${B}/employees`, page(p)).then((r) => r.data),
  profileTab: <T = any>(employeeId: string, tab: string, p?: { page?: number; pageSize?: number }) =>
    api.get<T>(`${B}/employees/${employeeId}/profile/${tab}`, page(p)).then((r) => r.data),

  createSession: (bookingId: string) => api.post<{ id: string }>(`${B}/sessions`, { bookingId }).then((r) => r.data),
  state: (id: string) => api.get<RunnerState>(`${B}/sessions/${id}`).then((r) => r.data),
  prepare: (id: string) => api.get<any>(`${B}/sessions/${id}/prepare`).then((r) => r.data),
  start: (id: string) => api.post<RunnerState>(`${B}/sessions/${id}/start`).then((r) => r.data),
  noShow: (id: string, reason?: string) => api.post(`${B}/sessions/${id}/no-show`, { reason }).then((r) => r.data),
  abandon: (id: string, reason: string) => api.post(`${B}/sessions/${id}/abandon`, { reason }).then((r) => r.data),
  goToStep: (id: string, stepIndex: number) => api.put(`${B}/sessions/${id}/step`, { stepIndex }).then((r) => r.data),

  getNotes: (id: string) => api.get<{ version: number; fields: NoteFields; finalizedAt: string | null }>(`${B}/sessions/${id}/notes`).then((r) => r.data),
  saveNotes: (id: string, baseVersion: number, changes: Partial<NoteFields>) =>
    api.put<{ version: number; fields: NoteFields }>(`${B}/sessions/${id}/notes`, { baseVersion, changes }).then((r) => r.data),

  addItem: (id: string, body: { kind: string; title: string; description?: string; ownerType: string; dueDate: string }) =>
    api.post<ActionItem>(`${B}/sessions/${id}/action-items`, body).then((r) => r.data),
  removeItem: (itemId: string) => api.delete(`${B}/action-items/${itemId}`).then((r) => r.data),
  setItemStatus: (itemId: string, status: string, note?: string) => api.patch(`${B}/action-items/${itemId}/status`, { status, note }).then((r) => r.data),
  recordDebt: (id: string, body: Record<string, unknown>) => api.post(`${B}/sessions/${id}/debts`, body).then((r) => r.data),

  updateClosure: (id: string, body: Record<string, unknown>) => api.patch<ClosureCheck>(`${B}/sessions/${id}/closure`, body).then((r) => r.data),
  closureCheck: (id: string) => api.get<ClosureCheck>(`${B}/sessions/${id}/closure-check`).then((r) => r.data),
  complete: (id: string) => api.post(`${B}/sessions/${id}/complete`).then((r) => r.data),
};
