import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({ isOpen, onClose, session }) => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  if (!session) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Reschedule Session">
      <div className="space-y-6">
        <div className="p-6 rounded-2xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--color-warning-dark)] mt-0.5" />
            <div>
              <h3 className="font-bold text-[var(--color-text-primary)]">Rescheduling is not connected yet</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                The previous modal only simulated a success flow. There is no backend endpoint for rescheduling, so this action is disabled until that API is added.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[var(--color-border-primary)]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[var(--color-primary)] text-[var(--color-text-inverse)] font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
