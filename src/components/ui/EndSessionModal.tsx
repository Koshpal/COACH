import React, { useState, useEffect } from 'react';
import { Clock, Tag, Eye, EyeOff, MessageSquare, Save, X, Plus } from 'lucide-react';
import { coachService } from '../../services/coach.service';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';

interface EndSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  onSuccess?: () => void;
}

export const EndSessionModal: React.FC<EndSessionModalProps> = ({ isOpen, onClose, session, onSuccess }) => {
  const { showToast } = useToast();
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [summary, setSummary] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState('0 min');

  useEffect(() => {
    if (isOpen && session) {
      const start = new Date(session.startTime);
      const now = new Date();
      const diff = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60)));
      setDuration(`${diff} min`);
    }
  }, [isOpen, session]);

  if (!session) return null;

  const handleAddTopic = () => {
    if (topicInput.trim() && topics.length < 5) {
      setTopics([...topics, topicInput.trim()]);
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleEndSession = async () => {
    setLoading(true);
    try {
      // 1. Complete the session
      await coachService.updateSessionStatus(session.id, 'COMPLETED');
      
      // 2. Submit notes
      const combinedNotes = `Summary: ${summary}\n\nPrivate: ${privateNotes}`;
      await coachService.updateSessionNotes(session.id, combinedNotes, 'PRIVATE');
      
      showToast('Session ended successfully!', 'success');
      onClose();
      if (onSuccess) onSuccess();
      else window.location.reload(); 
    } catch (err) {
      showToast('Failed to end session.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={`End session with ${session.clientName}`}>
      <div className="space-y-6">
        <p className="text-sm text-[var(--color-text-secondary)] -mt-2">
          Stop the timer and finalize session notes. Summary will be shared with the client.
        </p>

        {/* Session Duration Highlight */}
        <div className="flex items-center justify-between p-5 bg-[var(--color-primary-lightest)] rounded-2xl border border-[var(--color-primary-light)]">
          <div className="flex items-center gap-3 text-[var(--color-primary)]">
            <Clock className="w-5 h-5" />
            <span className="font-bold uppercase tracking-wider text-xs">Total Duration</span>
          </div>
          <span className="text-2xl font-bold text-[var(--color-primary)]">{duration}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Start Time</label>
            <div className="p-3 bg-[var(--color-bg-secondary)] rounded-xl border border-black/5 text-sm font-medium">
              {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">End Time (Now)</label>
            <div className="p-3 bg-[var(--color-bg-secondary)] rounded-xl border border-black/5 text-sm font-medium">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Topics Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
            <Tag className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-sm font-bold font-heading">Topics Covered</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
              placeholder="Add topic..."
              disabled={topics.length >= 5}
              className="flex-1 p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
            />
            <button 
              onClick={handleAddTopic}
              disabled={!topicInput.trim() || topics.length >= 5}
              className="px-6 bg-[var(--color-primary)] text-[var(--color-text-inverse)] rounded-xl font-bold shadow-md hover:opacity-90 disabled:opacity-50"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic, i) => (
              <span key={i} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary-lightest)] text-[var(--color-primary)] text-xs font-bold rounded-full border border-[var(--color-primary-light)]">
                {topic}
                <button onClick={() => handleRemoveTopic(i)} className="hover:text-[var(--color-error)]"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <p className="text-[10px] text-[var(--color-text-tertiary)] italic">Add up to 5 key topics discussed.</p>
        </div>

        {/* Summary (Shared) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
            <Eye className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-sm font-bold font-heading">Session Summary (Shared)</span>
          </div>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            placeholder="Key takeaways and next steps for the client..."
            className="w-full p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none transition-all text-sm"
          />
          <p className="text-[10px] text-[var(--color-success-dark)] font-medium">This will be visible to the client in their portal.</p>
        </div>

        {/* Private Notes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
            <EyeOff className="w-4 h-4 text-[var(--color-warning)]" />
            <span className="text-sm font-bold font-heading text-[var(--color-warning-dark)]">Private Notes</span>
          </div>
          <textarea
            value={privateNotes}
            onChange={(e) => setPrivateNotes(e.target.value)}
            rows={3}
            placeholder="Personal observations and internal tracking..."
            className="w-full p-4 bg-[var(--color-warning)]/5 border border-[var(--color-warning)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-warning)]/30 outline-none resize-none transition-all text-sm"
          />
          <p className="text-[10px] text-[var(--color-warning-dark)] font-medium italic">These notes are completely private to you.</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-[var(--color-border-primary)]">
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm font-bold rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-all border border-black/5">
              Discard
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm font-bold rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-all border border-black/5">
              <MessageSquare className="w-4 h-4" />
              Message
            </button>
          </div>
          <button 
            onClick={handleEndSession}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-10 py-2.5 bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-bold rounded-xl hover:opacity-90 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-[var(--color-text-inverse)] border-t-transparent rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
            End & Save Session
          </button>
        </div>
      </div>
    </Modal>
  );
};
