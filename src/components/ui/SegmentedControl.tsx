import React from "react";
import { cn } from "../../lib/cn";

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  /** underline = dashboard "Day / Week / month"; pill = Sessions tabs */
  variant?: "underline" | "pill";
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className,
  variant = "underline",
}) => {
  if (variant === "pill") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-lg bg-neutral-50 p-1",
          className,
        )}
      >
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={cn(
              "h-9 rounded-md px-6 font-jakarta text-sm font-medium transition-colors",
              value === o
                ? "bg-white text-neutral-900 shadow-low"
                : "text-neutral-400 hover:text-neutral-600",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-6", className)}>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "relative pb-1 font-outfit text-sm transition-colors",
            value === o
              ? "text-primary-600 font-medium"
              : "text-neutral-500 hover:text-neutral-700",
          )}
        >
          {o}
          {value === o && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary-600" />
          )}
        </button>
      ))}
    </div>
  );
};
