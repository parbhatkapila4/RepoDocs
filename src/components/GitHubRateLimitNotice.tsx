"use client";

import { useState, useEffect } from "react";
import { Clock, X } from "lucide-react";
import { isLikelyGitHubRateLimitMessage } from "@/lib/github-rate-limit-message";

interface Props {
  error: string | null;
  className?: string;
}

function isRateLimitError(error: string | null): boolean {
  return isLikelyGitHubRateLimitMessage(error);
}

export default function GitHubRateLimitNotice({ error, className = "" }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!isRateLimitError(error)) return;
    setDismissed(false);

    const resetMatch = error?.match(/reset\s*(?:in\s+)?(\d+)/i);
    if (resetMatch) {
      setMinutesLeft(Math.ceil(Number(resetMatch[1]) / 60));
    } else {
      setMinutesLeft(null);
    }
  }, [error]);

  if (!isRateLimitError(error) || dismissed) return null;

  return (
    <div
      className={`relative flex items-start gap-3 rounded-lg border border-amber-500/[0.08] bg-amber-500/[0.04] px-4 py-3.5 ${className}`}
    >
      <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-amber-500/[0.08] flex items-center justify-center">
        <Clock className="w-3.5 h-3.5 text-amber-400/70" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-[13px] font-medium text-white/70">
          GitHub API limit reached
        </p>
        <p className="text-[12px] leading-relaxed text-white/35">
          GitHub limits how often apps can request data.{" "}
          {minutesLeft
            ? `Resets in ~${minutesLeft} min.`
            : "Usually resets within the hour."}{" "}
          Everything will resume automatically. Your data is safe.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 mt-0.5 p-1 rounded text-white/15 hover:text-white/30 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export { isRateLimitError };
