import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, Video, ExternalLink, StickyNote } from 'lucide-react';
import { coachService } from '../../services/coach.service';
import { CalendarEvent } from '../../types/coach.types';
import {
  buildDayLaneEvents,
  CalendarView,
  filterEventsByRange,
  formatCalendarTime,
  getCalendarDays,
  getCalendarRange,
  getDayColumns,
  getEventStatusLabel,
  getMonthGridDays,
  normalizeSessionsToEvents,
} from './calendar.utils';

const VIEW_TITLES: Record<CalendarView, string> = {
  week: 'Week view',
  month: 'Month view',
};

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [view, setView] = useState<CalendarView>('week');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const range = useMemo(() => getCalendarRange(currentDate, view), [currentDate, view]);

  useEffect(() => {
    let isMounted = true;

    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await coachService.getSessions({
          startDate: range.startDate.toISOString(),
          endDate: range.endDate.toISOString(),
        });

        if (!isMounted) return;

        const normalized = normalizeSessionsToEvents(response);
        setEvents(filterEventsByRange(normalized, range));
      } catch {
        if (isMounted) {
          setError('Failed to load calendar sessions.');
          setEvents([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSessions();

    return () => {
      isMounted = false;
    };
  }, [range.endDate, range.startDate, view]);

  const calendarDays = useMemo(() => {
    return view === 'month' ? getMonthGridDays(currentDate) : getCalendarDays(currentDate, view);
  }, [currentDate, view]);

  const timeColumns = useMemo(() => getDayColumns(), []);
  const weekDays = useMemo(() => getCalendarDays(currentDate, 'week'), [currentDate]);

  const visibleEvents = events;

  const monthEventsByDay = useMemo(() => {
    return calendarDays.reduce<Record<string, CalendarEvent[]>>((acc, day) => {
      const matches = visibleEvents.filter(
        (event) => new Date(event.startTime).toDateString() === day.date.toDateString(),
      );
      acc[day.key] = matches;
      return acc;
    }, {});
  }, [calendarDays, visibleEvents]);

  const formatMonth = (date: Date) => date.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const jumpRange = (direction: -1 | 1) => {
    const next = new Date(currentDate);
    if (view === 'month') {
      next.setMonth(next.getMonth() + direction);
    } else {
      next.setDate(next.getDate() + direction * 7);
    }
    next.setHours(0, 0, 0, 0);
    setCurrentDate(next);
  };

  const openJoin = (event: CalendarEvent) => {
    if (!event.meetingLink) return;
    window.open(event.meetingLink, '_blank', 'noopener,noreferrer');
  };

  const isLiveEvent = (event: CalendarEvent) => {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    return now >= start && now <= end && event.status !== 'CANCELLED' && event.status !== 'COMPLETED';
  };

  const renderSessionBadge = (event: CalendarEvent) => {
    const label = getEventStatusLabel(event);
    const base = 'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider';

    if (label === 'Live') {
      return <span className={`${base} bg-[var(--color-success)] text-[var(--color-text-inverse)]`}>Live</span>;
    }

    if (label === 'Upcoming') {
      return <span className={`${base} bg-[var(--color-primary)] text-[var(--color-text-inverse)]`}>Upcoming</span>;
    }

    if (label === 'Completed') {
      return <span className={`${base} bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]`}>Completed</span>;
    }

    return <span className={`${base} bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]`}>Cancelled</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col gap-4 rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">Session calendar</p>
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-heading">Calendar</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">View booked sessions by week or month with live backend data.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-1">
            {(['week', 'month'] as CalendarView[]).map((option) => (
              <button
                key={option}
                onClick={() => setView(option)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  view === option
                    ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-md'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]'
                }`}
              >
                {VIEW_TITLES[option]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-1.5 shadow-sm">
            <button
              onClick={() => jumpRange(-1)}
              className="rounded-xl p-2 transition-all hover:bg-[var(--color-bg-secondary)]"
              aria-label="Previous range"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-[180px] px-3 text-center">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">{formatMonth(currentDate)}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">{view === 'week' ? 'Weekly schedule' : 'Monthly schedule'}</div>
            </div>
            <button
              onClick={() => jumpRange(1)}
              className="rounded-xl p-2 transition-all hover:bg-[var(--color-bg-secondary)]"
              aria-label="Next range"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-4" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/10 px-6 py-10 text-center text-[var(--color-error)]">
          <p className="font-semibold">{error}</p>
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-lightest)] text-[var(--color-primary)]">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-[var(--color-text-primary)]">No sessions in this range</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--color-text-secondary)]">Try a different week or month. Once sessions are booked, they will appear here automatically.</p>
        </div>
      ) : view === 'week' ? (
        <div className="overflow-hidden rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] shadow-xl">
          <div className="overflow-x-auto">
            <div className="min-w-[1100px]">
              <div className="grid grid-cols-[84px_repeat(7,minmax(0,1fr))] border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
                <div className="p-4" />
                {weekDays.map((day) => (
                  <div key={day.key} className={`border-l border-[var(--color-border-primary)] p-4 text-center ${day.isToday ? 'bg-[var(--color-primary)]' : ''}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${day.isToday ? 'text-[var(--color-text-inverse)]' : 'text-[var(--color-text-tertiary)]'}`}>
                      {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className={`mt-1 text-xl font-bold font-heading ${day.isToday ? 'text-[var(--color-text-inverse)]' : 'text-[var(--color-text-primary)]'}`}>
                      {day.date.getDate()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-[84px_repeat(7,minmax(0,1fr))]">
                <div className="border-r border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
                  {timeColumns.map((slot) => (
                    <div key={slot.hour} className="flex h-[60px] items-start justify-center border-b border-[var(--color-border-primary)] px-2 pt-2">
                      <span className="text-[10px] font-bold text-[var(--color-text-tertiary)]">{slot.label}</span>
                    </div>
                  ))}
                </div>

                {weekDays.map((day) => {
                  const dayEvents = buildDayLaneEvents(visibleEvents, day.date);
                  const maxLane = Math.max(1, ...dayEvents.map((event) => (event.lane ?? 0) + 1));

                  return (
                    <div key={day.key} className="relative h-[720px] border-l border-[var(--color-border-primary)] bg-[var(--color-bg-card)]">
                      {timeColumns.map((slot) => (
                        <div key={slot.hour} className="h-[60px] border-b border-[var(--color-border-primary)]/70" />
                      ))}

                      {dayEvents.map((event) => {
                        const start = new Date(event.startTime);
                        const end = new Date(event.endTime);
                        const topPx = Math.max(((start.getHours() - 8) * 60 + start.getMinutes()) * (60 / 60), 0);
                        const heightPx = Math.max(((end.getTime() - start.getTime()) / 60000) * (60 / 60), 54);
                        const leftPct = ((event.lane ?? 0) / maxLane) * 100;
                        const widthPct = 100 / maxLane;
                        const isPast = new Date(event.endTime) < new Date();

                        return (
                          <div
                            key={event.id}
                            className={`group absolute z-10 cursor-pointer rounded-2xl border p-3 shadow-sm transition-all hover:shadow-lg ${
                              event.status === 'CANCELLED'
                                ? 'border-[var(--color-error)]/20 bg-[var(--color-error)]/10 opacity-60'
                                : event.status === 'COMPLETED'
                                  ? 'border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] opacity-70'
                                  : event.status === 'LIVE'
                                    ? 'border-[var(--color-success)] bg-[var(--color-success-lightest,rgba(34,197,94,0.12))]'
                                    : 'border-[var(--color-primary-light)] bg-[var(--color-primary-lightest)]'
                            }`}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                            }}
                            onClick={() => setSelectedEvent(event)}
                          >
                            <div className="flex h-full flex-col justify-between gap-2 overflow-hidden">
                              <div className="space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-xs font-bold uppercase tracking-tight ${isPast ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'}`}>
                                    {event.title}
                                  </p>
                                  {renderSessionBadge(event)}
                                </div>
                                <p className="text-[10px] font-semibold text-[var(--color-text-secondary)]">
                                  {formatCalendarTime(event.startTime)} – {formatCalendarTime(event.endTime)}
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--color-primary)]">
                                  {event.sessionType === 'Virtual' ? <Video className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                                  <span>{event.sessionType}</span>
                                </div>
                              </div>

                              <div className="pointer-events-none flex translate-y-1 flex-wrap gap-2 opacity-0 transition-all group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                                {event.meetingLink && (isLiveEvent(event) || getEventStatusLabel(event) === 'Upcoming') && (
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-2 py-1 text-[10px] font-bold text-[var(--color-text-inverse)]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openJoin(event);
                                    }}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Join Session
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-bg-card)] px-2 py-1 text-[10px] font-bold text-[var(--color-text-primary)]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(event);
                                  }}
                                >
                                  <Clock className="h-3 w-3" />
                                  View Details
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-bg-card)] px-2 py-1 text-[10px] font-bold text-[var(--color-text-primary)]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(event);
                                  }}
                                >
                                  <StickyNote className="h-3 w-3" />
                                  {event.notes ? 'View Notes' : 'Add Notes'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] shadow-xl">
          <div className="grid grid-cols-7 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
              <div key={label} className="p-4 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-[var(--color-border-primary)]">
            {calendarDays.map((day) => {
              const dayEvents = monthEventsByDay[day.key] || [];

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedEvent(dayEvents[0] || null)}
                  className={`min-h-[150px] bg-[var(--color-bg-card)] p-3 text-left transition-all hover:bg-[var(--color-bg-secondary)] ${day.isCurrentMonth ? '' : 'opacity-40'} ${day.isToday ? 'ring-2 ring-inset ring-[var(--color-primary)]' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${day.isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'}`}>{day.date.getDate()}</span>
                    {dayEvents.length > 0 && (
                      <span className="rounded-full bg-[var(--color-primary-lightest)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={`rounded-xl border px-2 py-1.5 text-[10px] font-semibold shadow-sm ${
                          event.status === 'CANCELLED'
                            ? 'border-[var(--color-error)]/20 bg-[var(--color-error)]/10 text-[var(--color-error)]'
                            : event.status === 'COMPLETED'
                              ? 'border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                              : event.status === 'LIVE'
                                ? 'border-[var(--color-success)] bg-[var(--color-success-lightest,rgba(34,197,94,0.12))] text-[var(--color-success)]'
                                : 'border-[var(--color-primary-light)] bg-[var(--color-primary-lightest)] text-[var(--color-primary)]'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                      >
                        <div className="truncate">{event.title}</div>
                        <div className="mt-0.5 text-[9px] font-medium opacity-80">
                          {formatCalendarTime(event.startTime)} – {formatCalendarTime(event.endTime)}
                        </div>
                      </div>
                    ))}

                    {dayEvents.length > 2 && (
                      <div className="text-[10px] font-bold text-[var(--color-text-secondary)]">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedEvent && (
        <section className="rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-heading">{selectedEvent.title}</h2>
                {renderSessionBadge(selectedEvent)}
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{selectedEvent.company || 'Koshpal'}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--color-text-secondary)]">
                <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" />{formatCalendarTime(selectedEvent.startTime)} – {formatCalendarTime(selectedEvent.endTime)}</span>
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" />{selectedEvent.sessionType}</span>
                {selectedEvent.meetingLink && <span className="inline-flex items-center gap-2"><Video className="h-4 w-4" />Meeting link available</span>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedEvent.meetingLink && isLiveEvent(selectedEvent) && (
                <button
                  type="button"
                  onClick={() => openJoin(selectedEvent)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-text-inverse)]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Join Session
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedEvent(selectedEvent)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-2 text-sm font-bold text-[var(--color-text-primary)]"
              >
                <Clock className="h-4 w-4" />
                View Details
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[var(--color-bg-secondary)] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Notes</p>
              <p className="mt-2 text-sm text-[var(--color-text-primary)]">{selectedEvent.notes || 'No notes have been added for this session yet.'}</p>
            </div>
            <div className="rounded-2xl bg-[var(--color-bg-secondary)] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Action</p>
              <p className="mt-2 text-sm text-[var(--color-text-primary)]">
                Use the session details above to join, review the event, or add coaching notes.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
