import React from "react";
import { Calendar, ArrowUpRight } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "./Button";
import { Avatar } from "./Avatar";
import { sessionDetail } from "../../mock/data";
import type { SessionDetailData } from "../../services/adapters";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  detail?: SessionDetailData;
  onReschedule?: () => void;
  onJoin?: () => void;
  onViewProfile?: () => void;
}

export const SessionDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  detail = sessionDetail,
  onReschedule,
  onJoin,
  onViewProfile,
}) => {
  const d = detail;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerTone="teal"
      pattern
      size="sm"
      header={
        <div className="flex justify-center pb-2 pt-2">
          <Avatar
            src={d.clientAvatar}
            name={d.clientName}
            size={88}
            className="-mb-12 rounded-full ring-4 ring-white"
          />
        </div>
      }
      footer={
        <>
          <Button
            variant="neutral"
            onClick={onReschedule}
            iconLeft={<Calendar className="h-4 w-4" />}
          >
            Reschedule
          </Button>
          <Button
            variant="primary"
            disabled={!onJoin}
            onClick={onJoin}
            iconRight={<ArrowUpRight className="h-4 w-4" />}
          >
            Join Session
          </Button>
        </>
      }
    >
      <div className="pt-10 text-center">
        <h3 className="font-jakarta text-[22px] font-bold text-[var(--color-text-primary)]">
          {d.clientName}
        </h3>
        {d.credential && (
          <p className="font-outfit text-[15px] text-[var(--color-text-secondary)]">
            {d.credential}
          </p>
        )}
        <button
          onClick={onViewProfile}
          disabled={!onViewProfile}
          className="mt-1 font-jakarta text-[14px] font-medium text-[var(--color-primary)] underline underline-offset-2 disabled:opacity-50"
        >
          View Profile
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-md border-y border-[var(--color-border-primary)] py-4 font-outfit text-[15px]">
        <span className="font-jakarta font-semibold text-[var(--color-primary)]">
          {d.dateLabel}
        </span>
        <span className="text-[var(--color-text-secondary)]">
          {d.weekday}
          <span className="mx-2 text-[var(--color-text-tertiary)]">|</span>
          {d.timeRange}
        </span>
      </div>
    </Modal>
  );
};
