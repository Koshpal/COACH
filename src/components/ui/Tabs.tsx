import React from "react";
import { cn } from "../../lib/cn";

export interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

/** Underlined icon tab bar — Figma "ViewSwitcher" (Overview / Sessions / Notes). */
export const Tabs: React.FC<TabsProps> = ({ items, value, onChange, className }) => (
  <div className={cn("flex items-center gap-8 border-b border-neutral-100", className)}>
    {items.map((it) => {
      const active = it.key === value;
      return (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={cn(
            "relative flex items-center gap-2 pb-3 font-jakarta text-sm font-medium transition-colors",
            active ? "text-primary-600" : "text-neutral-500 hover:text-neutral-700",
          )}
        >
          {it.icon}
          {it.label}
          {active && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary-600" />
          )}
        </button>
      );
    })}
  </div>
);
