import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Mail, Star, Calendar, ChevronRight } from 'lucide-react';
import { SessionCard } from '../../components/ui/SessionCard';
import { coachService } from '../../services/coach.service';
import { formatTime, formatDate } from '../../utils/date';
import { SessionDetailsModal } from '../../components/ui/SessionDetailsModal';
import { EndSessionModal } from '../../components/ui/EndSessionModal';
import { RescheduleModal } from '../../components/ui/RescheduleModal';

type TabType = 'Live' | 'Upcoming' | 'History';

export const Sessions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Upcoming');
  const [sessions, setSessions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await coachService.getSessions();
        if (isMounted) setSessions(data);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        if (isMounted) setError('Failed to load sessions. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSessions();
    return () => { isMounted = false; };
  }, []);

  const handleOpenDetails = (session: any) => {
    setSelectedSession(session);
    setIsDetailsOpen(true);
  };

  const handleOpenEndSession = (session: any) => {
    setSelectedSession(session);
    setIsEndOpen(true);
  };

  const handleOpenReschedule = (session: any) => {
    setSelectedSession(session);
    setIsRescheduleOpen(true);
  };

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    switch (activeTab) {
      case 'Live': return sessions.bookedToday || [];
      case 'Upcoming': return sessions.upcoming || [];
      case 'History': return [...(sessions.history || [])].sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      default: return [];
    }
  }, [activeTab, sessions]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-heading">My Sessions</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Manage and track all your coaching consultations.</p>
        </div>
        <div className="flex bg-[var(--color-bg-card)] p-1 rounded-xl border border-[var(--color-border-primary)] shadow-sm">
          {(['Live', 'Upcoming', 'History'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-md' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'}`}
            >
              {tab === 'Live' ? 'Today' : tab}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="py-20 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="py-20 text-center bg-[var(--color-bg-card)] rounded-2xl border border-dashed border-[var(--color-border-primary)]">
          <p className="text-[var(--color-error)] font-medium mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[var(--color-primary)] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Retry
          </button>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="py-20 text-center bg-[var(--color-bg-card)] rounded-2xl border border-dashed border-[var(--color-border-primary)]">
          <p className="text-[var(--color-text-secondary)] italic">No {activeTab.toLowerCase()} sessions found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session: any) => (
            <SessionCard
              key={session.id}
              id={session.id}
              startTime={
                activeTab === 'Upcoming' || activeTab === 'History'
                  ? formatDate(session.startTime)
                  : formatTime(session.startTime)
              }
              endTime={
                activeTab === 'Upcoming' || activeTab === 'History'
                  ? formatDate(session.endTime)
                  : formatTime(session.endTime)
              }
              clientName={session.clientName || session.employee?.fullName || session.client?.name || 'Unassigned Client'}
              sessionType={session.type || 'Individual Coaching'}
              badge={session.status === 'CONFIRMED' ? 'Confirmed' : session.status}
              status={session.status}
              isVirtual={true}
              duration="45m"
              onJoinSession={() => window.open(session.meetingLink, '_blank')}
              onReschedule={() => handleOpenReschedule(session)}
              onEndSession={() => handleOpenEndSession(session)}
              onViewDetails={() => handleOpenDetails(session)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedSession && (
        <>
          <SessionDetailsModal
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            session={selectedSession}
          />
          <EndSessionModal
            isOpen={isEndOpen}
            onClose={() => setIsEndOpen(false)}
            session={selectedSession}
          />
          <RescheduleModal
            isOpen={isRescheduleOpen}
            onClose={() => setIsRescheduleOpen(false)}
            session={selectedSession}
          />
        </>
      )}
    </div>
  );
};
