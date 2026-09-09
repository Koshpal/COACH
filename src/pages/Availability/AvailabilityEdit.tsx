import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/common/Header";
import { ErrorState } from "../../components/common/PageState";
import { BlockSkeleton, Skeleton } from "../../components/common/Skeleton";
import { Button } from "../../components/ui/Button";
import { AvailabilityEditor } from "../../components/ui/AvailabilityEditor";
import { QuickPresets } from "../../components/ui/QuickPresets";
import { coachService } from "../../services/coach.service";
import { useAsync } from "../../hooks/useAsync";
import {
  toEditorDays,
  toWeeklySchedulePayload,
  type ApiWeekly,
} from "../../services/adapters";
import { quickPresets, type EditorDay } from "../../mock/data";

export const AvailabilityEdit: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(
    () => coachService.getWeeklySchedule(5) as Promise<ApiWeekly>,
    [],
  );

  const [days, setDays] = useState<EditorDay[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setDays(toEditorDays(data));
  }, [data]);

  const applyPreset = (label: string) => {
    const p = quickPresets.find((q) => q.label === label);
    if (!p) return;
    setDays((prev) =>
      prev.map((d) =>
        d.enabled
          ? { ...d, slots: [{ start: p.start, end: p.end }] }
          : d,
      ),
    );
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await coachService.saveWeeklyAvailability(toWeeklySchedulePayload(days));
      setSaved(true);
      reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Availability"
        actions={
          <div className="flex items-center gap-3">
            {saved && (
              <span className="font-outfit text-[13px] text-success-600">Saved</span>
            )}
            <Button variant="neutral" onClick={() => navigate("/availability")}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save changes
            </Button>
          </div>
        }
      />
      <h2 className="mb-4 font-jakarta text-[24px] font-semibold text-neutral-900">
        Edit Availability
      </h2>

      {loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          <BlockSkeleton lines={6} />
          <Skeleton className="h-[280px] w-full" />
        </div>
      )}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          <AvailabilityEditor days={days} onChange={setDays} />
          <QuickPresets onApply={applyPreset} />
        </div>
      )}
    </div>
  );
};
