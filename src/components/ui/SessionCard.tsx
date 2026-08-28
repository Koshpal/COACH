import React from 'react';
import { Video, Clock, Eye, Power } from 'lucide-react';

interface SessionCardProps {
  id: string;
  startTime: string;
  endTime: string;
  clientName: string;
  sessionType: string;
  badge: string;
  isVirtual?: boolean;
  duration?: string;
  status?: string;
  onJoinSession?: () => void;
  onViewDetails?: () => void;
  onEndSession?: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  id,
  startTime,
  endTime,
  clientName,
  sessionType,
  badge,
  isVirtual,
  duration,
  status,
  onJoinSession,
  onViewDetails,
  onEndSession
}) => {
  const initials = (() => {
    const parts = clientName?.trim().split(/\s+/) || [];
    if (parts.length === 0) return 'C';
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  })();
  
  const getBadgeStyle = () => {
    if (badge === 'Confirmed' || status === 'CONFIRMED') {
      return 'bg-[var(--color-info-bg)] text-[var(--color-secondary)] border-[var(--color-secondary)]';
    }
    if (status === 'COMPLETED') {
      return 'bg-[var(--color-success-bg)] text-[var(--color-success-darkest)] border-[var(--color-success)]';
    }
    return 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)]';
  };

  const isLive = status === 'LIVE' || (badge === 'Confirmed' && new Date() >= new Date(startTime) && new Date() <= new Date(endTime));

  return (
    <div className="rounded-2xl py-4 px-5 border hover:shadow-lg transition-all bg-[var(--color-bg-card)] border-[var(--color-border-primary)] group">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        {/* Time Section */}
        <div className="flex flex-col items-center min-w-[80px]">
          <div className="text-sm font-bold text-[var(--color-text-primary)]">{startTime}</div>
          <div className="w-[1px] h-6 bg-[var(--color-border-primary)] my-1"></div>
          <div className="text-sm font-medium text-[var(--color-text-secondary)]">{endTime}</div>
        </div>

        {/* Client Avatar */}
        <div className="hidden sm:flex rounded-full items-center justify-center w-12 h-12 bg-[var(--color-primary-lightest)] text-[var(--color-primary)] font-bold text-sm shadow-sm">
          {initials}
        </div>

        {/* Session Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.1em]">Employee</span>
              <h4 className="text-lg font-bold text-[var(--color-text-primary)] font-heading truncate">
                {clientName || 'Unassigned'}
              </h4>
            </div>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getBadgeStyle()}`}>
              {status || badge}
            </span>
          </div>
          
          <div className="mt-2 flex flex-col">
            <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.1em]">Session Type</span>
            <p className="text-sm font-medium text-[var(--color-primary)]">{sessionType}</p>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {isVirtual && (
              <div className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md gap-1 text-[var(--color-secondary)] bg-[var(--color-info-bg)] border border-[var(--color-secondary)/20]">
                <Video className='h-3 w-3' /> <span>VIRTUAL</span>
              </div>
            )}
            {duration && (
              <div className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md gap-1 text-[var(--color-warning)] bg-[var(--color-warning-bg)] border border-[var(--color-warning)/20]">
                <Clock className='h-3 w-3' /> <span>{duration}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {status === 'COMPLETED' ? (
            <button 
              onClick={onViewDetails}
              className="px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-xs font-bold rounded-xl border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)] transition-all flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" /> View Details
            </button>
          ) : (
            <>
              {isLive ? (
                <button
                  onClick={onEndSession}
                  className="px-4 py-2 bg-[var(--color-error)] text-white text-xs font-bold rounded-xl hover:opacity-90 shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5"
                >
                  <Power className="w-4 h-4" /> End Session
                </button>
              ) : (
                <button
                  onClick={onViewDetails}
                  className="px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-xs font-bold rounded-xl border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)] transition-all flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" /> View Details
                </button>
              )}
              <button 
                onClick={onJoinSession}
                className="px-6 py-2 bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all"
              >
                Join
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
