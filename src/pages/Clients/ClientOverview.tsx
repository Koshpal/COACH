import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { LayoutGrid, List, MessageSquare } from "lucide-react";
import { Header } from "../../components/common/Header";
import {
  ClientHeaderSkeleton,
  SessionListSkeleton,
  BlockSkeleton,
  SectionError,
  Skeleton,
} from "../../components/common/Skeleton";
import { Tabs, type TabItem } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { ClientProfileHeader } from "../../components/ui/ClientProfileHeader";
import { ProgressChart } from "../../components/ui/ProgressChart";
import { SessionCard } from "../../components/ui/SessionCard";
import { SessionEndDetailsModal } from "../../components/ui/SessionEndDetailsModal";
import { coachService } from "../../services/coach.service";
import { useAsync } from "../../hooks/useAsync";
import {
  toClientProfile,
  toSessionCard,
  toSessionDetail,
  type ApiSession,
  type SessionDetailData,
} from "../../services/adapters";
import { sessionDetail as fallbackDetail } from "../../mock/data";

const TAB_ITEMS: TabItem[] = [
  { key: "overview", label: "Overview", icon: <LayoutGrid className="h-4 w-4" /> },
  { key: "sessions", label: "Sessions", icon: <List className="h-4 w-4" /> },
  { key: "notes", label: "Notes", icon: <MessageSquare className="h-4 w-4" /> },
];

const clientIdOf = (s: ApiSession) =>
  s.employee?.id ?? s.booking?.employee?.id ?? s.clientId;

/* ── Notes panel — its own API (/sessions/:id/coach-notes) & loader ─── */
const ClientNotesCard: React.FC<{ latestId: string | null }> = ({ latestId }) => {
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { loading, error, reload } = useAsync(async () => {
    if (!latestId) return "";
    const n = await coachService.getCoachNote(latestId).catch(() => null);
    setNote(n?.notes ?? "");
    return n?.notes ?? "";
  }, [latestId]);

  const save = async () => {
    if (!latestId || note == null) return;
    setSaving(true);
    try {
      await coachService.updateSessionNotes(latestId, note, "PRIVATE");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <BlockSkeleton lines={3} className="!border-0 !p-0 !shadow-none" />;
  if (error)
    return <SectionError message="Couldn't load notes." onRetry={reload} />;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-jakarta text-[18px] font-semibold text-[var(--color-text-primary)]">
          Coach Notes
        </h3>
        <Button size="sm" onClick={save} loading={saving} disabled={!latestId}>
          Save note
        </Button>
      </div>
      <textarea
        value={note ?? ""}
        onChange={(e) => setNote(e.target.value)}
        rows={5}
        placeholder="Notes for the most recent session with this client…"
        className="w-full resize-none rounded-md border border-[var(--color-border-primary)] p-3 font-outfit text-[14px] text-[var(--color-text-secondary)] focus:border-[var(--color-border-focus)] focus:ring-0"
      />
    </div>
  );
};

export const ClientOverview: React.FC = () => {
  const { id = "" } = useParams();
  const [tab, setTab] = useState("overview");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] =
    useState<SessionDetailData>(fallbackDetail);

  /* Profile + sessions come from one API domain → one loader, but each
     visual area still renders its own skeleton shape. */
  const { data, loading, error, reload } = useAsync(async () => {
    const [sessions, profile] = await Promise.all([
      coachService.getSessions(),
      coachService.getProfile().catch(() => null),
    ]);
    const all = [
      ...(sessions.bookedToday ?? []),
      ...(sessions.upcoming ?? []),
      ...(sessions.history ?? []),
    ] as unknown as ApiSession[];
    return { all, topics: (profile as any)?.expertise ?? [] };
  }, [id]);

  const mine = useMemo(
    () => (data?.all ?? []).filter((s) => clientIdOf(s) === id),
    [data, id],
  );
  const profile = useMemo(
    () => (data ? toClientProfile(data.all, id, data.topics) : null),
    [data, id],
  );
  const latestId = useMemo(() => {
    const sorted = [...mine].sort(
      (a, b) => +new Date(b.startTime) - +new Date(a.startTime),
    );
    return sorted[0]?.id ?? null;
  }, [mine]);

  const openDetail = async (sid: string) => {
    const raw = mine.find((s) => s.id === sid);
    setActiveSessionId(sid);
    let n = null;
    let fb = null;
    try {
      n = await coachService.getCoachNote(sid);
    } catch {}
    try {
      fb = await coachService.getSessionFeedback(sid);
    } catch {}
    if (raw) setActiveDetail(toSessionDetail(raw, { note: n, feedback: fb }));
    setDetailsOpen(true);
  };

  const HeaderArea = () =>
    loading ? (
      <ClientHeaderSkeleton />
    ) : error || !profile ? (
      <SectionError message="Couldn't load this client." onRetry={reload} />
    ) : (
      <ClientProfileHeader client={profile} />
    );

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Session Booking"
        below={<Tabs items={TAB_ITEMS} value={tab} onChange={setTab} />}
      />

      <div className="rounded-[16px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-6 shadow-[var(--shadow-drop-low)]">
        {tab === "overview" && (
          <div className="space-y-8">
            <HeaderArea />
            {loading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : (
              <ProgressChart sessions={mine} />
            )}
          </div>
        )}

        {tab === "sessions" && (
          <>
            {loading ? (
              <SessionListSkeleton rows={4} />
            ) : error ? (
              <SectionError message="Couldn't load sessions." onRetry={reload} />
            ) : mine.length ? (
              <div className="space-y-4">
                {mine
                  .map((s) => toSessionCard(s))
                  .map((card) => (
                    <SessionCard
                      key={card.id}
                      session={card}
                      onViewDetails={() => openDetail(card.id)}
                      onRate={() => openDetail(card.id)}
                    />
                  ))}
              </div>
            ) : (
              <p className="font-outfit text-[14px] text-[var(--color-text-tertiary)]">
                No sessions with this client yet.
              </p>
            )}
          </>
        )}

        {tab === "notes" && (
          <div className="space-y-8">
            <HeaderArea />
            {loading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : (
              <ProgressChart sessions={mine} />
            )}
            <ClientNotesCard latestId={latestId} />
          </div>
        )}
      </div>

      <SessionEndDetailsModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        detail={activeDetail}
        sessionId={activeSessionId}
        onSaved={reload}
      />
    </div>
  );
};
