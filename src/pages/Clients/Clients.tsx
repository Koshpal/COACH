import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/common/Header';
import { useAsync } from '../../hooks/useAsync';
import { coachingService } from '../../services/coaching.service';
import { Card, Empty, Pager, SectionError, SectionSkeleton } from '../Coaching/ui';

/** "My employees": ONLY employees an administrator has assigned to this coach. */
export const Clients: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => { const t = setTimeout(() => { setDebounced(search.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);

  const { data, loading, error, reload } = useAsync(() => coachingService.employees({ page, pageSize: 12, search: debounced || undefined }), [page, debounced]);

  return (
    <div className="flex flex-col gap-6">
      <Header title="My Employees" />
      <Card>
        <label className="sr-only" htmlFor="emp-search">Search employees</label>
        <input id="emp-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…" maxLength={100}
          className="mb-4 w-full max-w-sm rounded-[10px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-3 py-2 font-outfit text-[14px] outline-none focus:border-[var(--color-primary)]" />
        {loading ? <SectionSkeleton rows={4} /> : error ? <SectionError message={error} onRetry={reload} /> : !data?.items.length ? (
          <Empty>{debounced ? 'No employees match your search.' : 'No employees are assigned to you yet. An administrator assigns employees to coaches.'}</Empty>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((e) => (
                <li key={e.id}>
                  <Link to={`/clients/${e.id}`} className="flex items-center gap-3 rounded-[12px] border border-[var(--color-border-primary)] p-4 transition-colors hover:border-[var(--color-primary)]">
                    <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[var(--color-primary)] font-jakarta text-sm font-bold text-white">
                      {e.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                    <span className="min-w-0"><span className="block truncate font-jakarta text-[15px] font-semibold text-[var(--color-text-primary)]">{e.name}</span>
                      <span className="block truncate font-outfit text-[12px] text-[var(--color-text-tertiary)]">{[e.company, e.department].filter(Boolean).join(' · ') || '—'}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
            <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
    </div>
  );
};
