import React from 'react';
import { cn } from '../../lib/cn';

const base = 'w-full rounded-[10px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-3 py-2 font-outfit text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]';

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="font-outfit text-[13px] font-medium text-[var(--color-text-secondary)]">{label}</span>
    {children}
    {hint && <span className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">{hint}</span>}
  </label>
);
export const TextInput = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn(base, p.className)} />;
export const TextArea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={4} {...p} className={cn(base, 'resize-y', p.className)} />;
export const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cn(base, p.className)} />;

export const sevTone = (s: string) => (s === 'URGENT' ? 'danger' : s === 'HIGH' ? 'warning' : s === 'MEDIUM' ? 'info' : 'neutral') as 'danger' | 'warning' | 'info' | 'neutral';
export const statusPill = (s: string) => (['RESOLVED', 'CLOSED', 'COMPLETED', 'REVIEWED', 'CONFIRMED', 'ADDRESSED', 'CERTIFIED'].includes(s) ? 'success' : ['ACTION_REQUIRED', 'OPEN', 'EXPIRED', 'DECLINED'].includes(s) ? 'warning' : ['SUBMITTED', 'SHARED', 'IN_PROGRESS', 'UNDER_REVIEW', 'ASSIGNED'].includes(s) ? 'info' : 'neutral') as 'success' | 'warning' | 'info' | 'neutral';
