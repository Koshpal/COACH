import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Star, MessageSquare, CircleCheckBig, Save } from 'lucide-react';
import { coachService } from '../../services/coach.service';
import { Modal } from '../common/Modal';
import { Session } from '../../types/coach.types';

interface SessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
}

interface EmployeeFeedback {
  id: string;
  rating: number;
  feedbackText: string;
  createdAt: string;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({ isOpen, onClose, session }) => {
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [summary, setSummary] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [employeeFeedback, setEmployeeFeedback] = useState<EmployeeFeedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    if (isOpen && session) {
      const loadNotesAndFeedback = async () => {
        try {
          // Load notes
          const noteResponse = session.coachNotes
            ? { notes: session.coachNotes }
            : await coachService.getCoachNote(session.id);

          const rawNotes = noteResponse?.notes || '';

          if (rawNotes.includes('Summary:') && rawNotes.includes('Private:')) {
            const parts = rawNotes.split('Private:');
            setSummary(parts[0].replace('Summary:', '').trim());
            setCoachNotes(parts[1].trim());
          } else {
            setSummary(rawNotes);
            setCoachNotes('');
          }

          // Load employee feedback
          setLoadingFeedback(true);
          try {
            const feedback = await coachService.getSessionFeedback(session.id);
            if (feedback) {
              setEmployeeFeedback(feedback);
            }
          } catch (err) {
            console.error('Error loading feedback:', err);
          } finally {
            setLoadingFeedback(false);
          }
        } catch {
          setSummary(session.coachNotes || '');
          setCoachNotes('');
        }
      };

      void loadNotesAndFeedback();
      setIsEditingSummary(false);
      setIsEditingNotes(false);
    }
  }, [isOpen, session]);

  if (!session) return null;

  const saveToBackend = async (newSummary: string, newNotes: string) => {
    setIsSaving(true);
    try {
      const combinedNotes = `Summary: ${newSummary}\n\nPrivate: ${newNotes}`;
      await coachService.updateSessionNotes(session.id, combinedNotes, 'SHARED');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSummary = async () => {
    await saveToBackend(summary, coachNotes);
    setIsEditingSummary(false);
  };

  const handleSaveNotes = async () => {
    await saveToBackend(summary, coachNotes);
    setIsEditingNotes(false);
  };

  const initials = (() => {
    const name = session.clientName || 'Client';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  })();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Session Details">
      <div className="space-y-8">
        {/* Client Profile Header */}
        <div className="flex items-center gap-6 p-6 bg-[var(--color-bg-secondary)] rounded-2xl border border-black/5">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-darkest)] flex items-center justify-center text-xl font-bold shadow-sm">
            {initials}
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] font-heading">{session.clientName}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] font-medium">
              {session.role || 'Employee'} • {session.company || 'Koshpal'}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: Calendar, label: 'Scheduled', value: session.date || 'TBD' },
            { icon: Clock, label: 'Duration', value: session.duration || '45m' },
            { icon: CircleCheckBig, label: 'Status', value: session.status, isStatus: true },
            { icon: Star, label: 'Client Rating', value: `${session.rating || 'N/A'}/5.0`, isRating: true }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-black/5">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-card)] flex items-center justify-center shadow-sm">
                <item.icon className={`w-5 h-5 ${item.isRating ? 'text-orange-400 fill-current' : 'text-[var(--color-text-secondary)]'}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">{item.label}</p>
                {item.isStatus ? (
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-darkest)] text-[10px] font-bold border border-[var(--color-success)]">
                    {item.value}
                  </span>
                ) : (
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">{item.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Shared Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[var(--color-text-primary)] font-heading uppercase tracking-wide flex items-center gap-2">
              Shared Summary
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Employee sees this</span>
            </h4>
            {!isEditingSummary && (
              <button
                onClick={() => setIsEditingSummary(true)}
                className="text-xs font-bold text-[var(--color-primary)] hover:underline"
              >
                Edit Summary
              </button>
            )}
          </div>
          {isEditingSummary ? (
            <div className="space-y-3 animate-fade-in">
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="w-full p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none transition-all"
                placeholder="What was discussed in the session?"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsEditingSummary(false)} className="px-4 py-1.5 text-xs font-bold text-[var(--color-text-secondary)]">Cancel</button>
                <button
                  onClick={handleSaveSummary}
                  disabled={isSaving}
                  className="px-6 py-1.5 bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-xs font-bold rounded-lg shadow-md hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Summary'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-black/5 text-sm text-[var(--color-text-secondary)] leading-relaxed italic">
              {summary || 'No summary provided for this session.'}
            </div>
          )}
        </div>

        {/* Private Coach Notes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[var(--color-text-primary)] font-heading uppercase tracking-wide flex items-center gap-2">
              Private Coach Notes
              <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Only you see this</span>
            </h4>
            {!isEditingNotes && (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="text-xs font-bold text-[var(--color-primary)] hover:underline"
              >
                Edit Notes
              </button>
            )}
          </div>
          {isEditingNotes ? (
            <div className="space-y-3 animate-fade-in">
              <textarea
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                rows={3}
                className="w-full p-4 bg-orange-50/30 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none resize-none transition-all"
                placeholder="Personal observations and future focus points..."
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsEditingNotes(false)} className="px-4 py-1.5 text-xs font-bold text-[var(--color-text-secondary)]">Cancel</button>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                  className="px-6 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg shadow-md hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-orange-50/20 rounded-xl border border-orange-100/50 text-sm text-orange-800/80 leading-relaxed">
              {coachNotes || 'No private notes added.'}
            </div>
          )}
        </div>

        {/* Employee Feedback Section */}
        {loadingFeedback ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : employeeFeedback ? (
          <div className="space-y-3 p-4 bg-green-50/30 rounded-2xl border border-green-100/50">
            <h4 className="text-sm font-bold text-green-700 font-heading uppercase tracking-wide flex items-center gap-2">
              <Star className="w-4 h-4 fill-current" />
              Employee Feedback
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < employeeFeedback.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 font-bold text-green-700">{employeeFeedback.rating}/5</span>
              </div>
              {employeeFeedback.feedbackText && (
                <p className="text-sm text-green-700/80 italic">{employeeFeedback.feedbackText}</p>
              )}
              <p className="text-xs text-green-600/60 mt-2">
                Submitted: {formatDate(employeeFeedback.createdAt)}
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex justify-between pt-6 border-t border-[var(--color-border-primary)]">
          <button onClick={onClose} className="px-6 py-2.5 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm font-bold rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-all">
            Close
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-bold rounded-xl hover:opacity-90 shadow-lg shadow-blue-500/20 transition-all">
            <MessageSquare className="w-4 h-4" />
            Message Client
          </button>
        </div>
      </div>
    </Modal>
  );
};
