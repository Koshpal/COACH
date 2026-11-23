import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/ui/Button';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { coachingService } from '../../services/coaching.service';
import { opsError, opsService, type Worksheet, type WorksheetField } from '../../services/coachingOps.service';
import { Card, Empty, Pill, SectionError, SectionSkeleton, fmtDate, label } from '../Coaching/ui';
import { Field, Select, TextArea, TextInput, statusPill } from './shared';

const CATEGORY_LABEL: Record<string, string> = {
  BUDGETING: 'Budgeting', SPENDING: 'Spending', SAVINGS: 'Savings', DEBT: 'Debt', GOALS: 'Goals',
  PLANNING: 'Planning', PROTECTION: 'Protection', MINDSET: 'Mindset', FOLLOW_UP: 'Follow-up', GENERAL: 'General',
};
const TYPE_HINT: Record<WorksheetField['type'], string> = { text: 'Short answer', longtext: 'Written answer', number: 'Number', choice: 'Pick one', scale: 'Rate 1 to 5' };

const isoDay = (offsetDays: number) => { const d = new Date(); d.setDate(d.getDate() + offsetDays); return d.toISOString().slice(0, 10); };
const showAnswer = (f: WorksheetField, v: string | number | undefined) => (v == null || v === '' ? '—' : f.type === 'scale' ? `${v} / 5` : String(v));

/** Worksheet picker: cards in the page (no dropdown), filtered by topic, with a preview of what the employee will answer. */
const WorksheetPicker: React.FC<{ sheets: Worksheet[]; value: string; onChange: (id: string) => void }> = ({ sheets, value, onChange }) => {
  const [cat, setCat] = useState('ALL');
  const cats = useMemo(() => ['ALL', ...Array.from(new Set(sheets.map((s) => s.category)))], [sheets]);
  const shown = cat === 'ALL' ? sheets : sheets.filter((s) => s.category === cat);
  const picked = sheets.find((s) => s.id === value);
  const chip = (on: boolean) => `rounded-full border px-3 py-1 font-outfit text-[12px] transition-colors ${on ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'}`;
  return (
    <div className="flex flex-col gap-3">
      {cats.length > 2 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter worksheets by topic">
          {cats.map((c) => <button key={c} type="button" className={chip(cat === c)} onClick={() => setCat(c)}>{c === 'ALL' ? 'All' : CATEGORY_LABEL[c] ?? label(c)}</button>)}
        </div>
      )}
      <div role="radiogroup" aria-label="Worksheet" className="flex max-h-[360px] flex-col gap-2 overflow-y-auto pr-1">
        {shown.map((s) => {
          const on = s.id === value;
          return (
            <button key={s.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(s.id)}
              className={`flex items-start gap-3 rounded-[12px] border p-3 text-left transition-colors ${on ? 'border-[var(--color-primary)] bg-[var(--color-info-bg)]' : 'border-[var(--color-border-primary)] hover:border-[var(--color-primary)]'}`}>
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border-primary)]'}`}>{on && <Check className="h-3 w-3" />}</span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2"><span className="font-jakarta text-[14px] font-semibold text-[var(--color-text-primary)]">{s.title}</span><Pill tone="neutral">{CATEGORY_LABEL[s.category] ?? label(s.category)}</Pill></span>
                {s.description && <span className="mt-0.5 block font-outfit text-[13px] text-[var(--color-text-secondary)]">{s.description}</span>}
                <span className="mt-1 block font-outfit text-[12px] text-[var(--color-text-tertiary)]">{s.estimatedMinutes ? `About ${s.estimatedMinutes} min · ` : ''}{s.fields.length} question{s.fields.length === 1 ? '' : 's'}</span>
              </span>
            </button>
          );
        })}
        {!shown.length && <Empty>No worksheets in this topic.</Empty>}
      </div>
      {picked && (
        <div className="rounded-[12px] bg-[var(--color-bg-secondary)] p-3">
          <p className="mb-2 font-jakarta text-[12px] font-semibold text-[var(--color-text-secondary)]">What the employee will answer</p>
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 font-outfit text-[13px]">
            {picked.fields.map((f) => <li key={f.key}>{f.label}{f.required ? ' *' : ''} <span className="text-[var(--color-text-tertiary)]">· {TYPE_HINT[f.type]}</span></li>)}
          </ol>
        </div>
      )}
    </div>
  );
};

export const Homework: React.FC = () => {
  const { showToast } = useToast();
  const [params] = useSearchParams();
  const employees = useAsync(() => coachingService.employees({ pageSize: 100 }), []);
  const sheets = useAsync(() => opsService.worksheets(), []);
  const [emp, setEmp] = useState(params.get('employee') ?? ''); const [tpl, setTpl] = useState(''); const [due, setDue] = useState(isoDay(7)); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
  const list = useAsync(() => opsService.homework(emp || undefined), [emp]);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});

  const assign = async () => {
    setBusy(true);
    try { await opsService.assignHomework({ employeeId: emp, templateId: tpl, dueDate: due ? new Date(`${due}T18:00:00`).toISOString() : undefined, instructions: note.trim() || undefined }); showToast('Worksheet assigned. The employee will be reminded before it is due.', 'success'); setNote(''); setTpl(''); list.reload(); } catch (e) { showToast(opsError(e), 'error'); } finally { setBusy(false); }
  };
  const review = async (id: string) => { try { await opsService.reviewHomework(id, reviewNote[id]?.trim() || undefined); showToast('Marked as reviewed', 'success'); list.reload(); } catch (e) { showToast(opsError(e), 'error'); } };
  const ordered = useMemo(() => [...(list.data ?? [])].sort((a, b) => Number(b.status === 'SUBMITTED') - Number(a.status === 'SUBMITTED')), [list.data]);
  const toReview = ordered.filter((h) => h.status === 'SUBMITTED').length;
  const dayChip = (d: number, text: string) => <button key={d} type="button" onClick={() => setDue(isoDay(d))} className={`rounded-full border px-3 py-1 font-outfit text-[12px] ${due === isoDay(d) ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-[var(--color-border-primary)] text-[var(--color-text-secondary)]'}`}>{text}</button>;

  return (
    <div className="flex flex-col gap-6">
      <Header title="Homework" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card title="Assign a worksheet">
          <div className="flex flex-col gap-5">
            <Field label="Employee"><Select value={emp} onChange={(e) => setEmp(e.target.value)}><option value="">Select an employee…</option>{employees.data?.items.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></Field>
            <Field group label="Worksheet" hint={!sheets.loading && !sheets.data?.length ? 'No worksheets are available yet.' : undefined}>
              {sheets.loading ? <SectionSkeleton rows={3} /> : sheets.error ? <SectionError message={sheets.error} onRetry={sheets.reload} /> : <WorksheetPicker sheets={sheets.data ?? []} value={tpl} onChange={setTpl} />}
            </Field>
            <Field group label="Due date (optional)">
              <div className="flex flex-col gap-2"><div className="flex flex-wrap gap-2">{dayChip(3, 'In 3 days')}{dayChip(7, 'In a week')}{dayChip(14, 'In 2 weeks')}</div>
                <TextInput type="date" value={due} min={isoDay(0)} onChange={(e) => setDue(e.target.value)} /></div>
            </Field>
            <Field label="Note for the employee (optional)" hint="Shown above the worksheet, for example what to focus on."><TextArea rows={3} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} /></Field>
            <Button loading={busy} disabled={!emp || !tpl} onClick={assign}>Assign worksheet</Button>
          </div>
        </Card>
        <Card title={emp ? 'Worksheets for this employee' : 'All my assigned worksheets'} action={toReview > 0 ? <Pill tone="info">{toReview} to review</Pill> : undefined}>
          {list.loading ? <SectionSkeleton rows={3} /> : list.error ? <SectionError message={list.error} onRetry={list.reload} /> : !ordered.length ? <Empty>Nothing assigned yet. Pick an employee and a worksheet to get started.</Empty> : (
            <ul className="flex flex-col gap-3">
              {ordered.map((h) => (
                <li key={h.id} className="rounded-[12px] border border-[var(--color-border-primary)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-jakarta text-[15px] font-semibold">{h.template.title}</span><Pill tone={statusPill(h.status)}>{label(h.status)}</Pill></div>
                  <p className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">{h.dueDate ? `Due ${fmtDate(h.dueDate)}` : 'No due date'}{h.submittedAt ? ` · Submitted ${fmtDate(h.submittedAt)}` : ''}</p>
                  {(h.status === 'SUBMITTED' || h.status === 'REVIEWED') && (
                    <dl className="mt-3 flex flex-col gap-2">{h.template.fields.map((f) => (<div key={f.key}><dt className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">{f.label}</dt><dd className="whitespace-pre-wrap font-outfit text-[14px]">{showAnswer(f, h.answers[f.key])}</dd></div>))}</dl>)}
                  {h.status === 'SUBMITTED' && (
                    <div className="mt-3 flex flex-col gap-2"><TextArea rows={2} placeholder="Feedback for the employee (optional)" value={reviewNote[h.id] ?? ''} maxLength={2000} onChange={(e) => setReviewNote((s) => ({ ...s, [h.id]: e.target.value }))} /><div className="flex justify-end"><Button size="sm" onClick={() => review(h.id)}>Mark reviewed</Button></div></div>)}
                </li>))}
            </ul>)}
        </Card>
      </div>
    </div>
  );
};
