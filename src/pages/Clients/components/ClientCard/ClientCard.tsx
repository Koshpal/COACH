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
  const initials = (client.firstName?.[0]?.toUpperCase() || '') + (client.lastName?.[0]?.toUpperCase() || '') || '?';
  const isActive = !!client.upcomingSession && new Date(client.upcomingSession) > new Date();

  return (
    <div className="rounded-2xl p-4 bg-white shadow-md border border-gray-200 space-y-4 hover:shadow-lg transition-all flex flex-col justify-between min-h-[260px]">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-blue-100 text-blue-600">
          {initials || <User2 />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-gray-900 truncate">{client.firstName} {client.lastName}</h3>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {client.organization && (
            <div className="text-xs text-gray-500 mt-1 truncate">{client.organization}</div>
          )}
        </div>
      </div>
      <div className="flex justify-between text-sm border-t border-b border-gray-100 py-2 mt-2">
        <div className="flex flex-col">
          <span className="text-gray-400">Last Session</span>
          <span className="text-gray-700 font-medium">{client.lastSession ? new Date(client.lastSession).toLocaleDateString() : '—'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400">Next Session</span>
          <span className="text-blue-600 font-bold">{client.upcomingSession ? new Date(client.upcomingSession).toLocaleDateString() : '—'}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          className="flex-1 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition"
          onClick={() => onViewDetails(client)}
        >
          View Details
        </button>
        {onMessage && (
          <button
            className="flex-1 py-2 rounded-lg bg-gray-50 text-gray-700 font-semibold hover:bg-gray-100 transition"
            onClick={() => onMessage(client)}
          >
            <MessageCircle size={18} className="inline mr-1" />Message
          </button>
        )}
        {onScheduleSession && !isActive && (
          <button
            className="flex-1 py-2 rounded-lg bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition"
            onClick={() => onScheduleSession(client)}
          >
            <CalendarPlus size={18} className="inline mr-1" />Schedule
          </button>
        )}
      </div>
      {typeof client.totalSessions === 'number' && (
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <span>Sessions: <span className="font-bold text-gray-700">{client.totalSessions}</span></span>
        </div>
      )}
    </div>
  );
};
