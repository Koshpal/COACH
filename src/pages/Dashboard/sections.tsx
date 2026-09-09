import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SummaryCards } from "../../components/ui/SummaryCards";
import { SessionCard } from "../../components/ui/SessionCard";
import { SessionTimeline } from "../../components/ui/SessionTimeline";
import { UpcomingAppointments } from "../../components/ui/UpcomingAppointments";
import {
  SummarySkeleton,
  SessionListSkeleton,
  ScheduleSkeleton,
  SectionError,
} from "../../components/common/Skeleton";
import { coachService } from "../../services/coach.service";
import { useAsync } from "../../hooks/useAsync";
import {
  toSummaryStats,
  toSessionCard,
  type ApiDashboard,
  type ApiSession,
} from "../../services/adapters";
import type { MockSession } from "../../mock/data";

/* ── Summary — its own API (/coach/dashboard) & its own loader ──────── */
export const DashboardSummary: React.FC = () => {
  const [period, setPeriod] = useState("Monthly");
  const { data, loading, error, reload } = useAsync(
    () => coachService.getDashboardStats() as unknown as Promise<ApiDashboard>,
    [],
  );

  if (loading) return <SummarySkeleton />;
  if (error || !data)
    return <SectionError message="Couldn't load your summary." onRetry={reload} />;

  return (
    <SummaryCards
      stats={toSummaryStats(data)}
      period={period}
      onPeriodChange={setPeriod}
    />
  );
};

/* ── Sessions block — its own API (/coach/sessions) & its own loader ── */
export const DashboardSessions: React.FC<{
  onOpenDetails: (raw: ApiSession) => void;
}> = ({ onOpenDetails }) => {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(
    () => coachService.getSessions(),
    [],
  );

  const view = useMemo(() => {
    if (!data) return null;
    const rawById = new Map<string, ApiSession>();
    const seen = new Set<string>();
    const collect = (rows: unknown[]) =>
      (rows as ApiSession[])
        .filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)))
        .map((s) => {
          rawById.set(s.id, s);
          return toSessionCard(s);
        });

    const today = collect([
      ...((data.bookedToday ?? []) as unknown[]),
      ...((data.todayLive ?? []) as unknown[]),
    ]);
    if (today[0] && today[0].status === "upcoming")
      today[0] = { ...today[0], status: "ready" };

    seen.clear();
    const upcoming = collect((data.upcoming ?? []) as unknown[]);

    return { today, upcoming, rawById };
  }, [data]);

  if (loading)
    return (
      <>
        <section>
          <h2 className="mb-4 font-jakarta text-[20px] font-semibold text-[var(--color-text-primary)]">
            Today&rsquo;s Session
          </h2>
          <SessionListSkeleton rows={2} />
        </section>
        <ScheduleSkeleton />
      </>
    );

  if (error || !view)
    return <SectionError message="Couldn't load your sessions." onRetry={reload} />;

  const open = (card: MockSession) => {
    const raw = view.rawById.get(card.id);
    if (raw) onOpenDetails(raw);
  };

  return (
    <>
      <section>
        <h2 className="mb-4 font-jakarta text-[20px] font-semibold text-[var(--color-text-primary)]">
          Today&rsquo;s Session
        </h2>
        <div className="space-y-4">
          {view.today.length ? (
            view.today.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onViewDetails={open}
                onJoin={() => s.meetingLink && window.open(s.meetingLink, "_blank")}
              />
            ))
          ) : (
            <p className="rounded-[12px] border border-dashed border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-8 text-center font-outfit text-[14px] text-[var(--color-text-tertiary)]">
              No sessions scheduled for today.
            </p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SessionTimeline
            sessions={view.upcoming}
            onViewDetails={open}
            onJoin={(s) => s.meetingLink && window.open(s.meetingLink, "_blank")}
          />
        </div>
        <UpcomingAppointments
          items={view.upcoming.slice(0, 3)}
          onViewMore={() => navigate("/sessions")}
          onSelect={open}
        />
      </div>
    </>
  );
};
