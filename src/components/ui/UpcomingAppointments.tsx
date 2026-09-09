import React from "react";
import { ChevronRight } from "lucide-react";
import { DateChip } from "./DateChip";
import type { MockSession } from "../../mock/data";

export const UpcomingAppointments: React.FC<{
  items: MockSession[];
  onViewMore?: () => void;
  onSelect?: (s: MockSession) => void;
}> = ({ items, onViewMore, onSelect }) => (
  <section className="rounded-lg border border-neutral-100 bg-white p-6 shadow-low">
    <div className="mb-4 flex items-center justify-between gap-2">
      <h3 className="whitespace-nowrap font-jakarta text-[18px] font-semibold text-neutral-900">
        Upcoming Appointments
      </h3>
      <button
        onClick={onViewMore}
        className="inline-flex shrink-0 items-center gap-1 font-jakarta text-[14px] font-medium text-primary-600 hover:text-primary-700"
      >
        View more <ChevronRight className="h-4 w-4" />
      </button>
    </div>

    <div className="space-y-3">
      {items.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect?.(s)}
          className="flex w-full items-center gap-4 rounded-md border border-neutral-100 px-3 py-3 text-left transition-colors hover:bg-neutral-25"
        >
          <DateChip month={s.month} day={s.day} />
          <div className="min-w-0">
            <p className="truncate font-jakarta text-[16px] font-semibold text-neutral-900">
              {s.clientName}
            </p>
            <p className="font-outfit text-[14px] text-neutral-500">{s.clientRole}</p>
          </div>
        </button>
      ))}
    </div>
  </section>
);
