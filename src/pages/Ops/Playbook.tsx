import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/common/Header';
import { useAsync } from '../../hooks/useAsync';
import { opsService, type PlaybookItem } from '../../services/coachingOps.service';
import { Card, Empty, Pager, Pill, SectionError, SectionSkeleton, fmtDate, label } from '../Coaching/ui';
import { TextInput } from './shared';

/** Sections of the Koshpal Coaching Playbook, in the order a coach meets them. Anything else is sorted after, by name. */
const SECTION_ORDER = ['START_HERE', 'RULES', 'FOUNDATION_PROGRAM', 'SESSION_GUIDE', 'TOPIC_GUIDES', 'PROBLEMS_AND_SOLUTIONS', 'HARD_SITUATIONS', 'QUALITY', 'TEMPLATES'];
const SECTION_LABEL: Record<string, string> = {
  START_HERE: 'Start here', RULES: 'Rules every coach follows', FOUNDATION_PROGRAM: 'Foundation program (Sessions 1 to 3)', SESSION_GUIDE: 'Session guide',
  TOPIC_GUIDES: 'Topic guides', PROBLEMS_AND_SOLUTIONS: 'Problems and solutions', HARD_SITUATIONS: 'Hard situations', QUALITY: 'How sessions are reviewed',
  TEMPLATES: 'Templates and worksheets', COACHING_PRACTICE: 'Coaching skills', SAFETY: 'Fraud and safety',
};
const sectionName = (c: string) => SECTION_LABEL[c] ?? label(c);

type Tab = 'handbook' | 'reference';
const TABS: { key: Tab; text: string; tag: string }[] = [
  { key: 'handbook', text: 'Coaching playbook', tag: 'handbook' },
  { key: 'reference', text: 'Reference library', tag: 'reference' },
];

const chip = (on: boolean) => `rounded-full border px-4 py-1.5 font-outfit text-[13px] transition-colors ${on ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'}`;

/** The PDF card: opens or downloads the full playbook. The file is fetched with the coach's session, never from a public link. */
const PdfCard: React.FC = () => {
  const [busy, setBusy] = useState<'open' | 'download' | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fetchPdf = async (mode: 'open' | 'download') => {
    setBusy(mode); setErr(null);
    // open the tab first, inside the click, so the browser's pop-up blocker allows it
    const tab = mode === 'open' ? window.open('', '_blank') : null;
    try {
      const url = URL.createObjectURL(new Blob([await opsService.handbookPdf()], { type: 'application/pdf' }));
      if (mode === 'open' && tab) tab.location.href = url;
      else { const a = document.createElement('a'); a.href = url; a.download = 'Koshpal-Coaching-Playbook.pdf'; document.body.appendChild(a); a.click(); a.remove(); }
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
    } catch {
      tab?.close();
      setErr('Could not load the PDF. Check your connection and try again.');
    } finally { setBusy(null); }
  };
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-outfit text-[12px] uppercase tracking-wide text-[var(--color-text-tertiary)]">For Koshpal coaches · internal use only</p>
          <h2 className="font-jakarta text-[18px] font-semibold text-[var(--color-text-primary)]">Koshpal Coaching Playbook and Session Guide</h2>
          <p className="font-outfit text-[13px] text-[var(--color-text-secondary)]">Version 1.0 · November 2026 · 31 pages. How every session runs: opening, discovery, plan and close.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={busy !== null} onClick={() => fetchPdf('open')} className="rounded-[10px] bg-[var(--color-primary)] px-4 py-2 font-outfit text-[13px] font-semibold text-white disabled:opacity-50">{busy === 'open' ? 'Opening…' : 'Open PDF'}</button>
          <button type="button" disabled={busy !== null} onClick={() => fetchPdf('download')} className="rounded-[10px] border border-[var(--color-border-primary)] px-4 py-2 font-outfit text-[13px] font-medium text-[var(--color-text-primary)] disabled:opacity-50">{busy === 'download' ? 'Preparing…' : 'Download'}</button>
        </div>
      </div>
      {err && <p role="alert" className="mt-3 font-outfit text-[13px] text-[var(--color-error-dark)]">{err}</p>}
    </Card>
  );
};

const Reader: React.FC<{ slug: string }> = ({ slug }) => {
  const { data, loading, error, reload } = useAsync(() => opsService.article(slug), [slug]);
  if (loading) return <SectionSkeleton rows={4} />;
  if (error || !data) return <SectionError message={error ?? 'Not found'} onRetry={reload} />;
  return (
    <article className="flex flex-col gap-3">
      <div><h3 className="font-jakarta text-[18px] font-semibold text-[var(--color-text-primary)]">{data.title}</h3>
        <p className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">{sectionName(data.category)} · Version {data.version} · Published {fmtDate(data.publishedAt)}</p></div>
      {data.summary && <p className="font-outfit text-[14px] text-[var(--color-text-secondary)]">{data.summary}</p>}
      {/* plain text on purpose: article bodies are never interpreted as HTML */}
      <div className="whitespace-pre-wrap font-outfit text-[14px] leading-6 text-[var(--color-text-primary)]">{data.body}</div>
      <div className="flex flex-wrap gap-1.5">{data.tags.filter((t) => t !== 'handbook' && t !== 'reference').map((t) => <Pill key={t}>{t}</Pill>)}</div>
    </article>
  );
};

const ArticleList: React.FC<{ items: PlaybookItem[]; sel: string | null; onSelect: (slug: string) => void; grouped: boolean }> = ({ items, sel, onSelect, grouped }) => {
  const row = (a: PlaybookItem) => (
    <li key={a.id}><button onClick={() => onSelect(a.slug)} className={`w-full rounded-[12px] border p-3 text-left hover:border-[var(--color-primary)] ${sel === a.slug ? 'border-[var(--color-primary)]' : 'border-[var(--color-border-primary)]'}`}>
      <span className="block font-jakarta text-[14px] font-semibold text-[var(--color-text-primary)]">{a.title}</span>
      <span className="block font-outfit text-[12px] text-[var(--color-text-tertiary)]">{grouped ? (a.summary ?? '') : `${sectionName(a.category)}${a.summary ? ` · ${a.summary}` : ''}`}</span></button></li>
  );
  if (!grouped) return <ul className="flex flex-col gap-2">{items.map(row)}</ul>;
  const byCat = new Map<string, PlaybookItem[]>();
  items.forEach((a) => byCat.set(a.category, [...(byCat.get(a.category) ?? []), a]));
  const cats = [...byCat.keys()].sort((a, b) => {
    const ia = SECTION_ORDER.indexOf(a), ib = SECTION_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || sectionName(a).localeCompare(sectionName(b));
  });
  return (
    <div className="flex flex-col gap-5">
      {cats.map((c) => (
        <section key={c} aria-label={sectionName(c)}>
          <h3 className="mb-2 font-jakarta text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">{sectionName(c)}</h3>
          <ul className="flex flex-col gap-2">{byCat.get(c)!.map(row)}</ul>
        </section>
      ))}
    </div>
  );
};

export const Playbook: React.FC = () => {
  const [q, setQ] = useState(''); const [debounced, setDebounced] = useState(''); const [page, setPage] = useState(1);
  const [sel, setSel] = useState<string | null>(null); const [tab, setTab] = useState<Tab>('handbook');
  useEffect(() => { const t = setTimeout(() => { setDebounced(q.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const searching = debounced.length > 0;
  const tag = TABS.find((t) => t.key === tab)!.tag;
  // Browsing shows a whole tab at once, grouped by section (the API caps a page at 50); searching looks across everything.
  const { data, loading, error, reload } = useAsync(
    () => opsService.searchPlaybook(searching ? { search: debounced, page, pageSize: 20 } : { tag, page: 1, pageSize: 50 }),
    [debounced, page, tag],
  );
  const total = data?.total ?? 0;
  const items = useMemo(() => data?.items ?? [], [data]);
  return (
    <div className="flex flex-col gap-6">
      <Header title="Playbook" />
      <PdfCard />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Card>
          <label className="sr-only" htmlFor="pb-search">Search the playbook</label>
          <TextInput id="pb-search" className="mb-3" placeholder="Search guidance, e.g. “credit card”…" value={q} maxLength={100} onChange={(e) => setQ(e.target.value)} />
          {!searching && (
            <div role="tablist" aria-label="Playbook sections" className="mb-4 flex flex-wrap gap-2">
              {TABS.map((t) => <button key={t.key} role="tab" aria-selected={tab === t.key} className={chip(tab === t.key)} onClick={() => setTab(t.key)}>{t.text}</button>)}
            </div>
          )}
          {searching && <p className="mb-3 font-outfit text-[12px] text-[var(--color-text-tertiary)]">{loading ? 'Searching…' : `${total} result${total === 1 ? '' : 's'} across the whole playbook`}</p>}
          {loading ? <SectionSkeleton rows={4} /> : error ? <SectionError message={error} onRetry={reload} /> : !items.length ? (
            <Empty>{searching ? 'Nothing matches your search.' : 'No playbook articles have been published yet.'}</Empty>
          ) : (
            <>
              <ArticleList items={items} sel={sel} onSelect={setSel} grouped={!searching} />
              {searching && <Pager page={page} pageSize={20} total={total} onPage={setPage} />}
            </>
          )}
        </Card>
        <Card title="Article">{sel ? <Reader slug={sel} /> : <Empty>Select an article to read it, or open the PDF above for the full playbook.</Empty>}</Card>
      </div>
    </div>
  );
};
