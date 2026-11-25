import api from './api';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type EscCategory = 'FINANCIAL_DISTRESS' | 'WELLBEING_CONCERN' | 'LEGAL_ISSUE' | 'FRAUD_OR_SCAM' | 'SAFETY_CONCERN' | 'CONDUCT_OR_COMPLAINT' | 'OTHER';
export const ESC_CATEGORIES: EscCategory[] = ['FINANCIAL_DISTRESS', 'WELLBEING_CONCERN', 'LEGAL_ISSUE', 'FRAUD_OR_SCAM', 'SAFETY_CONCERN', 'CONDUCT_OR_COMPLAINT', 'OTHER'];

export interface EscalationRow { id: string; category: EscCategory; severity: Severity; status: string; employeeId: string; employeeName: string | null; sessionId: string | null; createdAt: string; updatedAt: string }
export interface EscalationEvent { id: string; type: string; fromStatus: string | null; toStatus: string | null; comment: string | null; actorRole: string; createdAt: string }
export interface EscalationDetail extends Omit<EscalationRow, 'employeeName'> { summary: string; resolutionNote: string | null; assigned: boolean; events: EscalationEvent[] }
export interface Contact { id: string; category: EscCategory | null; name: string; organisation: string | null; phone: string | null; email: string | null; hours: string | null; notes: string | null; verifiedAt: string; isStale: boolean }

export interface PlaybookItem { id: string; slug: string; category: string; title: string; summary: string | null; tags: string[]; version: number; publishedAt: string | null }
export interface PlaybookArticle extends PlaybookItem { body: string }

export interface ToolEntry { tool: string; needsConfig: boolean; configured: boolean }
export interface ToolResult { id: string; employeeId: string; sessionId: string | null; tool: string; inputs: any; outputs: any; status: 'DRAFT' | 'SHARED' | 'CONFIRMED'; version: number; configRef: string | null; updatedAt: string; confirmedAt: string | null }

export interface WorksheetField { key: string; label: string; type: 'text' | 'number' | 'longtext' | 'choice' | 'scale'; required?: boolean; help?: string; options?: string[] }
export interface Worksheet { id: string; key: string; title: string; description: string | null; category: string; estimatedMinutes: number | null; fields: WorksheetField[] }
export interface Homework { id: string; employeeId: string; templateId: string; status: 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED'; dueDate: string | null; instructions: string | null; answers: Record<string, string | number>; submittedAt: string | null; reviewNote: string | null; template: { title: string; category?: string; fields: WorksheetField[] } }

export interface Correction { id: string; sessionId: string; fieldKey: string | null; reason: string; status: 'OPEN' | 'ADDRESSED' | 'DECLINED'; response: string | null; createdAt: string }
export interface LearningModule { id: string; key: string; title: string; kind: string; description: string | null; content: string | null; isRequired: boolean; requiredCount: number; isPlaceholderContent: boolean; assessments: { id: string; title: string; passScore: number }[]; status: string; completedCount: number }
export interface LearningPath { certification: { status: string; certifiedAt: string | null; expiresAt: string | null; readyForApproval: boolean }; modules: LearningModule[] }

const K = '/coach';
export const opsService = {
  // escalations
  raise: (body: { employeeId: string; sessionId?: string; category: EscCategory; severity?: Severity; summary: string }) => api.post(`${K}/escalations`, body).then((r) => r.data),
  escalations: () => api.get<EscalationRow[]>(`${K}/escalations`).then((r) => r.data),
  escalation: (id: string) => api.get<EscalationDetail>(`${K}/escalations/${id}`).then((r) => r.data),
  escalationComment: (id: string, comment: string) => api.post(`${K}/escalations/${id}/comments`, { comment }).then((r) => r.data),
  contacts: (category?: EscCategory) => api.get<Contact[]>(`${K}/escalation-contacts`, { params: { category } }).then((r) => r.data),
  // playbook
  searchPlaybook: (p: { search?: string; category?: string; tag?: string; page?: number; pageSize?: number }) => api.get<{ total: number; items: PlaybookItem[] }>(`${K}/playbook/articles`, { params: { pageSize: 20, ...p } }).then((r) => r.data),
  /** The Koshpal Coaching Playbook PDF. Fetched through the API so the coach's session is checked; never a public URL. */
  handbookPdf: () => api.get<Blob>(`${K}/playbook/handbook`, { responseType: 'blob', timeout: 60_000 }).then((r) => r.data),
  article: (slug: string) => api.get<PlaybookArticle>(`${K}/playbook/articles/${slug}`).then((r) => r.data),
  // tools
  tools: () => api.get<ToolEntry[]>(`${K}/tools`).then((r) => r.data),
  calculate: (body: { tool: string; inputs: any }) => api.post<{ tool: string; inputs: any; outputs: any; configRef: string | null }>(`${K}/tools/calculate`, body).then((r) => r.data),
  createResult: (body: { employeeId: string; sessionId?: string; tool: string; inputs: any }) => api.post<ToolResult>(`${K}/tools/results`, body).then((r) => r.data),
  results: (employeeId: string) => api.get<ToolResult[]>(`${K}/tools/results`, { params: { employeeId } }).then((r) => r.data),
  updateResult: (id: string, inputs: any) => api.put<ToolResult>(`${K}/tools/results/${id}`, { inputs }).then((r) => r.data),
  shareResult: (id: string) => api.post<ToolResult>(`${K}/tools/results/${id}/share`).then((r) => r.data),
  // homework
  worksheets: () => api.get<Worksheet[]>(`${K}/homework/templates`).then((r) => r.data),
  assignHomework: (body: { employeeId: string; templateId: string; dueDate?: string; instructions?: string }) => api.post(`${K}/homework`, body).then((r) => r.data),
  homework: (employeeId?: string) => api.get<Homework[]>(`${K}/homework`, { params: { employeeId } }).then((r) => r.data),
  reviewHomework: (id: string, note?: string) => api.post(`${K}/homework/${id}/review`, { note }).then((r) => r.data),
  // quality
  corrections: () => api.get<Correction[]>(`${K}/quality/corrections`).then((r) => r.data),
  respondCorrection: (id: string, action: 'ADDRESS' | 'DECLINE', text: string) => api.post(`${K}/quality/corrections/${id}/respond`, { action, text }).then((r) => r.data),
  // learning
  learning: () => api.get<LearningPath>(`${K}/learning`).then((r) => r.data),
  completeReading: (id: string) => api.post(`${K}/learning/modules/${id}/complete`).then((r) => r.data),
  attempt: (assessmentId: string, answers: Record<string, number>) => api.post<{ scorePercent: number; passed: boolean; passScore: number }>(`${K}/learning/assessments/${assessmentId}/attempt`, { answers }).then((r) => r.data),
};

export function opsError(err: any): string {
  const d = err?.response?.data;
  if (!err?.response) return 'Cannot reach the server. Check your connection and try again.';
  const m = Array.isArray(d?.message) ? d.message.join(', ') : d?.message;
  return m ?? 'Something went wrong';
}
