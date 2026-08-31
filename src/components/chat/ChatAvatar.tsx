"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { avatarGradient, initialsFor } from "@/lib/chat-client";

export type PresenceStatus = "indexed" | "indexing" | "idle" | "error";

const PRESENCE_COLOR: Record<PresenceStatus, string> = {
  indexed: "#22c55e",
  indexing: "#f59e0b",
  idle: "#6b7280",
  error: "#ef4444",
};

export const PRESENCE_LABEL: Record<PresenceStatus, string> = {
  indexed: "Indexed",
  indexing: "Indexing",
  idle: "Not indexed",
  error: "Index failed",
};

export function ChatAvatar({
  name,
  src,
  size = 44,
  status,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  status?: PresenceStatus;
  className?: string;
}) {
  const { from, to } = avatarGradient(name || "?");
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;
  const dot = Math.max(10, Math.round(size * 0.27));

  return (
    <span
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <span
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-full ring-1 ring-white/10"
        style={{ backgroundImage: `linear-gradient(140deg, ${from}, ${to})` }}
      >
        {src && showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            draggable={false}
            referrerPolicy="no-referrer"
            onError={() => setFailedSrc(src)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="font-semibold leading-none text-white/95"
            style={{ fontSize: Math.round(size * 0.36) }}
          >
            {initialsFor(name)}
          </span>
        )}
      </span>

      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-[#141416]",
            status === "indexing" && "animate-pulse",
          )}
          style={{
            width: dot,
            height: dot,
            backgroundColor: PRESENCE_COLOR[status],
          }}
          title={PRESENCE_LABEL[status]}
        />
      )}
    </span>
  );
}
