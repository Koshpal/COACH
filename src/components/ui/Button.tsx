import React from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "tertiary" | "neutral" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-jakarta font-semibold rounded-md transition-all duration-150 whitespace-nowrap select-none disabled:opacity-50 disabled:pointer-events-none focus:outline-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-[0_1px_2px_rgba(26,37,70,0.24)]",
  secondary:
    "bg-primary-50 text-primary-600 hover:bg-primary-100 active:bg-primary-200",
  tertiary:
    "bg-white text-primary-600 border border-primary-200 hover:border-primary-400 hover:bg-primary-50 active:bg-primary-100",
  neutral:
    "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-25 active:bg-neutral-50",
  ghost: "bg-transparent text-primary-600 hover:bg-primary-50",
  danger:
    "bg-white text-error-600 border border-error-200 hover:bg-error-50 active:bg-error-100",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-[15px]",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  iconLeft,
  iconRight,
  fullWidth,
  className,
  children,
  disabled,
  ...rest
}) => (
  <button
    className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? (
      <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
    ) : (
      iconLeft
    )}
    {children}
    {!loading && iconRight}
  </button>
);
