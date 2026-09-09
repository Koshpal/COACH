import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { SegmentedControl } from "./SegmentedControl";
import { SessionCard } from "./SessionCard";
import type { MockSession } from "../../mock/data";

interface SessionTimelineProps {
  title?: string;
  sessions: MockSession[];
  onViewDetails?: (s: MockSession) => void;
  onJoin?: (s: MockSession) => void;
  maxRows?: number;
}

type View = "Day view" | "Week view" | "month";

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** [rangeStart, rangeEnd) for a view, offset by `step` units from today. */
function rangeFor(view: View, step: number): [Date, Date, string] {
  const today = startOfDay(new Date());
  if (view === "Day view") {
    const s = new Date(today);
    s.setDate(s.getDate() + step);
    const e = new Date(s);
    e.setDate(e.getDate() + 1);
    return [s, e, format(s, "EEEE, MMMM d")];
  }
  if (view === "month") {
    const s = new Date(today.getFullYear(), today.getMonth() + step, 1);
    const e = new Date(today.getFullYear(), today.getMonth() + step + 1, 1);
    return [s, e, format(s, "MMMM yyyy")];
  }
  // Week — Monday..Sunday containing today, shifted by `step` weeks
  const s = new Date(today);
  const day = (s.getDay() + 6) % 7; // 0 = Monday
  s.setDate(s.getDate() - day + step * 7);
  const e = new Date(s);
  e.setDate(e.getDate() + 7);
  return [s, e, `${format(s, "MMMM dd")} – ${format(new Date(e.getTime() - 1), "dd")}`];
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({
  title = "Your Schedule",
  sessions,
  onViewDetails,
  onJoin,
  maxRows = 4,
}) => {
  const [view, setView] = useState<View>("Week view");
  const [step, setStep] = useState(0);

  const [rStart, rEnd, label] = useMemo(() => rangeFor(view, step), [view, step]);

  const inRange = useMemo(
    () =>
      sessions.filter((s) => {
        if (!s.startTime) return step === 0; // no timestamp → only show on "current"
        const t = new Date(s.startTime).getTime();
        return t >= rStart.getTime() && t < rEnd.getTime();
      }),
    [sessions, rStart, rEnd, step],
  );
  const shown = inRange.slice(0, maxRows);

  return (
    <section className="rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-6 shadow-[var(--shadow-drop-low)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-jakarta text-[20px] font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        <span className="rounded-md bg-[var(--color-primary-lightest)] px-3 py-1 font-jakarta text-[13px] font-medium text-[var(--color-primary)]">
          {inRange.length} {inRange.length === 1 ? "session" : "sessions"}
        </span>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          options={["Day view", "Week view", "month"]}
          value={view}
          onChange={(v) => {
            setView(v as View);
            setStep(0);
          }}
        />
        <div className="flex items-center gap-3 font-outfit text-[14px] text-[var(--color-text-secondary)]">
          <button
            onClick={() => setStep((s) => s - 1)}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[130px] text-center">{label}</span>
          <button
            onClick={() => setStep((s) => s + 1)}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {shown.length ? (
          shown.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              onViewDetails={onViewDetails}
              onJoin={onJoin}
            />
          ))
        ) : (
          <p className="rounded-md border border-dashed border-[var(--color-border-primary)] p-8 text-center font-outfit text-[14px] text-[var(--color-text-tertiary)]">
            No sessions in this {view === "month" ? "month" : view === "Day view" ? "day" : "week"}.
          </p>
        )}
      </div>
    </section>
  );
};
