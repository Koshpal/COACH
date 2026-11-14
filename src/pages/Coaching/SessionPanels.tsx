import { usePolling } from '../../hooks/usePolling';
import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Trash2, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { coachingService, parseApiError, type ActionItem, type ClosureCheck, type RunnerState } from '../../services/coaching.service';
import { Card, Empty, fmtDate, inr, Pill } from './ui';

const field = 'w-full rounded-[10px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-3 py-2 font-outfit text-[14px] outline-none focus:border-[var(--color-primary)] disabled:opacity-60';
const lbl = 'mb-1 block font-jakarta text-[12px] font-semibold text-[var(--color-text-secondary)]';
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const tomorrowIso = () => isoDay(new Date(Date.now() + 86_400_000));

/* ───────────────────────── Action plan ───────────────────────── */

export const ActionPlanPanel: React.FC<{ sessionId: string; items: ActionItem[]; setItems: React.Dispatch<React.SetStateAction<ActionItem[]>>; editable: boolean }> = ({ sessionId, items, setItems, editable }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState({ title: '', kind: 'ACTION', ownerType: 'EMPLOYEE', dueDate: tomorrowIso() });
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const item = await coachingService.addItem(sessionId, { ...form, dueDate: new Date(`${form.dueDate}T12:00:00+05:30`).toISOString() });
      setItems((prev) => [...prev, item]);
      setForm((f) => ({ ...f, title: '' }));
    } catch (err) { showToast(parseApiError(err).message, 'error'); } finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    try { await coachingService.removeItem(id); setItems((prev) => prev.filter((i) => i.id !== id)); } catch (err) { showToast(parseApiError(err).message, 'error'); }
  };

  return (
    <Card title="Action plan">
      {items.length === 0 ? <Empty>No actions yet. Every action needs an owner and a due date.</Empty> : (
        <ul className="mb-4 flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.id} className="flex items-start justify-between gap-2 rounded-[10px] bg-[var(--color-bg-secondary)] p-3">
              <div className="min-w-0">
                <p className="font-outfit text-[14px] font-medium text-[var(--color-text-primary)]">{i.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 font-outfit text-[12px] text-[var(--color-text-tertiary)]">
                  <Pill tone={i.kind === 'HOMEWORK' ? 'info' : 'neutral'}>{i.kind === 'HOMEWORK' ? 'Homework' : 'Action'}</Pill>
                  Owner: {i.ownerType === 'EMPLOYEE' ? 'Employee' : 'You'} · Due {fmtDate(i.dueDate)}
                </p>
              </div>
              {editable && <button onClick={() => remove(i.id)} aria-label={`Remove ${i.title}`} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error-dark)]"><Trash2 className="h-4 w-4" /></button>}
            </li>
          ))}
        </ul>
      )}
      {editable && (
        <form onSubmit={add} className="flex flex-col gap-3">
          <div><label className={lbl} htmlFor="ai-title">What needs to happen?</label><input id="ai-title" className={field} value={form.title} maxLength={200} required onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className={lbl} htmlFor="ai-kind">Type</label><select id="ai-kind" className={field} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}><option value="ACTION">Action</option><option value="HOMEWORK">Homework</option></select></div>
            <div><label className={lbl} htmlFor="ai-owner">Owner</label><select id="ai-owner" className={field} value={form.ownerType} onChange={(e) => setForm({ ...form, ownerType: e.target.value })}><option value="EMPLOYEE">Employee</option><option value="COACH">Me</option></select></div>
            <div><label className={lbl} htmlFor="ai-due">Due</label><input id="ai-due" type="date" required min={isoDay(new Date())} className={field} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
          </div>
          <Button type="submit" size="sm" loading={busy} disabled={!form.title.trim()}>Add to plan</Button>
        </form>
      )}
    </Card>
  );
};

/* ───────────────────────── Debts ───────────────────────── */

export const DebtsPanel: React.FC<{ sessionId: string; editable: boolean }> = ({ sessionId, editable }) => {
  const { showToast } = useToast();
  const blank = { lender: '', debtType: 'Credit card', outstanding: '', interestRatePct: '', emiAmount: '' };
  const [form, setForm] = useState(blank);
  const [added, setAdded] = useState<{ lender: string; outstanding: number }[]>([]);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await coachingService.recordDebt(sessionId, {
        lender: form.lender, debtType: form.debtType, outstanding: Number(form.outstanding),
        ...(form.interestRatePct && { interestRatePct: Number(form.interestRatePct) }), ...(form.emiAmount && { emiAmount: Number(form.emiAmount) }),
      });
      setAdded((a) => [...a, { lender: form.lender, outstanding: Number(form.outstanding) }]);
      setForm(blank);
      showToast('Debt recorded.', 'success');
    } catch (err) { showToast(parseApiError(err).message, 'error'); } finally { setBusy(false); }
  };

  return (
    <Card title="Record a debt">
      <p className="mb-3 font-outfit text-[12px] text-[var(--color-text-tertiary)]">Record debts the employee tells you about. Visible only to you and the employee.</p>
      {added.length > 0 && <ul className="mb-3 space-y-1 font-outfit text-[13px]">{added.map((d, i) => <li key={i} className="flex justify-between rounded-[8px] bg-[var(--color-bg-secondary)] px-3 py-1.5"><span>{d.lender}</span><span>{inr(d.outstanding)}</span></li>)}</ul>}
      {editable ? (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl} htmlFor="d-lender">Lender</label><input id="d-lender" required className={field} value={form.lender} maxLength={120} onChange={(e) => setForm({ ...form, lender: e.target.value })} /></div>
            <div><label className={lbl} htmlFor="d-type">Type</label><input id="d-type" required className={field} value={form.debtType} maxLength={60} onChange={(e) => setForm({ ...form, debtType: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className={lbl} htmlFor="d-out">Outstanding ₹</label><input id="d-out" required type="number" min={0} className={field} value={form.outstanding} onChange={(e) => setForm({ ...form, outstanding: e.target.value })} /></div>
            <div><label className={lbl} htmlFor="d-rate">Interest %</label><input id="d-rate" type="number" min={0} max={100} step="0.01" className={field} value={form.interestRatePct} onChange={(e) => setForm({ ...form, interestRatePct: e.target.value })} /></div>
            <div><label className={lbl} htmlFor="d-emi">EMI ₹</label><input id="d-emi" type="number" min={0} className={field} value={form.emiAmount} onChange={(e) => setForm({ ...form, emiAmount: e.target.value })} /></div>
          </div>
          <Button type="submit" size="sm" loading={busy} disabled={!form.lender.trim() || form.outstanding === ''}>Save debt</Button>
        </form>
      ) : <Empty>Debts can be recorded while the session is in progress.</Empty>}
    </Card>
  );
};

/* ───────────────────────── Close session ───────────────────────── */

export const ClosePanel: React.FC<{
  state: RunnerState; itemsVersion: number; editable: boolean;
  flushNotes: () => Promise<boolean>; hasUnsaved: () => boolean; onCompleted: () => void; onChanged: () => void | Promise<void>;
}> = ({ state, itemsVersion, editable, flushNotes, hasUnsaved, onCompleted }) => {
  const { showToast } = useToast();
  const s = state.session;
  const [escalation, setEscalation] = useState(s.escalationAnswer);
  const [homework, setHomework] = useState(s.homeworkDecision);
  const [hwReason, setHwReason] = useState(s.homeworkNotRequiredReason ?? '');
  const [noPlan, setNoPlan] = useState(!!s.actionPlanException);
  const [planReason, setPlanReason] = useState(s.actionPlanException ?? '');
  const [nextReason, setNextReason] = useState(s.nextSessionException ?? '');
  const [checks, setChecks] = useState<Record<string, boolean>>(s.checklistAnswers ?? {});
  const [check, setCheck] = useState<ClosureCheck | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try { setCheck(await coachingService.closureCheck(s.id)); } catch { /* keep the last result */ }
  }, [s.id]);
  useEffect(() => { void refresh(); }, [refresh, itemsVersion]);
  usePolling(refresh, 8000);

  const patch = async (body: Record<string, unknown>) => {
    try { setCheck(await coachingService.updateClosure(s.id, body)); } catch (e) { showToast(parseApiError(e).message, 'error'); }
  };
  const has = (code: string) => !!check?.outstanding.some((o) => o.code === code);
  const radio = 'h-4 w-4 accent-[var(--color-primary)]';

  const complete = async () => {
    setBusy(true);
    try {
      const clean = await flushNotes();
      if (!clean || hasUnsaved()) { showToast('Your notes have not finished saving. Check your connection and try again.', 'error'); return; }
      await coachingService.complete(s.id);
      onCompleted();
    } catch (e) {
      const err = parseApiError(e);
      if (err.outstanding) setCheck({ canComplete: false, outstanding: err.outstanding });
      showToast(err.outstanding ? 'The session cannot be completed yet — see the checklist.' : err.message, 'error');
    } finally { setBusy(false); }
  };

  return (
    <Card title="Close session">
      <div className="flex flex-col gap-5">
        <fieldset disabled={!editable} className="flex flex-col gap-2">
          <legend className="mb-1 font-jakarta text-[13px] font-semibold">Does this case need to be escalated? <span className="text-[var(--color-error-dark)]">*</span></legend>
          {([['NONE_NEEDED', 'No escalation needed'], ['RAISED', 'Yes — describe it in the “Escalation status” note']] as const).map(([v, t]) => (
            <label key={v} className="flex items-center gap-2 font-outfit text-[14px]"><input type="radio" className={radio} name="esc" checked={escalation === v} onChange={() => { setEscalation(v); void patch({ escalationAnswer: v }); }} />{t}</label>
          ))}
        </fieldset>

        <fieldset disabled={!editable} className="flex flex-col gap-2">
          <legend className="mb-1 font-jakarta text-[13px] font-semibold">Homework <span className="text-[var(--color-error-dark)]">*</span></legend>
          <label className="flex items-center gap-2 font-outfit text-[14px]"><input type="radio" className={radio} name="hw" checked={homework === 'ASSIGNED'} onChange={() => { setHomework('ASSIGNED'); void patch({ homeworkDecision: 'ASSIGNED' }); }} />Assigned (add it in the Action plan)</label>
          <label className="flex items-center gap-2 font-outfit text-[14px]"><input type="radio" className={radio} name="hw" checked={homework === 'NOT_REQUIRED'} onChange={() => { setHomework('NOT_REQUIRED'); void patch({ homeworkDecision: 'NOT_REQUIRED' }); }} />Not required</label>
          {homework === 'NOT_REQUIRED' && <textarea aria-label="Why homework is not required" className={field} rows={2} maxLength={1000} placeholder="Why is homework not needed? (min. 10 characters)" value={hwReason} onChange={(e) => setHwReason(e.target.value)} onBlur={() => patch({ homeworkNotRequiredReason: hwReason })} />}
        </fieldset>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 font-outfit text-[14px]"><input type="checkbox" disabled={!editable} className={radio} checked={noPlan} onChange={(e) => { setNoPlan(e.target.checked); if (!e.target.checked) { setPlanReason(''); void patch({ actionPlanException: '' }); } }} />No action plan is needed for this session</label>
          {noPlan && <textarea aria-label="Why no action plan is needed" className={field} rows={2} maxLength={1000} placeholder="Document why (min. 10 characters). Flagged for admin review." value={planReason} onChange={(e) => setPlanReason(e.target.value)} onBlur={() => patch({ actionPlanException: planReason })} />}
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-jakarta text-[13px] font-semibold">Next session</p>
          {!has('NEXT_SESSION_NOT_BOOKED') && !nextReason ? (
            <p className="flex items-center gap-1.5 font-outfit text-[13px] text-[var(--color-success-dark)]"><CheckCircle2 className="h-4 w-4" />Booked, or not required for the final session.</p>
          ) : (
            <>
              <p className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">No upcoming booking found. The employee books sessions in their Koshpal app; if that can't happen yet, record why (flagged for admin review).</p>
              <textarea aria-label="Why the next session is not booked" disabled={!editable} className={field} rows={2} maxLength={1000} placeholder="Reason (min. 10 characters)" value={nextReason} onChange={(e) => setNextReason(e.target.value)} onBlur={() => patch({ nextSessionException: nextReason })} />
            </>
          )}
        </div>

        <fieldset disabled={!editable} className="flex flex-col gap-2">
          <legend className="mb-1 font-jakarta text-[13px] font-semibold">Quality checklist</legend>
          {state.template.closingChecklist.map((c) => (
            <label key={c.key} className="flex items-start gap-2 font-outfit text-[14px]"><input type="checkbox" className={`${radio} mt-0.5`} checked={!!checks[c.key]} onChange={(e) => { const next = { ...checks, [c.key]: e.target.checked }; setChecks(next); void patch({ checklistAnswers: { [c.key]: e.target.checked } }); }} />{c.label}{c.required && <span className="text-[var(--color-error-dark)]"> *</span>}</label>
          ))}
        </fieldset>

        <div role="status" aria-live="polite" className="rounded-[12px] bg-[var(--color-bg-secondary)] p-3">
          {!check ? <p className="font-outfit text-[13px] text-[var(--color-text-tertiary)]">Checking…</p> : check.canComplete ? (
            <p className="flex items-center gap-1.5 font-jakarta text-[14px] font-semibold text-[var(--color-success-dark)]"><CheckCircle2 className="h-4 w-4" />Everything is in place.</p>
          ) : (
            <>
              <p className="mb-2 font-jakarta text-[13px] font-semibold">Still to do ({check.outstanding.length})</p>
              <ul className="space-y-1.5">{check.outstanding.map((o, i) => <li key={`${o.code}-${o.ref ?? i}`} className="flex items-start gap-1.5 font-outfit text-[13px] text-[var(--color-text-secondary)]"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-error)]" />{o.message}</li>)}</ul>
            </>
          )}
        </div>

        <Button onClick={complete} loading={busy} disabled={!editable || !check?.canComplete} fullWidth>Complete session</Button>
        <p className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">Once completed, the notes are locked.</p>
      </div>
    </Card>
  );
};
