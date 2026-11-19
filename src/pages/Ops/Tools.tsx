import { usePolling } from '../../hooks/usePolling';
import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/ui/Button';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { coachingService } from '../../services/coaching.service';
import { opsError, opsService, type ToolResult } from '../../services/coachingOps.service';
import { Card, Empty, Pill, SectionError, SectionSkeleton, fmtDateTime, label } from '../Coaching/ui';
import { Field, Select, TextInput, statusPill } from './shared';
import { TOOL_FORMS, type ToolField } from './toolForms';

const fmtVal = (v: unknown): string => (typeof v === 'number' ? v.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : v == null ? '—' : String(v));
const Outputs: React.FC<{ value: any; depth?: number }> = ({ value, depth = 0 }) => {
  if (Array.isArray(value)) return <ul className="flex flex-col gap-1.5">{value.map((v, i) => <li key={i} className="rounded-[8px] bg-[var(--color-bg-secondary)] px-3 py-2"><Outputs value={v} depth={depth + 1} /></li>)}</ul>;
  if (value && typeof value === 'object') return <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">{Object.entries(value).map(([k, v]) => (<React.Fragment key={k}><dt className="font-outfit text-[13px] text-[var(--color-text-tertiary)]">{label(k.replace(/([A-Z])/g, '_$1'))}</dt><dd className="font-outfit text-[14px] font-medium text-[var(--color-text-primary)]">{typeof v === 'object' && v ? <Outputs value={v} depth={depth + 1} /> : fmtVal(v)}</dd></React.Fragment>))}</dl>;
  return <span>{fmtVal(value)}</span>;
};

const FieldInput: React.FC<{ f: ToolField; value: string; onChange: (v: string) => void }> = ({ f, value, onChange }) => (
  <Field label={f.label + (f.optional ? ' (optional)' : '')} hint={f.hint}>
    {f.type === 'select' && f.options ? <Select value={value} onChange={(e) => onChange(e.target.value)}>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
      : <TextInput inputMode={f.type === 'number' ? 'decimal' : undefined} value={value} onChange={(e) => onChange(e.target.value)} maxLength={f.type === 'number' ? 18 : 80} />}
  </Field>
);

export const Tools: React.FC = () => {
  const { showToast } = useToast();
  const employees = useAsync(() => coachingService.employees({ pageSize: 100 }), []);
  const catalog = useAsync(() => opsService.tools(), []);
  const [empId, setEmpId] = useState(''); const [tool, setTool] = useState('EMI');
  const [vals, setVals] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Record<string, Record<string, string>[]>>({});
  const [busy, setBusy] = useState(false);
  // Result of a calculation run without an employee: shown only here, never saved.
  const [preview, setPreview] = useState<{ tool: string; outputs: any; configRef: string | null } | null>(null);
  const form = TOOL_FORMS[tool];
  const results = useAsync(() => (empId ? opsService.results(empId) : Promise.resolve([] as ToolResult[])), [empId]);

  // The employee confirms in their own portal: poll so the coach sees "Confirmed" without refreshing.
  usePolling(results.refresh, 10_000, !!empId);

  useEffect(() => {
    setPreview(null);
    setVals(Object.fromEntries(form.fields.map((f) => [f.key, f.def ?? ''])));
    setRows(Object.fromEntries((form.rows ?? []).map((r) => [r.key, Array.from({ length: Math.max(1, r.min ?? 0) }, () => ({}))])));
  }, [tool]); // eslint-disable-line react-hooks/exhaustive-deps

  const inputs = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const f of form.fields) { const v = vals[f.key]; if (v === undefined || v === '') continue; out[f.key] = f.type === 'number' ? Number(v) : v; }
    for (const r of form.rows ?? []) out[r.key] = (rows[r.key] ?? []).filter((row) => Object.values(row).some((v) => v)).map((row) => Object.fromEntries(r.cols.map((c) => [c.key, c.type === 'number' ? Number(row[c.key] ?? 0) : row[c.key] ?? ''])));
    return out;
  }, [vals, rows, form]);

  const compute = async () => {
    setBusy(true);
    try {
      if (!empId) { setPreview(await opsService.calculate({ tool, inputs })); showToast('Calculated. Pick an employee if you want to save and share it.', 'success'); }
      else { setPreview(null); await opsService.createResult({ employeeId: empId, tool, inputs }); showToast('Calculated. Review it, then share it with the employee.', 'success'); results.reload(); }
    } catch (e) { showToast(opsError(e), 'error'); } finally { setBusy(false); }
  };
  const share = async (id: string) => { try { await opsService.shareResult(id); showToast('Shared. The employee can now see and confirm it.', 'success'); results.reload(); } catch (e) { showToast(opsError(e), 'error'); } };

  return (
    <div className="flex flex-col gap-6">
      <Header title="Financial tools" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card title="Calculate">
          <div className="flex flex-col gap-4">
            <Field label="Employee (optional)" hint="Leave empty to just calculate. Choose an employee to save the result and share it with them."><Select value={empId} onChange={(e) => setEmpId(e.target.value)}><option value="">No employee — calculate only</option>{employees.data?.items.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></Field>
            <Field label="Tool"><Select value={tool} onChange={(e) => setTool(e.target.value)}>{Object.entries(TOOL_FORMS).map(([k, v]) => { const c = catalog.data?.find((x) => x.tool === k); return <option key={k} value={k}>{v.title}{c && !c.configured ? ' (not configured)' : ''}</option>; })}</Select></Field>
            <p className="font-outfit text-[13px] text-[var(--color-text-tertiary)]">{form.blurb}</p>
            {form.fields.map((f) => <FieldInput key={f.key} f={f} value={vals[f.key] ?? ''} onChange={(v) => setVals((s) => ({ ...s, [f.key]: v }))} />)}
            {(form.rows ?? []).map((r) => (
              <div key={r.key} className="flex flex-col gap-2"><span className="font-outfit text-[13px] font-medium text-[var(--color-text-secondary)]">{r.label}</span>
                {(rows[r.key] ?? []).map((row, i) => (
                  <div key={i} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${r.cols.length}, minmax(0, 1fr)) auto` }}>
                    {r.cols.map((c) => <TextInput key={c.key} aria-label={c.label} placeholder={c.label} inputMode={c.type === 'number' ? 'decimal' : undefined} value={row[c.key] ?? ''} onChange={(e) => setRows((s) => ({ ...s, [r.key]: s[r.key].map((x, j) => (j === i ? { ...x, [c.key]: e.target.value } : x)) }))} />)}
                    <button type="button" aria-label="Remove row" className="px-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-error-dark)]" disabled={(rows[r.key]?.length ?? 0) <= (r.min ?? 0)} onClick={() => setRows((s) => ({ ...s, [r.key]: s[r.key].filter((_, j) => j !== i) }))}>✕</button>
                  </div>))}
                <Button variant="tertiary" size="sm" onClick={() => setRows((s) => ({ ...s, [r.key]: [...(s[r.key] ?? []), {}] }))}>Add row</Button>
              </div>))}
            <Button loading={busy} onClick={compute}>Calculate</Button>
          </div>
        </Card>
        <Card title={empId ? 'Results for this employee' : 'Result'}>
          {!empId ? (preview ? (
            <div className="rounded-[12px] border border-[var(--color-border-primary)] p-4">
              <div className="mb-2 flex items-center justify-between gap-2"><span className="font-jakarta text-[15px] font-semibold">{TOOL_FORMS[preview.tool]?.title ?? label(preview.tool)}</span><Pill tone="neutral">Not saved</Pill></div>
              <Outputs value={preview.outputs} />
              {preview.configRef && <p className="mt-2 font-outfit text-[12px] text-[var(--color-text-tertiary)]">Based on configuration: {preview.configRef}</p>}
              <p className="mt-3 font-outfit text-[12px] text-[var(--color-text-tertiary)]">Choose an employee above and calculate again to save this and share it with them.</p>
            </div>
          ) : <Empty>Fill in the form and press Calculate. Choose an employee only if you want to save and share the result.</Empty>) : results.loading && !results.data ? <SectionSkeleton rows={2} /> : results.error ? <SectionError message={results.error} onRetry={results.reload} /> : !results.data?.length ? <Empty>No calculations yet.</Empty> : (
            <ul className="flex flex-col gap-4">
              {results.data.map((r) => (
                <li key={r.id} className="rounded-[12px] border border-[var(--color-border-primary)] p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className="font-jakarta text-[15px] font-semibold">{TOOL_FORMS[r.tool]?.title ?? label(r.tool)}</span><span className="flex items-center gap-2"><Pill tone={statusPill(r.status)}>{label(r.status)}</Pill><span className="font-outfit text-[12px] text-[var(--color-text-tertiary)]">v{r.version} · {fmtDateTime(r.updatedAt)}</span></span></div>
                  <Outputs value={r.outputs} />
                  {r.configRef && <p className="mt-2 font-outfit text-[12px] text-[var(--color-text-tertiary)]">Based on configuration: {r.configRef}</p>}
                  {r.status === 'DRAFT' && <div className="mt-3 flex justify-end"><Button size="sm" onClick={() => share(r.id)}>Share with employee</Button></div>}
                </li>))}
            </ul>)}
        </Card>
      </div>
    </div>
  );
};
