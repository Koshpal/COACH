import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/common/Header";
import { Spinner, ErrorState } from "../../components/common/PageState";
import { SummaryCards } from "../../components/ui/SummaryCards";
import { SessionCard } from "../../components/ui/SessionCard";
import { SessionTimeline } from "../../components/ui/SessionTimeline";
import { UpcomingAppointments } from "../../components/ui/UpcomingAppointments";
import { SessionDetailsModal } from "../../components/ui/SessionDetailsModal";
import { coachService } from "../../services/coach.service";
import { useAsync } from "../../hooks/useAsync";
import {
  toSummaryStats,
  toSessionCard,
  type ApiDashboard,
} from "../../services/adapters";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("Monthly");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data, loading, error, reload } = useAsync(
    () => coachService.getDashboardStats() as unknown as Promise<ApiDashboard>,
    [],
  );

  const view = useMemo(() => {
    if (!data) return null;
    const stats = toSummaryStats(data);
    const today = (data.todaySessions ?? []).map((s) => toSessionCard(s));
    if (today[0]?.status === "upcoming") today[0] = { ...today[0], status: "ready" };
    const upcoming = (data.upcomingSessions ?? []).map((s) => toSessionCard(s));
    return { stats, today, upcoming, upcomingCount: data.upcomingCount ?? upcoming.length };
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      <Header title="Coach Dashboard" />

      {loading && <Spinner label="Loading your dashboard…" />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {view && (
        <div className="space-y-8">
          <SummaryCards
            stats={view.stats}
            period={period}
            onPeriodChange={setPeriod}
          />

          <section>
            <h2 className="mb-4 font-jakarta text-[20px] font-semibold text-neutral-900">
              Today&rsquo;s Session
            </h2>
            <div className="space-y-4">
              {view.today.length ? (
                view.today.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onViewDetails={() => setDetailsOpen(true)}
                    onJoin={() => s.meetingLink && window.open(s.meetingLink, "_blank")}
                  />
                ))
              ) : (
                <p className="rounded-md border border-dashed border-neutral-200 bg-white p-8 text-center font-outfit text-[14px] text-neutral-400">
                  No sessions scheduled for today.
                </p>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SessionTimeline
                count={view.upcomingCount}
                sessions={view.upcoming.slice(0, 3)}
                onViewDetails={() => setDetailsOpen(true)}
              />
            </div>
            <UpcomingAppointments
              items={view.upcoming.slice(0, 3)}
              onViewMore={() => navigate("/sessions")}
              onSelect={() => setDetailsOpen(true)}
            />
          </div>
        </div>
      )}

      <SessionDetailsModal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} />
    </div>
  );
};
