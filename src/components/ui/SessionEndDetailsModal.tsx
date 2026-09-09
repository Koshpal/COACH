import React from "react";
import { Modal } from "../common/Modal";
import { Button } from "./Button";
import { Avatar } from "./Avatar";
import { StarRating } from "./RatingPill";
import { sessionDetail } from "../../mock/data";
import type { SessionDetailData } from "../../services/adapters";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  detail?: SessionDetailData;
}

const SectionTitle: React.FC<{ children: React.ReactNode; onEdit?: () => void }> = ({
  children,
  onEdit,
}) => (
  <div className="mb-2 flex items-center justify-between">
    <h4 className="font-jakarta text-[16px] font-semibold text-neutral-900">{children}</h4>
    {onEdit && (
      <button
        onClick={onEdit}
        className="rounded-md border border-neutral-200 px-3 py-1 font-jakarta text-[13px] font-medium text-neutral-600 hover:bg-neutral-25"
      >
        Edit
      </button>
    )}
  </div>
);

export const SessionEndDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  detail = sessionDetail,
}) => {
  const d = detail;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerTone="indigo"
      header={
        <div className="flex items-center gap-3">
          <Avatar src={d.clientAvatar} name={d.clientName} size={44} />
          <div>
            <h3 className="font-jakarta text-[18px] font-bold">{d.clientName}</h3>
            <p className="font-outfit text-[13px] text-white/80">{d.credential}</p>
          </div>
        </div>
      }
      footer={
        <Button variant="neutral" onClick={onClose}>
          Close
        </Button>
      }
    >
      <section className="space-y-6">
        <div>
          <SectionTitle>Scheduled Date &amp; Time</SectionTitle>
          <div className="flex items-center justify-between rounded-md border border-neutral-100 bg-neutral-25 px-4 py-3 font-outfit text-[15px]">
            <span className="font-jakarta font-semibold text-primary-600">{d.longDate}</span>
            <span className="text-neutral-700">
              {d.weekday}
              <span className="mx-2 text-neutral-300">|</span>
              {d.timeRange}
            </span>
          </div>
        </div>

        <div>
          <SectionTitle>Topics Covered</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {d.topics.map((t) => (
              <span
                key={t}
                className="rounded-md bg-primary-50 px-3 py-1.5 font-jakarta text-[13px] font-medium text-primary-600"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle onEdit={() => {}}>Session Summary</SectionTitle>
          <p className="font-outfit text-[14px] leading-relaxed text-neutral-600">{d.summary}</p>
        </div>

        <div>
          <SectionTitle onEdit={() => {}}>Private notes</SectionTitle>
          <p className="font-outfit text-[14px] leading-relaxed text-neutral-600">
            {d.privateNotes}
          </p>
        </div>

        {d.feedback.rating > 0 && (
          <div>
            <SectionTitle>Client Feedback</SectionTitle>
            <div className="rounded-md border border-neutral-100 p-4">
              <p className="flex items-center gap-2 font-jakarta text-[14px] font-semibold text-primary-600">
                Rating: <StarRating value={d.feedback.rating} />
              </p>
              {d.feedback.quote && (
                <p className="mt-2 font-outfit text-[14px] leading-relaxed text-neutral-600">
                  &ldquo;{d.feedback.quote}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </Modal>
  );
};
