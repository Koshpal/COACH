import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/common/Header";
import { ErrorState } from "../../components/common/PageState";
import { CalendarSkeleton } from "../../components/common/Skeleton";
import { AvailabilityCalendar } from "../../components/ui/AvailabilityCalendar";
import { coachService } from "../../services/coach.service";
import { useAsync } from "../../hooks/useAsync";
import { toCalendarMonth, type ApiSlot } from "../../services/adapters";

export const Availability: React.FC = () => {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(() => new Date());

  const { data, loading, error, reload } = useAsync(
    () => coachService.getSlots() as Promise<ApiSlot[]>,
    [],
  );

  const month = useMemo(
    () => (data ? toCalendarMonth(data, anchor) : null),
    [data, anchor],
  );

  const shift = (delta: number) =>
    setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));

  return (
    <div className="flex flex-col gap-6">
      <Header title="Availability" />
      {loading && <CalendarSkeleton />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}
      {month && (
        <AvailabilityCalendar
          month={month}
          onEdit={() => navigate("/availability/edit")}
          onPrev={() => shift(-1)}
          onNext={() => shift(1)}
        />
      )}
    </div>
  );
};
