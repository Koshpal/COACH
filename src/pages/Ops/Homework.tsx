import React, { useState } from 'react';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/ui/Button';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { coachingService } from '../../services/coaching.service';
import { opsError, opsService } from '../../services/coachingOps.service';
import { Card, Empty, Pill, SectionError, SectionSkeleton, fmtDate, label } from '../Coaching/ui';
import { Field, Select, TextArea, TextInput, statusPill } from './shared';

export const Homework: React.FC = () => {
  const { showToast } = useToast();
  const employees = useAsync(() => coachingService.employees({ pageSize: 100 }), []);
  const sheets = useAsync(() => opsService.worksheets(), []);
  const [emp, setEmp] = useState(''); const [tpl, setTpl] = useState(''); const [due, setDue] = useState(''); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
  const list = useAsync(() => opsService.homework(emp || undefined), [emp]);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});

  const assign = async () => {
    setBusy(true);
    try { await opsService.assignHomework({ employeeId: emp, templateId: tpl, dueDate: due ? new Date(`${due}T18:00:00`).toISOString() : undefined, instructions: note.trim() || undefined }); showToast('Homework assigned. The employee will be reminded before it is due.', 'success'); setNote(''); list.reload(); } catch (e) { showToast(opsError(e), 'error'); } finally { setBusy(false); }
  };
  const review = async (id: string) => { try { await opsService.reviewHomework(id, reviewNote[id]?.trim() || undefined); showToast('Marked as reviewed', 'success'); list.reload(); } catch (e) { showToast(opsError(e), 'error'); } };

  return (
    <div className="flex flex-col gap-6">
      <Header title="Homework" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Card title="Assign a worksheet">
          <div className="flex flex-col gap-4">
            <Field label="Employee"><Select value={emp} onChange={(e) => setEmp(e.target.value)}><option value="">Select an employee…</option>{employees.data?.items.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></Field>
            <Field label="Worksheet" hint={!sheets.loading && !sheets.data?.length ? 'No worksheets exist yet. An administrator creates them.' : undefined}><Select value={tpl} onChange={(e) => setTpl(e.target.value)}><option value="">Select a worksheet…</option>{sheets.data?.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</Select></Field>
            <Field label="Due date (optional)"><TextInput type="date" value={due} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDue(e.target.value)} /></Field>
            <Field label="Instructions (optional)"><TextArea rows={3} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} /></Field>
            <Button loading={busy} disabled={!emp || !tpl} onClick={assign}>Assign</Button>
          </div>
        </Card>
        <Card title={emp ? 'Homework for this employee' : 'All my assigned homework'}>
          {list.loading ? <SectionSkeleton rows={3} /> : list.error ? <SectionError message={list.error} onRetry={list.reload} /> : !list.data?.length ? <Empty>Nothing assigned yet.</Empty> : (
            <ul className="flex flex-col gap-3">
              {list.data.map((h) => (
                <li key={h.id} className="rounded-[12px] border border-[var(--color-border-primary)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-jakarta text-[15px] font-semibold">{h.template.title}</span><Pill tone={statusPill(h.status)}>{label(h.status)}</Pill></div>
                  <p className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">{h.dueDate ? `Due ${fmtDate(h.dueDate)}` : 'No due date'}{h.submittedAt ? ` · Submitted ${fmtDate(h.submittedAt)}` : ''}</p>
                  {(h.status === 'SUBMITTED' || h.status === 'REVIEWED') && (
                    <dl className="mt-3 flex flex-col gap-2">{h.template.fields.map((f) => (<div key={f.key}><dt className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">{f.label}</dt><dd className="whitespace-pre-wrap font-outfit text-[14px]">{h.answers[f.key] ?? '—'}</dd></div>))}</dl>)}
                  {h.status === 'SUBMITTED' && (
                    <div className="mt-3 flex flex-col gap-2"><TextArea rows={2} placeholder="Feedback for the employee (optional)" value={reviewNote[h.id] ?? ''} maxLength={2000} onChange={(e) => setReviewNote((s) => ({ ...s, [h.id]: e.target.value }))} /><div className="flex justify-end"><Button size="sm" onClick={() => review(h.id)}>Mark reviewed</Button></div></div>)}
                </li>))}
            </ul>)}
        </Card>
      </div>
    </div>
  );
};
