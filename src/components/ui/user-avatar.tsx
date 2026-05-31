"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  const n = (name || "").trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  const e = (email || "").trim();
  if (e) return e[0].toUpperCase();
  return "U";
}

export function UserAvatar({ src, name, email, className }: UserAvatarProps) {
  const [status, setStatus] = React.useState<"idle" | "loaded" | "error">(
    src ? "idle" : "error"
  );

  React.useEffect(() => {
    setStatus(src ? "idle" : "error");
  }, [src]);

  const initials = getInitials(name, email);
  const showImage = !!src && status !== "error";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-zinc-600 via-zinc-700 to-zinc-900 ring-1 ring-white/10",
        className
      )}
    >
      <span
        className={cn(
          "text-xs font-semibold tracking-tight text-white/90 transition-opacity duration-200",
          status === "loaded" ? "opacity-0" : "opacity-100"
        )}
        aria-hidden={status === "loaded"}
      >
        {initials}
      </span>

      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? undefined}
          alt={name || email || "User"}
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            status === "loaded" ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </span>
  );
}
