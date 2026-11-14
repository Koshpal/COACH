import React, { useState } from 'react';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/common/Modal';
import api from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { opsError, opsService, type Correction } from '../../services/coachingOps.service';
import { Card, Empty, Pill, SectionError, SectionSkeleton, fmtDate, label } from '../Coaching/ui';
import { TextArea, statusPill } from './shared';

interface Quiz { id: string; title: string; passScore: number; questions: { id: string; text: string; options: string[] }[] }

const QuizModal: React.FC<{ id: string | null; onClose: () => void; onDone: () => void }> = ({ id, onClose, onDone }) => {
  const { showToast } = useToast();
  const quiz = useAsync(() => (id ? api.get<Quiz>(`/coach/learning/assessments/${id}`).then((r) => r.data) : Promise.resolve(null)), [id]);
  const [ans, setAns] = useState<Record<string, number>>({}); const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ scorePercent: number; passed: boolean; passScore: number } | null>(null);
  const q = quiz.data;
  const submit = async () => { if (!id) return; setBusy(true); try { setRes(await opsService.attempt(id, ans)); onDone(); } catch (e) { showToast(opsError(e), 'error'); } finally { setBusy(false); } };
  const close = () => { setAns({}); setRes(null); onClose(); };
  return (
    <Modal isOpen={!!id} onClose={close} header={<span className="font-jakarta font-semibold">{q?.title ?? 'Assessment'}</span>} size="lg"
      footer={<div className="flex justify-end gap-2"><Button variant="neutral" onClick={close}>{res ? 'Close' : 'Cancel'}</Button>{!res && <Button loading={busy} disabled={!q || Object.keys(ans).length < q.questions.length} onClick={submit}>Submit answers</Button>}</div>}>
      {quiz.loading ? <SectionSkeleton rows={3} /> : quiz.error || !q ? <SectionError message={quiz.error ?? 'Not found'} /> : res ? (
        <div className={`rounded-[12px] px-4 py-5 text-center font-outfit ${res.passed ? 'bg-[var(--color-success-bg)] text-[var(--color-success-darkest)]' : 'bg-[var(--color-error-bg)] text-[var(--color-error-dark)]'}`}>
          <div className="font-jakarta text-[28px] font-bold">{res.scorePercent}%</div><div>{res.passed ? 'Passed' : `Not passed — you need ${res.passScore}%. Review the material and try again.`}</div></div>
      ) : (
        <ol className="flex flex-col gap-5">{q.questions.map((qq, i) => (
          <li key={qq.id}><p className="mb-2 font-jakarta text-[15px] font-semibold">{i + 1}. {qq.text}</p>
            <div className="flex flex-col gap-1.5">{qq.options.map((o, j) => (<label key={j} className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-[var(--color-border-primary)] px-3 py-2 font-outfit text-[14px] has-[:checked]:border-[var(--color-primary)]"><input type="radio" name={qq.id} checked={ans[qq.id] === j} onChange={() => setAns((s) => ({ ...s, [qq.id]: j }))} />{o}</label>))}</div></li>))}</ol>)}
    </Modal>
  );
};

const CorrectionRow: React.FC<{ c: Correction; onDone: () => void }> = ({ c, onDone }) => {
  const { showToast } = useToast(); const [text, setText] = useState(''); const [busy, setBusy] = useState(false);
  const act = async (a: 'ADDRESS' | 'DECLINE') => { setBusy(true); try { await opsService.respondCorrection(c.id, a, text.trim()); showToast(a === 'ADDRESS' ? 'Addendum added to the session notes' : 'Your reply was recorded', 'success'); onDone(); } catch (e) { showToast(opsError(e), 'error'); } finally { setBusy(false); } };
  return (
    <li className="rounded-[12px] border border-[var(--color-border-primary)] p-4">
      <div className="flex items-center justify-between gap-2"><span className="font-jakarta text-[14px] font-semibold">{c.fieldKey ? `Note field: ${label(c.fieldKey.replace(/([A-Z])/g, '_$1'))}` : 'Session notes'}</span><Pill tone={statusPill(c.status)}>{label(c.status)}</Pill></div>
      <p className="mt-1 font-outfit text-[14px]">{c.reason}</p><p className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">Requested {fmtDate(c.createdAt)}</p>
      {c.status === 'OPEN' ? (
        <div className="mt-3 flex flex-col gap-2"><TextArea rows={2} placeholder="Your clarification (added next to the original notes — the original is never changed)" value={text} onChange={(e) => setText(e.target.value)} maxLength={3000} />
          <div className="flex justify-end gap-2"><Button size="sm" variant="neutral" loading={busy} disabled={!text.trim()} onClick={() => act('DECLINE')}>Decline with reason</Button><Button size="sm" loading={busy} disabled={!text.trim()} onClick={() => act('ADDRESS')}>Add addendum</Button></div></div>
      ) : c.response && <p className="mt-2 rounded-[8px] bg-[var(--color-bg-secondary)] px-3 py-2 font-outfit text-[13px]">{c.response}</p>}
    </li>);
};

export const Learning: React.FC = () => {
  const { showToast } = useToast();
  const path = useAsync(() => opsService.learning(), []);
  const corr = useAsync(() => opsService.corrections(), []);
  const [quizId, setQuizId] = useState<string | null>(null);
  const read = async (id: string) => { try { await opsService.completeReading(id); path.reload(); } catch (e) { showToast(opsError(e), 'error'); } };
  const cert = path.data?.certification;
  return (
    <div className="flex flex-col gap-6">
      <Header title="Learning & quality" />
      <Card title="Certification">
        {path.loading ? <SectionSkeleton rows={1} /> : path.error ? <SectionError message={path.error} onRetry={path.reload} /> : cert && (
          <div className="flex flex-wrap items-center gap-3"><Pill tone={statusPill(cert.status)}>{label(cert.status)}</Pill>
            <span className="font-outfit text-[14px] text-[var(--color-text-secondary)]">{cert.status === 'CERTIFIED' ? `Valid until ${fmtDate(cert.expiresAt)}` : cert.readyForApproval ? 'All required modules are complete — waiting for administrator approval.' : 'Complete the required modules below.'}</span></div>)}
      </Card>
      <Card title="Learning path">
        {path.loading ? <SectionSkeleton rows={3} /> : !path.data?.modules.length ? <Empty>No learning modules have been set up yet.</Empty> : (
          <ul className="flex flex-col gap-3">
            {path.data.modules.map((m) => (
              <li key={m.id} className="rounded-[12px] border border-[var(--color-border-primary)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-jakarta text-[15px] font-semibold">{m.title}</span><span className="flex gap-2">{!m.isRequired && <Pill>Optional</Pill>}<Pill tone={statusPill(m.status)}>{label(m.status)}</Pill></span></div>
                <p className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">{label(m.kind)}{m.requiredCount > 1 ? ` · ${m.completedCount}/${m.requiredCount} verified` : ''}</p>
                {m.description && <p className="mt-1 font-outfit text-[14px] text-[var(--color-text-secondary)]">{m.description}</p>}
                {m.isPlaceholderContent && m.kind === 'READING' && <p className="mt-1 font-outfit text-[12px] text-[var(--color-warning-darkest)]">Content for this module has not been written yet.</p>}
                {m.content && <div className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-[8px] bg-[var(--color-bg-secondary)] p-3 font-outfit text-[13px]">{m.content}</div>}
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {m.kind === 'READING' && m.status !== 'COMPLETED' && <Button size="sm" onClick={() => read(m.id)}>Mark as read</Button>}
                  {m.kind === 'ASSESSMENT' && m.assessments.map((a) => <Button key={a.id} size="sm" variant="tertiary" onClick={() => setQuizId(a.id)}>{m.status === 'COMPLETED' ? 'Retake' : 'Take'} “{a.title}” (pass {a.passScore}%)</Button>)}
                  {['ROLE_PLAY', 'SHADOWING', 'SUPERVISED'].includes(m.kind) && m.status !== 'COMPLETED' && <span className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">Verified by an administrator after you complete it.</span>}
                </div>
              </li>))}
          </ul>)}
      </Card>
      <Card title="Review requests from quality">
        {corr.loading ? <SectionSkeleton rows={2} /> : corr.error ? <SectionError message={corr.error} onRetry={corr.reload} /> : !corr.data?.length ? <Empty>No review requests.</Empty> : <ul className="flex flex-col gap-3">{corr.data.map((c) => <CorrectionRow key={c.id} c={c} onDone={corr.reload} />)}</ul>}
      </Card>
      <QuizModal id={quizId} onClose={() => setQuizId(null)} onDone={path.reload} />
    </div>
  );
};
