import React, { useEffect, useState } from 'react';
import { Header } from '../../components/common/Header';
import { useAsync } from '../../hooks/useAsync';
import { opsService } from '../../services/coachingOps.service';
import { Card, Empty, Pager, Pill, SectionError, SectionSkeleton, fmtDate } from '../Coaching/ui';
import { TextInput } from './shared';

const Reader: React.FC<{ slug: string }> = ({ slug }) => {
  const { data, loading, error, reload } = useAsync(() => opsService.article(slug), [slug]);
  if (loading) return <SectionSkeleton rows={4} />;
  if (error || !data) return <SectionError message={error ?? 'Not found'} onRetry={reload} />;
  return (
    <article className="flex flex-col gap-3">
      <div><h3 className="font-jakarta text-[18px] font-semibold text-[var(--color-text-primary)]">{data.title}</h3>
        <p className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">Version {data.version} · Published {fmtDate(data.publishedAt)}</p></div>
      {data.summary && <p className="font-outfit text-[14px] text-[var(--color-text-secondary)]">{data.summary}</p>}
      {/* plain text on purpose: article bodies are never interpreted as HTML */}
      <div className="whitespace-pre-wrap font-outfit text-[14px] leading-6 text-[var(--color-text-primary)]">{data.body}</div>
      <div className="flex flex-wrap gap-1.5">{data.tags.map((t) => <Pill key={t}>{t}</Pill>)}</div>
    </article>
  );
};

export const Playbook: React.FC = () => {
  const [q, setQ] = useState(''); const [debounced, setDebounced] = useState(''); const [page, setPage] = useState(1); const [sel, setSel] = useState<string | null>(null);
  useEffect(() => { const t = setTimeout(() => { setDebounced(q.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const { data, loading, error, reload } = useAsync(() => opsService.searchPlaybook({ search: debounced || undefined, page }), [debounced, page]);
  return (
    <div className="flex flex-col gap-6">
      <Header title="Playbook" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Card>
          <label className="sr-only" htmlFor="pb-search">Search the playbook</label>
          <TextInput id="pb-search" className="mb-4" placeholder="Search guidance, e.g. “debt”…" value={q} maxLength={100} onChange={(e) => setQ(e.target.value)} />
          {loading ? <SectionSkeleton rows={4} /> : error ? <SectionError message={error} onRetry={reload} /> : !data?.items.length ? (
            <Empty>{debounced ? 'Nothing matches your search.' : 'No playbook articles have been published yet.'}</Empty>
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {data.items.map((a) => (
                  <li key={a.id}><button onClick={() => setSel(a.slug)} className={`w-full rounded-[12px] border p-3 text-left hover:border-[var(--color-primary)] ${sel === a.slug ? 'border-[var(--color-primary)]' : 'border-[var(--color-border-primary)]'}`}>
                    <span className="block font-jakarta text-[14px] font-semibold text-[var(--color-text-primary)]">{a.title}</span>
                    <span className="block font-outfit text-[12px] text-[var(--color-text-tertiary)]">{a.category}{a.summary ? ` · ${a.summary}` : ''}</span></button></li>
                ))}
              </ul>
              <Pager page={page} pageSize={20} total={data.total} onPage={setPage} />
            </>
          )}
        </Card>
        <Card title="Article">{sel ? <Reader slug={sel} /> : <Empty>Select an article to read it.</Empty>}</Card>
      </div>
    </div>
  );
};
