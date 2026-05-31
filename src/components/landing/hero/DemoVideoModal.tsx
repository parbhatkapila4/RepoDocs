"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface DemoVideoModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  poster?: string;
}

export function DemoVideoModal({
  open,
  onClose,
  src,
  poster,
}: DemoVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) {
      videoRef.current?.pause();
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product walkthrough"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
      onClick={onClose}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
      />

      <div
        className="relative z-10 w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#040406] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] bg-black/50 text-white/55 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-black/70 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <video
            ref={videoRef}
            src={src}
            poster={poster}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="block aspect-video w-full bg-black"
          />
        </div>
      </div>
    </div>
  );
}
