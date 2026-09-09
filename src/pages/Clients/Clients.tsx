import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/common/Header";
import { ErrorState } from "../../components/common/PageState";
import { ClientGridSkeleton } from "../../components/common/Skeleton";
import { ClientCard } from "../../components/ui/ClientCard";
import { coachService } from "../../services/coach.service";
import { useAsync } from "../../hooks/useAsync";
import { toClients, type ApiSession } from "../../services/adapters";

export const Clients: React.FC = () => {
  const navigate = useNavigate();

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
    const topics = (profile as any)?.expertise ?? [];
    return toClients(all, topics);
  }, []);

  const clients = useMemo(() => data ?? [], [data]);

  return (
    <div className="flex flex-col gap-6">
      <Header title="Client's Profile" />
      {loading && <ClientGridSkeleton count={6} />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => (
            <ClientCard
              key={c.id}
              client={c}
              onView={() => navigate(`/clients/${c.id}`)}
            />
          ))}
          {clients.length === 0 && (
            <p className="font-outfit text-[14px] text-neutral-400">No clients yet.</p>
          )}
        </div>
      )}
    </div>
  );
};
