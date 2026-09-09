import React from "react";
import { Clock } from "lucide-react";
import { quickPresets } from "../../mock/data";

export const QuickPresets: React.FC<{ onApply?: (label: string) => void }> = ({
  onApply,
}) => (
  <aside className="rounded-lg border border-neutral-100 bg-white p-5 shadow-low">
    <h3 className="mb-4 flex items-center gap-2 font-jakarta text-[18px] font-semibold text-neutral-900">
      <Clock className="h-[18px] w-[18px] text-primary-600" />
      Quick Presets
    </h3>
    <div className="space-y-3">
      {quickPresets.map((p) => (
        <button
          key={p.label}
          onClick={() => onApply?.(p.label)}
          className="w-full rounded-md bg-neutral-50 py-2.5 font-outfit text-[14px] text-neutral-700 transition-colors hover:bg-primary-50 hover:text-primary-600"
        >
          {p.label}
        </button>
      ))}
    </div>
  </aside>
);
