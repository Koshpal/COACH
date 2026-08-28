import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Clock, Trash2, Plus, Save, Lock, Copy, CalendarClock, Info } from 'lucide-react';
import { coachService } from '../../services/coach.service';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';

type Day =
  | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKDAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const WEEKS_TO_GENERATE = 4;
// Multiples of 30 only, so every generated session starts on a :00 or :30.
const DURATIONS = [30, 60, 90, 120];

// 00:00 … 23:30 in 30-minute steps
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

interface Range { start: string; end: string }
interface BookedSlot { id: string; start: string; end: string }
interface DayState { enabled: boolean; ranges: Range[]; booked: BookedSlot[] }
type Schedule = Record<Day, DayState>;

const emptySchedule = (): Schedule =>
  DAYS.reduce((acc, d) => ({ ...acc, [d]: { enabled: false, ranges: [], booked: [] } }), {} as Schedule);

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) =>
  toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);

/** Merge consecutive same-touching AVAILABLE slots back into editable ranges. */
function mergeSlots(slots: { start: string; end: string }[]): Range[] {
  const sorted = [...slots].sort((x, y) => toMin(x.start) - toMin(y.start));
  const out: Range[] = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    if (last && last.end === s.start) last.end = s.end;
    else out.push({ start: s.start, end: s.end });
  }
  return out;
}

export const Availability: React.FC = () => {
  const { showToast } = useToast();
  const [schedule, setSchedule] = useState<Schedule>(emptySchedule);
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const patch = useCallback((updater: (s: Schedule) => Schedule) => {
    setSchedule((prev) => updater(structuredClone(prev)));
    setDirty(true);
  }, []);

  const loadExistingSlots = useCallback(async () => {
    try {
      setLoading(true);
      const data = await coachService.getWeeklySchedule(WEEKS_TO_GENERATE);
      const next = emptySchedule();
      for (const day of DAYS) {
        const rows: any[] = Array.isArray(data?.[day.toUpperCase()]) ? data[day.toUpperCase()] : [];
        const booked = rows.filter((r) => r.status === 'BOOKED').map((r) => ({ id: r.id, start: r.start, end: r.end }));
        const available = rows.filter((r) => r.status === 'AVAILABLE');
        next[day] = {
          enabled: rows.length > 0,
          ranges: mergeSlots(available),
          booked,
        };
      }
      setSchedule(next);
      setDirty(false);
    } catch (err) {
      console.error('Error loading slots:', err);
      showToast('Failed to load availability', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadExistingSlots(); }, [loadExistingSlots]);

  // Warn before leaving with unsaved edits
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const toggleDay = (day: Day) =>
    patch((s) => { s[day].enabled = !s[day].enabled; return s; });

  const addRange = (day: Day) =>
    patch((s) => {
      const last = s[day].ranges[s[day].ranges.length - 1];
      const start = last ? last.end : '10:00';
      const startMin = Math.min(toMin(start), 24 * 60 - duration);
      const endMin = startMin + duration;
      s[day].ranges.push({
        start: TIME_OPTIONS[Math.round(startMin / 30)] ?? '10:00',
        end: TIME_OPTIONS[Math.round(endMin / 30)] ?? '11:00',
      });
      return s;
    });

  const removeRange = (day: Day, i: number) =>
    patch((s) => { s[day].ranges.splice(i, 1); return s; });

  const editRange = (day: Day, i: number, key: 'start' | 'end', val: string) =>
    patch((s) => { s[day].ranges[i][key] = val; return s; });

  const copyToWeekdays = (day: Day) =>
    patch((s) => {
      const src = s[day].ranges.map((r) => ({ ...r }));
      for (const d of WEEKDAYS) {
        if (d === day) continue;
        s[d].enabled = src.length > 0;
        s[d].ranges = src.map((r) => ({ ...r }));
      }
      return s;
    });

  const quickStart = () =>
    patch((s) => {
      for (const d of DAYS) {
        const isWeekday = WEEKDAYS.includes(d);
        s[d].enabled = isWeekday;
        s[d].ranges = isWeekday ? [{ start: '10:00', end: '18:00' }] : [];
      }
      return s;
    });

  // ---- validation ----
  const dayErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    for (const day of DAYS) {
      const d = schedule[day];
      if (!d.enabled) continue;
      for (let i = 0; i < d.ranges.length; i++) {
        const r = d.ranges[i];
        const len = toMin(r.end) - toMin(r.start);
        if (len <= 0) { errs[day] = `${r.start}–${r.end}: end must be after start`; break; }
        if (len < duration) {
          errs[day] = `${r.start}–${r.end} is shorter than one ${duration}-min session`; break;
        }
        if (d.ranges.some((o, j) => j !== i && overlaps(r, o))) {
          errs[day] = `${r.start}–${r.end} overlaps another block`; break;
        }
        if (d.booked.some((b) => overlaps(r, b))) {
          errs[day] = `${r.start}–${r.end} overlaps a booked session`; break;
        }
      }
    }
    return errs;
  }, [schedule, duration]);

  const summary = useMemo(() => {
    let openSlots = 0, bookedCount = 0, activeDays = 0;
    for (const day of DAYS) {
      const d = schedule[day];
      bookedCount += d.booked.length;
      if (!d.enabled) continue;
      const mins = d.ranges.reduce((sum, r) => sum + Math.max(0, toMin(r.end) - toMin(r.start)), 0);
      if (mins > 0) activeDays++;
      openSlots += Math.floor(mins / duration);
    }
    return { openSlotsPerWeek: openSlots, openSlotsTotal: openSlots * WEEKS_TO_GENERATE, bookedCount, activeDays };
  }, [schedule, duration]);

  const hasErrors = Object.keys(dayErrors).length > 0;

  const doPublish = async () => {
    setConfirmOpen(false);
    try {
      setPublishing(true);
      const weeklySchedule = DAYS.reduce((acc, day) => {
        const d = schedule[day];
        if (d.enabled && d.ranges.length > 0) {
          acc[day.toUpperCase()] = d.ranges.map((r) => ({ start: r.start, end: r.end }));
        }
        return acc;
      }, {} as Record<string, { start: string; end: string }[]>);

      const res: any = await coachService.saveWeeklyAvailability({
        slotDurationMinutes: duration,
        weeksToGenerate: WEEKS_TO_GENERATE,
        weeklySchedule,
      });
      showToast(
        `Published — ${res?.slotsGenerated ?? summary.openSlotsTotal} open slots for the next ${WEEKS_TO_GENERATE} weeks.`,
        'success',
      );
      await loadExistingSlots();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to publish availability.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const nothingConfigured = !loading && DAYS.every((d) => !schedule[d].enabled || schedule[d].ranges.length === 0) &&
    DAYS.every((d) => schedule[d].booked.length === 0);

  return (
    <div className="mx-auto space-y-6 max-w-7xl">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-heading">Availability</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Set your weekly working hours. We split them into {duration}-minute sessions employees can book.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs font-semibold text-[var(--color-warning-dark)]">Unsaved changes</span>}
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={publishing || loading || hasErrors}
            className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] text-[var(--color-text-inverse)] rounded-xl font-bold hover:opacity-90 disabled:opacity-50 shadow-lg transition-all"
          >
            {publishing
              ? <div className="w-4 h-4 border-2 border-[var(--color-text-inverse)] border-t-transparent rounded-full animate-spin" />
              : <Save className="w-5 h-5" />}
            Publish Schedule
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)]">
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          <Clock className="w-4 h-4 text-[var(--color-primary)]" />
          Session length
          <select
            value={duration}
            onChange={(e) => { setDuration(Number(e.target.value)); setDirty(true); }}
            className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
          </select>
        </label>
        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-info-bg)] text-[var(--color-primary)]">
          <Info className="w-3.5 h-3.5" /> All times in IST (Asia/Kolkata)
        </span>
        <span className="text-xs text-[var(--color-text-tertiary)]">Applies to the next {WEEKS_TO_GENERATE} weeks</span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--color-bg-secondary)] animate-pulse" />
          ))}
        </div>
      ) : nothingConfigured ? (
        <div className="p-10 text-center bg-[var(--color-bg-card)] rounded-2xl border border-dashed border-[var(--color-border-primary)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
            <CalendarClock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">No availability set</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-5">
            Employees can&rsquo;t book you until you publish some working hours.
          </p>
          <button
            onClick={quickStart}
            className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-text-inverse)] font-bold hover:opacity-90"
          >
            Start with weekdays 10:00–18:00
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-3">
            {DAYS.map((day) => {
              const d = schedule[day];
              const err = dayErrors[day];
              return (
                <div
                  key={day}
                  className={`p-5 rounded-2xl border transition-all ${
                    d.enabled ? 'bg-[var(--color-bg-card)] border-[var(--color-primary-light)]' : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleDay(day)}
                        role="switch"
                        aria-checked={d.enabled}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${d.enabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-secondary)]'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${d.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className={`text-lg font-bold ${d.enabled ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>{day}</span>
                      {d.booked.length > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-dark)]">
                          {d.booked.length} booked
                        </span>
                      )}
                    </div>
                    {d.enabled && (
                      <div className="flex items-center gap-3">
                        {d.ranges.length > 0 && (
                          <button onClick={() => copyToWeekdays(day)} className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
                            <Copy className="w-3.5 h-3.5" /> Copy to weekdays
                          </button>
                        )}
                        <button onClick={() => addRange(day)} className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-primary)] hover:underline">
                          <Plus className="w-4 h-4" /> Add hours
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Booked (locked) */}
                  {d.booked.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-[var(--color-success-bg)] border border-[var(--color-success-light)]">
                      <Lock className="w-4 h-4 text-[var(--color-success-dark)]" />
                      <span className="text-sm font-semibold text-[var(--color-success-dark)]">{b.start} – {b.end}</span>
                      <span className="text-xs text-[var(--color-success-dark)]/80">Booked · protected</span>
                    </div>
                  ))}

                  {d.enabled && (
                    <div className="space-y-2">
                      {d.ranges.length === 0 && d.booked.length === 0 && (
                        <p className="text-sm text-[var(--color-text-secondary)] italic">No hours added for this day.</p>
                      )}
                      {d.ranges.map((r, i) => {
                        const len = Math.max(0, toMin(r.end) - toMin(r.start));
                        const nSlots = Math.floor(len / duration);
                        const leftover = len - nSlots * duration;
                        return (
                          <div key={`${day}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-black/5">
                            <select
                              value={r.start}
                              onChange={(e) => editRange(day, i, 'start', e.target.value)}
                              className="min-w-[96px] bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-lg pl-3.5 pr-9 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                            >
                              {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="text-xs font-bold text-[var(--color-text-tertiary)]">to</span>
                            <select
                              value={r.end}
                              onChange={(e) => editRange(day, i, 'end', e.target.value)}
                              className="min-w-[96px] bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-lg pl-3.5 pr-9 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                            >
                              {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="text-xs text-[var(--color-text-tertiary)]">
                              {nSlots} slot{nSlots === 1 ? '' : 's'}
                              {leftover > 0 && nSlots > 0 && ` · last ${leftover}m unused`}
                            </span>
                            <div className="flex-1" />
                            <button onClick={() => removeRange(day, i)} className="p-2 text-[var(--color-error)] hover:bg-[var(--color-error-light)] rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                      {err && <p className="text-xs font-semibold text-[var(--color-error-dark)] pt-1">{err}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] shadow-sm">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4 font-heading">Summary</h3>
              <div className="space-y-3 text-sm">
                <Row label="Active days" value={summary.activeDays} />
                <Row label={`Open slots / week`} value={summary.openSlotsPerWeek} />
                <Row label={`Over ${WEEKS_TO_GENERATE} weeks`} value={summary.openSlotsTotal} />
                <Row label="Booked (protected)" value={summary.bookedCount} />
              </div>
            </div>

            <div className="p-6 bg-[var(--color-info-bg)] rounded-2xl border border-[var(--color-primary-light)]">
              <h4 className="font-bold text-[var(--color-primary)] mb-2">How it works</h4>
              <ul className="text-xs text-[var(--color-primary-darkest)] space-y-2 list-disc pl-4">
                <li>Publishing replaces your <strong>open</strong> slots for the next {WEEKS_TO_GENERATE} weeks.</li>
                <li>Booked sessions are never touched.</li>
                <li>Each block is split into {duration}-minute sessions; any leftover time is ignored.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Publish schedule?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            This regenerates your open availability for the next <strong>{WEEKS_TO_GENERATE} weeks</strong>.
          </p>
          <ul className="text-sm space-y-1.5">
            <li className="flex justify-between"><span className="text-[var(--color-text-secondary)]">New open slots</span><strong>{summary.openSlotsTotal}</strong></li>
            <li className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Booked sessions kept</span><strong>{summary.bookedCount}</strong></li>
          </ul>
          {summary.openSlotsTotal === 0 && (
            <p className="text-xs font-semibold text-[var(--color-warning-dark)]">
              You&rsquo;re publishing an empty schedule — employees won&rsquo;t be able to book you.
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setConfirmOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]">
              Cancel
            </button>
            <button onClick={doPublish} className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-text-inverse)] font-bold hover:opacity-90">
              Publish
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const Row: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-[var(--color-text-secondary)]">{label}</span>
    <span className="font-bold text-[var(--color-primary)] tabular-nums">{value}</span>
  </div>
);
