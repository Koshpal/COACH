import React from "react";
import { cn } from "../../lib/cn";

type ChipColor = "green" | "blue" | "red" | "yellow" | "neutral" | "teal";

const colors: Record<ChipColor, string> = {
  green: "bg-success-50 text-success-700",
  blue: "bg-primary-50 text-primary-600",
  teal: "bg-secondary-50 text-secondary-700",
  red: "bg-error-50 text-error-600",
  yellow: "bg-warning-50 text-warning-700",
  neutral: "bg-neutral-50 text-neutral-600",
};

export const Chip: React.FC<{
  color?: ChipColor;
  className?: string;
  children: React.ReactNode;
}> = ({ color = "neutral", className, children }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-md px-2.5 h-8 font-outfit text-[13px] leading-none",
      colors[color],
      className,
    )}
  >
    {children}
  </span>
);
