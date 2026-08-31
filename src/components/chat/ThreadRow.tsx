"use client";

import React from "react";
import { Pin, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatThread } from "@/lib/chat-client";
import { formatThreadTimestamp } from "@/lib/relative-time";
import { ChatAvatar, type PresenceStatus } from "./ChatAvatar";

export function ThreadRow({
  thread,
  active,
  presence,
  avatarSeed,
  onSelect,
}: {
  thread: ChatThread;
  active: boolean;
  presence?: PresenceStatus;
  avatarSeed: string;
  onSelect: () => void;
}) {
  const preview = thread.lastMessagePreview?.trim();

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
        active
          ? "bg-[var(--chat-accent)]/[0.09]"
          : "hover:bg-white/[0.035] active:bg-white/[0.05]",
      )}
    >
      {active && (
        <span className="absolute inset-y-0 left-0 w-[2px] bg-[var(--chat-accent)]" />
      )}

      <ChatAvatar name={avatarSeed} size={44} status={presence} />

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[14.5px] font-medium",
              active ? "text-white" : "text-white/85",
            )}
          >
            {thread.title}
          </span>
          {thread.pinned && (
            <Pin className="h-3 w-3 shrink-0 -rotate-45 fill-white/25 text-white/25" />
          )}
          <span
            suppressHydrationWarning
            className="shrink-0 text-[11.5px] tabular-nums text-white/35"
          >
            {formatThreadTimestamp(thread.lastMessageAt)}
          </span>
        </span>

        <span className="mt-0.5 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[13px] leading-snug text-white/40">
            {preview || (
              <span className="italic text-white/25">No messages yet</span>
            )}
          </span>
          {thread.messageCount > 0 && (
            <span
              className={cn(
                "shrink-0 rounded-full px-[7px] py-[2px] text-[11px] font-semibold tabular-nums leading-none",
                active
                  ? "bg-[var(--chat-accent)] text-[var(--chat-on-accent)]"
                  : "bg-white/[0.08] text-white/45",
              )}
            >
              {thread.messageCount}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

export function ThreadRowSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 px-4 py-3">
      <div className="h-11 w-11 shrink-0 rounded-full bg-white/[0.06]" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-[13px] w-2/3 rounded bg-white/[0.06]" />
        <div className="h-[11px] w-5/6 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}

export function ThreadListEmpty({
  message,
  hint,
}: {
  message: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-8 py-14 text-center">
      <AlertCircle className="mb-1 h-4 w-4 text-white/15" />
      <p className="text-[13px] text-white/40">{message}</p>
      {hint && (
        <p className="text-[12px] leading-relaxed text-white/25">{hint}</p>
      )}
    </div>
  );
}
