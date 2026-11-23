import React from 'react';
import { Check, X } from 'lucide-react';
import { Empty, fmtDate, inr, label, Pill, statusTone } from './ui';

/* Reusable pieces, also used by the session preparation view. */

export const IntakeView: React.FC<{ d: any }> = ({ d }) => {
  if (!d) return null;
  const rows: [string, string[] | string | null][] = [
    ['Age group', d.ageGroup ? label(d.ageGroup).replace('Age ', '').replace(/_/g, '–') : null],
    ['Monthly salary range', d.monthlySalaryRange ? label(d.monthlySalaryRange) : null],
    ['Wants to improve', d.improvementGoals], ['Money challenges', d.moneyChallenges],
    ['How they manage money', d.moneyManagementStyles], ['Help needed with', d.helpNeeded],
  ];
  return (
    <div className="flex flex-col gap-3">
      <p className="font-outfit text-[13px]">{d.completed ? <Pill tone="success">Completed {fmtDate(d.completedAt)}</Pill> : <Pill tone="warning">Intake not completed</Pill>}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k}><dt className="font-jakarta text-[12px] font-semibold text-[var(--color-text-secondary)]">{k}</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5 font-outfit text-[14px]">{Array.isArray(v) ? (v.length ? v.map((x) => <Pill key={x} tone="info">{label(x)}</Pill>) : <span className="text-[var(--color-text-tertiary)]">—</span>) : v ?? <span className="text-[var(--color-text-tertiary)]">—</span>}</dd></div>
        ))}
      </dl>
    </div>
  );
};

export const SnapshotView: React.FC<{ d: any }> = ({ d }) => {
  if (!d) return null;
  if (d.shared === false) return <Empty>{d.reason}</Empty>;
  const Stat = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="rounded-[12px] bg-[var(--color-bg-secondary)] p-3"><p className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">{k}</p><p className="mt-1 font-jakarta text-[18px] font-semibold">{v}</p></div>;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat k="Income (latest month)" v={inr(d.latest?.income)} /><Stat k="Expenses" v={inr(d.latest?.expense)} /><Stat k="Savings" v={inr(d.latest?.savings)} />
        <Stat k="EMIs (last 30 days)" v={inr(d.emisLast30Days?.total)} /><Stat k="Debts recorded with coach" v={inr(d.recordedDebts?.outstanding)} />
        <Stat k="Emergency fund" v={d.emergencyFund ? `${d.emergencyFund.progressPct ?? 0}%` : 'No goal set'} />
      </div>
      {d.budget && <p className="font-outfit text-[13px] text-[var(--color-text-secondary)]">Current budget: <b>{d.budget.name}</b> · {inr(d.budget.amount)} across {d.budget.categories} categories</p>}
      {d.months?.length > 0 && (
        <table className="w-full text-left font-outfit text-[13px]"><thead className="text-[var(--color-text-tertiary)]"><tr><th className="pb-1 font-medium">Month</th><th className="pb-1 font-medium">Income</th><th className="pb-1 font-medium">Expenses</th><th className="pb-1 font-medium">Savings</th></tr></thead>
          <tbody>{d.months.map((m: any) => <tr key={`${m.year}-${m.month}`} className="border-t border-[var(--color-border-primary)]"><td className="py-1.5">{m.month}/{m.year}</td><td>{inr(m.income)}</td><td>{inr(m.expense)}</td><td>{inr(m.savings)}</td></tr>)}</tbody></table>
      )}
    </div>
  );
};

const Unavailable: React.FC<{ d: any }> = ({ d }) => (
  <div className="rounded-[12px] border border-dashed border-[var(--color-border-primary)] p-5">
    <Pill tone={d.blockedBy === 'MISSING_INFORMATION' ? 'warning' : 'neutral'}>{d.blockedBy === 'MISSING_INFORMATION' ? 'Waiting on Koshpal content' : 'Coming in a later release'}</Pill>
    <p className="mt-2 font-outfit text-[14px] text-[var(--color-text-secondary)]">{d.reason}</p>
  </div>
);

const List: React.FC<{ rows: React.ReactNode[]; empty: string }> = ({ rows, empty }) => rows.length ? <ul className="flex flex-col gap-2">{rows.map((r, i) => <li key={i} className="rounded-[10px] bg-[var(--color-bg-secondary)] px-3 py-2.5 font-outfit text-[14px]">{r}</li>)}</ul> : <Empty>{empty}</Empty>;

/** Renders the payload of one profile tab. */
export const TabBody: React.FC<{ tab: string; d: any }> = ({ tab, d }) => {
  if (d?.available === false) return <Unavailable d={d} />;
  switch (tab) {
    case 'overview':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[12px] bg-[var(--color-bg-secondary)] p-4 font-outfit text-[14px]">
            <p className="font-jakarta text-[12px] font-semibold text-[var(--color-text-secondary)]">Program</p>
            {d.program ? <><p className="mt-1 font-medium">{d.program.name}</p><p className="text-[var(--color-text-secondary)]">{d.program.sessionsCompleted} of {d.program.totalSessions} sessions completed</p></> : <p className="mt-1 text-[var(--color-text-tertiary)]">Not enrolled</p>}
            <p className="mt-3 text-[var(--color-text-secondary)]">Next booking: {d.nextBooking ? fmtDate(d.nextBooking.slotStart) : 'none'}</p>
            <p className="text-[var(--color-text-secondary)]">Last completed: {d.lastCompletedSession ? `Session ${d.lastCompletedSession.sessionNumber}, ${fmtDate(d.lastCompletedSession.completedAt)}` : 'none'}</p>
          </div>
          <div className="rounded-[12px] bg-[var(--color-bg-secondary)] p-4 font-outfit text-[14px]">
            <p className="font-jakarta text-[12px] font-semibold text-[var(--color-text-secondary)]">Status</p>
            <ul className="mt-2 space-y-1.5">
              <li className="flex items-center gap-2">{d.consent.coachingActive ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <X className="h-4 w-4 text-[var(--color-error)]" />}Coaching consent {d.consent.coachingActive ? `given ${fmtDate(d.consent.since)}` : 'not active'}</li>
              <li className="flex items-center gap-2">{d.intakeCompleted ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <X className="h-4 w-4 text-[var(--color-error)]" />}Intake {d.intakeCompleted ? 'completed' : 'not completed'}</li>
              <li className="flex items-center gap-2">{d.financialDataSharedWithCoach ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <X className="h-4 w-4 text-[var(--color-error)]" />}Financial data {d.financialDataSharedWithCoach ? 'shared with you' : 'not shared'}</li>
              <li>{d.openActionItems} open action item{d.openActionItems === 1 ? '' : 's'}{d.overdueActionItems ? <> · <span className="text-[var(--color-error-dark)]">{d.overdueActionItems} overdue</span></> : null}</li>
            </ul>
          </div>
        </div>
      );
    case 'intake': return <IntakeView d={d} />;
    case 'financial-snapshot': return <SnapshotView d={d} />;
    case 'budget':
      if (d.shared === false) return <Empty>{d.reason}</Empty>;
      return d.budget ? (
        <div><p className="mb-3 font-outfit text-[14px]"><b>{d.budget.name}</b> · {inr(d.budget.amount)} {d.budget.frequency ? label(d.budget.frequency) : ''}</p>
          <List empty="" rows={d.budget.categories.map((c: any) => <div className="flex justify-between"><span>{c.category}</span><span>{inr(c.amount)}</span></div>)} /></div>
      ) : <Empty>No budget created yet.</Empty>;
    case 'debts':
      return (
        <div className="flex flex-col gap-5">
          <List empty="No debts recorded in sessions yet." rows={d.recorded.map((x: any) => <div className="flex flex-wrap justify-between gap-2"><span>{x.lender} · {x.type}</span><span>{inr(x.outstanding)}{x.interestRatePct != null ? ` @ ${x.interestRatePct}%` : ''}{x.emi != null ? ` · EMI ${inr(x.emi)}` : ''}</span></div>)} />
          <div><h3 className="mb-2 font-jakarta text-[13px] font-semibold">EMIs detected from transactions (last 90 days)</h3>
            {d.detectedEmis.shared ? <List empty="No EMI payments detected." rows={d.detectedEmis.items.map((x: any) => <div className="flex justify-between"><span>{x.description ?? 'Unlabelled'} ({x.payments}×)</span><span>{inr(x.total90Days)}</span></div>)} /> : <Empty>The employee has not shared transaction data with you.</Empty>}</div>
        </div>
      );
    case 'goals':
      if (d.shared === false) return <Empty>{d.reason}</Empty>;
      return <List empty="No goals set." rows={d.goals.map((g: any) => <div className="flex flex-wrap justify-between gap-2"><span>{g.title}{g.achieved && <> <Pill tone="success">Achieved</Pill></>}</span><span>{inr(g.saved)} of {inr(g.target)} · by {fmtDate(g.goalDate)}</span></div>)} />;
    case 'action-plans':
      return <List empty="No action items yet." rows={d.items.map((i: any) => <div className="flex flex-wrap items-center justify-between gap-2"><span>{i.title} <span className="text-[12px] text-[var(--color-text-tertiary)]">· Session {i.sessionNumber} · {i.ownerType === 'EMPLOYEE' ? 'Employee' : 'Coach'}</span></span><span className="flex items-center gap-2"><Pill tone={i.kind === 'HOMEWORK' ? 'info' : 'neutral'}>{label(i.kind)}</Pill>{i.overdue ? <Pill tone="danger">Overdue</Pill> : <Pill tone={i.status === 'COMPLETED' ? 'success' : 'neutral'}>{label(i.status)}</Pill>}<span className="text-[12px] text-[var(--color-text-tertiary)]">Due {fmtDate(i.dueDate)}{i.completedAt ? ` · done ${fmtDate(i.completedAt)}` : ''}</span></span></div>)} />;
    case 'sessions':
      return <List empty="No coaching sessions yet." rows={d.items.map((s: any) => <div className="flex flex-wrap items-center justify-between gap-2"><span>Session {s.sessionNumber} · {fmtDate(s.scheduledStart)} <span className="text-[12px] text-[var(--color-text-tertiary)]">· script v{s.templateVersion}</span></span><span className="flex items-center gap-2"><Pill tone={statusTone(s.status)}>{label(s.status)}</Pill>{s.notesFinalised && <Pill tone="success">Notes final</Pill>}{!s.openable && <Pill>Previous coach</Pill>}</span></div>)} />;
    case 'worksheets':
      return (
        <div className="flex flex-col gap-3">
          {d.items.length === 0 && <Empty>No worksheets assigned to this employee yet.</Empty>}
          {d.items.map((w: any) => (
            <div key={w.id} className="rounded-[12px] bg-[var(--color-bg-secondary)] p-4 font-outfit text-[14px]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{w.title}</span>
                <span className="flex items-center gap-2">
                  <Pill tone={w.status === 'REVIEWED' ? 'success' : w.status === 'SUBMITTED' ? 'info' : 'neutral'}>{label(w.status)}</Pill>
                  {w.overdue && <Pill tone="danger">Overdue</Pill>}
                  <span className="text-[12px] text-[var(--color-text-tertiary)]">{w.dueDate ? `Due ${fmtDate(w.dueDate)}` : 'No due date'}</span>
                </span>
              </div>
              {w.instructions && <p className="mt-1 text-[var(--color-text-secondary)]">{w.instructions}</p>}
              {w.answers ? (
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(Array.isArray(w.fields) ? w.fields : []).map((f: any) => (
                    <div key={f.key}><dt className="font-jakarta text-[12px] font-semibold text-[var(--color-text-secondary)]">{f.label}</dt>
                      <dd className="mt-1 whitespace-pre-wrap">{w.answers[f.key] != null && w.answers[f.key] !== '' ? String(w.answers[f.key]) : <span className="text-[var(--color-text-tertiary)]">—</span>}</dd></div>
                  ))}
                </dl>
              ) : <p className="mt-2 text-[12px] text-[var(--color-text-tertiary)]">Answers appear here once the employee submits.</p>}
              {w.submittedAt && <p className="mt-2 text-[12px] text-[var(--color-text-tertiary)]">Submitted {fmtDate(w.submittedAt)}{w.reviewedAt ? ` · reviewed ${fmtDate(w.reviewedAt)}` : ''}</p>}
              {w.reviewNote && <p className="mt-1 text-[13px]"><b>Your review note:</b> {w.reviewNote}</p>}
            </div>
          ))}
        </div>
      );
    case 'consent':
      return (
        <div className="flex flex-col gap-3">
          <p className="font-outfit text-[14px]">{d.active ? <Pill tone="success">Active since {fmtDate(d.activeConsent.grantedAt)} (text v{d.activeConsent.textVersion})</Pill> : <Pill tone="danger">No active consent — sessions cannot start</Pill>}</p>
          <List empty="No consent history." rows={d.history.map((h: any) => <div className="flex justify-between"><span>Text v{h.textVersion} · given {fmtDate(h.grantedAt)}</span><Pill tone={h.status === 'GRANTED' ? 'success' : 'danger'}>{h.status === 'GRANTED' ? 'Given' : `Withdrawn ${fmtDate(h.withdrawnAt)}`}</Pill></div>)} />
        </div>
      );
    case 'privacy':
      return (
        <div className="grid gap-4 md:grid-cols-2 font-outfit text-[14px]">
          <div><h3 className="mb-1 font-jakarta text-[13px] font-semibold">You can access</h3><ul className="list-disc pl-5 space-y-1">{d.coach.canAccess.map((x: string) => <li key={x}>{x}</li>)}</ul>
            <h3 className="mb-1 mt-4 font-jakarta text-[13px] font-semibold">You cannot access</h3><ul className="list-disc pl-5 space-y-1">{d.coach.cannotAccess.map((x: string) => <li key={x}>{x}</li>)}</ul></div>
          <div><h3 className="mb-1 font-jakarta text-[13px] font-semibold">Administrators</h3><p>{d.admin.summary}</p>
            <h3 className="mb-1 mt-4 font-jakarta text-[13px] font-semibold">HR can see</h3><ul className="list-disc pl-5 space-y-1">{d.hr.canSee.map((x: string) => <li key={x}>{x}</li>)}</ul>
            <h3 className="mb-1 mt-4 font-jakarta text-[13px] font-semibold">HR can never see</h3><ul className="list-disc pl-5 space-y-1">{d.hr.cannotSee.map((x: string) => <li key={x}>{x}</li>)}</ul></div>
        </div>
      );
    default: return null;
  }
};
