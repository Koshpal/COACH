import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SegmentedControl } from "./SegmentedControl";
import { SessionCard } from "./SessionCard";
import type { MockSession } from "../../mock/data";

interface SessionTimelineProps {
  title?: string;
  count?: number;
  weekLabel?: string;
  sessions: MockSession[];
  onViewDetails?: (s: MockSession) => void;
  onJoin?: (s: MockSession) => void;
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({
  title = "Your Schedule",
  count,
  weekLabel = "September 08 – 14",
  sessions,
  onViewDetails,
  onJoin,
}) => {
  const [view, setView] = useState("Week view");

  return (
    <section className="rounded-lg border border-neutral-100 bg-white p-6 shadow-low">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-jakarta text-[20px] font-semibold text-neutral-900">{title}</h3>
        {count != null && (
          <span className="rounded-md bg-primary-50 px-3 py-1 font-jakarta text-[13px] font-medium text-primary-600">
            {count} sessions
          </span>
        )}
      </div>

      <div className="mb-5 flex items-center justify-between">
        <SegmentedControl
          options={["Day view", "Week view", "month"]}
          value={view}
          onChange={setView}
        />
        <div className="flex items-center gap-3 font-outfit text-[14px] text-neutral-700">
          <button className="text-neutral-400 hover:text-neutral-700">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {weekLabel}
          <button className="text-neutral-400 hover:text-neutral-700">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} onViewDetails={onViewDetails} onJoin={onJoin} />
        ))}
      </div>
    </section>
  );
};
