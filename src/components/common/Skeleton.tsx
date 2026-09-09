import React from "react";

/** A single shimmering placeholder block. Size it with `className`. */
export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-[8px] bg-[var(--color-bg-tertiary)] ${className}`}
    aria-hidden="true"
  />
);

/** Small inline spinner for a widget body that has no meaningful skeleton shape. */
export const InlineLoader: React.FC<{ className?: string }> = ({
  className = "h-40",
}) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--color-primary)]" />
  </div>
);

/** Compact inline error for a single failed section (not the whole page). */
export const SectionError: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = "Couldn't load this section.",
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-8 text-center shadow-[var(--shadow-drop-low)]">
    <p className="font-heading text-[15px] font-semibold text-[var(--color-text-primary)]">
      {message}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="rounded-[8px] bg-[var(--color-primary)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--color-primary-darkest)]"
      >
        Try again
      </button>
    )}
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`rounded-[16px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-6 shadow-[var(--shadow-drop-low)] ${className}`}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* pre-shaped skeletons                                                */
/* ------------------------------------------------------------------ */

/** Dashboard "Summary" — title row + 3 tinted stat tiles. */
export const SummarySkeleton: React.FC = () => (
  <Card>
    <div className="mb-4 flex items-center justify-between">
      <Skeleton className="h-6 w-28" />
      <Skeleton className="h-8 w-24" />
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-[12px] bg-[var(--color-bg-tertiary)] p-5">
          <Skeleton className="mb-6 h-11 w-11 rounded-full bg-black/5" />
          <Skeleton className="mb-2 h-4 w-24 bg-black/5" />
          <Skeleton className="mb-3 h-8 w-20 bg-black/5" />
          <Skeleton className="h-3 w-32 bg-black/5" />
        </div>
      ))}
    </div>
  </Card>
);

/** A single session-row skeleton (date chip · name · time pill · action). */
export const SessionRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-5 rounded-[12px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-4 py-3.5">
    <Skeleton className="h-[62px] w-[62px]" />
    <div className="min-w-[150px] space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
    <Skeleton className="h-11 w-56" />
    <div className="ml-auto flex items-center gap-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-11 w-28" />
    </div>
  </div>
);

export const SessionListSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <SessionRowSkeleton key={i} />
    ))}
  </div>
);

/** Dashboard bottom row — "Your Schedule" panel + "Upcoming" panel. */
export const ScheduleSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <Card className="lg:col-span-2">
      <div className="mb-5 flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-24" />
      </div>
      <SessionListSkeleton rows={3} />
    </Card>
    <Card>
      <Skeleton className="mb-4 h-6 w-48" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-[12px] border border-[var(--color-border-primary)] p-3">
            <Skeleton className="h-[62px] w-[62px]" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

/** Client grid — N card skeletons. */
export const ClientGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i}>
        <div className="flex items-start gap-3">
          <Skeleton className="h-[52px] w-[52px] rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="mt-4 h-10 w-full" />
      </Card>
    ))}
  </div>
);

/** Client profile header — avatar + name + chips + 3 stat tiles. */
export const ClientHeaderSkeleton: React.FC = () => (
  <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
    <div className="max-w-md space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-[52px] w-[52px] rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-7 w-24" />
      </div>
      <Skeleton className="h-9 w-64" />
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-[110px] w-[168px]" />
      ))}
    </div>
  </div>
);

/** Full-height month grid placeholder. */
export const CalendarSkeleton: React.FC = () => (
  <Card className="!p-0 overflow-hidden">
    <div className="flex items-center justify-between p-6">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-10 w-40" />
    </div>
    <div className="grid grid-cols-7 border-t border-[var(--color-border-primary)]">
      {Array.from({ length: 7 * 5 }).map((_, i) => (
        <div
          key={i}
          className="min-h-[120px] border-b border-r border-[var(--color-border-primary)] p-3 [&:nth-child(7n)]:border-r-0"
        >
          <Skeleton className="h-6 w-6" />
        </div>
      ))}
    </div>
  </Card>
);

/** Simple stacked block skeleton for editor / notes panels. */
export const BlockSkeleton: React.FC<{ lines?: number; className?: string }> = ({
  lines = 4,
  className = "",
}) => (
  <Card className={className}>
    <div className="space-y-4">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  </Card>
);
