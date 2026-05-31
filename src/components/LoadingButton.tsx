"use client";

import React, { forwardRef } from "react";

type LoadingButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};
export const LoadingButton = forwardRef<
  HTMLButtonElement,
  LoadingButtonProps
>(function LoadingButton(
  { loading = false, disabled, children, className, ...props },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      {...props}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      className={`relative ${className ?? ""}`}
    >
      <span
        className={`inline-flex items-center justify-center gap-1.5 transition-opacity duration-150 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden={loading || undefined}
      >
        {children}
      </span>

      {loading && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5"
        >
          <span className="dot-1 h-1.5 w-1.5 rounded-full bg-current" />
          <span className="dot-2 h-1.5 w-1.5 rounded-full bg-current" />
          <span className="dot-3 h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
    </button>
  );
});
