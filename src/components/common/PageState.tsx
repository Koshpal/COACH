import React from "react";

export const Spinner: React.FC<{ label?: string }> = ({ label = "Loading…" }) => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
    <p className="font-outfit text-[14px] text-neutral-500">{label}</p>
  </div>
);

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = "Couldn't load this page.",
  onRetry,
}) => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-neutral-100 bg-white p-10 text-center shadow-low">
    <p className="font-jakarta text-[16px] font-semibold text-neutral-900">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="rounded-md bg-primary-600 px-4 py-2 font-jakarta text-[14px] font-semibold text-white hover:bg-primary-700"
      >
        Try again
      </button>
    )}
  </div>
);
