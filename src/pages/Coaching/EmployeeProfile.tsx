import React, { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Header } from '../../components/common/Header';
import { useAsync } from '../../hooks/useAsync';
import { coachingService, parseApiError } from '../../services/coaching.service';
import { Card, Pager, SectionError, SectionSkeleton } from './ui';
import { TabBody } from './ProfileTabs';

const TABS = [
  ['overview', 'Overview'], ['intake', 'Intake Assessment'], ['financial-snapshot', 'Financial Snapshot'], ['budget', 'Budget'],
  ['debts', 'Debts'], ['goals', 'Goals'], ['money-script', 'Money Script'], ['action-plans', 'Action Plans'],
  ['sessions', 'Session History'], ['worksheets', 'Worksheets'], ['consent', 'Consent'], ['privacy', 'Privacy Information'],
] as const;
const PAGED = new Set(['action-plans', 'sessions']);

export const EmployeeProfile: React.FC = () => {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([k]) => k === params.get('tab')) ? (params.get('tab') as string) : 'overview';
  const [page, setPage] = useState(1);

  const header = useAsync(() => coachingService.profileTab(id, 'overview'), [id]);
  const body = useAsync(
    () => coachingService.profileTab(id, tab, PAGED.has(tab) ? { page, pageSize: 10 } : undefined).catch((e) => { throw new Error(JSON.stringify(parseApiError(e))); }),
    [id, tab, page],
  );

  const go = (k: string) => { setPage(1); setParams({ tab: k }, { replace: true }); };
  const name = header.data?.employee?.name;

  let bodyError: { code?: string; message?: string } | null = null;
  if (body.error) { try { bodyError = JSON.parse(body.error); } catch { bodyError = { message: body.error }; } }

  return (
    <div className="flex flex-col gap-6">
      <Header title={name ?? 'Employee profile'} />
      <Card>
        <div className="mb-4 flex items-center gap-3 font-outfit text-[13px] text-[var(--color-text-secondary)]">
          <Link to="/clients" className="hover:text-[var(--color-primary)]">← My employees</Link>
          {header.data?.employee && <span>{[header.data.employee.company, header.data.employee.department].filter(Boolean).join(' · ')}</span>}
        </div>
        <div role="tablist" aria-label="Employee profile sections" className="-mx-1 flex gap-1 overflow-x-auto border-b border-[var(--color-border-primary)] pb-px">
          {TABS.map(([k, t]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => go(k)}
              className={`shrink-0 border-b-2 px-3 py-2 font-outfit text-[14px] transition-colors ${tab === k ? 'border-[var(--color-primary)] font-semibold text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>{t}</button>
          ))}
        </div>
        <div className="pt-5" role="tabpanel">
          {body.loading ? <SectionSkeleton /> : bodyError ? (
            bodyError.code === 'CONSENT_REQUIRED' ? <SectionError message="This employee has not given, or has withdrawn, consent for coaching, so this information is hidden." />
            : bodyError.code === 'NOT_ASSIGNED' ? <SectionError message="This employee is not assigned to you." />
            : <SectionError message={bodyError.message ?? 'Could not load this section'} onRetry={body.reload} />
          ) : body.data ? (
            <>
              <TabBody tab={tab} d={body.data} />
              {PAGED.has(tab) && <Pager page={body.data.page} pageSize={body.data.pageSize} total={body.data.total} onPage={setPage} />}
            </>
          ) : null}
        </div>
      </Card>
    </div>
  );
};
