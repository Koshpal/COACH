import React, { useEffect, useState } from "react";
import { Plus, Info } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "./Button";
import type { SessionDetailData } from "../../services/adapters";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  detail: SessionDetailData;
  clientName?: string;
  /** persist the session as ended; receives the composed note text */
  onSubmit?: (payload: {
    topics: string[];
    summary: string;
    privateNotes: string;
  }) => Promise<void> | void;
}

const Helper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-2 flex items-center gap-1.5 font-outfit text-[13px] text-neutral-400">
    <Info className="h-3.5 w-3.5" />
    {children}
  </p>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-2 flex items-center justify-between">
    <h4 className="font-jakarta text-[16px] font-semibold text-neutral-900">{children}</h4>
  </div>
);

export const SessionEndFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  detail,
  clientName = "Pranav Wadhwa",
  onSubmit,
}) => {
  const d = detail;
  const [topics, setTopics] = useState<string[]>(d.topics);
  const [draft, setDraft] = useState("");
  const [summary, setSummary] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTopics(d.topics);
      setDraft("");
      setSummary("");
      setPrivateNotes("");
    }
  }, [isOpen, d.topics]);

  const addTopic = () => {
    const t = draft.trim();
    if (t && topics.length < 5) {
      setTopics((p) => [...p, t]);
      setDraft("");
    }
  };

  const submit = async () => {
    if (!onSubmit) return onClose();
    setSaving(true);
    try {
      await onSubmit({ topics, summary, privateNotes });
      onClose();
    } catch {
      /* the page has already shown the error; keep the form open so nothing the coach typed is lost */
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
        <div>
          <h3 className="font-jakarta text-[20px] font-bold">
            Session ended with {clientName}
          </h3>
          <p className="font-outfit text-[14px] text-white/80">Fill out these details</p>
        </div>
      }
      footer={
        <>
          <Button variant="neutral" onClick={onClose}>
            Close
          </Button>
          <Button variant="tertiary" loading={saving} onClick={submit}>
            Submit
          </Button>
        </>
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
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTopic()}
              placeholder="Add topics as discussed"
              className="h-11 flex-1 rounded-md border border-neutral-200 px-3 font-outfit text-[14px] text-neutral-800 placeholder:text-neutral-400 focus:border-primary-400 focus:ring-0"
            />
            <Button variant="neutral" onClick={addTopic} iconLeft={<Plus className="h-4 w-4" />}>
              Add
            </Button>
          </div>
          <Helper>Add up to 5 topics</Helper>
          <div className="mt-3 flex flex-wrap gap-2">
            {topics.map((t) => (
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
          <SectionTitle>Summary</SectionTitle>
          <textarea
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Add a description..."
            className="w-full resize-none rounded-md border border-neutral-200 px-3 py-2.5 font-outfit text-[14px] text-neutral-800 placeholder:text-neutral-400 focus:border-primary-400 focus:ring-0"
          />
          <Helper>This will be visible to employee</Helper>
        </div>

        <div>
          <SectionTitle>Private notes</SectionTitle>
          <textarea
            rows={2}
            value={privateNotes}
            onChange={(e) => setPrivateNotes(e.target.value)}
            placeholder="Add personal notes..."
            className="w-full resize-none rounded-md border border-neutral-200 px-3 py-2.5 font-outfit text-[14px] text-neutral-800 placeholder:text-neutral-400 focus:border-primary-400 focus:ring-0"
          />
          <Helper>These notes are private and not shared with the client</Helper>
        </div>
      </section>
    </Modal>
  );
};
