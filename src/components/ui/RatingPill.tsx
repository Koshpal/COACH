import React from "react";
import { Star } from "lucide-react";
import { cn } from "../../lib/cn";

export const RatingPill: React.FC<{
  value: number;
  className?: string;
  tone?: "neutral" | "amber";
}> = ({ value, className, tone = "neutral" }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-md px-2 h-7 font-jakarta text-[13px] font-semibold",
      tone === "amber" ? "bg-warning-50 text-neutral-800" : "bg-neutral-50 text-neutral-700",
      className,
    )}
  >
    <Star className="h-3.5 w-3.5 fill-warning-400 text-warning-400" />
    {value}
  </span>
);

export const StarRating: React.FC<{ value: number; size?: number; className?: string }> = ({
  value,
  size = 16,
  className,
}) => (
  <span className={cn("inline-flex items-center gap-0.5", className)}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        style={{ width: size, height: size }}
        className={cn(
          i < Math.round(value)
            ? "fill-warning-400 text-warning-400"
            : "fill-neutral-200 text-neutral-200",
        )}
      />
    ))}
  </span>
);
