import { useCallback, useEffect, useRef, useState } from 'react';
import { coachingService, NOTE_FIELDS, parseApiError, type NoteField, type NoteFields } from '../../services/coaching.service';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'offline' | 'conflict' | 'locked' | 'error';

interface Conflict { server: { version: number; fields: NoteFields }; fields: string[] }
interface Draft { baseVersion: number; changes: Partial<NoteFields>; ts: number }

const DEBOUNCE_MS = 1200;
const MAX_BACKOFF_MS = 30_000;

// Coaching notes can contain sensitive financial information. Keep recovery drafts tab-scoped
// rather than persisting them across browser restarts in localStorage.
const draftKey = (sessionId: string) => `koshpal.coach.notes.${sessionId}`;
const readDraft = (sessionId: string): Draft | null => {
  try { const raw = sessionStorage.getItem(draftKey(sessionId)); return raw ? (JSON.parse(raw) as Draft) : null; } catch { return null; }
};
const writeDraft = (sessionId: string, draft: Draft | null) => {
  try { if (draft) sessionStorage.setItem(draftKey(sessionId), JSON.stringify(draft)); else sessionStorage.removeItem(draftKey(sessionId)); } catch { /* storage unavailable: server autosave still protects the notes */ }
};

/**
 * Live-notes autosave.
 *  - debounced PUT of ONLY the changed fields, with the server version they were based on;
 *  - one request in flight at a time; edits made meanwhile are sent right after;
 *  - every keystroke is mirrored to sessionStorage, so a refresh / crash / dropped connection loses nothing;
 *  - offline => retry with backoff (and immediately when the browser comes back online);
 *  - a 409 is surfaced as a conflict the coach resolves — never silently overwritten.
 */
export function useNotesAutosave(sessionId: string, initial: { version: number; fields: NoteFields }, editable: boolean) {
  // Copy, never alias: the ref below is mutated on every keystroke and must not touch the caller's object.
  const [fields, setFields] = useState<NoteFields>(() => ({ ...initial.fields }));
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [recovered, setRecovered] = useState(0);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const fieldsRef = useRef<NoteFields>({ ...initial.fields });
  const baseVersion = useRef(initial.version);
  const dirty = useRef<Set<NoteField>>(new Set());
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failures = useRef(0);
  const statusRef = useRef<SaveStatus>('saved');
  const setStatusBoth = (s: SaveStatus) => { statusRef.current = s; setStatus(s); };

  const persist = useCallback(() => {
    if (!dirty.current.size) return writeDraft(sessionId, null);
    const changes: Partial<NoteFields> = {};
    dirty.current.forEach((k) => { changes[k] = fieldsRef.current[k]; });
    writeDraft(sessionId, { baseVersion: baseVersion.current, changes, ts: Date.now() });
  }, [sessionId]);

  const schedule = useCallback((ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void save(); }, ms);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = useCallback(async (): Promise<void> => {
    if (inFlight.current || !dirty.current.size || !editable) return;
    if (statusRef.current === 'conflict' || statusRef.current === 'locked') return;
    inFlight.current = true;
    setStatusBoth('saving');
    const keys = [...dirty.current];
    const sent: Partial<NoteFields> = {};
    keys.forEach((k) => { sent[k] = fieldsRef.current[k]; });
    try {
      const res = await coachingService.saveNotes(sessionId, baseVersion.current, sent);
      failures.current = 0;
      baseVersion.current = res.version;
      keys.forEach((k) => { if (fieldsRef.current[k] === sent[k]) dirty.current.delete(k); });
      // adopt fields the server merged in from elsewhere, but never clobber anything still being typed
      let changed = false;
      NOTE_FIELDS.forEach((f) => { if (!dirty.current.has(f) && fieldsRef.current[f] !== res.fields[f]) { fieldsRef.current[f] = res.fields[f]; changed = true; } });
      if (changed) setFields({ ...fieldsRef.current });
      persist();
      setSavedAt(new Date());
      setMessage(null);
      if (dirty.current.size) { setStatusBoth('unsaved'); schedule(DEBOUNCE_MS); } else setStatusBoth('saved');
    } catch (e) {
      const err = parseApiError(e);
      if (err.offline || (err.status !== null && err.status >= 500)) {
        failures.current += 1;
        setStatusBoth('offline');
        setMessage('Not saved yet — your notes are kept on this device and will sync automatically.');
        schedule(Math.min(MAX_BACKOFF_MS, 2000 * 2 ** Math.min(failures.current, 5)));
      } else if (err.status === 409 && err.code === 'NOTE_CONFLICT' && err.server) {
        setConflict({ server: err.server, fields: err.conflictingFields ?? [] });
        setStatusBoth('conflict');
      } else if (err.status === 409 || err.status === 403) {
        setStatusBoth('locked');
        setMessage(err.message);
      } else {
        setStatusBoth('error');
        setMessage(err.message);
      }
    } finally {
      inFlight.current = false;
    }
  }, [editable, persist, schedule, sessionId]);

  /** Draft recovery: re-apply anything that was typed but never reached the server. */
  useEffect(() => {
    if (!editable) return;
    const draft = readDraft(sessionId);
    if (!draft) return;
    // Idempotent (React StrictMode runs effects twice): compares against the untouched `initial`.
    const toRecover = (Object.keys(draft.changes) as NoteField[]).filter(
      (k) => NOTE_FIELDS.includes(k) && draft.changes[k] !== initial.fields[k],
    );
    if (toRecover.length) {
      toRecover.forEach((k) => { fieldsRef.current[k] = draft.changes[k] as string; dirty.current.add(k); });
      baseVersion.current = Math.min(draft.baseVersion, initial.version); // keep the conflict check honest
      setFields({ ...fieldsRef.current });
      setRecovered(toRecover.length);
      setStatusBoth('unsaved');
      schedule(300);
    } else if (!dirty.current.size) {
      writeDraft(sessionId, null); // the draft only repeats what the server already has
    }
    // run once per session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const setField = useCallback((key: NoteField, value: string) => {
    if (!editable) return;
    fieldsRef.current[key] = value;
    dirty.current.add(key);
    setFields({ ...fieldsRef.current });
    persist();
    if (statusRef.current !== 'conflict' && statusRef.current !== 'locked') { setStatusBoth('unsaved'); schedule(DEBOUNCE_MS); }
  }, [editable, persist, schedule]);

  /** Flush immediately (used before closing the session or navigating away). */
  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    let guard = 0;
    while (dirty.current.size && statusRef.current !== 'conflict' && statusRef.current !== 'locked' && guard++ < 5) {
      await save();
      if (statusRef.current === 'offline' || statusRef.current === 'error') break;
    }
    return !dirty.current.size;
  }, [save]);

  const keepMine = useCallback(() => {
    if (!conflict) return;
    baseVersion.current = conflict.server.version; // I have seen the server copy; my edits now win
    setConflict(null);
    setStatusBoth('unsaved');
    void save();
  }, [conflict, save]);

  const useServer = useCallback(() => {
    if (!conflict) return;
    conflict.fields.forEach((f) => { if (NOTE_FIELDS.includes(f as NoteField)) { fieldsRef.current[f as NoteField] = conflict.server.fields[f as NoteField]; dirty.current.delete(f as NoteField); } });
    NOTE_FIELDS.forEach((f) => { if (!dirty.current.has(f)) fieldsRef.current[f] = conflict.server.fields[f]; });
    baseVersion.current = conflict.server.version;
    setFields({ ...fieldsRef.current });
    setConflict(null);
    persist();
    setStatusBoth(dirty.current.size ? 'unsaved' : 'saved');
    if (dirty.current.size) schedule(300);
  }, [conflict, persist, schedule]);

  useEffect(() => {
    const online = () => { if (statusRef.current === 'offline') { failures.current = 0; void save(); } };
    const hide = () => { if (document.visibilityState === 'hidden' && dirty.current.size) void save(); };
    const unload = (e: BeforeUnloadEvent) => { if (dirty.current.size) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('online', online);
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('beforeunload', unload);
    return () => {
      window.removeEventListener('online', online);
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('beforeunload', unload);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [save]);

  return { fields, setField, status, message, conflict, keepMine, useServer, recovered, savedAt, flush, hasUnsaved: () => dirty.current.size > 0 };
}
