import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

interface DropdownProps {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  className?: string;
  /** "button" = bordered pill (header period picker); "field" = form input look */
  variant?: "button" | "field";
  size?: "sm" | "md";
}

export const Dropdown: React.FC<DropdownProps> = ({
  value,
  options,
  onChange,
  className,
  variant = "button",
  size = "md",
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center justify-between gap-2 font-outfit transition-colors",
          size === "sm" ? "h-8 text-[13px]" : "h-10 text-sm",
          variant === "button"
            ? "rounded-md border border-neutral-200 bg-white px-3 text-neutral-700 hover:bg-neutral-25"
            : "w-full rounded-md border border-neutral-200 bg-neutral-25 px-3 text-neutral-700",
        )}
      >
        <span className="truncate">{value}</span>
        <ChevronDown className="h-4 w-4 text-neutral-400" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 min-w-[160px] overflow-hidden rounded-md border border-neutral-100 bg-white py-1 shadow-medium">
          {options.map((o) => (
            <button
              key={o}
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={cn(
                "block w-full px-3 py-2 text-left font-outfit text-sm hover:bg-neutral-25",
                o === value ? "text-primary-600" : "text-neutral-700",
              )}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
