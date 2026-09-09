import React, { useEffect, useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "./Button";
import { Avatar } from "./Avatar";
import { StarRating } from "./RatingPill";
import { sessionDetail } from "../../mock/data";
import type { SessionDetailData } from "../../services/adapters";
import { coachService } from "../../services/coach.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  detail?: SessionDetailData;
  /** session id — enables the "Edit" flow on the session note */
  sessionId?: string | null;
  onSaved?: () => void;
}

export const SessionEndDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  detail = sessionDetail,
  sessionId,
  onSaved,
}) => {
  const d = detail;
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState(d.summary);
  const [draft, setDraft] = useState(d.summary);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSummary(d.summary);
    setDraft(d.summary);
    setEditing(false);
  }, [d.summary, isOpen]);

  const save = async () => {
    if (!sessionId) return;
    setSaving(true);
    try {
      await coachService.updateSessionNotes(sessionId, draft, "SHARED");
      setSummary(draft); // reflect the change immediately
      setEditing(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerTone="indigo"
      header={
        <div className="flex items-center gap-3 pr-8">
          <Avatar src={d.clientAvatar} name={d.clientName} size={44} />
          <div className="min-w-0">
            <h3 className="truncate font-jakarta text-[18px] font-bold">{d.clientName}</h3>
            {d.credential && (
              <p className="truncate font-outfit text-[13px] text-white/80">
                {d.credential}
              </p>
            )}
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
          <h4 className="mb-2 font-jakarta text-[16px] font-semibold text-[var(--color-text-primary)]">
            Scheduled Date &amp; Time
          </h4>
          <div className="flex items-center justify-between rounded-md border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] px-4 py-3 font-outfit text-[15px]">
            <span className="font-jakarta font-semibold text-[var(--color-primary)]">
              {d.longDate}
            </span>
            <span className="text-[var(--color-text-secondary)]">
              {d.weekday}
              <span className="mx-2 text-[var(--color-text-tertiary)]">|</span>
              {d.timeRange}
            </span>
          </div>
        </div>

        <div>
          <h4 className="mb-2 font-jakarta text-[16px] font-semibold text-[var(--color-text-primary)]">
            Topics Covered
          </h4>
          <div className="flex flex-wrap gap-2">
            {d.topics.map((t) => (
              <span
                key={t}
                className="rounded-md bg-[var(--color-primary-lightest)] px-3 py-1.5 font-jakarta text-[13px] font-medium text-[var(--color-primary)]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-jakarta text-[16px] font-semibold text-[var(--color-text-primary)]">
              Session Notes
            </h4>
            {sessionId && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="rounded-md border border-[var(--color-border-primary)] px-3 py-1 font-jakarta text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
              >
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-md border border-[var(--color-border-primary)] p-3 font-outfit text-[14px] text-[var(--color-text-secondary)] focus:border-[var(--color-border-focus)] focus:ring-0"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => {
                    setDraft(summary);
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" loading={saving} onClick={save}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="font-outfit text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              {summary || (
                <span className="italic text-[var(--color-text-tertiary)]">
                  No notes recorded for this session.
                </span>
              )}
            </p>
          )}
        </div>

        {d.feedback.rating > 0 && (
          <div>
            <h4 className="mb-2 font-jakarta text-[16px] font-semibold text-[var(--color-text-primary)]">
              Client Feedback
            </h4>
            <div className="rounded-md border border-[var(--color-border-primary)] p-4">
              <p className="flex items-center gap-2 font-jakarta text-[14px] font-semibold text-[var(--color-primary)]">
                Rating: <StarRating value={d.feedback.rating} />
              </p>
              {d.feedback.quote && (
                <p className="mt-2 font-outfit text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
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
