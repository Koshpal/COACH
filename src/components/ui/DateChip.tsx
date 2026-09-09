import React from "react";
import { cn } from "../../lib/cn";

/** Month-over-day tile used at the left of every session row. */
export const DateChip: React.FC<{
  month: string;
  day: string;
  className?: string;
}> = ({ month, day, className }) => (
  <div
    className={cn(
      "flex h-[62px] w-[62px] shrink-0 flex-col items-center justify-center rounded-md bg-neutral-50 leading-none",
      className,
    )}
  >
    <span className="font-jakarta text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
      {month}
    </span>
    <span className="mt-0.5 font-jakarta text-[22px] font-bold text-neutral-900">{day}</span>
  </div>
);
