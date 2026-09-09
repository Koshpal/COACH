import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "../../lib/cn";
import { Toggle } from "./Toggle";
import { Dropdown } from "./Dropdown";
import { timeOptions, type EditorDay } from "../../mock/data";

const durationLabel = (start: string, end: string) => {
  const h = Number(end.split(":")[0]) - Number(start.split(":")[0]);
  return h > 0 ? `${h}h` : "0h";
};

interface Props {
  days: EditorDay[];
  onChange: (next: EditorDay[]) => void;
}

export const AvailabilityEditor: React.FC<Props> = ({ days, onChange }) => {
  const update = (di: number, patch: Partial<EditorDay>) =>
    onChange(days.map((d, i) => (i === di ? { ...d, ...patch } : d)));

  const setSlot = (di: number, si: number, key: "start" | "end", value: string) =>
    update(di, {
      slots: days[di].slots.map((s, i) => (i === si ? { ...s, [key]: value } : s)),
    });

  const addSlot = (di: number) =>
    update(di, { slots: [...days[di].slots, { start: "09:00", end: "12:00" }] });

  const removeSlot = (di: number, si: number) =>
    update(di, { slots: days[di].slots.filter((_, i) => i !== si) });

  return (
    <div className="rounded-lg border border-neutral-100 bg-white p-4 shadow-low">
      <div className="space-y-4">
        {days.map((d, di) => (
          <div
            key={d.day}
            className={cn(
              "rounded-md border border-neutral-100 p-4",
              !d.enabled && "opacity-60",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Toggle
                  checked={d.enabled}
                  onChange={(v) => update(di, { enabled: v })}
                />
                <span className="font-jakarta text-[16px] font-semibold text-neutral-900">
                  {d.day}
                </span>
              </div>
              <button
                onClick={() => addSlot(di)}
                className="inline-flex items-center gap-1.5 font-jakarta text-[14px] font-medium text-neutral-500 hover:text-neutral-800"
              >
                <Plus className="h-4 w-4" /> Add Slot
              </button>
            </div>

            {d.enabled && d.slots.length === 0 && (
              <p className="py-4 text-center font-outfit text-[13px] text-neutral-400">
                No time slots added
              </p>
            )}

            {d.enabled && d.slots.length > 0 && (
              <div className="mt-4 space-y-3">
                {d.slots.map((s, si) => (
                  <div key={si} className="flex items-center gap-3">
                    <Dropdown
                      variant="field"
                      value={s.start}
                      options={timeOptions}
                      onChange={(v) => setSlot(di, si, "start", v)}
                      className="w-28"
                    />
                    <span className="font-outfit text-[14px] text-neutral-400">to</span>
                    <Dropdown
                      variant="field"
                      value={s.end}
                      options={timeOptions}
                      onChange={(v) => setSlot(di, si, "end", v)}
                      className="w-28"
                    />
                    <span className="rounded bg-neutral-50 px-2 py-1 font-outfit text-[12px] text-neutral-500">
                      {durationLabel(s.start, s.end)}
                    </span>
                    <button
                      onClick={() => removeSlot(di, si)}
                      className="text-error-500 hover:text-error-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
