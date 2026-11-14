import React from 'react';
import { cn } from '../../lib/cn';

export const Card: React.FC<{ title?: React.ReactNode; action?: React.ReactNode; className?: string; children: React.ReactNode }> = ({ title, action, className, children }) => (
  <section className={cn('rounded-[16px] bg-[var(--color-bg-card)] p-5 shadow-[var(--shadow-drop-low)]', className)}>
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-3">
        {title && <h2 className="font-jakarta text-[16px] font-semibold text-[var(--color-text-primary)]">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </section>
);

const tones = {
  neutral: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
  info: 'bg-[var(--color-info-bg)] text-[var(--color-primary)]',
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success-darkest)]',
  warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-darkest)]',
  danger: 'bg-[var(--color-error-bg)] text-[var(--color-error-dark)]',
} as const;

export const Pill: React.FC<{ tone?: keyof typeof tones; children: React.ReactNode }> = ({ tone = 'neutral', children }) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 font-outfit text-[12px] font-medium', tones[tone])}>{children}</span>
);

export const statusTone = (s: string): keyof typeof tones =>
  s === 'COMPLETED' ? 'success' : s === 'IN_PROGRESS' ? 'info' : s === 'CANCELLED' || s === 'NO_SHOW' ? 'danger' : 'neutral';

export const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="rounded-[12px] bg-[var(--color-bg-secondary)] px-4 py-6 text-center font-outfit text-[14px] text-[var(--color-text-tertiary)]">{children}</p>
);

export const Pager: React.FC<{ page: number; pageSize: number; total: number; onPage: (p: number) => void }> = ({ page, pageSize, total, onPage }) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const btn = 'rounded-[8px] border border-[var(--color-border-primary)] px-3 py-1.5 font-outfit text-[13px] disabled:opacity-40 hover:border-[var(--color-primary)]';
  return (
    <div className="mt-4 flex items-center justify-end gap-3">
      <span className="font-outfit text-[13px] text-[var(--color-text-tertiary)]">Page {page} of {pages}</span>
      <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <button className={btn} disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
};

export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
export const fmtDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—');
export const fmtDateTime = (iso: string) => `${fmtDate(iso)}, ${fmtTime(iso)}`;
export const inr = (n: number | null | undefined) => (n == null ? '—' : `₹${Math.round(n).toLocaleString('en-IN')}`);
export const label = (s: string) => s.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export const SectionSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-[12px] bg-[var(--color-bg-tertiary)]" />)}
  </div>
);

export const SectionError: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div role="alert" className="flex items-center justify-between gap-3 rounded-[12px] bg-[var(--color-error-bg)] px-4 py-3 font-outfit text-[14px] text-[var(--color-error-dark)]">
    <span>{message}</span>
    {onRetry && <button onClick={onRetry} className="font-semibold underline">Retry</button>}
  </div>
);
