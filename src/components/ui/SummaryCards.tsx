import React from "react";
import { Check, Users, Clock, ArrowUpRight, Activity } from "lucide-react";
import { cn } from "../../lib/cn";
import { Dropdown } from "./Dropdown";
import type { SummaryStat } from "../../mock/data";

const TONES: Record<
  SummaryStat["tone"],
  { card: string; badge: string; label: string; value: string }
> = {
  green: { card: "bg-success-50", badge: "bg-success-500", label: "text-success-700", value: "text-neutral-900" },
  indigo: { card: "bg-primary-100", badge: "bg-primary-400", label: "text-primary-700", value: "text-neutral-900" },
  teal: { card: "bg-secondary-50", badge: "bg-secondary-600", label: "text-secondary-700", value: "text-neutral-900" },
  amber: { card: "bg-warning-50", badge: "bg-warning-500", label: "text-warning-700", value: "text-neutral-900" },
};

const ICONS = {
  check: Check,
  rating: Activity,
  attended: Users,
  clock: Clock,
};

interface SummaryCardsProps {
  stats: SummaryStat[];
  period?: string;
  periodOptions?: string[];
  onPeriodChange?: (p: string) => void;
  project?: string;
  projectOptions?: string[];
  onProjectChange?: (p: string) => void;
  className?: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  stats,
  period,
  periodOptions = ["Monthly", "Weekly"],
  onPeriodChange,
  project,
  projectOptions,
  onProjectChange,
  className,
}) => (
  <section
    className={cn(
      "rounded-lg border border-neutral-100 bg-white p-4 shadow-low",
      className,
    )}
  >
    <header className="mb-4 flex items-center justify-between">
      <h2 className="font-jakarta text-[20px] font-semibold text-neutral-900">Summary</h2>
      <div className="flex items-center gap-3">
        {project && projectOptions && (
          <Dropdown value={project} options={projectOptions} onChange={onProjectChange ?? (() => {})} />
        )}
        {period && (
          <Dropdown value={period} options={periodOptions} onChange={onPeriodChange ?? (() => {})} />
        )}
      </div>
    </header>

    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
    >
      {stats.map((s) => {
        const tone = TONES[s.tone];
        const Icon = ICONS[s.icon];
        return (
          <article key={s.key} className={cn("rounded-lg p-6", tone.card)}>
            <span
              className={cn(
                "mb-6 flex h-11 w-11 items-center justify-center rounded-full text-white",
                tone.badge,
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <p className={cn("font-outfit text-[15px]", tone.label)}>{s.label}</p>
            <p className={cn("mt-1 font-jakarta text-[32px] font-bold leading-none", tone.value)}>
              {s.value}
            </p>
            <p className="mt-4 flex items-center gap-1.5 font-outfit text-[13px] text-neutral-600">
              {s.deltaKind === "up" ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-success-600" />
              ) : (
                <Activity className="h-3.5 w-3.5 text-neutral-400" />
              )}
              {s.delta}
            </p>
          </article>
        );
      })}
    </div>
  </section>
);
