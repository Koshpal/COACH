import React, { useState, useMemo, useEffect } from 'react';
import { Clock, Trash2, Plus, Save, Eye, EyeOff } from 'lucide-react';
import { coachService } from '../../services/coach.service';
import { useToast } from '../../context/ToastContext';

interface Slot {
  id?: string;
  start: string;
  end: string;
  status?: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: Slot[];
}

type WeeklySchedule = Record<string, DaySchedule>;

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export const Availability: React.FC = () => {
  const { showToast } = useToast();
  const [schedule, setSchedule] = useState<WeeklySchedule>(
    DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: { enabled: false, slots: [] } }), {})
  );
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showBookedSlots, setShowBookedSlots] = useState(true);

  const loadExistingSlots = async () => {
    try {
      setLoading(true);
      const weeklyData = await coachService.getWeeklySchedule(1);
      const nextSchedule = DAYS_OF_WEEK.reduce<WeeklySchedule>((acc, day) => {
        const backendKey = day.toUpperCase();
        const slots = Array.isArray(weeklyData?.[backendKey]) ? weeklyData[backendKey] : [];

        acc[day] = {
          enabled: slots.length > 0,
          slots: slots.map((slot: any) => ({
            id: slot.id,
            start: slot.start,
            end: slot.end,
            status: slot.status,
          })),
        };

        return acc;
      }, DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: { enabled: false, slots: [] } }), {}) as WeeklySchedule);

      setSchedule(nextSchedule);
    } catch (err) {
      console.error('Error loading slots:', err);
      showToast('Failed to load availability slots', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExistingSlots();
  }, []);

  const toggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  const addSlot = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { 
        ...prev[day], 
        slots: [...prev[day].slots, { start: '09:00', end: '10:00' }] 
      }
    }));
  };

  const removeSlot = (day: string, index: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { 
        ...prev[day], 
        slots: prev[day].slots.filter((_, i) => i !== index) 
      }
    }));
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const payload = {
        slotDurationMinutes: 60,
        weeksToGenerate: 4,
        weeklySchedule: DAYS_OF_WEEK.reduce((acc, day) => {
          if (schedule[day].enabled && schedule[day].slots.length > 0) {
            acc[day.toUpperCase()] = schedule[day].slots.map((s) => ({
              start: s.start,
              end: s.end,
            }));
          }
          return acc;
        }, {} as Record<string, { start: string; end: string }[]>),
      };

      await coachService.saveWeeklyAvailability(payload);
      showToast('Availability updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update availability.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const summary = useMemo(() => {
    const activeDays = DAYS_OF_WEEK.filter(d => schedule[d].enabled).length;
    const totalSlots = DAYS_OF_WEEK.reduce((sum, d) => sum + (schedule[d].enabled ? schedule[d].slots.length : 0), 0);
    return { activeDays, totalSlots };
  }, [schedule]);

  return (
    <div className="mx-auto space-y-6 max-w-7xl">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-heading">Availability</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Manage your weekly working hours and session slots.</p>
        </div>
        <button
          onClick={handlePublish}
          disabled={publishing || loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] text-[var(--color-text-inverse)] rounded-xl font-bold hover:opacity-90 disabled:opacity-50 shadow-lg shadow-blue-500/20 transition-all"
        >
          {publishing ? <div className="w-4 h-4 border-2 border-[var(--color-text-inverse)] border-t-transparent rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
          Publish Schedule
        </button>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="space-y-6 lg:col-span-3">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className={`p-6 rounded-2xl border transition-all ${schedule[day].enabled ? 'bg-[var(--color-bg-card)] border-[var(--color-primary-light)]' : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)]'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleDay(day)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${schedule[day].enabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-secondary)]'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${schedule[day].enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-lg font-bold ${schedule[day].enabled ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>{day}</span>
                </div>
                {schedule[day].enabled && (
                  <button onClick={() => addSlot(day)} className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-primary)] hover:underline">
                    <Plus className="w-4 h-4" /> Add Slot
                  </button>
                )}
              </div>

              {schedule[day].enabled && (
                <div className="space-y-3">
                  {schedule[day].slots.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-secondary)] italic">No slots added for this day.</p>
                  ) : (
                    schedule[day].slots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-[var(--color-bg-secondary)] rounded-xl border border-black/5">
                        <div className="flex items-center gap-2">
                          <select
                            value={slot.start}
                            onChange={(e) => {
                              const newStart = e.target.value;
                              if (newStart >= slot.end) {
                                showToast('Start time must be before end time', 'error');
                                return;
                              }
                              setSchedule(prev => ({
                                ...prev,
                                [day]: {
                                  ...prev[day],
                                  slots: prev[day].slots.map((s, i) =>
                                    i === index ? { ...s, start: newStart } : s
                                  ),
                                },
                              }));
                            }}
                            className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] rounded-lg px-10 py-1.5 text-sm font-medium focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                          >
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span className="text-xs font-bold text-[var(--color-text-tertiary)]">to</span>
                          <select
                            value={slot.end}
                            onChange={(e) => {
                              const newEnd = e.target.value;
                              if (newEnd <= slot.start) {
                                showToast('End time must be after start time', 'error');
                                return;
                              }
                              setSchedule(prev => ({
                                ...prev,
                                [day]: {
                                  ...prev[day],
                                  slots: prev[day].slots.map((s, i) =>
                                    i === index ? { ...s, end: newEnd } : s
                                  ),
                                },
                              }));
                            }}
                            className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] rounded-lg px-10 py-1.5 text-sm font-medium focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                          >
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="flex-1"></div>
                        <button onClick={() => removeSlot(day, index)} className="p-2 text-[var(--color-error)] hover:bg-[var(--color-error-light)] rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] shadow-sm">
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4 font-heading">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Active Days</span>
                <span className="font-bold text-[var(--color-primary)]">{summary.activeDays}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Total Slots</span>
                <span className="font-bold text-[var(--color-primary)]">{summary.totalSlots}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[var(--color-info-bg)] rounded-2xl border border-[var(--color-primary-light)]">
            <h4 className="font-bold text-[var(--color-primary)] mb-2">Tips</h4>
            <ul className="text-xs text-[var(--color-primary-darkest)] space-y-2 list-disc pl-4">
              <li>All times are displayed in IST.</li>
              <li>Slots should ideally be 1 hour long.</li>
              <li>Published availability will be applied to the next 4 weeks.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
