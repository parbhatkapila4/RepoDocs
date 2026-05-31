"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const SYNC_TIMEOUT_MS = 8000;
const STUCK_AFTER_MS = 10_000;

export default function SyncUserPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [stuck, setStuck] = useState(false);
  const ranRef = useRef(false);

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  useEffect(() => {
    if (!isLoaded) return;
    if (ranRef.current) return;
    ranRef.current = true;

    if (!isSignedIn) {
      window.location.replace("/sign-in");
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);

    fetch("/api/sync-user-bootstrap", {
      method: "POST",
      signal: controller.signal,
    })
      .catch((err) => {
        console.error("[sync-user] bootstrap failed:", err);
      })
      .finally(() => {
        clearTimeout(timeout);
        window.location.replace("/dashboard");
      });
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    const t = setTimeout(() => setStuck(true), STUCK_AFTER_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#040406] px-6 text-white">
      <div className="flex flex-col items-center text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/80" />
        <p className="mt-6 text-[14px] text-white/55">
          Setting up your account…
        </p>

        {stuck && (
          <div className="mt-10 max-w-xs">
            <p className="text-[13px] leading-[1.6] text-white/40">
              This is taking longer than usual. Continue manually if it
              doesn&apos;t resolve in a few more seconds.
            </p>
            <a
              href="/dashboard"
              className="mt-5 inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-[13px] font-medium text-black transition-colors hover:bg-white/95"
            >
              Continue to dashboard
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
