"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, RotateCcw } from "lucide-react";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    console.error("[(protected)/error]", error);
  }, [error]);

  const handleRetry = () => {
    setRetrying(true);
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-start justify-center gap-5 px-8 py-12">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.22em] text-rose-300/80">
        <span className="h-1 w-1 rounded-full bg-rose-400" />
        request failed
      </span>

      <h1 className="max-w-2xl text-[clamp(1.6rem,3.2vw,2.1rem)] font-medium leading-[1.15] tracking-[-0.025em] text-white">
        We couldn&apos;t load this view.
      </h1>

      <p className="max-w-xl text-[14.5px] leading-[1.65] text-white/55">
        This is usually transient  -  a model timeout, a stalled query, or a
        backend hiccup. Retrying almost always works. If it doesn&apos;t,
        head back to the dashboard and try again.
      </p>

      {error.digest && (
        <div className="rounded-md border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 font-mono text-[11.5px] text-white/55">
          digest: <span className="text-white/80">{error.digest}</span>
        </div>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying || isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-[13px] font-medium text-black transition-all hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {retrying || isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          {retrying || isPending ? "Retrying…" : "Retry"}
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.02] px-4 py-2 text-[13px] text-white/80 transition-colors hover:border-white/20 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
