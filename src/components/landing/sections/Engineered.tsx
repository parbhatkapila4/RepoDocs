"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

import {
  STAGE,
  RED,
  PAPER,
  PANEL,
  SCANLINES,
  PixelFrame,
  PixelTile,
  PixelBadge,
  SCREEN,
  LINE,
} from "./shared";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

function IconStack() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-7 w-7 sm:h-8 sm:w-8"
      aria-hidden
    >
      <g
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="6" y="6" width="12" height="12" />
        <rect x="9.5" y="9.5" width="5" height="5" opacity="0.7" />
        <path d="M9 6V3.2M15 6V3.2M9 20.8V18M15 20.8V18" />
        <path d="M6 9H3.2M6 15H3.2M20.8 9H18M20.8 15H18" />
      </g>
    </svg>
  );
}

const SPECS = [
  { k: "retrieval", v: "pgvector, cosine, top 5" },
  { k: "embeddings", v: "gemini-embedding-001, 768d" },
  { k: "summaries", v: "one per file, at index time" },
  { k: "queue", v: "leased rows, resumable" },
];

const FILES_TOTAL = 196;
const RUN_TICKS = 128;
const HOLD_TICKS = 34;
const CYCLE_TICKS = RUN_TICKS + HOLD_TICKS;

interface StepDef {
  label: string;
  start: number;
  end: number;
}

const STEPS: StepDef[] = [
  { label: "fetch tarball", start: 0, end: 10 },
  { label: "walk source tree", start: 10, end: 28 },
  { label: "summarize and embed", start: 28, end: 112 },
  { label: "write readme", start: 112, end: 128 },
];

const LOGS: { at: number; text: string }[] = [
  { at: 1, text: "job lease acquired" },
  { at: 5, text: "fetch tarball @ pinned commit" },
  { at: 14, text: "walk tree · skip lockfiles, .git, node_modules" },
  { at: 24, text: "196 files to index" },
  { at: 32, text: "summarize + embed src/lib/api-guards.ts" },
  { at: 42, text: "summarize + embed src/lib/rate-limit.ts" },
  { at: 52, text: "summarize + embed src/routes/webhook.ts · 768d" },
  { at: 62, text: "summarize + embed prisma/schema.prisma" },
  { at: 72, text: "time box hit · checkpoint written, resuming" },
  { at: 82, text: "summarize + embed src/lib/budget.ts" },
  { at: 92, text: "summarize + embed src/lib/plans.ts" },
  { at: 102, text: "131/196 files stored" },
  { at: 110, text: "196/196 files stored" },
  { at: 118, text: "readme from 196 file summaries" },
  { at: 126, text: "index complete · 196 files · 196 vectors" },
];

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

function stepProgress(t: number, step: StepDef): number {
  if (t <= step.start) return 0;
  if (t >= step.end) return 1;
  return (t - step.start) / (step.end - step.start);
}

function stepMetric(i: number, t: number, done: boolean, active: boolean) {
  const p = stepProgress(t, STEPS[i]);
  if (i === 0) return done ? "pinned sha" : active ? "receiving…" : "";
  if (i === 1) return done || active ? `${fmtInt(p * FILES_TOTAL)} files` : "";
  if (i === 2)
    return done || active
      ? `${fmtInt(p * FILES_TOTAL)}/${FILES_TOTAL} · 768d`
      : "";
  return done ? "grounded in summaries" : active ? "composing…" : "";
}

function Monitor() {
  const [liveTick, setTick] = useState(0);
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  useEffect(() => {
    if (reduced || !inView) return;
    const id = setInterval(() => {
      setTick((t) => (t + 1 >= CYCLE_TICKS ? 0 : t + 1));
    }, 100);
    return () => clearInterval(id);
  }, [reduced, inView]);
  const tick = reduced ? RUN_TICKS : liveTick;
  const t = Math.min(tick, RUN_TICKS);
  const running = !reduced && tick < RUN_TICKS;
  const pct = Math.min(100, Math.round((t / RUN_TICKS) * 100));
  const filesDone = Math.round(
    Math.max(stepProgress(t, STEPS[1]), stepProgress(t, STEPS[2])) *
      FILES_TOTAL,
  );
  const visibleLogs = LOGS.filter((l) => l.at <= tick).slice(-6);
  const logDim = [0.14, 0.2, 0.3, 0.4, 0.55, 0.75];

  return (
    <div
      role="img"
      aria-label="A replay of one RepoDoc indexing run: fetch the tarball, walk the source tree, summarize files, embed the summaries, then write the readme, with a live log of each step"
      ref={ref}
      className="flex h-full w-full flex-col font-mono"
      style={{ backgroundColor: SCREEN, fontVariantNumeric: "tabular-nums" }}
    >
      <div
        className="flex items-center gap-2.5 border-b px-4 py-3"
        style={{ borderColor: LINE }}
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center"
          style={{ backgroundColor: RED, color: STAGE }}
          aria-hidden
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor">
            <rect x="1" y="1" width="4" height="4" />
            <rect x="7" y="1" width="4" height="4" />
            <rect x="1" y="7" width="4" height="4" />
            <rect x="7" y="7" width="4" height="4" />
          </svg>
        </span>
        <span className="text-[12px]" style={{ color: PAPER }}>
          acme/payments-api
        </span>
        <span className="text-white/30">·</span>
        <span className="text-[11px] text-white/45">main</span>
        <span className="ml-auto flex items-center gap-2 text-[10px] uppercase tracking-[0.14em]">
          <span
            className={`h-1.5 w-1.5 shrink-0 ${running ? "animate-pulse" : ""}`}
            style={{ backgroundColor: RED }}
            aria-hidden
          />
          {running ? (
            <span className="text-white/45">indexing · {pct}%</span>
          ) : (
            <span style={{ color: RED }}>ready</span>
          )}
        </span>
      </div>

      <div className="flex flex-col gap-[7px] px-4 py-4 text-[12px] leading-[1.5] sm:px-5">
        {STEPS.map((step, i) => {
          const done = t >= step.end;
          const active = !done && t >= step.start;
          const metric = stepMetric(i, t, done, active);
          return (
            <div key={step.label} className="flex items-baseline gap-2.5">
              <span
                className="w-3 shrink-0 text-center"
                style={{
                  color: done
                    ? RED
                    : active
                      ? "rgba(243,238,228,0.7)"
                      : "rgba(243,238,228,0.2)",
                }}
                aria-hidden
              >
                {done ? "✓" : active ? SPINNER[t % SPINNER.length] : "·"}
              </span>
              <span
                className="truncate"
                style={{
                  color:
                    done || active
                      ? "rgba(243,238,228,0.8)"
                      : "rgba(243,238,228,0.3)",
                }}
              >
                {step.label}
              </span>
              <span className="ml-auto shrink-0 pl-3 text-[11px] text-white/45">
                {metric}
              </span>
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 border-y px-4 py-2.5 sm:px-5"
        style={{ borderColor: LINE }}
      >
        <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-white/45">
          {filesDone}/{FILES_TOTAL} files
        </span>
        <span
          className="h-1 flex-1"
          style={{ backgroundColor: "rgba(243,238,228,0.08)" }}
          aria-hidden
        >
          <span
            className="block h-full"
            style={{ width: `${pct}%`, backgroundColor: RED }}
          />
        </span>
      </div>

      <div className="flex min-h-[86px] flex-1 flex-col justify-end gap-[3px] px-4 py-3 text-[10.5px] leading-[1.45] sm:px-5">
        <style>{`
          @keyframes section-log-in {
            from { transform: translateY(5px); }
            to { transform: none; }
          }
          .section-log-line { animation: section-log-in 0.25s ease-out; }
          @media (prefers-reduced-motion: reduce) {
            .section-log-line { animation: none; }
          }
        `}</style>
        {visibleLogs.map((l, i) => (
          <div
            key={`${l.at}-${l.text}`}
            className="section-log-line truncate"
            style={{
              color: `rgba(243,238,228,${logDim[i + (6 - visibleLogs.length)] ?? 0.7})`,
            }}
          >
            {l.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Engineered() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: STAGE }}
    >
      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-8 lg:gap-10"
        >
          <div className="flex max-w-3xl flex-col gap-6">
            <div className="mb-3">
              <PixelBadge>Under the hood</PixelBadge>
            </div>
            <h2
              className="pb-2 font-display text-[clamp(2.25rem,3.05vw,2.75rem)] font-medium leading-[1.12] tracking-[-0.012em]"
              style={{ color: PAPER }}
            >
              Postgres, one gateway, one resumable worker.
            </h2>
            <p className="pb-2 font-grotesk text-[18px] font-light leading-[1.28] text-white/70 lg:text-[21px]">
              No orchestration framework, no separate vector database, no queue
              service. The vectors live in Postgres, generation goes through one
              gateway, and the indexing worker leases a row so it can stop and
              pick up where it left off.
            </p>
          </div>

          <div className="relative flex flex-col-reverse gap-3 lg:grid lg:grid-cols-[1fr_2fr]">
            <div className="relative w-full p-3">
              <PixelFrame />
              <div
                className="relative flex h-full flex-col gap-6 px-6 py-6 lg:px-10 lg:py-10"
                style={{
                  backgroundColor: PANEL,
                  backgroundImage: SCANLINES,
                }}
              >
                <div className="flex min-h-0 flex-1 flex-col justify-center gap-6 text-left">
                  <PixelTile>
                    <IconStack />
                  </PixelTile>
                  <h3
                    className="font-grotesk text-[20px] font-bold leading-[1.2]"
                    style={{ color: PAPER }}
                  >
                    The parts, and nothing else
                  </h3>
                  <dl className="flex flex-col">
                    {SPECS.map((s) => (
                      <div
                        key={s.k}
                        className="flex flex-col gap-0.5 py-1.5 xl:flex-row xl:items-baseline xl:justify-between xl:gap-4"
                      >
                        <dt className="font-grotesk text-[9.5px] uppercase tracking-[0.1em] text-white/50">
                          {s.k}
                        </dt>
                        <dd
                          className="font-mono text-[11px] xl:text-right"
                          style={{ color: "rgba(243,238,228,0.75)" }}
                        >
                          {s.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>

            <div className="flex h-full w-full flex-col gap-3 lg:min-h-0">
              <div className="relative w-full lg:h-full lg:min-h-0 lg:flex-1">
                <div className="relative w-full overflow-clip lg:absolute lg:inset-0">
                  <div
                    className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border"
                    style={{ borderColor: LINE, backgroundColor: SCREEN }}
                  >
                    <Monitor />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{ backgroundImage: SCANLINES }}
      />
    </section>
  );
}
