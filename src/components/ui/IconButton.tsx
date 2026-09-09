import React from "react";
import { cn } from "../../lib/cn";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 40px bordered square used in the page header (bell / gear). */
  size?: number;
}

export const IconButton: React.FC<IconButtonProps> = ({
  size = 40,
  className,
  children,
  ...rest
}) => (
  <button
    style={{ width: size, height: size }}
    className={cn(
      "inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-600",
      "hover:bg-neutral-25 hover:text-neutral-800 active:bg-neutral-50 transition-colors",
      className,
    )}
    {...rest}
  >
    {children}
  </button>
);
