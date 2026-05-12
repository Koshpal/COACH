import React from 'react';
import { Mail, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Client {
  id: string;
  name: string;
  company: string;
  lastSession: string;
  nextSession: string;
}

interface ClientCardProps {
  client: Client;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate('/client-overview', { state: { client } });
  };

  const initials = (() => {
    const parts = client.name?.trim().split(/\s+/) || [];
    if (parts.length === 0) return 'C';
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  })();

  return (
    <div className="rounded-2xl p-4 bg-[var(--color-bg-card)] shadow-md border border-[var(--color-border-primary)] space-y-4 hover:shadow-lg transition-all">
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-[var(--color-primary-lightest)] text-[var(--color-primary)]">
            {initials}
          </div>
          <div>
            <h3 className="font-bold text-lg text-[var(--color-text-primary)] font-heading">{client.name}</h3>
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] mt-1">
              <TrendingUp size={12} className="text-[var(--color-primary)]" />
              <span>{client.company}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm border-t border-b border-[var(--color-border-primary)] py-3">
        <div className="flex justify-between">
          <span className="text-[var(--color-text-secondary)]">Last Session</span>
          <span className="text-[var(--color-text-primary)] font-medium">{client.lastSession}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-secondary)]">Next Session</span>
          <span className="text-[var(--color-primary)] font-bold">{client.nextSession}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="flex items-center justify-center gap-2 flex-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl py-2.5 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-all">
          <Mail size={16} />
          Message
        </button>
        <button
          onClick={handleViewDetails}
          className="flex-1 bg-[var(--color-primary)] text-[var(--color-text-inverse)] rounded-xl py-2.5 text-sm font-bold hover:opacity-90 shadow-lg shadow-blue-500/20 transition-all"
        >
          View details
        </button>
      </div>
    </div>
  );
};
