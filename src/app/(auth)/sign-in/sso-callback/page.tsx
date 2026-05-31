"use client";

import React, { useEffect, useState } from "react";
import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SSOCallbackPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      window.location.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    const t = setTimeout(() => setStuck(true), 6000);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#040406] px-6 text-white">
      <div className="flex flex-col items-center text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/80" />
        <p className="mt-6 text-[14px] text-white/55">Completing sign-in…</p>

        {stuck && (
          <div className="mt-10 max-w-xs">
            <p className="text-[13px] leading-[1.6] text-white/40">
              This is taking longer than usual. If nothing happens in a few
              more seconds, try continuing manually.
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

      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/dashboard"
        signInFallbackRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/sync-user"
        signUpFallbackRedirectUrl="/sync-user"
      />
    </main>
  );
}
