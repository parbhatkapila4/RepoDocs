import React from "react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";

export function LoadingDots({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-flex items-center gap-1 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/25 animate-pulse" />
      <span className="h-1.5 w-1.5 rounded-full bg-white/25 animate-pulse [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-white/25 animate-pulse [animation-delay:300ms]" />
    </span>
  );
}

export function PageSkeleton({
  rows = 6,
  className = "",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 ${className}`}
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <div className="relative overflow-hidden h-3 w-16 rounded bg-white/[0.04] mb-4 before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent before:animate-[shimmer_1.8s_ease-in-out_infinite]" />
          <div className="relative overflow-hidden h-5 w-2/3 rounded bg-white/[0.04] before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent before:animate-[shimmer_1.8s_ease-in-out_infinite]" />
        </div>
      ))}
    </div>
  );
}

export function PageError({
  title = "Something went wrong",
  message,
  onRetry,
  className = "",
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-rose-500/20 bg-rose-500/[0.04] px-5 py-6 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400/85" />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium text-white/90">{title}</div>
          {message && (
            <p className="mt-1.5 text-[13px] leading-[1.6] text-white/55">
              {message}
            </p>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.03] px-3.5 py-1.5 text-[12.5px] font-medium text-white/85 transition-colors hover:border-white/20 hover:text-white"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PageEmpty({
  title,
  message,
  action,
  icon,
  className = "",
}: {
  title: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.015] px-6 py-14 text-center ${className}`}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-white/40">
        {icon || <Inbox className="h-4 w-4" />}
      </div>
      <h3 className="text-[15px] font-medium tracking-[-0.01em] text-white">
        {title}
      </h3>
      {message && (
        <p className="mt-1.5 max-w-sm text-[13.5px] leading-[1.6] text-white/50">
          {message}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
