import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bold, Italic, Heading2, List, ListOrdered, Code, Minus,
  Eye, Edit3, Save, Lock, Globe, ChevronDown, FileText
} from 'lucide-react';
import { coachService } from '../../../../services/coach.service';
import { useToast } from '../../../../context/ToastContext';

interface Session {
  id: string;
  startTime: string;
  status: string;
  type?: string;
  clientName?: string;
}

interface NotesTabProps {
  sessions: Session[];
}

const SESSION_STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-[var(--color-success)]/20 text-[var(--color-success)]',
  CONFIRMED: 'bg-[var(--color-info)]/20 text-[var(--color-info)]',
  SCHEDULED: 'bg-[var(--color-info)]/20 text-[var(--color-info)]',
  CANCELLED: 'bg-[var(--color-error)]/20 text-[var(--color-error)]',
  LIVE: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]',
};

const formatSessionDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatSessionTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const TOOLBAR_ACTIONS = [
  { icon: Bold,         label: 'Bold',            wrap: ['**', '**'],     placeholder: 'bold text' },
  { icon: Italic,       label: 'Italic',          wrap: ['*', '*'],       placeholder: 'italic text' },
  { icon: Heading2,     label: 'Heading',         wrap: ['## ', ''],      placeholder: 'Heading', newLine: true },
  { icon: List,         label: 'Bullet List',     wrap: ['- ', ''],       placeholder: 'list item', newLine: true },
  { icon: ListOrdered,  label: 'Numbered List',   wrap: ['1. ', ''],      placeholder: 'list item', newLine: true },
  { icon: Code,         label: 'Code',            wrap: ['`', '`'],       placeholder: 'code' },
  { icon: Minus,        label: 'Divider',         insert: '\n\n---\n\n' },
];

export const NotesTab: React.FC<NotesTabProps> = ({ sessions }) => {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'SHARED'>('PRIVATE');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);

  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadNote = useCallback(async (session: Session) => {
    setLoading(true);
    setContent('');
    setSavedAt(null);
    setDirty(false);
    try {
      const data = await coachService.getCoachNote(session.id);
      if (data?.notes) {
        // Strip the Summary:/Private: wrapper if stored from SessionDetailsModal
        const raw: string = data.notes;
        if (raw.includes('Private:') && raw.includes('Summary:')) {
          const privatePart = raw.split('Private:')[1]?.trim() ?? '';
          setContent(privatePart);
        } else {
          setContent(raw);
        }
        setVisibility(data.visibility ?? 'PRIVATE');
      }
    } catch {
      setContent('');
      showToast('Failed to load notes for this session.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleSelectSession = (session: Session) => {
    setSelectedSession(session);
    setDropdownOpen(false);
    setMode('preview');
    showToast(`Loading notes for ${formatSessionDate(session.startTime)}…`, 'info');
    void loadNote(session);
  };

  const handleSave = async () => {
    if (!selectedSession) return;
    setSaving(true);
    try {
      await coachService.updateSessionNotes(selectedSession.id, content, visibility);
      setSavedAt(new Date());
      setDirty(false);
      showToast('Note saved successfully.', 'success');
    } catch (err) {
      console.error('Failed to save note:', err);
      showToast('Failed to save note. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const applyToolbarAction = (action: typeof TOOLBAR_ACTIONS[0]) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);

    let newContent = content;
    let cursorStart = start;
    let cursorEnd = end;

    if (action.insert) {
      newContent = content.slice(0, start) + action.insert + content.slice(end);
      cursorStart = cursorEnd = start + action.insert.length;
    } else if (action.wrap) {
      const [before, after] = action.wrap;
      const insertion = selected || action.placeholder || '';
      const prefix = action.newLine && start > 0 && content[start - 1] !== '\n' ? '\n' : '';
      newContent = content.slice(0, start) + prefix + before + insertion + after + content.slice(end);
      cursorStart = start + prefix.length + before.length;
      cursorEnd = cursorStart + insertion.length;
    }

    setContent(newContent);
    setDirty(true);

    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setDirty(true);
  };

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  return (
    <div className="mt-8 animate-fade-in space-y-4">
      {/* Session Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider whitespace-nowrap">
          Session
        </span>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-all min-w-[220px]"
          >
            <FileText className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" />
            <span className="flex-1 text-left truncate">
              {selectedSession
                ? `${formatSessionDate(selectedSession.startTime)} · ${formatSessionTime(selectedSession.startTime)}`
                : 'Select a session…'}
            </span>
            <ChevronDown className={`w-4 h-4 text-[var(--color-text-secondary)] shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute z-20 mt-2 w-72 bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-xl shadow-xl overflow-hidden">
              {sortedSessions.length === 0 ? (
                <div className="p-4 text-sm text-[var(--color-text-secondary)] text-center">No sessions found</div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {sortedSessions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSession(s)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm hover:bg-[var(--color-bg-secondary)] transition-all ${selectedSession?.id === s.id ? 'bg-[var(--color-primary-lightest)]' : ''}`}
                    >
                      <div>
                        <p className="font-bold text-[var(--color-text-primary)]">{formatSessionDate(s.startTime)}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{formatSessionTime(s.startTime)}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${SESSION_STATUS_COLORS[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {s.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedSession && (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${SESSION_STATUS_COLORS[selectedSession.status] ?? ''}`}>
            {selectedSession.status}
          </span>
        )}
      </div>

      {/* Editor Area */}
      {!selectedSession ? (
        <div className="p-16 text-center bg-[var(--color-bg-secondary)] rounded-2xl border border-dashed border-[var(--color-border-primary)]">
          <FileText className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-tertiary)]" />
          <p className="text-sm font-bold text-[var(--color-text-secondary)]">Select a session to view or write notes</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Notes are private by default and support markdown formatting</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border-primary)] overflow-hidden">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-card)]">
            {/* Write / Preview tabs */}
            <div className="flex gap-1 p-0.5 bg-[var(--color-bg-tertiary)] rounded-lg">
              <button
                onClick={() => setMode('write')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mode === 'write' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Write
              </button>
              <button
                onClick={() => setMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mode === 'preview' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
            </div>

            {/* Visibility toggle */}
            <button
              onClick={() => { setVisibility(v => v === 'PRIVATE' ? 'SHARED' : 'PRIVATE'); setDirty(true); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                visibility === 'PRIVATE'
                  ? 'border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-[var(--color-warning-dark)]'
                  : 'border-[var(--color-info)]/30 bg-[var(--color-info)]/10 text-[var(--color-info)]'
              }`}
            >
              {visibility === 'PRIVATE' ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              {visibility === 'PRIVATE' ? 'Private' : 'Shared'}
            </button>
          </div>

          {/* Toolbar (write mode only) */}
          {mode === 'write' && (
            <div className="flex items-center gap-0.5 px-3 py-2 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-card)] flex-wrap">
              {TOOLBAR_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  title={action.label}
                  onClick={() => applyToolbarAction(action)}
                  className="p-1.5 rounded-md hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
                >
                  <action.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          )}

          {/* Content area */}
          {mode === 'write' ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder={`Write notes for this session…\n\nMarkdown is supported:\n**bold**, *italic*, ## heading, - list, \`code\``}
              className="w-full min-h-[320px] p-5 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none resize-y font-mono leading-relaxed"
              spellCheck
            />
          ) : (
            <div className="min-h-[320px] p-5">
              {content.trim() ? (
                <div className="markdown-preview text-sm leading-relaxed text-[var(--color-text-primary)]">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-tertiary)] italic">No notes yet — click Write to add some.</p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-card)]">
            <div className="text-xs text-[var(--color-text-tertiary)]">
              {saving
                ? 'Saving…'
                : savedAt
                ? `Saved ${savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : dirty
                ? 'Unsaved changes'
                : 'No changes'}
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="flex items-center gap-2 px-5 py-2 bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-40 transition-all shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save Note'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
