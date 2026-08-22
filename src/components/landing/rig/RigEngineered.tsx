"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

import { RigEyebrow, STAGE, RED } from "./shared";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const GREEN = "#22c55e";
const PAPER = "#f3eee4";
const LINE = "rgba(243,238,228,0.14)";

const LEFT = [
  { title: "RAG pipeline", desc: "Retrieval over your indexed source" },
  { title: "pgvector", desc: "768-dim cosine search in Postgres" },
  { title: "Leased job queue", desc: "Resumable indexing, no queue service" },
];
const RIGHT = [
  { title: "Gemini summaries", desc: "Every file distilled to its intent" },
  { title: "File-level sources", desc: "The files behind every answer" },
  { title: "Metered spend", desc: "Per-project cost ceiling, enforced live" },
];

function Anno({
  title,
  desc,
  side,
}: {
  title: string;
  desc: string;
  side: "left" | "right";
}) {
  const text = (
    <div className={side === "left" ? "text-right" : "text-left"}>
      <div
        className="font-mono text-[11px] uppercase tracking-[0.18em]"
        style={{ color: PAPER }}
      >
        {title}
      </div>
      <div className="mt-1 text-[11px] leading-snug text-white/30">{desc}</div>
    </div>
  );
  const line = (
    <span className="h-px flex-1" style={{ backgroundColor: LINE }} />
  );
  const dot = (
    <span
      className="h-2 w-2 shrink-0 rounded-full border"
      style={{ borderColor: `${RED}99` }}
    />
  );
  return (
    <div className="flex items-center gap-4">
      {side === "left" ? (
        <>
          {text}
          {line}
          {dot}
        </>
      ) : (
        <>
          {dot}
          {line}
          {text}
        </>
      )}
    </div>
  );
}

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
  { label: "clone parbhatkapila4/repodocs", start: 0, end: 9 },
  { label: "walk source tree", start: 9, end: 26 },
  { label: "summarize files", start: 26, end: 78 },
  { label: "embed summaries", start: 78, end: 112 },
  { label: "write docs + readme", start: 112, end: 128 },
];

const LOGS: { at: number; text: string }[] = [
  { at: 4, text: "fetch tarball @ origin/main" },
  { at: 12, text: "tree walk · skip lockfiles, .git" },
  { at: 21, text: "queued 196 files · lease w-01 acquired" },
  { at: 30, text: "summarize src/lib/github/tarball.ts" },
  { at: 38, text: "summarize src/lib/indexing-worker-run.ts" },
  { at: 46, text: "summarize src/lib/rag.ts" },
  { at: 54, text: "summarize prisma/schema.prisma" },
  { at: 62, text: "summarize src/app/api/query/route.ts" },
  { at: 70, text: "summarize src/lib/docs-sections.ts" },
  { at: 82, text: "embed summaries · 768d · gemini-embedding-001" },
  { at: 91, text: "embed summaries · 131/196" },
  { at: 100, text: "embed summaries · 196/196" },
  { at: 108, text: "pgvector upsert · hnsw index warm" },
  { at: 116, text: "compose docs · 17 sections" },
  { at: 122, text: "readme grounded in 196 file summaries" },
  { at: 127, text: "index complete · 196 files · 196 vectors" },
];

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

function stepProgress(t: number, step: StepDef): number {
  if (t <= step.start) return 0;
  if (t >= step.end) return 1;
  return (t - step.start) / (step.end - step.start);
}

function stepMetric(t: number, index: number): string {
  const p = stepProgress(t, STEPS[index]);
  switch (index) {
    case 0:
      return p >= 1 ? "origin/main" : p > 0 ? "receiving…" : "";
    case 1:
      return p > 0 ? `${fmtInt(easeOut(p) * FILES_TOTAL)} files` : "";
    case 2:
      return p > 0 ? `${fmtInt(p * FILES_TOTAL)}/${fmtInt(FILES_TOTAL)}` : "";
    case 3:
      return p > 0 ? `${fmtInt(p * FILES_TOTAL)} vectors · 768d` : "";
    case 4:
      return p >= 1 ? "17 sections · readme" : p > 0 ? "17 sections…" : "";
    default:
      return "";
  }
}

function Monitor() {
  const [liveTick, setTick] = useState(0);
  const [run, setRun] = useState(147);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setTick((t) => {
        if (t + 1 >= CYCLE_TICKS) {
          setRun((r) => r + 1);
          return 0;
        }
        return t + 1;
      });
    }, 100);
    return () => clearInterval(id);
  }, [reduced]);

  // Reduced motion: show the completed run as a still frame.
  const tick = reduced ? RUN_TICKS : liveTick;
  const t = Math.min(tick, RUN_TICKS);
  const running = !reduced && tick < RUN_TICKS;
  const pct = Math.min(100, Math.round((t / RUN_TICKS) * 100));
  const elapsed = (t * 0.1).toFixed(1).padStart(4, "0");
  const visibleLogs = LOGS.filter((l) => l.at <= tick).slice(-4);
  const logDim = [0.2, 0.3, 0.45, 0.7];

  return (
    <div
      className="relative w-full max-w-[560px] shrink-0 rounded-2xl border border-white/[0.08] p-3.5 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]"
      style={{ backgroundColor: "#100e10" }}
    >
      <div
        className="overflow-hidden rounded-xl border border-white/[0.07]"
        style={{
          backgroundColor: "#08070a",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
          <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-white/80">
            <span
              className={`h-1.5 w-1.5 rounded-full ${running ? "animate-pulse" : ""}`}
              style={{ backgroundColor: GREEN }}
            />
            parbhatkapila4/repodocs
            <span className="text-white/30">·</span>
            <span className="text-white/35">main · self-index</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em]">
            {running ? (
              <span className="text-white/40">indexing · {pct}%</span>
            ) : (
              <span style={{ color: GREEN }}>✓ ready</span>
            )}
          </span>
        </div>

        <div className="space-y-[7px] px-5 py-4 font-mono text-[12.5px] leading-[1.5]">
          {STEPS.map((step, i) => {
            const done = t >= step.end;
            const active = running && t >= step.start && t < step.end;
            const metric = stepMetric(t, i);
            return (
              <div
                key={step.label}
                className="flex items-baseline justify-between gap-4"
              >
                <span className="flex items-baseline gap-2.5">
                  <span
                    className="inline-block w-3 text-center"
                    style={{
                      color: done
                        ? GREEN
                        : active
                          ? PAPER
                          : "rgba(255,255,255,0.22)",
                    }}
                  >
                    {done ? "✓" : active ? SPINNER[tick % SPINNER.length] : "○"}
                  </span>
                  <span
                    className={
                      done || active ? "text-white/85" : "text-white/30"
                    }
                  >
                    {step.label}
                  </span>
                </span>
                <span
                  className={`text-[11px] ${active ? "text-white/60" : "text-white/35"}`}
                >
                  {metric}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 border-t border-white/[0.06] px-5 py-2.5 font-mono text-[10px] tracking-[0.08em] text-white/35">
          <span>run #{run} · w-01</span>
          <span className="relative h-px flex-1 overflow-hidden rounded-full bg-white/[0.08]">
            <span
              className="absolute inset-y-0 left-0 transition-[width] duration-200 ease-linear"
              style={{ width: `${pct}%`, backgroundColor: GREEN }}
            />
          </span>
          <span>00:{elapsed}</span>
        </div>

        <div className="h-[86px] space-y-[3px] overflow-hidden border-t border-white/[0.06] px-5 py-2.5 font-mono text-[10.5px] leading-[1.5]">
          {visibleLogs.map((l, i) => (
            <motion.div
              key={`${run}-${l.at}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{
                color: `rgba(243,238,228,${logDim[i + (4 - visibleLogs.length)]})`,
              }}
            >
              {l.text}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-3 pt-3 font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">
        <span>RAG engine</span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-1 w-1 rounded-full"
            style={{ backgroundColor: RED }}
          />
          <span style={{ color: RED }}>pgvector</span>
        </span>
        <span>grounded</span>
      </div>
    </div>
  );
}

export default function RigEngineered() {
  return (
    <section
      className="relative mt-16 overflow-hidden lg:mt-24"
      style={{ backgroundColor: STAGE }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(243,238,228,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(243,238,228,0.025) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage:
            "radial-gradient(ellipse 75% 60% at 50% 48%, black, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 60% at 50% 48%, black, transparent 82%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <RigEyebrow glyph="◆">Under the hood</RigEyebrow>
          <h2
            className="mx-auto mt-6 max-w-3xl text-[clamp(2.2rem,5vw,4rem)] font-black leading-[1.0] tracking-[-0.04em]"
            style={{ color: PAPER }}
          >
            Built for people who read the code.
          </h2>
        </motion.div>

        <div className="mt-16 hidden items-stretch justify-center gap-10 lg:flex">
          <div className="flex flex-1 flex-col justify-between py-6">
            {LEFT.map((a) => (
              <Anno key={a.title} {...a} side="left" />
            ))}
          </div>
          <Monitor />
          <div className="flex flex-1 flex-col justify-between py-6">
            {RIGHT.map((a) => (
              <Anno key={a.title} {...a} side="right" />
            ))}
          </div>
        </div>

        <div className="mt-12 lg:hidden">
          <div className="flex justify-center">
            <Monitor />
          </div>
          <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/[0.1] bg-white/[0.08] sm:grid-cols-2">
            {[...LEFT, ...RIGHT].map((a) => (
              <div
                key={a.title}
                className="p-5"
                style={{ backgroundColor: STAGE }}
              >
                <div
                  className="font-mono text-[11px] uppercase tracking-[0.18em]"
                  style={{ color: PAPER }}
                >
                  {a.title}
                </div>
                <div className="mt-1 text-[12px] text-white/35">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
