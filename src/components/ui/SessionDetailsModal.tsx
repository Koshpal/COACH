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
}

export const SessionDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  detail = sessionDetail,
  onReschedule,
  onJoin,
}) => {
  const d = detail;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerTone="teal"
      pattern
      size="sm"
      header={<div className="h-12" />}
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
            variant="secondary"
            disabled={!onJoin}
            onClick={onJoin}
            iconRight={<ArrowUpRight className="h-4 w-4" />}
          >
            Join Session
          </Button>
        </>
      }
    >
      <div className="-mt-14 flex flex-col items-center text-center">
        <Avatar
          src={d.clientAvatar}
          name={d.clientName}
          size={92}
          className="rounded-full ring-4 ring-white"
        />
        <h3 className="mt-3 font-jakarta text-[22px] font-bold text-neutral-900">
          {d.clientName}
        </h3>
        <p className="font-outfit text-[15px] text-neutral-500">{d.credential}</p>
        <button className="mt-1 font-jakarta text-[14px] font-medium text-primary-600 underline underline-offset-2">
          View Profile
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-md border-y border-neutral-100 py-4 font-outfit text-[15px]">
        <span className="font-jakarta font-semibold text-primary-600">{d.dateLabel}</span>
        <span className="text-neutral-700">
          {d.weekday}
          <span className="mx-2 text-neutral-300">|</span>
          {d.timeRange}
        </span>
      </div>
    </Modal>
  );
};
