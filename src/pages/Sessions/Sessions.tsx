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
import { IST_TIMEZONE as IST, utcToIST as toIst } from "../../utils/timezone";
import { useToast } from "../../context/ToastContext";
import { usePolling } from "../../hooks/usePolling";
import { coachingService, parseApiError } from "../../services/coaching.service";

const TABS = ["Upcoming", "Past", "Cancelled"];
const ALL_MONTHS = "All months";
const monthLabel = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit", timeZone: IST }).format(new Date(value));

const GroupHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="mb-4 mt-8 font-jakarta text-[20px] font-semibold text-neutral-900 first:mt-0">
    {children}
  </h3>
);

/** "0:42" — how long a live session has been running. */
const elapsed = (startIso: string | undefined, _tick: number) => {
  if (!startIso) return "";
  const mins = Math.max(0, Math.floor((Date.now() - new Date(startIso).getTime()) / 60_000));
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`;
};

const dedupe = (rows: ApiSession[]) => {
  const seen = new Set<string>();
  return rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
};

export const Sessions: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tab, setTab] = useState("Upcoming");
  const [month, setMonth] = useState(ALL_MONTHS);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [endFormOpen, setEndFormOpen] = useState(false);
  const [endDetailsOpen, setEndDetailsOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState<SessionDetailData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Re-evaluate "live now" and the elapsed timer every 30 s while the tab is open.
  const [tick, setTick] = useState(0);
  usePolling(() => setTick((t) => t + 1), 30_000);

  // Opens the programme workflow (Prepare → Start → Runner → Close). The booking id is the card id; the
  // server creates the session on first open and returns the existing one afterwards.
  const openProgramSession = async (bookingId: string) => {
    try {
      const session = await coachingService.createSession(bookingId);
      navigate(`/sessions/${session.id}/prepare`);
    } catch (e) {
      showToast(parseApiError(e).message, "error");
    }
  };

  const { data, loading, error, reload } = useAsync(async () => {
    const s = await coachService.getSessions();
    return dedupe([
      ...(s.bookedToday ?? []),
      ...(s.upcoming ?? []),
      ...(s.history ?? []),
    ] as unknown as ApiSession[]);
  }, []);

  const monthOptions = useMemo(() => {
    const months = new Map<string, number>();
    (data ?? []).forEach((session) => {
      const date = toIst(session.startTime);
      if (!Number.isNaN(date.getTime())) {
        months.set(monthLabel(session.startTime), new Date(date.getFullYear(), date.getMonth(), 1).getTime());
      }
    });
    return [ALL_MONTHS, ...Array.from(months.entries()).sort((a, b) => b[1] - a[1]).map(([label]) => label)];
  }, [data]);

  const filteredData = useMemo(
    () => month === ALL_MONTHS ? (data ?? []) : (data ?? []).filter((session) => monthLabel(session.startTime) === month),
    [data, month],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `tick` re-derives live/past from the clock
  const grouped = useMemo(() => (data ? groupSessions(filteredData) : null), [data, filteredData, tick]);
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
    if (!raw) {
      // Never open a detail view on placeholder content.
      showToast("That session is no longer in the list. Refresh and try again.", "error");
      return;
    }
    setActiveDetail(toSessionDetail(raw, { note, feedback }));
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
    // Coach notes are one record with one visibility. If the coach wrote private notes, the whole
    // note stays PRIVATE so they are never shown to the employee; otherwise it is shared.
    const hasPrivate = privateNotes.trim().length > 0;
    const body = [
      topics.length ? `Topics: ${topics.join(", ")}` : "",
      summary && `Summary: ${summary}`,
      hasPrivate && `Private: ${privateNotes}`,
    ]
      .filter(Boolean)
      .join("\n");
    // The API only accepts coach notes on a COMPLETED session, and only lets a
    // session be completed once it has ended — so complete first, then note.
    // Any failure is shown and rethrown so the form stays open with what the coach typed.
    try {
      await coachService.updateSessionStatus(activeId, "COMPLETED");
    } catch (e) {
      const err = parseApiError(e);
      if (err.code === "USE_SESSION_RUNNER") {
        showToast(err.message, "info");
        try {
          const session = await coachingService.createSession(activeId); // returns the existing one if there is one
          navigate(`/sessions/${session.id}/prepare`);
        } catch (e2) {
          showToast(parseApiError(e2).message, "error");
        }
        return;
      }
      showToast(`Could not complete the session: ${err.message}`, "error");
      throw e;
    }
    try {
      await coachService.updateSessionNotes(activeId, body || "Session completed.", hasPrivate ? "PRIVATE" : "SHARED");
    } catch (e) {
      showToast(`The session was completed, but the notes were not saved: ${parseApiError(e).message}`, "error");
      reload();
      throw e;
    }
    showToast(hasPrivate ? "Session completed. Your notes are private and were not shared." : "Session completed.", "success");
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
            <Dropdown value={month} options={monthOptions} onChange={setMonth} />
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
                {grouped.today.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    live={s.status === "ready"}
                    liveTimer={elapsed(s.startTime, tick)}
                    onOpen={() => openProgramSession(s.id)}
                    onViewDetails={() => openDetail(s.id, "session")}
                    onJoin={() => s.meetingLink && window.open(s.meetingLink, "_blank", "noopener,noreferrer")}
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
                    onOpen={() => openProgramSession(s.id)}
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
                    onOpen={() => openProgramSession(s.id)}
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

      {activeDetail && (
        <>
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
              ? () => window.open(activeDetail.meetingLink, "_blank", "noopener,noreferrer")
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
        </>
      )}
    </div>
  );
};
