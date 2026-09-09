import React from "react";
import { cn } from "../../lib/cn";

interface AvatarProps {
  src?: string;
  name?: string;
  size?: number;
  className?: string;
  online?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = "",
  size = 40,
  className,
  online,
}) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full rounded-full object-cover bg-neutral-100"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-primary-100 text-primary-700 font-jakarta font-semibold text-[13px]">
          {initials || "?"}
        </span>
      )}
      {online && (
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-primary-600" />
      )}
    </span>
  );
};
