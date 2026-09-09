import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** rendered inside the coloured header band */
  header?: React.ReactNode;
  headerTone?: "indigo" | "teal" | "plain";
  /** sticky footer (buttons) */
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  /** header pattern overlay (View Details / end-session modals) */
  pattern?: boolean;
  className?: string;
}

const sizes = { sm: "max-w-md", md: "max-w-[560px]", lg: "max-w-2xl" };
const tones = {
  indigo: "bg-primary-600 text-white",
  teal: "bg-secondary-700 text-white",
  plain: "bg-white text-neutral-900 border-b border-neutral-100",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  header,
  headerTone = "plain",
  footer,
  size = "md",
  pattern,
  className,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-neutral-900/45 p-4 py-10 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full overflow-hidden rounded-xl bg-white shadow-high animate-scale-in",
          sizes[size],
          className,
        )}
      >
        {header !== undefined && (
          <div
            className={cn(
              "relative px-6 py-5",
              tones[headerTone],
              pattern && headerTone !== "plain" && "topo-header",
            )}
          >
            {header}
            <button
              onClick={onClose}
              className={cn(
                "absolute right-4 top-4 z-10 rounded-md p-1 transition-colors",
                headerTone === "plain"
                  ? "text-neutral-400 hover:bg-neutral-100"
                  : "text-white/90 hover:bg-white/15",
              )}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-neutral-100 bg-neutral-25 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
