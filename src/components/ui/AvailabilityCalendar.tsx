import React from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "./Button";
import type { CalDay } from "../../mock/data";

interface CalendarMonth {
  label: string;
  weekdays: string[];
  days: CalDay[];
}

export const AvailabilityCalendar: React.FC<{
  month: CalendarMonth;
  onEdit?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}> = ({ month, onEdit, onPrev, onNext }) => {
  const { label, weekdays, days } = month;

  return (
    <section className="overflow-hidden rounded-lg border border-neutral-100 bg-white shadow-low">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <h2 className="font-jakarta text-[22px] font-semibold text-neutral-900">{label}</h2>
          <div className="flex items-center gap-1 text-neutral-400">
            <button
              onClick={onPrev}
              className="rounded p-1 hover:bg-neutral-25 hover:text-neutral-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={onNext}
              className="rounded p-1 hover:bg-neutral-25 hover:text-neutral-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <Button
          variant="tertiary"
          onClick={onEdit}
          iconRight={<Pencil className="h-4 w-4" />}
        >
          Edit Availability
        </Button>
      </header>

      <div className="grid grid-cols-7 border-t border-neutral-100">
        {weekdays.map((w) => (
          <div
            key={w}
            className="border-b border-neutral-100 px-4 py-3 font-jakarta text-[13px] font-medium uppercase tracking-wide text-neutral-400"
          >
            {w}
          </div>
        ))}

        {days.map((d: CalDay, i) => (
          <div
            key={i}
            className={cn(
              "min-h-[136px] border-b border-r border-neutral-100 p-3 [&:nth-child(7n+7)]:border-r-0",
              d.holiday && "bg-neutral-50",
            )}
          >
            <span
              className={cn(
                "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 font-jakarta text-[15px]",
                d.selected
                  ? "bg-primary-600 font-semibold text-white"
                  : "text-neutral-800",
              )}
            >
              {d.day}
            </span>

            {d.holiday ? (
              <p className="mt-8 text-center font-outfit text-[13px] text-neutral-400">Holiday</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {d.slots?.map((s, si) => (
                  <div
                    key={si}
                    className="rounded-md bg-neutral-25 px-2 py-1 text-center font-outfit text-[12px] text-neutral-600"
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
