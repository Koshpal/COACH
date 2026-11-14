import React, { useState } from 'react';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/ui/Button';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { ESC_CATEGORIES, opsError, opsService, type EscCategory } from '../../services/coachingOps.service';
import { Card, Empty, Pill, SectionError, SectionSkeleton, fmtDateTime, fmtDate, label } from '../Coaching/ui';
import { Field, Select, TextArea, sevTone, statusPill } from './shared';
import { RaiseEscalationModal } from './RaiseEscalation';

const Detail: React.FC<{ id: string }> = ({ id }) => {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useAsync(() => opsService.escalation(id), [id]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  if (loading) return <SectionSkeleton rows={3} />;
  if (error || !data) return <SectionError message={error ?? 'Not found'} onRetry={reload} />;
  const send = async () => {
    setBusy(true);
    try { await opsService.escalationComment(id, text.trim()); setText(''); reload(); } catch (e) { showToast(opsError(e), 'error'); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2"><Pill tone={sevTone(data.severity)}>{label(data.severity)}</Pill><Pill tone={statusPill(data.status)}>{label(data.status)}</Pill><Pill>{label(data.category)}</Pill></div>
      <p className="whitespace-pre-wrap font-outfit text-[14px] text-[var(--color-text-primary)]">{data.summary}</p>
      {data.resolutionNote && <p className="rounded-[10px] bg-[var(--color-success-bg)] px-3 py-2 font-outfit text-[13px] text-[var(--color-success-darkest)]"><strong>Outcome:</strong> {data.resolutionNote}</p>}
      <ol className="flex flex-col gap-2 border-l-2 border-[var(--color-border-primary)] pl-4">
        {data.events.map((e) => (
          <li key={e.id} className="font-outfit text-[13px]">
            <span className="text-[var(--color-text-tertiary)]">{fmtDateTime(e.createdAt)} · {e.actorRole === 'ADMIN' ? 'Admin' : 'You'}</span>
            <div className="text-[var(--color-text-primary)]">{e.type === 'STATUS_CHANGED' || e.type === 'ASSIGNED' ? `${label(e.type)}${e.toStatus ? ` → ${label(e.toStatus)}` : ''}` : e.type === 'CREATED' ? 'Raised' : e.comment}{(e.type === 'STATUS_CHANGED') && e.comment ? ` — ${e.comment}` : ''}</div>
          </li>
        ))}
      </ol>
      {data.status !== 'CLOSED' && (
        <div className="flex flex-col gap-2"><TextArea rows={2} placeholder="Add an update for the administrator…" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
          <div className="flex justify-end"><Button size="sm" loading={busy} disabled={!text.trim()} onClick={send}>Send update</Button></div></div>
      )}
    </div>
  );
};

const Contacts: React.FC = () => {
  const [cat, setCat] = useState<EscCategory | ''>('');
  const { data, loading, error, reload } = useAsync(() => opsService.contacts(cat || undefined), [cat]);
  return (
    <Card title="Who to contact" action={<Select className="!w-auto" value={cat} onChange={(e) => setCat(e.target.value as EscCategory | '')} aria-label="Filter by category"><option value="">All categories</option>{ESC_CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}</Select>}>
      {loading ? <SectionSkeleton rows={2} /> : error ? <SectionError message={error} onRetry={reload} /> : !data?.length ? (
        <Empty>No contacts have been added yet. Ask an administrator to add the escalation contacts.</Empty>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.map((c) => (
            <li key={c.id} className="rounded-[12px] border border-[var(--color-border-primary)] p-4">
              <div className="flex items-start justify-between gap-2"><span className="font-jakarta text-[15px] font-semibold text-[var(--color-text-primary)]">{c.name}</span>{c.isStale && <Pill tone="warning">Check before use</Pill>}</div>
              <div className="font-outfit text-[13px] text-[var(--color-text-secondary)]">{[c.organisation, c.category ? label(c.category) : 'General'].filter(Boolean).join(' · ')}</div>
              <div className="mt-2 flex flex-col gap-0.5 font-outfit text-[14px]">{c.phone && <a className="text-[var(--color-primary)]" href={`tel:${c.phone}`}>{c.phone}</a>}{c.email && <a className="text-[var(--color-primary)]" href={`mailto:${c.email}`}>{c.email}</a>}{c.hours && <span className="text-[var(--color-text-tertiary)]">{c.hours}</span>}</div>
              <div className="mt-2 font-outfit text-[12px] text-[var(--color-text-tertiary)]">Last verified {fmtDate(c.verifiedAt)}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export const Escalations: React.FC = () => {
  const { data, loading, error, reload } = useAsync(() => opsService.escalations(), []);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-6">
      <Header title="Escalations" actions={<Button size="sm" onClick={() => setOpen(true)}>Raise escalation</Button>} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card title="My escalations">
          {loading ? <SectionSkeleton rows={3} /> : error ? <SectionError message={error} onRetry={reload} /> : !data?.length ? <Empty>You have not raised any escalations.</Empty> : (
            <ul className="flex flex-col gap-2">
              {data.map((r) => (
                <li key={r.id}>
                  <button onClick={() => setSel(r.id)} className={`flex w-full flex-col gap-1 rounded-[12px] border p-3 text-left transition-colors hover:border-[var(--color-primary)] ${sel === r.id ? 'border-[var(--color-primary)]' : 'border-[var(--color-border-primary)]'}`}>
                    <span className="flex flex-wrap items-center gap-2"><Pill tone={sevTone(r.severity)}>{label(r.severity)}</Pill><Pill tone={statusPill(r.status)}>{label(r.status)}</Pill></span>
                    <span className="font-jakarta text-[14px] font-semibold text-[var(--color-text-primary)]">{label(r.category)} · {r.employeeName ?? 'Employee'}</span>
                    <span className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">Raised {fmtDateTime(r.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Details">{sel ? <Detail id={sel} /> : <Empty>Select an escalation to see its history.</Empty>}</Card>
      </div>
      <Contacts />
      <RaiseEscalationModal open={open} onClose={() => setOpen(false)} onRaised={reload} />
    </div>
  );
};
