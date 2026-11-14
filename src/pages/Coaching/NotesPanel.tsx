import React from 'react';
import { EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { NOTE_FIELDS, type NoteField, type NoteFields } from '../../services/coaching.service';

const LABELS: Record<NoteField, { label: string; hint: string; rows: number }> = {
  sessionObjective: { label: 'Session objective', hint: 'What do we want to achieve today?', rows: 2 },
  employeeConcerns: { label: 'Employee concerns', hint: 'In their own words.', rows: 3 },
  keyDiscussion: { label: 'Key discussion', hint: 'What was covered.', rows: 4 },
  financialObservations: { label: 'Financial observations', hint: 'Patterns, risks, strengths you noticed.', rows: 3 },
  toolsUsed: { label: 'Tools used', hint: 'Calculators / worksheets used.', rows: 2 },
  decisionsMade: { label: 'Decisions made', hint: 'What was agreed.', rows: 3 },
  employeeCommitments: { label: 'Employee commitments', hint: 'What they promised to do.', rows: 3 },
  coachRecommendations: { label: 'Coach recommendations', hint: 'Your advice.', rows: 3 },
  escalationStatus: { label: 'Escalation status', hint: 'If the case needs help, describe it here.', rows: 2 },
  nextSessionObjective: { label: 'Next session objective', hint: 'What to pick up next time.', rows: 2 },
  coachPrivateNotes: { label: 'Private coach notes', hint: 'Only you can see these. Never shown to the employee or in the shared workspace.', rows: 3 },
};

interface Props {
  fields: NoteFields;
  onChange: (k: NoteField, v: string) => void;
  editable: boolean;
  required: string[];
  conflict: { server: { version: number; fields: NoteFields }; fields: string[] } | null;
  onKeepMine: () => void;
  onUseServer: () => void;
}

export const NotesPanel: React.FC<Props> = ({ fields, onChange, editable, required, conflict, onKeepMine, onUseServer }) => (
  <section className="rounded-[16px] bg-[var(--color-bg-card)] p-5" aria-label="Session notes">
    <h2 className="mb-1 font-jakarta text-[16px] font-semibold text-[var(--color-text-primary)]">Live notes</h2>
    <p className="mb-4 font-outfit text-[13px] text-[var(--color-text-tertiary)]">Saved automatically as you type. <span className="text-[var(--color-error-dark)]">*</span> = required to close the session.</p>

    {conflict && (
      <div role="alert" className="mb-4 rounded-[12px] border border-[var(--color-error-light)] bg-[var(--color-error-bg)] p-4">
        <p className="font-jakarta text-[14px] font-semibold text-[var(--color-error-dark)]">These notes were changed somewhere else</p>
        <p className="mt-1 font-outfit text-[13px] text-[var(--color-text-secondary)]">Another tab or device saved a different version of: <b>{conflict.fields.map((f) => LABELS[f as NoteField]?.label ?? f).join(', ')}</b>. Nothing has been overwritten.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {conflict.fields.slice(0, 2).map((f) => (
            <div key={f} className="rounded-[10px] bg-white p-3 font-outfit text-[12px]">
              <p className="font-semibold">{LABELS[f as NoteField]?.label ?? f} — other version</p>
              <p className="mt-1 whitespace-pre-line text-[var(--color-text-secondary)]">{conflict.server.fields[f as NoteField] || '(empty)'}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={onKeepMine}>Keep what's on this screen</Button>
          <Button size="sm" variant="neutral" onClick={onUseServer}>Use the other version</Button>
        </div>
      </div>
    )}

    <div className="flex flex-col gap-4">
      {NOTE_FIELDS.map((k) => {
        const meta = LABELS[k];
        const isReq = required.includes(k);
        const isPrivate = k === 'coachPrivateNotes';
        const empty = isReq && !fields[k].trim();
        return (
          <div key={k} className={isPrivate ? 'rounded-[12px] border border-dashed border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-3' : ''}>
            <label htmlFor={`note-${k}`} className="mb-1 flex items-center gap-1.5 font-jakarta text-[13px] font-semibold text-[var(--color-text-primary)]">
              {isPrivate && <EyeOff className="h-3.5 w-3.5" aria-hidden />}
              {meta.label}{isReq && <span className="text-[var(--color-error-dark)]" aria-label="required">*</span>}
            </label>
            <textarea id={`note-${k}`} value={fields[k]} rows={meta.rows} maxLength={10000} disabled={!editable} placeholder={meta.hint}
              onChange={(e) => onChange(k, e.target.value)} aria-invalid={empty || undefined}
              className={`w-full resize-y rounded-[10px] border bg-[var(--color-bg-card)] p-3 font-outfit text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] disabled:bg-[var(--color-bg-secondary)] ${empty ? 'border-[var(--color-warning-light)]' : 'border-[var(--color-border-primary)]'}`} />
          </div>
        );
      })}
    </div>
  </section>
);
