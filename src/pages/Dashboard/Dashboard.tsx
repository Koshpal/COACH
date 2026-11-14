import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/ui/Button';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { coachingService, parseApiError, type TodaySession } from '../../services/coaching.service';
import { Card, Empty, fmtDate, fmtDateTime, fmtTime, label, Pager, Pill, SectionError, SectionSkeleton, statusTone } from '../Coaching/ui';

/**
 * Coach dashboard — answers "what do I do next?". Four independent sections, each with its own
 * API call, loader and error state, so a slow endpoint never blanks the page.
 */
export const Dashboard: React.FC = () => (
  <div className="flex flex-col gap-6">
    <Header title="Coach Dashboard" />
    <TodaySessions />
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <OpenTasks />
      <Performance />
    </div>
    <ProgramProgress />
  </div>
);

/* ── Today's sessions ───────────────────────────────────────────────────── */
const TodaySessions: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data, loading, error, reload } = useAsync(() => coachingService.today(), []);
  const [busy, setBusy] = useState<string | null>(null);

  const prepare = async (s: TodaySession) => {
    setBusy(s.bookingId);
    try {
      const id = s.sessionId ?? (await coachingService.createSession(s.bookingId)).id;
      navigate(s.status === 'IN_PROGRESS' ? `/sessions/${id}/run` : `/sessions/${id}/prepare`);
    } catch (e) {
      showToast(parseApiError(e).message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card title="Today's sessions">
      {loading ? <SectionSkeleton /> : error ? <SectionError message={error} onRetry={reload} /> : !data?.items.length ? (
        <Empty>No sessions scheduled for today.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.items.map((s) => (
            <li key={s.bookingId} className="flex flex-col gap-3 rounded-[12px] border border-[var(--color-border-primary)] p-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={s.profileLink} className="font-jakarta text-[15px] font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-primary)]">{s.employeeName}</Link>
                  {s.sessionNumber && <Pill tone="info">Session {s.sessionNumber}</Pill>}
                  <Pill tone={statusTone(s.status)}>{label(s.status)}</Pill>
                </div>
                <p className="mt-1 font-outfit text-[13px] text-[var(--color-text-secondary)]">
                  {fmtTime(s.scheduledStart)} – {fmtTime(s.scheduledEnd)} IST · {s.pendingActionItems} pending action item{s.pendingActionItems === 1 ? '' : 's'} ·{' '}
                  {s.previousNotesAvailable ? 'Previous notes available' : 'No previous notes'} · Next session: {s.nextSessionAt ? fmtDateTime(s.nextSessionAt) : 'not booked'}
                </p>
              </div>
              {s.status === 'COMPLETED' || s.status === 'CANCELLED' || s.status === 'NO_SHOW' ? (
                <Link to={s.profileLink} className="font-outfit text-[14px] font-medium text-[var(--color-primary)]">View profile</Link>
              ) : (
                <Button size="sm" loading={busy === s.bookingId} onClick={() => prepare(s)}>
                  {s.status === 'IN_PROGRESS' ? 'Resume session' : 'Prepare'}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

/* ── Open tasks ─────────────────────────────────────────────────────────── */
const OpenTasks: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => coachingService.tasks({ page, pageSize: 6 }), [page]);
  return (
    <Card title="Open tasks" action={data && data.total > 0 ? <Pill tone="warning">{data.total}</Pill> : undefined}>
      {loading ? <SectionSkeleton /> : error ? <SectionError message={error} onRetry={reload} /> : !data?.items.length ? (
        <Empty>You're all caught up. Nothing needs your attention.</Empty>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {data.items.map((t, i) => (
              <li key={`${t.type}-${i}`}>
                <Link to={t.link} className="flex items-start justify-between gap-3 rounded-[12px] px-3 py-2.5 hover:bg-[var(--color-bg-secondary)]">
                  <span className="min-w-0">
                    <span className="block truncate font-jakarta text-[14px] font-medium text-[var(--color-text-primary)]">{t.title}</span>
                    <span className="block font-outfit text-[12px] text-[var(--color-text-tertiary)]">{t.subtitle}</span>
                  </span>
                  {t.dueAt && <span className="shrink-0 font-outfit text-[12px] text-[var(--color-error-dark)]">{fmtDate(t.dueAt)}</span>}
                </Link>
              </li>
            ))}
          </ul>
          <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
        </>
      )}
      <p className="mt-3 font-outfit text-[12px] text-[var(--color-text-tertiary)]">
        Follow-up messages, escalations needing action and audit feedback will appear here as those modules are released.
      </p>
    </Card>
  );
};

/* ── Personal performance ───────────────────────────────────────────────── */
const Performance: React.FC = () => {
  const { data: p, loading, error, reload } = useAsync(() => coachingService.performance(), []);
  const pct = (v: number | null) => (v == null ? 'No data yet' : `${v}%`);
  const Stat: React.FC<{ name: string; value: React.ReactNode; hint?: string }> = ({ name, value, hint }) => (
    <div className="rounded-[12px] bg-[var(--color-bg-secondary)] p-3" title={hint}>
      <p className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">{name}</p>
      <p className="mt-1 font-jakarta text-[20px] font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
  const Unavailable = ({ why }: { why?: string }) => <span className="text-[13px] font-normal text-[var(--color-text-tertiary)]">{why ?? 'Not available yet'}</span>;
  return (
    <Card title="Your performance">
      {loading ? <SectionSkeleton rows={2} /> : error || !p ? <SectionError message={error ?? 'Could not load performance'} onRetry={reload} /> : (
        <div className="grid grid-cols-2 gap-3">
          <Stat name="Sessions completed" value={`${p.sessionsCompleted.total} (${p.sessionsCompleted.thisMonth} this month)`} />
          <Stat name="Notes completion" value={pct(p.notesCompletionRate.percent)} hint={p.notesCompletionRate.basis} />
          <Stat name="Follow-up completion" value={pct(p.followUpCompletionRate.percent)} hint={p.followUpCompletionRate.basis} />
          <Stat name="Employee feedback" value={p.employeeFeedback.count ? `${p.employeeFeedback.averageRating} / 5 (${p.employeeFeedback.count})` : 'No feedback yet'} />
          <Stat name="Average quality score" value={p.averageQualityScore.available ? '—' : <Unavailable why={p.averageQualityScore.reason} />} />
          <Stat name="Open escalations" value={p.openEscalations.available ? '0' : <Unavailable why={p.openEscalations.reason} />} />
        </div>
      )}
    </Card>
  );
};

/* ── Program progress ───────────────────────────────────────────────────── */
const ProgramProgress: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => coachingService.progress({ page, pageSize: 8 }), [page]);
  return (
    <Card title="Program progress">
      {loading ? <SectionSkeleton /> : error ? <SectionError message={error} onRetry={reload} /> : !data?.items.length ? (
        <Empty>No employees are assigned to you yet.</Empty>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left font-outfit text-[14px]">
              <thead className="text-[12px] text-[var(--color-text-tertiary)]">
                <tr><th className="pb-2 font-medium">Employee</th><th className="pb-2 font-medium">Program</th><th className="pb-2 font-medium">Progress</th><th className="pb-2 font-medium">Next activity</th><th className="pb-2 font-medium">Pending</th></tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.employeeId} className="border-t border-[var(--color-border-primary)]">
                    <td className="py-3"><Link className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary)]" to={`/clients/${r.employeeId}`}>{r.employeeName}</Link></td>
                    <td className="py-3 text-[var(--color-text-secondary)]">{r.program ?? <Pill tone="warning">Not enrolled</Pill>}</td>
                    <td className="py-3">
                      {r.totalSessions ? (
                        <div className="flex items-center gap-2" title={`${r.sessionsCompleted} of ${r.totalSessions} sessions completed`}>
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]"><div className="h-full bg-[var(--color-primary)]" style={{ width: `${(r.sessionsCompleted / r.totalSessions) * 100}%` }} /></div>
                          <span className="text-[13px] text-[var(--color-text-secondary)]">{r.programStatus === 'COMPLETED' ? 'Done' : `Session ${r.currentSession}/${r.totalSessions}`}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="py-3 text-[var(--color-text-secondary)]">{r.nextActivity ? `Session on ${fmtDateTime(r.nextActivity.at)}` : '—'}</td>
                    <td className="py-3">{r.pendingTasks ? <Pill tone="warning">{r.pendingTasks}</Pill> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
        </>
      )}
    </Card>
  );
};
