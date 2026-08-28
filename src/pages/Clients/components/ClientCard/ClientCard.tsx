import React from 'react';
import { MessageCircle, CalendarPlus, User2 } from 'lucide-react';
import { Client } from '../../../../types/coach.types';

interface ClientCardProps {
  client: Client;
  onViewDetails: (client: Client) => void;
  onMessage?: (client: Client) => void;
  onScheduleSession?: (client: Client) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onViewDetails, onMessage, onScheduleSession }) => {
  const initials = (() => {
    const parts = client.name?.trim().split(/\s+/).filter(Boolean) || [];
    if (parts.length === 0) return '?';
    const first = parts[0][0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase() || '?';
  })();
  const isActive = !!client.upcomingSession && new Date(client.upcomingSession) > new Date();

  return (
    <div className="rounded-2xl p-4 bg-[var(--color-bg-card)] shadow-md border border-[var(--color-border-primary)] space-y-4 hover:shadow-lg transition-all flex flex-col justify-between min-h-[260px]">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-[var(--color-primary-lightest)] text-[var(--color-primary)]">
          {initials || <User2 />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-[var(--color-text-primary)] truncate">{client.name}</h3>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-[var(--color-success)]/15 text-[var(--color-success-darkest)]' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {client.organization && (
            <div className="text-xs text-[var(--color-text-secondary)] mt-1 truncate">{client.organization}</div>
          )}
        </div>
      </div>
      <div className="flex justify-between text-sm border-t border-b border-[var(--color-border-primary)] py-2 mt-2">
        <div className="flex flex-col">
          <span className="text-[var(--color-text-tertiary)]">Last Session</span>
          <span className="text-[var(--color-text-primary)] font-medium">{client.lastSession ? new Date(client.lastSession).toLocaleDateString() : '—'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[var(--color-text-tertiary)]">Next Session</span>
          <span className="text-[var(--color-primary)] font-bold">{client.upcomingSession ? new Date(client.upcomingSession).toLocaleDateString() : '—'}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          className="flex-1 py-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary)]/20 transition"
          onClick={() => onViewDetails(client)}
        >
          View Details
        </button>
        {onMessage && (
          <button
            className="flex-1 py-2 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-semibold hover:bg-[var(--color-bg-tertiary)] transition"
            onClick={() => onMessage(client)}
          >
            <MessageCircle size={18} className="inline mr-1" />Message
          </button>
        )}
        {onScheduleSession && !isActive && (
          <button
            className="flex-1 py-2 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success-darkest)] font-semibold hover:bg-[var(--color-success)]/20 transition"
            onClick={() => onScheduleSession(client)}
          >
            <CalendarPlus size={18} className="inline mr-1" />Schedule
          </button>
        )}
      </div>
      {typeof client.totalSessions === 'number' && (
        <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-secondary)]">
          <span>Sessions: <span className="font-bold text-[var(--color-text-primary)]">{client.totalSessions}</span></span>
        </div>
      )}
    </div>
  );
};
