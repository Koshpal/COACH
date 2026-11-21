import React from "react";
import { Clock, ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { DateChip } from "./DateChip";
import { RatingPill } from "./RatingPill";
import type { MockSession } from "../../mock/data";

interface SessionCardProps {
  session: MockSession;
  onViewDetails?: (s: MockSession) => void;
  onJoin?: (s: MockSession) => void;
  onRate?: (s: MockSession) => void;
  onEnd?: (s: MockSession) => void;
  /** open the coaching-program workflow (prepare / run / close) for this session */
  onOpen?: (s: MockSession) => void;
  /** render the live "● 0:03 / End Session" treatment instead of Join */
  live?: boolean;
  liveTimer?: string;
  className?: string;
  /** dim the card (used behind modals in the Figma frames) */
  muted?: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onViewDetails,
  onJoin,
  onRate,
  onEnd,
  onOpen,
  live,
  liveTimer = "",
  className,
  muted,
}) => {
  const showJoin = session.status === "ready";
  const isPast = session.status === "past";
  const needsCloseOut = !!session.needsCloseOut;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-3 rounded-md border border-neutral-100 bg-white px-4 py-3.5 shadow-low",
        muted && "opacity-60",
        className,
      )}
    >
      <DateChip month={session.month} day={session.day} />

      <div className="h-14 w-px shrink-0 bg-neutral-100" />

      <div className="min-w-[140px] shrink-0">
        <p className="font-jakarta text-[16px] font-semibold leading-tight text-neutral-900">
          {session.clientName}
        </p>
        <p className="font-outfit text-[14px] text-neutral-500">{session.clientRole}</p>
      </div>

      <div className="flex h-11 shrink-0 items-center gap-2 rounded-md border border-neutral-200 px-3">
        <Clock className="h-4 w-4 shrink-0 text-primary-600" />
        <span className="whitespace-nowrap font-outfit text-[13px] text-neutral-700">
          {session.weekday}
          <span className="mx-1 text-neutral-300">·</span>
          {session.timeRange}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-4 sm:gap-6">
        {needsCloseOut && (
          <span className="inline-flex h-8 items-center rounded-md bg-warning-50 px-2.5 font-jakarta text-[13px] font-semibold text-warning-700">Needs closing</span>
        )}
        {isPast && !needsCloseOut &&
          (session.rating != null ? (
            <RatingPill value={session.rating} />
          ) : (
            <button
              onClick={() => onRate?.(session)}
              className="h-8 rounded-md bg-neutral-50 px-3 font-jakarta text-[13px] font-semibold text-primary-600 hover:bg-neutral-100"
            >
              Rate now
            </button>
          ))}

        {session.isAssigned === false && session.status !== "cancelled" && !(isPast && !needsCloseOut) && (
          <span
            className="font-outfit text-[13px] text-neutral-400"
            title="An admin has not assigned this employee to you, so the coaching notes and session tools are not available for them."
          >
            Not on your list
          </span>
        )}
        {onOpen && session.isAssigned !== false && session.status !== "cancelled" && !(isPast && !needsCloseOut) && (
          <button
            onClick={() => onOpen(session)}
            className="font-jakarta text-[14px] font-semibold text-primary-600 hover:text-primary-700"
          >
            {needsCloseOut ? "Close out" : "Open session"}
          </button>
        )}

        <button
          onClick={() => onViewDetails?.(session)}
          className="font-jakarta text-[14px] font-medium text-primary-600 underline underline-offset-2 hover:text-primary-700"
        >
          View Details
        </button>

        {showJoin && (
          <button
            onClick={() => onJoin?.(session)}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary-600 px-5 font-jakarta text-[14px] font-semibold text-white hover:bg-primary-700"
          >
            Join Session
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}

        {live && (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-success-50 px-2.5 h-8 font-jakarta text-[13px] font-semibold text-success-700">
              <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
              {liveTimer || "Live"}
            </span>
            <button
              onClick={() => onEnd?.(session)}
              className="inline-flex h-11 items-center rounded-md border border-error-300 px-5 font-jakarta text-[14px] font-semibold text-error-600 hover:bg-error-50"
            >
              End Session
            </button>
          </>
        )}
      </div>
    </div>
  );
};
