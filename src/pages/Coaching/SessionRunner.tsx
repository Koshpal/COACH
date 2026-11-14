import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, CloudOff, Loader2, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/common/Modal';
import { ErrorState, Spinner } from '../../components/common/PageState';
import { useToast } from '../../context/ToastContext';
import { coachingService, parseApiError, type RunnerState } from '../../services/coaching.service';
import { useNotesAutosave, type SaveStatus } from './useNotesAutosave';
import { NotesPanel } from './NotesPanel';
import { ActionPlanPanel, ClosePanel, DebtsPanel } from './SessionPanels';
import { Pill, statusTone, label } from './ui';
import { RaiseEscalationModal } from '../Ops/RaiseEscalation';

const mmss = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** Ticks once a second; elapsed time is derived from the SERVER start time so a refresh never resets it. */
function useElapsed(startedAt: string | null, serverNow: string) {
  const skew = useRef(0);
  useEffect(() => { skew.current = new Date(serverNow).getTime() - Date.now(); }, [serverNow]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  return startedAt ? (now + skew.current - new Date(startedAt).getTime()) / 1000 : 0;
}

const SaveIndicator: React.FC<{ status: SaveStatus; savedAt: Date | null }> = ({ status, savedAt }) => {
  const map: Record<SaveStatus, { icon: React.ReactNode; text: string; cls: string }> = {
    saved: { icon: <CheckCircle2 className="h-4 w-4" />, text: savedAt ? `Saved ${savedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'All changes saved', cls: 'text-[var(--color-success-dark)]' },
    saving: { icon: <Loader2 className="h-4 w-4 animate-spin" />, text: 'Saving…', cls: 'text-[var(--color-text-secondary)]' },
    unsaved: { icon: <Circle className="h-4 w-4" />, text: 'Unsaved changes', cls: 'text-[var(--color-warning-dark)]' },
    offline: { icon: <CloudOff className="h-4 w-4" />, text: 'Offline — kept on this device', cls: 'text-[var(--color-error-dark)]' },
    conflict: { icon: <CloudOff className="h-4 w-4" />, text: 'Conflict — choose a version', cls: 'text-[var(--color-error-dark)]' },
    locked: { icon: <Lock className="h-4 w-4" />, text: 'Read-only', cls: 'text-[var(--color-text-secondary)]' },
    error: { icon: <CloudOff className="h-4 w-4" />, text: 'Could not save', cls: 'text-[var(--color-error-dark)]' },
  };
  const m = map[status];
  return <span role="status" aria-live="polite" className={`inline-flex items-center gap-1.5 font-outfit text-[13px] ${m.cls}`}>{m.icon}{m.text}</span>;
};

export const SessionRunner: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<RunnerState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { setState(await coachingService.state(id)); } catch (e) { setError(parseApiError(e).message); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (state?.session.status === 'SCHEDULED') navigate(`/sessions/${id}/prepare`, { replace: true });
  }, [state?.session.status, id, navigate]);

  if (error) return <div className="p-6"><ErrorState message={error} onRetry={load} /></div>;
  if (!state || !state.note) return <Spinner label="Loading session…" />;
  if (state.session.status === 'SCHEDULED') return <Spinner label="Opening preparation…" />;
  return <Runner key={state.session.id} initial={state} reload={load} />;
};

const Runner: React.FC<{ initial: RunnerState; reload: () => Promise<void> }> = ({ initial, reload }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const s = initial.session;
  const tpl = initial.template;
  const live = s.status === 'IN_PROGRESS';
  const [step, setStep] = useState(s.currentStepIndex);
  const [rightTab, setRightTab] = useState<'plan' | 'debts' | 'close'>('plan');
  const [items, setItems] = useState(initial.actionItems);
  const [endOpen, setEndOpen] = useState(false);
  const [endReason, setEndReason] = useState('');

  const notes = useNotesAutosave(s.id, { version: initial.note!.version, fields: initial.note!.fields }, live);
  const elapsed = useElapsed(s.startedAt, initial.serverNow);
  const recoveredToast = useRef(false);
  useEffect(() => {
    if (notes.recovered && !recoveredToast.current) { recoveredToast.current = true; showToast(`Recovered ${notes.recovered} unsaved note field${notes.recovered > 1 ? 's' : ''} from this device.`, 'success'); }
  }, [notes.recovered, showToast]);

  const stepProgressByIndex = useMemo(() => new Map(initial.stepProgress.map((p) => [p.stepIndex, p])), [initial.stepProgress]);
  const current = tpl.steps[step];
  const plannedStart = tpl.steps.slice(0, step).reduce((a, b) => a + b.minutes, 0);
  const plannedEnd = plannedStart + current.minutes;
  const behind = elapsed / 60 > plannedEnd;

  const goTo = async (next: number) => {
    if (next < 0 || next >= tpl.steps.length || next === step || !live) return;
    const prev = step;
    setStep(next);
    try { await coachingService.goToStep(s.id, next); } catch (e) { setStep(prev); showToast(parseApiError(e).message, 'error'); }
  };

  const endWithoutCompleting = async () => {
    try {
      await notes.flush();
      await coachingService.abandon(s.id, endReason.trim());
      showToast('Session ended without completion.', 'success');
      navigate('/dashboard');
    } catch (e) { showToast(parseApiError(e).message, 'error'); }
  };

  const consentLost = live && !initial.consent.active;
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg-secondary)]">
      {/* ── top bar ── */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-4 py-3 lg:px-6">
        <Link to="/dashboard" className="flex items-center gap-1 font-outfit text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]" aria-label="Back to dashboard"><ArrowLeft className="h-4 w-4" />Exit</Link>
        <div className="min-w-0">
          <p className="truncate font-jakarta text-[16px] font-semibold text-[var(--color-text-primary)]">{initial.employee.name}</p>
          <p className="truncate font-outfit text-[12px] text-[var(--color-text-tertiary)]">Session {s.sessionNumber} · {tpl.title}{initial.employee.company ? ` · ${initial.employee.company}` : ''}</p>
        </div>
        <Pill tone={statusTone(s.status)}>{label(s.status)}</Pill>
        {tpl.isPlaceholderContent && <Pill tone="warning">Placeholder script</Pill>}
        <div className="ml-auto flex items-center gap-5">
          {live && <Button size="sm" variant="danger" onClick={() => setHelpOpen(true)}>I need help</Button>}
          <SaveIndicator status={notes.status} savedAt={notes.savedAt} />
          {live && (
            <div className="text-right" aria-label="Session timer">
              <p className={`font-jakarta text-[22px] font-semibold tabular-nums ${elapsed / 60 > tpl.durationMinutes ? 'text-[var(--color-error-dark)]' : 'text-[var(--color-text-primary)]'}`}>{mmss(elapsed)}</p>
              <p className="font-outfit text-[11px] text-[var(--color-text-tertiary)]">of {tpl.durationMinutes}:00</p>
            </div>
          )}
        </div>
      </header>

      {consentLost && (
        <div role="alert" className="bg-[var(--color-error-bg)] px-6 py-3 font-outfit text-[14px] text-[var(--color-error-dark)]">
          The employee has withdrawn consent. Notes can no longer be recorded. You can end this session without completing it.
        </div>
      )}
      {notes.message && notes.status !== 'saved' && (
        <div role="status" className="bg-[var(--color-warning-bg)] px-6 py-2 font-outfit text-[13px] text-[var(--color-warning-darkest)]">{notes.message}</div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[220px_minmax(0,1fr)_380px] lg:p-6">
        {/* ── step rail ── */}
        <nav aria-label="Session steps" className="rounded-[16px] bg-[var(--color-bg-card)] p-3 lg:sticky lg:top-24 lg:self-start">
          <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {tpl.steps.map((st, i) => {
              const done = !!stepProgressByIndex.get(i)?.completedAt || i < step;
              const active = i === step;
              return (
                <li key={st.key} className="shrink-0">
                  <button disabled={!live} onClick={() => goTo(i)} aria-current={active ? 'step' : undefined}
                    className={`flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left font-outfit text-[13px] transition-colors ${active ? 'bg-[var(--color-primary-lightest)] font-semibold text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'}`}>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${done && !active ? 'bg-[var(--color-success)] text-white' : active ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-tertiary)]'}`}>{done && !active ? '✓' : i + 1}</span>
                    <span className="flex-1">{st.title}</span>
                    <span className="text-[11px] text-[var(--color-text-tertiary)]">{st.minutes}m</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-3 hidden h-1.5 overflow-hidden rounded-full bg-[var(--color-bg-tertiary)] lg:block" role="progressbar" aria-valuemin={0} aria-valuemax={tpl.steps.length} aria-valuenow={step + 1}>
            <div className="h-full bg-[var(--color-primary)] transition-all" style={{ width: `${((step + 1) / tpl.steps.length) * 100}%` }} />
          </div>
        </nav>

        {/* ── guidance + notes ── */}
        <main className="flex min-w-0 flex-col gap-4">
          <section className="rounded-[16px] bg-[var(--color-bg-card)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="font-jakarta text-[20px] font-semibold text-[var(--color-text-primary)]">Step {step + 1}: {current.title}</h1>
              <span className={`font-outfit text-[13px] ${behind && live ? 'text-[var(--color-warning-dark)]' : 'text-[var(--color-text-tertiary)]'}`}>
                {current.minutes} min · target {plannedStart}–{plannedEnd} min{behind && live ? ' · running behind' : ''}
              </span>
            </div>
            {step === 0 && <p className="mt-2 rounded-[10px] bg-[var(--color-bg-secondary)] px-3 py-2 font-outfit text-[13px] text-[var(--color-text-secondary)]"><b>Objective:</b> {tpl.objective}</p>}
            <p className="mt-3 whitespace-pre-line font-outfit text-[15px] leading-relaxed text-[var(--color-text-primary)]">{current.instructions || 'No instructions configured for this step.'}</p>
            {current.questions.length > 0 && (<><h3 className="mt-4 font-jakarta text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">Ask</h3><ul className="mt-1 list-disc space-y-1 pl-5 font-outfit text-[14px]">{current.questions.map((q, i) => <li key={i}>{q}</li>)}</ul></>)}
            {current.discussionPoints.length > 0 && (<><h3 className="mt-4 font-jakarta text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">Discuss</h3><ul className="mt-1 list-disc space-y-1 pl-5 font-outfit text-[14px]">{current.discussionPoints.map((q, i) => <li key={i}>{q}</li>)}</ul></>)}
            {current.recommendedTools.length > 0 && <p className="mt-4 font-outfit text-[13px] text-[var(--color-text-secondary)]"><b>Recommended tools:</b> {current.recommendedTools.join(', ')} <span className="text-[var(--color-text-tertiary)]">(in-session calculators arrive in a later release)</span></p>}
            <div className="mt-5 flex items-center justify-between">
              <Button variant="neutral" size="sm" iconLeft={<ArrowLeft className="h-4 w-4" />} disabled={step === 0 || !live} onClick={() => goTo(step - 1)}>Previous</Button>
              <Button size="sm" iconRight={<ArrowRight className="h-4 w-4" />} disabled={step === tpl.steps.length - 1 || !live} onClick={() => goTo(step + 1)}>Next step</Button>
            </div>
          </section>

          <NotesPanel
            fields={notes.fields} onChange={notes.setField} editable={live && notes.status !== 'locked'}
            required={tpl.requiredNoteFields} conflict={notes.conflict} onKeepMine={notes.keepMine} onUseServer={notes.useServer}
          />
        </main>

        {/* ── right: action plan / debts / close ── */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
          <div role="tablist" className="flex rounded-[12px] bg-[var(--color-bg-card)] p-1">
            {([['plan', 'Action plan'], ['debts', 'Debts'], ['close', 'Close session']] as const).map(([k, t]) => (
              <button key={k} role="tab" aria-selected={rightTab === k} onClick={() => setRightTab(k)}
                className={`flex-1 rounded-[8px] px-2 py-2 font-outfit text-[13px] font-medium ${rightTab === k ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)]'}`}>{t}</button>
            ))}
          </div>
          {rightTab === 'plan' && <ActionPlanPanel sessionId={s.id} items={items} setItems={setItems} editable={live} />}
          {rightTab === 'debts' && <DebtsPanel sessionId={s.id} editable={live && !consentLost} />}
          {rightTab === 'close' && (
            <ClosePanel
              state={initial} itemsVersion={items.length} editable={live}
              flushNotes={notes.flush} hasUnsaved={notes.hasUnsaved}
              onCompleted={() => { showToast('Session completed.', 'success'); navigate('/dashboard'); }}
              onChanged={reload}
            />
          )}
          {live && <button onClick={() => setEndOpen(true)} className="self-start font-outfit text-[13px] text-[var(--color-text-tertiary)] underline hover:text-[var(--color-error-dark)]">End without completing…</button>}
        </aside>
      </div>

      <RaiseEscalationModal open={helpOpen} onClose={() => setHelpOpen(false)} employeeId={initial.employee.id} sessionId={s.id} />
      <Modal isOpen={endOpen} onClose={() => setEndOpen(false)} header={<span className="font-jakarta font-semibold">End session without completing?</span>} size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="neutral" onClick={() => setEndOpen(false)}>Keep going</Button><Button variant="danger" disabled={endReason.trim().length < 5} onClick={endWithoutCompleting}>End session</Button></div>}>
        <p className="mb-3 font-outfit text-[14px] text-[var(--color-text-secondary)]">The session will be cancelled and cannot be resumed. Tell us why:</p>
        <textarea value={endReason} onChange={(e) => setEndReason(e.target.value)} rows={3} maxLength={500} aria-label="Reason" className="w-full rounded-[10px] border border-[var(--color-border-primary)] p-3 font-outfit text-[14px]" />
      </Modal>
    </div>
  );
};
