"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  ExternalLink,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

interface DemoVideoModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  poster?: string;
}

const ACCENT = "#AFBFC0";
const EASE = [0.22, 1, 0.36, 1] as const;
const CHAMFER =
  "polygon(0 0, 100% 0, 100% 100%, 13px 100%, 0 calc(100% - 13px))";
const NOISE_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 320 320' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
const SCANLINES =
  "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px)";


function timecode(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "00:00";
  const total = Math.floor(value);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fileLabel(src: string): string {
  const tail = src.split("?")[0].split("/").pop();
  if (!tail) return "walkthrough.mp4";
  try {
    return decodeURIComponent(tail);
  } catch {
    return tail;
  }
}

function CornerBrackets() {
  const base = "pointer-events-none absolute h-3 w-3 border-[#AFBFC0]/40";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-30">
      <span className={`${base} left-[6px] top-[6px] border-l border-t`} />
      <span className={`${base} right-[6px] top-[6px] border-r border-t`} />
      <span className={`${base} right-[6px] bottom-[6px] border-b border-r`} />
      <span className={`${base} bottom-[6px] left-[17px] border-b border-l`} />
    </div>
  );
}

function ModalContent({
  onClose,
  src,
  poster,
}: {
  onClose: () => void;
  src: string;
  poster?: string;
}) {
  const reduceMotion = useReducedMotion();

  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const scrubbing = useRef(false);

  const titleId = useId();
  const fileName = fileLabel(src);

  type Phase = "loading" | "ready" | "error";
  const [phase, setPhase] = useState<Phase>("loading");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [needsSound, setNeedsSound] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const requestClose = useCallback(() => {
    videoRef.current?.pause();
    onClose();
  }, [onClose]);

  useEffect(() => {
    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 80);

    return () => {
      window.clearTimeout(focusTimer);
      const target = previouslyFocused.current;
      if (target && typeof target.focus === "function") target.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key === "Tab") {
        const root = panelRef.current;
        if (!root) return;
        const focusables = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter(
          (el) => el.offsetParent !== null || el === document.activeElement,
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  useEffect(() => {
    const onFs = () =>
      setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const attemptPlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.muted = false;
      await v.play();
      setMuted(false);
      setNeedsSound(false);
      setBlocked(false);
    } catch {
      try {
        v.muted = true;
        await v.play();
        setMuted(true);
        setNeedsSound(true);
        setBlocked(false);
      } catch {
        setMuted(false);
        setNeedsSound(false);
        setBlocked(true);
        setPlaying(false);
      }
    }
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      setBlocked(false);
      void v.play().catch(() => setBlocked(true));
    } else {
      v.pause();
    }
  }, []);

  const restart = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    setCurrent(0);
    setBlocked(false);
    void v.play().catch(() => setBlocked(true));
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setMuted(next);
    if (!next) setNeedsSound(false);
  }, []);

  const enableSound = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    setNeedsSound(false);
    setBlocked(false);
    void v.play().catch(() => setBlocked(true));
  }, []);

  const seekTo = useCallback((value: number) => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = value;
    setCurrent(value);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void frame.requestFullscreen?.().catch(() => undefined);
    }
  }, []);

  const progress = duration > 0 ? (current / duration) * 100 : 0;
  const bufferPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const showBigPlay = phase === "ready" && blocked && !playing;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        padding:
          "max(env(safe-area-inset-top),0.75rem) max(env(safe-area-inset-right),0.75rem) max(env(safe-area-inset-bottom),0.75rem) max(env(safe-area-inset-left),0.75rem)",
      }}
      initial="hidden"
      animate="shown"
      exit="hidden"
      onMouseDown={requestClose}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[#020203]/90 backdrop-blur-xl"
        variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}
        transition={{ duration: 0.4, ease: EASE }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 48% at 50% 46%, ${ACCENT}22, transparent 68%)`,
        }}
        variants={{
          hidden: {
            opacity: 0,
            scale: 0.9,
            transition: { duration: 0.4, ease: EASE },
          },
          shown: {
            opacity: reduceMotion ? 0.7 : [0.45, 0.78, 0.55],
            scale: 1,
            transition: {
              opacity: reduceMotion
                ? { duration: 0.6 }
                : { duration: 9, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 0.9, ease: EASE },
            },
          },
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <motion.div
        ref={panelRef}
        className="relative z-10 w-full max-w-5xl"
        onMouseDown={(e) => e.stopPropagation()}
        variants={{
          hidden: {
            opacity: 0,
            scale: reduceMotion ? 1 : 0.94,
            filter: reduceMotion ? "blur(0px)" : "blur(14px)",
            y: reduceMotion ? 0 : 12,
          },
          shown: { opacity: 1, scale: 1, filter: "blur(0px)", y: 0 },
        }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        <div
          ref={frameRef}
          className="relative bg-[#040406]"
          style={{
            clipPath: CHAMFER,
            boxShadow: `0 48px 130px -30px rgba(0,0,0,0.9), 0 0 0 1px ${ACCENT}29, 0 0 64px -22px ${ACCENT}55`,
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 opacity-50"
            style={{ backgroundImage: SCANLINES }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 opacity-[0.05] mix-blend-overlay"
            style={{ backgroundImage: NOISE_URL }}
          />
          <CornerBrackets />

          <div className="relative z-30 flex items-center justify-between gap-3 border-b border-[#AFBFC0]/12 bg-black/35 px-4 py-2.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden
                className="text-[9px] leading-none text-[#AFBFC0]"
              >
                ◆
              </span>
              <span
                id={titleId}
                className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-[#fdeee8]/85 sm:text-[10.5px]"
              >
                REPODOC
                <span className="mx-1.5 text-[#AFBFC0]/45">{"//"}</span>
                <span className="text-[#fdeee8]/55">PRODUCT WALKTHROUGH</span>
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span
                aria-hidden
                className="hidden font-mono text-[10.5px] tabular-nums tracking-[0.16em] text-[#AFBFC0]/80 sm:inline"
              >
                {timecode(current)}
                <span className="mx-1 text-[#fdeee8]/25">/</span>
                <span className="text-[#fdeee8]/45">{timecode(duration)}</span>
              </span>
              <span className="relative flex h-2 w-2" aria-hidden>
                {playing && !reduceMotion && (
                  <span
                    className="absolute inline-flex h-full w-full rounded-full"
                    style={{
                      backgroundColor: ACCENT,
                      opacity: 0.55,
                      animation: "ping 1.6s cubic-bezier(0,0,0.2,1) infinite",
                    }}
                  />
                )}
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: phase === "error" ? "#7a4a44" : ACCENT,
                    opacity: playing ? 1 : 0.45,
                    boxShadow: playing ? `0 0 8px -1px ${ACCENT}` : undefined,
                  }}
                />
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={requestClose}
                aria-label="Close walkthrough"
                className="inline-flex h-7 w-7 items-center justify-center border border-[#AFBFC0]/20 bg-black/40 text-[#fdeee8]/60 outline-none transition-colors hover:border-[#AFBFC0]/55 hover:text-[#fdeee8] focus-visible:border-[#AFBFC0] focus-visible:ring-1 focus-visible:ring-[#AFBFC0]/60"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
            </div>
          </div>

          <div className="relative aspect-video w-full overflow-hidden bg-black">
            <video
              ref={videoRef}
              src={src}
              poster={poster}
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full bg-black object-contain"
              onClick={togglePlay}
              onLoadedMetadata={(e) =>
                setDuration(e.currentTarget.duration || 0)
              }
              onCanPlay={() => setPhase((p) => (p === "error" ? p : "ready"))}
              onLoadedData={() => {
                setPhase((p) => (p === "error" ? p : "ready"));
                void attemptPlay();
              }}
              onWaiting={() => setPhase((p) => (p === "error" ? p : "loading"))}
              onPlaying={() => {
                setPhase("ready");
                setPlaying(true);
              }}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => {
                if (!scrubbing.current) setCurrent(e.currentTarget.currentTime);
              }}
              onProgress={(e) => {
                const v = e.currentTarget;
                if (v.buffered.length > 0)
                  setBuffered(v.buffered.end(v.buffered.length - 1));
              }}
              onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
              onEnded={() => setPlaying(false)}
              onError={() => setPhase("error")}
            />

            <AnimatePresence>
              {phase === "loading" && (
                <motion.div
                  key="loading"
                  aria-hidden
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#040406]/75"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative h-9 w-9">
                    <span
                      className="absolute inset-0 rounded-full border-2"
                      style={{ borderColor: `${ACCENT}22` }}
                    />
                    <motion.span
                      className="absolute inset-0 rounded-full border-2 border-transparent"
                      style={{ borderTopColor: ACCENT }}
                      animate={reduceMotion ? undefined : { rotate: 360 }}
                      transition={{
                        duration: 0.9,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#AFBFC0]/70">
                      Buffering stream
                    </span>
                    <span className="font-mono text-[9.5px] tracking-[0.12em] text-[#fdeee8]/30">
                      {fileName}
                    </span>
                  </div>
                  <span className="relative h-px w-32 overflow-hidden bg-[#AFBFC0]/12">
                    <motion.span
                      className="absolute inset-y-0 left-0 w-1/3"
                      style={{ backgroundColor: `${ACCENT}b3` }}
                      animate={
                        reduceMotion ? undefined : { x: ["-120%", "420%"] }
                      }
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {phase === "error" && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#040406]/95 px-6 text-center">
                <AlertTriangle
                  className="h-7 w-7 text-[#AFBFC0]/80"
                  strokeWidth={1.75}
                />
                <p className="max-w-xs font-mono text-[11px] leading-relaxed tracking-[0.03em] text-[#fdeee8]/65">
                  The stream failed to load. Your connection may have dropped.
                </p>
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ clipPath: CHAMFER }}
                  className="inline-flex items-center gap-2 border border-[#AFBFC0]/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#fdeee8] outline-none transition-colors hover:bg-[#AFBFC0]/10 focus-visible:ring-1 focus-visible:ring-[#AFBFC0]/60"
                >
                  Open video directly
                  <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                </a>
              </div>
            )}

            <AnimatePresence>
              {showBigPlay && (
                <motion.button
                  key="bigplay"
                  type="button"
                  onClick={togglePlay}
                  aria-label="Play walkthrough"
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <span
                    className="flex h-[68px] w-[68px] items-center justify-center backdrop-blur-md transition-transform duration-300 hover:scale-105"
                    style={{
                      clipPath: CHAMFER,
                      backgroundColor: `${ACCENT}1f`,
                      boxShadow: `0 0 0 1px ${ACCENT}4d, 0 0 44px -8px ${ACCENT}99`,
                    }}
                  >
                    <Play
                      className="ml-0.5 h-6 w-6"
                      style={{ color: ACCENT, fill: ACCENT }}
                    />
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {needsSound && playing && (
                <motion.button
                  key="sound"
                  type="button"
                  onClick={enableSound}
                  aria-label="Unmute walkthrough"
                  className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-2 border border-[#AFBFC0]/45 bg-black/65 px-3 py-2 backdrop-blur-sm transition-colors hover:border-[#AFBFC0]/80 hover:bg-black/80"
                  style={{ clipPath: CHAMFER }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    {!reduceMotion && (
                      <span
                        className="absolute inline-flex h-full w-full rounded-full bg-[#AFBFC0]"
                        style={{
                          animation:
                            "ping 1.6s cubic-bezier(0,0,0.2,1) infinite",
                        }}
                      />
                    )}
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#AFBFC0]" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#fdeee8]">
                    Tap for sound
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="relative z-30 border-t border-[#AFBFC0]/12 bg-black/35">
            <div className="group/scrub relative px-4 pt-3 sm:px-5">
              <div className="relative h-1.5">
                <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#fdeee8]/10" />
                <div
                  className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#fdeee8]/20"
                  style={{ width: `${bufferPct}%` }}
                />
                <div
                  className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: ACCENT,
                    boxShadow: `0 0 8px -1px ${ACCENT}b3`,
                  }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#AFBFC0] opacity-0 shadow-[0_0_10px_-1px_rgba(175,191,192,0.9)] transition-opacity group-hover/scrub:opacity-100"
                  style={{ left: `${progress}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.01}
                  value={current}
                  aria-label="Seek through video"
                  aria-valuetext={`${timecode(current)} of ${timecode(
                    duration,
                  )}`}
                  disabled={phase !== "ready" || duration === 0}
                  onPointerDown={() => {
                    scrubbing.current = true;
                  }}
                  onPointerUp={() => {
                    scrubbing.current = false;
                  }}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="absolute inset-x-0 top-1/2 z-10 m-0 h-4 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent outline-none focus-visible:ring-1 focus-visible:ring-[#AFBFC0]/60 disabled:cursor-not-allowed [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent [&::-webkit-slider-runnable-track]:h-4 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-3.5 pb-3 pt-2 sm:px-5">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={playing ? "Pause" : "Play"}
                  disabled={phase !== "ready"}
                  className="inline-flex h-8 w-8 items-center justify-center text-[#fdeee8]/85 outline-none transition-colors hover:text-[#fdeee8] focus-visible:text-[#fdeee8] focus-visible:ring-1 focus-visible:ring-[#AFBFC0]/60 disabled:opacity-40"
                >
                  {playing ? (
                    <Pause className="h-4 w-4" fill="currentColor" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={restart}
                  aria-label="Restart from beginning"
                  disabled={phase !== "ready"}
                  className="inline-flex h-8 w-8 items-center justify-center text-[#fdeee8]/70 outline-none transition-colors hover:text-[#fdeee8] focus-visible:text-[#fdeee8] focus-visible:ring-1 focus-visible:ring-[#AFBFC0]/60 disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute" : "Mute"}
                  aria-pressed={muted}
                  disabled={phase !== "ready"}
                  className="inline-flex h-8 w-8 items-center justify-center text-[#fdeee8]/75 outline-none transition-colors hover:text-[#fdeee8] focus-visible:text-[#fdeee8] focus-visible:ring-1 focus-visible:ring-[#AFBFC0]/60 disabled:opacity-40"
                >
                  {muted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>

                <span className="ml-1 font-mono text-[10.5px] tabular-nums tracking-[0.12em] text-[#fdeee8]/55 sm:hidden">
                  {timecode(current)}
                  <span className="mx-0.5 text-[#fdeee8]/25">/</span>
                  {timecode(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="hidden items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#fdeee8]/30 md:flex"
                >
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ backgroundColor: `${ACCENT}99` }}
                  />
                  sourced to the files behind it
                </span>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={
                    fullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                  className="inline-flex h-8 w-8 items-center justify-center text-[#fdeee8]/75 outline-none transition-colors hover:text-[#fdeee8] focus-visible:text-[#fdeee8] focus-visible:ring-1 focus-visible:ring-[#AFBFC0]/60"
                >
                  {fullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 px-1 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#fdeee8]/25">
          narrated walkthrough
          <span className="mx-2 text-[#fdeee8]/12">·</span>
          press esc to close
        </p>
      </motion.div>
    </motion.div>
  );
}

export function DemoVideoModal({
  open,
  onClose,
  src,
  poster,
}: DemoVideoModalProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <ModalContent
          key="demo-modal"
          onClose={onClose}
          src={src}
          poster={poster}
        />
      )}
    </AnimatePresence>
  );
}
