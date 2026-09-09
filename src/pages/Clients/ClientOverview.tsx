import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { LayoutGrid, List, MessageSquare } from "lucide-react";
import { Header } from "../../components/common/Header";
import { Spinner, ErrorState } from "../../components/common/PageState";
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

export const ClientOverview: React.FC = () => {
  const { id = "" } = useParams();
  const [tab, setTab] = useState("overview");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState<SessionDetailData>(fallbackDetail);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

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
    () =>
      (data?.all ?? []).filter(
        (s) => (s.employee?.id ?? s.booking?.employee?.id ?? s.clientId) === id,
      ),
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

  useEffect(() => {
    if (!latestId) return;
    coachService
      .getCoachNote(latestId)
      .then((n) => setNote(n?.notes ?? ""))
      .catch(() => setNote(""));
  }, [latestId]);

  const openDetail = async (sid: string) => {
    const raw = mine.find((s) => s.id === sid);
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

  const saveNote = async () => {
    if (!latestId) return;
    setSavingNote(true);
    try {
      await coachService.updateSessionNotes(latestId, note, "PRIVATE");
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Session Booking"
        below={<Tabs items={TAB_ITEMS} value={tab} onChange={setTab} />}
      />

      {loading && <Spinner label="Loading client…" />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {profile && (
        <div className="rounded-lg border border-neutral-100 bg-white p-6 shadow-low">
          {tab === "overview" && (
            <div className="space-y-8">
              <ClientProfileHeader client={profile} />
              <ProgressChart />
            </div>
          )}

          {tab === "sessions" && (
            <div className="space-y-4">
              {mine.length ? (
                mine
                  .map((s) => toSessionCard(s))
                  .map((card) => (
                    <SessionCard
                      key={card.id}
                      session={card}
                      onViewDetails={() => openDetail(card.id)}
                      onRate={() => openDetail(card.id)}
                    />
                  ))
              ) : (
                <p className="font-outfit text-[14px] text-neutral-400">
                  No sessions with this client yet.
                </p>
              )}
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-8">
              <ClientProfileHeader client={profile} />
              <ProgressChart />
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-jakarta text-[18px] font-semibold text-neutral-900">
                    Coach Notes
                  </h3>
                  <Button size="sm" onClick={saveNote} loading={savingNote} disabled={!latestId}>
                    Save note
                  </Button>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={5}
                  placeholder="Notes for the most recent session with this client…"
                  className="w-full resize-none rounded-md border border-neutral-200 p-3 font-outfit text-[14px] text-neutral-700 focus:border-primary-400 focus:ring-0"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <SessionEndDetailsModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        detail={activeDetail}
      />
    </div>
  );
};
