import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Clock, Calendar, Video, ArrowLeft, Eye } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { coachService } from '../../services/coach.service';
import { Client } from '../../types/client.types';
import { SessionDetailsModal } from '../../components/ui/SessionDetailsModal';

type ClientOverviewState = Client & {
  name?: string;
  company?: string;
  nextSession?: string;
  role?: string;
};

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return 'N/A';
  return parsedDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (value?: string) => {
  if (!value) return 'TBD';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return 'TBD';
  return parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getClientDisplayName = (client: ClientOverviewState | null) => {
  if (!client) return 'Unknown Client';
  if (client.name) return client.name;

  const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim();
  return fullName || 'Unknown Client';
};

const getClientCompany = (client: ClientOverviewState | null) => {
  if (!client) return 'N/A';
  return client.company || client.organization || 'N/A';
};

export const ClientOverview: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const client = location.state?.client as ClientOverviewState | undefined;

  useEffect(() => {
    if (!client?.id) {
      navigate('/clients');
      return;
    }
    fetchClientConsultations();
  }, [client, navigate]);

  const fetchClientConsultations = async () => {
    try {
      setLoading(true);
      if (!client?.id) {
        setConsultations([]);
        return;
      }
      const clientId = client.id;
      const allConsultations = await coachService.getSessions();
      // Filter sessions for this specific client
      const allList = [
        ...((allConsultations as any).bookedToday || []),
        ...((allConsultations as any).upcoming || []),
        ...((allConsultations as any).history || []),
      ];
      const clientConsultations = allList.filter(c => c.clientId === clientId || c.employee?.id === clientId);
      setConsultations(clientConsultations);
    } catch (error) {
      console.error('Error fetching client consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (session: any) => {
    setSelectedSession(session);
    setIsDetailsOpen(true);
  };

  const clientData = useMemo(() => {
    if (!client) return null;
    const displayName = getClientDisplayName(client);
    const displayCompany = getClientCompany(client);
    return {
      name: displayName,
      role: client.role || 'Employee',
      company: displayCompany,
      totalSessions: consultations.length,
      completedSessions: consultations.filter(c => c.status === 'COMPLETED').length,
      scheduledSessions: consultations.filter(c => c.status === 'SCHEDULED' || c.status === 'CONFIRMED').length,
      engagement: 'Active',
      lastSession: formatDate(client.lastSession),
      upcomingSession: client.upcomingSession || client.nextSession
        ? {
            date: formatDate(client.upcomingSession || client.nextSession),
            time: formatTime(client.upcomingSession || client.nextSession),
          }
        : null
    };
  }, [client, consultations]);

  const engagementData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sessionsByMonth: any[] = [];
    const now = new Date();
    
    for (let i = -3; i <= 2; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      const count = consultations.filter(c => {
        const d = new Date(c.startTime);
        return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();
      }).length;

      sessionsByMonth.push({
        month: monthNames[date.getMonth()],
        year: date.getFullYear(),
        sessions: count,
        isCurrentMonth: i === 0
      });
    }
    return sessionsByMonth;
  }, [consultations]);

  if (!clientData) return null;

  return (
    <div className="mx-auto space-y-6 max-w-7xl animate-fade-in">
      <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)] hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </button>

      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-6 mb-8 md:flex-row md:items-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary-lightest)] text-[var(--color-primary)] flex items-center justify-center text-2xl font-bold">
            {(clientData.name?.[0] || 'C').toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-heading">{clientData.name}</h2>
              <span className="px-3 py-1 bg-[var(--color-secondary)] text-[var(--color-text-inverse)] text-[10px] font-bold rounded-full uppercase tracking-wider">{clientData.company}</span>
            </div>
            <p className="text-[var(--color-text-secondary)] mt-1">{clientData.role}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs font-bold text-[var(--color-primary)]">{clientData.totalSessions} Sessions</span>
              <div className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)]"></div>
              <span className="text-xs font-bold text-[var(--color-primary)]">{clientData.scheduledSessions} Scheduled</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-[var(--color-bg-tertiary)] rounded-xl overflow-x-auto">
          {['Overview', 'Sessions', 'Notes', 'Messages'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[100px] py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab 
                ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-md' 
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Overview' && (
          <div className="mt-8 space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { label: 'Total Sessions', value: clientData.totalSessions, sub: `${clientData.completedSessions} completed` },
                { label: 'Engagement', value: clientData.engagement, sub: `Last: ${clientData.lastSession}` },
                { label: 'Upcoming', value: clientData.upcomingSession?.date || 'None', sub: clientData.upcomingSession?.time || '-' }
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-2xl bg-[var(--color-bg-secondary)] border border-black/5 flex flex-col justify-between h-40">
                  <p className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">{stat.label}</p>
                  <div>
                    <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-2xl border border-black/5">
              <div className="flex items-center gap-2 mb-8">
                <TrendingUp className="w-5 h-5 text-[var(--color-success)]" />
                <h3 className="font-bold text-[var(--color-text-primary)]">Engagement Trend</h3>
              </div>
              <div className="flex items-end justify-between h-40 gap-2">
                {engagementData.map((data, idx) => (
                  <div key={idx} className="relative flex flex-col items-center justify-end flex-1 gap-3">
                    {hoveredBar === idx && (
                      <div className="absolute -top-9 whitespace-nowrap rounded-lg bg-[var(--color-text-primary)] px-2.5 py-1 text-[10px] font-bold text-[var(--color-text-inverse)] shadow-lg">
                        {data.sessions} session{data.sessions === 1 ? '' : 's'}
                      </div>
                    )}
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 cursor-grabbing ${data.isCurrentMonth ? 'bg-[var(--color-secondary)]' : 'bg-[var(--color-success)]'}`}
                      style={{ height: `${Math.max(data.sessions * 30, 4)}px`, opacity: hoveredBar === idx ? 0.8 : 1 }}
                      onMouseEnter={() => setHoveredBar(idx)}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">{data.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Sessions' && (
          <div className="mt-8 space-y-4 animate-fade-in">
            {consultations.length === 0 ? (
              <div className="p-12 text-center bg-[var(--color-bg-secondary)] rounded-2xl">
                <p className="text-[var(--color-text-secondary)]">No sessions found.</p>
              </div>
            ) : (
              consultations.map((s, i) => (
                <div key={i} className="p-6 bg-[var(--color-bg-secondary)] rounded-xl border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-24">
                        <p className="text-xs font-bold text-[var(--color-text-primary)]">{new Date(s.startTime).toLocaleDateString()}</p>
                        <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="w-px h-10 bg-[var(--color-border-primary)]"></div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-[var(--color-text-primary)]">{s.type || 'Coaching Session'}</p>
                        <p className="text-[10px] text-[var(--color-text-secondary)]">Duration: 45 Minutes</p>
                      </div>
                    </div>
                    <div className="pl-28">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase ${s.status === 'COMPLETED' ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' : 'bg-[var(--color-info)]/20 text-[var(--color-info)]'}`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewDetails(s)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Notes' && (
          <div className="mt-8 space-y-6 animate-fade-in">
            <div className="p-12 text-center bg-[var(--color-bg-secondary)] rounded-2xl">
              <p className="text-[var(--color-text-secondary)]">Client notes feature is currently being refactored.</p>
            </div>
          </div>
        )}

        {activeTab === 'Messages' && (
          <div className="mt-8 p-12 text-center bg-[var(--color-bg-secondary)] rounded-2xl animate-fade-in">
            <p className="text-[var(--color-text-secondary)]">Message history will be available in the next update.</p>
          </div>
        )}
      </section>

      {/* Session Details Modal */}
      {selectedSession && (
        <SessionDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          session={selectedSession}
        />
      )}
    </div>
  );
};
