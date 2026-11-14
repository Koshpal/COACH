import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/ui/Button';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { coachingService } from '../../services/coaching.service';
import { ESC_CATEGORIES, opsError, opsService, type EscCategory, type Severity } from '../../services/coachingOps.service';
import { label } from '../Coaching/ui';
import { Field, Select, TextArea } from './shared';

/** Used from the Escalations page and from the Session Runner ("I need help"). */
export const RaiseEscalationModal: React.FC<{ open: boolean; onClose: () => void; onRaised?: () => void; employeeId?: string; sessionId?: string }> = ({ open, onClose, onRaised, employeeId, sessionId }) => {
  const { showToast } = useToast();
  const employees = useAsync(() => (employeeId ? Promise.resolve(null) : coachingService.employees({ pageSize: 100 })), [employeeId]);
  const [emp, setEmp] = useState(employeeId ?? '');
  const [category, setCategory] = useState<EscCategory>('FINANCIAL_DISTRESS');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);
  const target = employeeId ?? emp;
  const valid = !!target && summary.trim().length >= 10;

  const submit = async () => {
    setBusy(true);
    try {
      await opsService.raise({ employeeId: target, sessionId, category, severity, summary: summary.trim() });
      showToast('Escalation raised. An administrator will pick it up.', 'success');
      setSummary('');
      onRaised?.();
      onClose();
    } catch (e) { showToast(opsError(e), 'error'); } finally { setBusy(false); }
  };

  return (
    <Modal isOpen={open} onClose={onClose} header={<span className="font-jakarta font-semibold">Raise an escalation</span>} size="md"
      footer={<div className="flex justify-end gap-2"><Button variant="neutral" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!valid} onClick={submit}>Raise escalation</Button></div>}>
      <div className="flex flex-col gap-4">
        {!employeeId && (
          <Field label="Employee">
            <Select value={emp} onChange={(e) => setEmp(e.target.value)}>
              <option value="">Select an employee…</option>
              {employees.data?.items.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category"><Select value={category} onChange={(e) => setCategory(e.target.value as EscCategory)}>{ESC_CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}</Select></Field>
          <Field label="Severity"><Select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>{(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Severity[]).map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select></Field>
        </div>
        <Field label="What is happening?" hint="Facts only: what you saw or were told, and what you have already done. Minimum 10 characters.">
          <TextArea value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={4000} />
        </Field>
        <p className="rounded-[10px] bg-[var(--color-warning-bg)] px-3 py-2 font-outfit text-[12px] text-[var(--color-warning-darkest)]">If someone is in immediate danger, contact emergency services first, then raise this escalation.</p>
      </div>
    </Modal>
  );
};
