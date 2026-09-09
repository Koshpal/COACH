import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/common/Header";
import { ErrorState } from "../../components/common/PageState";
import { SessionListSkeleton } from "../../components/common/Skeleton";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Dropdown } from "../../components/ui/Dropdown";
import { SessionCard } from "../../components/ui/SessionCard";
import { SessionDetailsModal } from "../../components/ui/SessionDetailsModal";
import { SessionEndFormModal } from "../../components/ui/SessionEndFormModal";
import { SessionEndDetailsModal } from "../../components/ui/SessionEndDetailsModal";
import { coachService } from "../../services/coach.service";
import { useAsync } from "../../hooks/useAsync";
import {
  groupSessions,
  toSessionDetail,
  type ApiSession,
  type SessionDetailData,
} from "../../services/adapters";
import { sessionDetail as fallbackDetail } from "../../mock/data";

const TABS = ["Upcoming", "Past", "Cancelled"];
const MONTHS = ["May 23", "Jun 23", "Jul 23", "Aug 23"];

const GroupHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="mb-4 mt-8 font-jakarta text-[20px] font-semibold text-neutral-900 first:mt-0">
    {children}
  </h3>
);

const dedupe = (rows: ApiSession[]) => {
  const seen = new Set<string>();
  return rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
};

export const Sessions: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Upcoming");
  const [month, setMonth] = useState(MONTHS[0]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [endFormOpen, setEndFormOpen] = useState(false);
  const [endDetailsOpen, setEndDetailsOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState<SessionDetailData>(fallbackDetail);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data, loading, error, reload } = useAsync(async () => {
    const s = await coachService.getSessions();
    return dedupe([
      ...(s.bookedToday ?? []),
      ...(s.upcoming ?? []),
      ...(s.history ?? []),
    ] as unknown as ApiSession[]);
  }, []);

  const grouped = useMemo(() => (data ? groupSessions(data) : null), [data]);
  const pastYears = useMemo(
    () =>
      grouped
        ? Object.keys(grouped.pastByYear).sort((a, b) => Number(b) - Number(a))
        : [],
    [grouped],
  );

  const openDetail = async (
    id: string,
    kind: "session" | "end-details" | "end-form",
  ) => {
    setActiveId(id);
    const raw = (data ?? []).find((s) => s.id === id);
    let note = null;
    let feedback = null;
    try {
      note = await coachService.getCoachNote(id);
    } catch {
      /* none yet */
    }
    try {
      feedback = await coachService.getSessionFeedback(id);
    } catch {
      /* none yet */
    }
    if (raw) setActiveDetail(toSessionDetail(raw, { note, feedback }));
    if (kind === "session") setDetailsOpen(true);
    else if (kind === "end-details") setEndDetailsOpen(true);
    else setEndFormOpen(true);
  };

  const submitEnd = async ({
    topics,
    summary,
    privateNotes,
  }: {
    topics: string[];
    summary: string;
    privateNotes: string;
  }) => {
    if (!activeId) return;
    const body = [
      topics.length ? `Topics: ${topics.join(", ")}` : "",
      summary && `Summary: ${summary}`,
      privateNotes && `Private: ${privateNotes}`,
    ]
      .filter(Boolean)
      .join("\n");
    // The API only accepts coach notes on a COMPLETED session, and only lets a
    // session be completed once it has ended — so complete first, then note.
    try {
      await coachService.updateSessionStatus(activeId, "COMPLETED");
    } catch {
      /* already completed, or the session hasn't ended yet */
    }
    try {
      await coachService.updateSessionNotes(activeId, body || "Session completed.", "SHARED");
    } catch {
      /* notes rejected (session not yet completed) — status change still applied */
    }
    reload();
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Sessions"
        below={
          <div className="flex items-center justify-between">
            <SegmentedControl
              variant="pill"
              options={TABS}
              value={tab}
              onChange={setTab}
            />
            <Dropdown value={month} options={MONTHS} onChange={setMonth} />
          </div>
        }
      />

      {loading && <SessionListSkeleton rows={4} />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}

      {grouped && tab === "Upcoming" && (
        <div>
          {grouped.today.length > 0 && (
            <div>
              <GroupHeading>Today</GroupHeading>
              <div className="space-y-4">
                {grouped.today.map((s, i) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    live={i === 0}
                    onViewDetails={() => openDetail(s.id, "session")}
                    onJoin={() => s.meetingLink && window.open(s.meetingLink, "_blank")}
                    onEnd={() => openDetail(s.id, "end-form")}
                  />
                ))}
              </div>
            </div>
          )}
          {grouped.nextWeek.length > 0 && (
            <div>
              <GroupHeading>Next Week</GroupHeading>
              <div className="space-y-4">
                {grouped.nextWeek.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onViewDetails={() => openDetail(s.id, "session")}
                    onJoin={() => s.meetingLink && window.open(s.meetingLink, "_blank")}
                  />
                ))}
              </div>
            </div>
          )}
          {grouped.today.length === 0 && grouped.nextWeek.length === 0 && (
            <p className="mt-8 font-outfit text-[14px] text-neutral-400">
              No upcoming sessions.
            </p>
          )}
        </div>
      )}

      {grouped && tab === "Past" && (
        <div>
          <p className="font-outfit text-[15px] text-neutral-600">
            {pastYears.reduce((n, y) => n + grouped.pastByYear[y].length, 0)} Results found
          </p>
          {pastYears.map((year) => (
            <div key={year}>
              <GroupHeading>{year}</GroupHeading>
              <div className="space-y-4">
                {grouped.pastByYear[year].map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onViewDetails={() => openDetail(s.id, "end-details")}
                    onRate={() => openDetail(s.id, "end-details")}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {grouped && tab === "Cancelled" && (
        <div className="space-y-4 pt-2">
          {grouped.cancelled.length ? (
            grouped.cancelled.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onViewDetails={() => openDetail(s.id, "session")}
              />
            ))
          ) : (
            <p className="mt-4 font-outfit text-[14px] text-neutral-400">
              No cancelled sessions.
            </p>
          )}
        </div>
      )}

      <SessionDetailsModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        detail={activeDetail}
        onViewProfile={
          activeDetail.clientId
            ? () => {
                setDetailsOpen(false);
                navigate(`/clients/${activeDetail.clientId}`);
              }
            : undefined
        }
        onJoin={
          activeDetail.meetingLink
            ? () => window.open(activeDetail.meetingLink, "_blank")
            : undefined
        }
        onReschedule={() => {
          setDetailsOpen(false);
          navigate("/availability");
        }}
      />
      <SessionEndFormModal
        isOpen={endFormOpen}
        onClose={() => setEndFormOpen(false)}
        detail={activeDetail}
        clientName={activeDetail.clientName}
        onSubmit={submitEnd}
      />
      <SessionEndDetailsModal
        isOpen={endDetailsOpen}
        onClose={() => setEndDetailsOpen(false)}
        detail={activeDetail}
        sessionId={activeId}
        onSaved={reload}
      />
    </div>
  );
};
