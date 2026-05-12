import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarPlus, MessageCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { coachService } from '../../services/coach.service';
import { Client } from '../../types/client.types';
import { ClientCard } from './components/ClientCard/ClientCard';
import { ClientFilters } from './components/ClientFilters/ClientFilters';

const getClientStatus = (client: Client): 'active' | 'inactive' => {
  if (!client.upcomingSession) return 'inactive';
  return new Date(client.upcomingSession).getTime() > Date.now() ? 'active' : 'inactive';
};

const parseSessionDateTime = (session: any) => {
  const datePart = session?.date ? String(session.date).slice(0, 10) : '';
  const startTime = session?.startTime ? new Date(session.startTime) : null;
  const fallback = session?.startTime || session?.slot?.startTime || session?.createdAt;

  if (startTime && !Number.isNaN(startTime.getTime())) {
    return startTime;
  }

  if (datePart && session?.slot?.startTime) {
    const parsed = new Date(`${datePart}T${String(session.slot.startTime).slice(11, 16)}:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (fallback) {
    const parsed = new Date(fallback);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
};

const deriveClientsFromSessions = (sessionsResponse: any): Client[] => {
  const groupedSessions = [
    ...(sessionsResponse?.bookedToday || []),
    ...(sessionsResponse?.upcoming || []),
    ...(sessionsResponse?.todayLive || []),
    ...(sessionsResponse?.history || []),
  ];

  const clientsById = new Map<string, Client & { lastSessionAt?: number; nextSessionAt?: number }>();
  const now = Date.now();

  groupedSessions.forEach((session: any) => {
    const employee = session?.employee || session?.booking?.employee || {};
    const id = employee?.id || session?.clientId;
    if (!id) return;

    const fullName = String(employee?.fullName || session?.clientName || 'Unknown Client').trim();
    const [firstName = 'Unknown', ...restName] = fullName.split(/\s+/);
    const lastName = restName.join(' ') || '';
    const sessionDate = parseSessionDateTime(session);
    const sessionTimestamp = sessionDate ? sessionDate.getTime() : null;

    const existing = clientsById.get(id);
    const baseClient: Client & { lastSessionAt?: number; nextSessionAt?: number } = existing || {
      id,
      firstName,
      lastName,
      email: employee?.email || '',
      avatar: undefined,
      phone: employee?.phone,
      organization: employee?.company || 'Koshpal',
      totalSessions: 0,
      upcomingSession: undefined,
      lastSession: undefined,
      lastSessionAt: undefined,
      nextSessionAt: undefined,
    };

    baseClient.firstName = firstName;
    baseClient.lastName = lastName;
    baseClient.email = employee?.email || baseClient.email;
    baseClient.phone = employee?.phone || baseClient.phone;
    baseClient.organization = employee?.company || baseClient.organization || 'Koshpal';
    baseClient.totalSessions = (baseClient.totalSessions || 0) + 1;

    if (sessionTimestamp !== null) {
      if (sessionTimestamp < now) {
        if (!baseClient.lastSessionAt || sessionTimestamp > baseClient.lastSessionAt) {
          baseClient.lastSessionAt = sessionTimestamp;
          baseClient.lastSession = new Date(sessionTimestamp).toISOString();
        }
      } else if (!baseClient.nextSessionAt || sessionTimestamp < baseClient.nextSessionAt) {
        baseClient.nextSessionAt = sessionTimestamp;
        baseClient.upcomingSession = new Date(sessionTimestamp).toISOString();
      }
    }

    clientsById.set(id, baseClient);
  });

  return Array.from(clientsById.values()).map(({ lastSessionAt, nextSessionAt, ...client }) => client);
};

export const Clients: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sort, setSort] = useState<'recent' | 'nextSession'>('recent');

  useEffect(() => {
    let isMounted = true;

    const loadClients = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await coachService.getSessions();
        if (isMounted) {
          setClients(deriveClientsFromSessions(data));
        }
      } catch {
        if (isMounted) {
          setError('Failed to load clients.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadClients();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = clients
      .filter((client) => {
        const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
        return normalizedSearch ? fullName.includes(normalizedSearch) : true;
      })
      .filter((client) => {
        if (status === 'all') return true;
        return getClientStatus(client) === status;
      })
      .sort((left, right) => {
        if (sort === 'nextSession') {
          const leftValue = left.upcomingSession ? new Date(left.upcomingSession).getTime() : Number.POSITIVE_INFINITY;
          const rightValue = right.upcomingSession ? new Date(right.upcomingSession).getTime() : Number.POSITIVE_INFINITY;
          return leftValue - rightValue;
        }

        const leftValue = left.lastSession ? new Date(left.lastSession).getTime() : 0;
        const rightValue = right.lastSession ? new Date(right.lastSession).getTime() : 0;
        return rightValue - leftValue;
      });

    return filtered;
  }, [clients, search, status, sort]);

  const activeCount = useMemo(() => clients.filter((client) => getClientStatus(client) === 'active').length, [clients]);
  const noActiveClients = status === 'active' && activeCount === 0;

  const handleViewDetails = (client: Client) => {
    navigate('/client-overview', { state: { client } });
  };

  const handleMessage = (client: Client) => {
    navigate('/sessions', { state: { clientId: client.id, action: 'message' } });
  };

  const handleScheduleSession = (client: Client) => {
    navigate('/sessions', { state: { clientId: client.id, action: 'schedule' } });
  };

  const emptyState = () => {
    if (clients.length === 0) {
      return {
        title: 'No clients yet',
        description: 'Once coaching sessions are booked, clients will appear here with their latest activity and next session.',
      };
    }

    if (noActiveClients) {
      return {
        title: 'No active clients',
        description: 'There are no clients with an upcoming session right now. Schedule a session to activate one.',
      };
    }

    if (search.trim() || status !== 'all') {
      return {
        title: 'No matching clients',
        description: 'Try adjusting the search or filter to find the client you need.',
      };
    }

    return {
      title: 'No clients found',
      description: 'No clients are available for the selected filter.',
    };
  };

  const empty = emptyState();

  return (
    <div className="max-w-6xl px-4 py-6 mx-auto space-y-6 md:px-0">
      <header className="flex flex-col gap-4 rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-6 shadow-sm md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">Client dashboard</p>
          <div>
            <h1 className="text-3xl font-bold font-heading text-[var(--color-text-primary)]">Clients</h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-secondary)]">
              Track client activity, understand who is currently engaged, and take the next best action quickly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex">
          <div className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-3">
            <div className="text-xs font-medium text-[var(--color-text-secondary)]">Total clients</div>
            <div className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">{clients.length}</div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-3">
            <div className="text-xs font-medium text-[var(--color-text-secondary)]">Active clients</div>
            <div className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">{activeCount}</div>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-10 py-4 shadow-sm">
        <ClientFilters
          search={search}
          setSearch={setSearch}
          status={status}
          setStatus={setStatus}
          sort={sort}
          setSort={setSort}
        />
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="min-h-[260px] animate-pulse rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-4"
            >
              <div className="h-4 w-1/2 rounded bg-[var(--color-bg-tertiary)]" />
              <div className="mt-6 h-10 rounded bg-[var(--color-bg-tertiary)]" />
              <div className="mt-4 space-y-3">
                <div className="h-4 rounded bg-[var(--color-bg-tertiary)]" />
                <div className="h-4 rounded bg-[var(--color-bg-tertiary)]" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="px-6 py-10 text-center text-red-700 border border-red-200 rounded-3xl bg-red-50">
          <p className="font-semibold">{error}</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-lightest)] text-[var(--color-primary)]">
            <Search className="w-6 h-6" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-[var(--color-text-primary)]">{empty.title}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--color-text-secondary)]">{empty.description}</p>
          <button
            type="button"
            onClick={() => navigate('/sessions')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-[var(--color-text-inverse)] transition hover:opacity-95"
          >
            Schedule session
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onViewDetails={handleViewDetails}
              onMessage={handleMessage}
              onScheduleSession={handleScheduleSession}
            />
          ))}
        </div>
      )}
    </div>
  );
};
