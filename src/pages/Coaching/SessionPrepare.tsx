import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/ui/Button';
import { ErrorState, Spinner } from '../../components/common/PageState';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { coachingService, parseApiError } from '../../services/coaching.service';
import { Card, Empty, fmtDate, fmtDateTime, inr, label, Pill } from './ui';
import { IntakeView, SnapshotView } from './ProfileTabs';

const NOTE_LABELS: Record<string, string> = {
  sessionObjective: 'Objective', employeeConcerns: 'Concerns', keyDiscussion: 'Key discussion', financialObservations: 'Observations',
  toolsUsed: 'Tools used', decisionsMade: 'Decisions', employeeCommitments: 'Commitments', coachRecommendations: 'Recommendations',
  escalationStatus: 'Escalation', nextSessionObjective: 'Planned for this session', coachPrivateNotes: 'Your private notes',
};

export const SessionPrepare: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data, loading, error, reload } = useAsync(() => coachingService.prepare(id).catch((e) => { throw new Error(JSON.stringify(parseApiError(e))); }), [id]);
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner label="Preparing your session…" />;
  if (error || !data) {
    let info: { code?: string; message?: string } = {};
    try { info = JSON.parse(error ?? '{}'); } catch { info = { message: error ?? undefined }; }
    return (
      <div className="flex flex-col gap-6">
        <Header title="Prepare session" />
        {info.code === 'CONSENT_REQUIRED' ? (
          <Card title="Consent needed"><p className="font-outfit text-[14px] text-[var(--color-text-secondary)]">This employee has not given — or has withdrawn — consent for coaching, so their information is hidden and the session cannot start. Ask them to review the consent request in their Koshpal app.</p><Link to="/dashboard" className="mt-4 inline-block font-outfit text-[14px] font-medium text-[var(--color-primary)]">Back to dashboard</Link></Card>
        ) : <ErrorState message={info.message ?? 'Could not load the preparation view'} onRetry={reload} />}
      </div>
    );
  }

  const start = async () => {
    setBusy(true);
    try { await coachingService.start(id); navigate(`/sessions/${id}/run`); } catch (e) { showToast(parseApiError(e).message, 'error'); } finally { setBusy(false); }
  };
  const noShow = async () => {
    setBusy(true);
    try { await coachingService.noShow(id); showToast('Marked as no-show.', 'success'); navigate('/dashboard'); } catch (e) { showToast(parseApiError(e).message, 'error'); } finally { setBusy(false); }
  };

  const o = data.overview;
  const past = new Date(data.session.scheduledStart).getTime() < Date.now();
  return (
    <div className="flex flex-col gap-6">
      <Header title="Prepare session" actions={
        <div className="flex gap-2">
          {past && data.session.status === 'SCHEDULED' && <Button variant="neutral" size="sm" onClick={noShow} disabled={busy}>Mark no-show</Button>}
          {data.session.status === 'SCHEDULED' && <Button size="sm" onClick={start} loading={busy}>Start session</Button>}
          {data.session.status === 'IN_PROGRESS' && <Button size="sm" onClick={() => navigate(`/sessions/${id}/run`)}>Resume session</Button>}
        </div>} />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to={`/clients/${o.employee.id}`} className="font-jakarta text-[20px] font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-primary)]">{o.employee.name}</Link>
            <p className="font-outfit text-[13px] text-[var(--color-text-secondary)]">{[o.employee.company, o.employee.department].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="flex flex-wrap gap-2"><Pill tone="info">Session {data.session.sessionNumber} of {o.program?.totalSessions ?? '?'}</Pill><Pill>{fmtDateTime(data.session.scheduledStart)}</Pill>{data.script.isPlaceholderContent && <Pill tone="warning">Placeholder script</Pill>}</div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Last session">
          {data.lastSession?.notes ? (
            <dl className="flex flex-col gap-3">
              <p className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">Session {data.lastSession.sessionNumber}, completed {fmtDate(data.lastSession.completedAt)}</p>
              {Object.entries(data.lastSession.notes).filter(([, v]) => String(v).trim()).map(([k, v]) => (
                <div key={k}><dt className="font-jakarta text-[12px] font-semibold text-[var(--color-text-secondary)]">{NOTE_LABELS[k] ?? k}</dt><dd className="whitespace-pre-line font-outfit text-[14px]">{String(v)}</dd></div>
              ))}
            </dl>
          ) : <Empty>No previous session with you.</Empty>}
        </Card>

        <Card title="Open action items & homework">
          {data.pendingActionItems.length + data.pendingHomework.length === 0 ? <Empty>Nothing outstanding.</Empty> : (
            <ul className="flex flex-col gap-2">
              {[...data.pendingHomework, ...data.pendingActionItems].map((i: any) => (
                <li key={i.id} className="flex items-center justify-between gap-2 rounded-[10px] bg-[var(--color-bg-secondary)] px-3 py-2 font-outfit text-[14px]">
                  <span>{i.title}</span><span className="flex items-center gap-2"><Pill tone={i.kind === 'HOMEWORK' ? 'info' : 'neutral'}>{label(i.kind)}</Pill><span className="text-[12px] text-[var(--color-text-tertiary)]">Due {fmtDate(i.dueDate)}</span></span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Intake assessment"><IntakeView d={data.intake} /></Card>
        <Card title="Financial snapshot"><SnapshotView d={data.financialSnapshot} /></Card>

        <Card title="Goals">
          {data.goals.shared === false ? <Empty>{data.goals.reason}</Empty> : !data.goals.goals?.length ? <Empty>No goals set.</Empty> : (
            <ul className="flex flex-col gap-2">{data.goals.goals.map((g: any) => <li key={g.id} className="flex justify-between rounded-[10px] bg-[var(--color-bg-secondary)] px-3 py-2 font-outfit text-[14px]"><span>{g.title}</span><span>{inr(g.saved)} / {inr(g.target)}</span></li>)}</ul>
          )}
        </Card>
        <Card title="Debts">
          {!data.debts.recorded.length && !data.debts.detectedEmis?.items?.length ? <Empty>No debts recorded yet.</Empty> : (
            <ul className="flex flex-col gap-2">
              {data.debts.recorded.map((d: any) => <li key={d.id} className="flex justify-between rounded-[10px] bg-[var(--color-bg-secondary)] px-3 py-2 font-outfit text-[14px]"><span>{d.lender} · {d.type}</span><span>{inr(d.outstanding)}{d.interestRatePct != null ? ` @ ${d.interestRatePct}%` : ''}</span></li>)}
              {data.debts.detectedEmis?.items?.map((d: any, i: number) => <li key={i} className="flex justify-between rounded-[10px] px-3 py-2 font-outfit text-[13px] text-[var(--color-text-secondary)]"><span>EMI detected: {d.description ?? 'Unlabelled'}</span><span>{inr(d.total90Days)} / 90d</span></li>)}
            </ul>
          )}
        </Card>
      </div>

      <Card title={`Script: ${data.script.title}`}>
        <p className="mb-3 font-outfit text-[14px] text-[var(--color-text-secondary)]"><b>Objective:</b> {data.script.objective}</p>
        <ol className="flex flex-col gap-2">
          {data.script.steps.map((s: any, i: number) => (
            <li key={s.key} className="rounded-[10px] border border-[var(--color-border-primary)] p-3 font-outfit text-[14px]">
              <p className="font-jakarta font-semibold">{i + 1}. {s.title} <span className="font-outfit text-[12px] font-normal text-[var(--color-text-tertiary)]">· {s.minutes} min</span></p>
              {s.instructions && <p className="mt-1 whitespace-pre-line text-[var(--color-text-secondary)]">{s.instructions}</p>}
            </li>
          ))}
        </ol>
        {data.script.expectedOutcomes.length > 0 && <><h3 className="mt-4 font-jakarta text-[13px] font-semibold">Expected outcomes</h3><ul className="list-disc pl-5 font-outfit text-[14px]">{data.script.expectedOutcomes.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></>}
      </Card>
    </div>
  );
};
