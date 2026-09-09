import React from "react";
import { cn } from "../../lib/cn";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, className, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
      checked ? "bg-primary-600" : "bg-neutral-200",
      disabled && "opacity-50",
      className,
    )}
  >
    <span
      className={cn(
        "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
        checked ? "translate-x-[22px]" : "translate-x-0.5",
      )}
    />
  </button>
);
