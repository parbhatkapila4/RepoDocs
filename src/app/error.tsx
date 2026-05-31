"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#040406]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh]"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(245,158,11,0.04), transparent 70%)",
        }}
      />

      <div className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-6 pt-32 pb-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.22em] text-rose-300/80">
          <span className="h-1 w-1 rounded-full bg-rose-400" />
          unexpected error
        </span>

        <h1 className="text-[clamp(1.8rem,3.6vw,2.4rem)] font-medium leading-[1.15] tracking-[-0.025em] text-white">
          Something broke on this page.
          <br />
          <span className="text-white/45">It wasn&apos;t supposed to.</span>
        </h1>

        <p className="max-w-xl text-[14.5px] leading-[1.65] text-white/55">
          The error has been logged. You can try again, or head back to the
          home page. If this keeps happening, the request id below helps us
          track it down.
        </p>

        {error.digest && (
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 font-mono text-[11.5px] text-white/55">
            digest: <span className="text-white/80">{error.digest}</span>
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-[13px] font-medium text-black transition-all hover:bg-white/95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.02] px-4 py-2 text-[13px] text-white/80 transition-colors hover:border-white/20 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
