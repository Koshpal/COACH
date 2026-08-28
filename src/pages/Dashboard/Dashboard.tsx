import React, { useState, useEffect, useCallback } from 'react';
import { Users, Calendar, Video, Clock, ChevronRight } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { SessionCard } from '../../components/ui/SessionCard';
import { coachService } from '../../services/coach.service';
import { formatTime } from '../../utils/date';
import { SessionDetailsModal } from '../../components/ui/SessionDetailsModal';
import { EndSessionModal } from '../../components/ui/EndSessionModal';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Coach');
  
  // Modal states
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const dashboardData = await coachService.getDashboardStats();
      setStats(dashboardData);
      setTodaySessions(dashboardData.todaySessions || []);
      setUpcomingSessions(dashboardData.upcomingSessions || []);

      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserName(user.name || user.email?.split('@')[0] || 'Coach');
        } catch (e) {
          console.error('Error parsing user from localStorage', e);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenDetails = (session: any) => {
    setSelectedSession(session);
    setIsDetailsOpen(true);
  };

  const handleOpenEndSession = (session: any) => {
    setSelectedSession(session);
    setIsEndOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[var(--color-text-secondary)] font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-heading text-balance">
          Welcome back, {userName}!
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Here's what's happening with your sessions today.</p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sessions"
          value={stats?.totalSessions || 0}
          icon={Calendar}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Clients"
          value={stats?.activeClients || 0}
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Total Hours"
          value={stats?.totalHours || 0}
          icon={Clock}
        />
        <StatCard
          title="Avg. Rating"
          value={stats?.avgRating || 0}
          icon={Video}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] font-heading">Today's Sessions</h3>
            <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-lightest)] px-3 py-1 rounded-full border border-[var(--color-primary-light)]">
              {todaySessions.length} Scheduled
            </span>
          </div>

          <div className="space-y-4">
            {todaySessions.length > 0 ? (
              todaySessions.map((session) => (
                <SessionCard
                  key={session.id}
                  id={session.id}
                  startTime={formatTime(session.startTime)}
                  endTime={formatTime(session.endTime)}
                  clientName={session.clientName || session.employee?.fullName || session.client?.name || 'Unassigned Client'}
                  sessionType={session.type}
                  badge={session.status === 'CONFIRMED' ? 'Confirmed' : session.status}
                  status={session.status}
                  isVirtual={true}
                  duration="45m"
                  onJoinSession={() => window.open(session.meetingLink, '_blank')}
                  onEndSession={() => handleOpenEndSession(session)}
                  onViewDetails={() => handleOpenDetails(session)}
                />
              ))
            ) : (
              <div className="p-12 text-center bg-[var(--color-bg-card)] rounded-2xl border border-dashed border-[var(--color-border-primary)]">
                <p className="text-[var(--color-text-secondary)] italic">No sessions scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] font-heading">Upcoming</h3>
          <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] overflow-hidden">
            {upcomingSessions.length > 0 ? (
              upcomingSessions.slice(0, 5).map((session, i) => (
                <div key={session.id} className={`p-4 flex items-center gap-4 hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer ${i !== upcomingSessions.length - 1 ? 'border-b border-[var(--color-border-primary)]' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center font-bold text-xs">
                    {((session.clientName || session.employee?.fullName || session.client?.name || 'C')[0]).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                      {session.clientName || session.employee?.fullName || session.client?.name || 'Unassigned Client'}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider">{new Date(session.startTime).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-xs text-[var(--color-text-secondary)]">No upcoming sessions.</p>
              </div>
            )}
            <button className="w-full py-3 text-xs font-bold text-[var(--color-primary)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
              View All Sessions
            </button>
          </div>
        </div>
      </div>

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
            onSuccess={() => { setIsEndOpen(false); fetchData(); }}
          />
        </>
      )}
    </div>
  );
};
