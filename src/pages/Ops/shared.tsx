import React from 'react';
import { cn } from '../../lib/cn';

const base = 'w-full rounded-[10px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-3 py-2 font-outfit text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]';

/**
 * `group` renders a div instead of a label, for fields that hold several controls (chips, a card picker). Inside a <label>
 * every click on empty space is forwarded to the label's FIRST control and the controls get the label text as their name.
 */
export const Field: React.FC<{ label: string; hint?: string; group?: boolean; children: React.ReactNode }> = ({ label, hint, group, children }) => {
  const body = (
    <>
      <span className="font-outfit text-[13px] font-medium text-[var(--color-text-secondary)]">{label}</span>
      {children}
      {hint && <span className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">{hint}</span>}
    </>
  );
  return group ? <div role="group" aria-label={label} className="flex flex-col gap-1.5">{body}</div> : <label className="flex flex-col gap-1.5">{body}</label>;
};
export const TextInput = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn(base, p.className)} />;
export const TextArea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={4} {...p} className={cn(base, 'resize-y', p.className)} />;
export const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cn(base, p.className)} />;

export const sevTone = (s: string) => (s === 'URGENT' ? 'danger' : s === 'HIGH' ? 'warning' : s === 'MEDIUM' ? 'info' : 'neutral') as 'danger' | 'warning' | 'info' | 'neutral';
export const statusPill = (s: string) => (['RESOLVED', 'CLOSED', 'COMPLETED', 'REVIEWED', 'CONFIRMED', 'ADDRESSED', 'CERTIFIED'].includes(s) ? 'success' : ['ACTION_REQUIRED', 'OPEN', 'EXPIRED', 'DECLINED'].includes(s) ? 'warning' : ['SUBMITTED', 'SHARED', 'IN_PROGRESS', 'UNDER_REVIEW', 'ASSIGNED'].includes(s) ? 'info' : 'neutral') as 'success' | 'warning' | 'info' | 'neutral';
