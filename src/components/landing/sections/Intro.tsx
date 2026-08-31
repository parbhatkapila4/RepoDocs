"use client";

import React from "react";
import { motion } from "motion/react";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

import {
  STAGE,
  RED,
  PAPER,
  PANEL,
  SCANLINES,
  PixelFrame,
  PixelTile,
  PixelBadge,
  PixelCta,
} from "./shared";

const SCREEN = "#0B0B10";
const LINE = "rgba(243,238,228,0.09)";
const LINE_SOLID = "rgba(243,238,228,0.18)";

function IconIndex() {
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
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <line x1="10" y1="6.5" x2="14" y2="6.5" opacity="0.7" />
        <line x1="6.5" y1="10" x2="6.5" y2="14" opacity="0.7" />
        <line x1="17.5" y1="10" x2="17.5" y2="14" opacity="0.7" />
        <line x1="10" y1="17.5" x2="14" y2="17.5" opacity="0.7" />
      </g>
    </svg>
  );
}

const META = [
  { label: "Model", value: "Gemini 2.5 Flash" },
  { label: "Embeddings", value: "gemini-embedding-001, 768d" },
  { label: "Retrieval", value: "Top 5 files" },
];

const SOURCES = [
  { file: "api-guards.ts", score: "91%" },
  { file: "rate-limit.ts", score: "88%" },
  { file: "route.ts", score: "84%" },
  { file: "plans.ts", score: "79%" },
  { file: "redis.ts", score: "74%" },
];

const NODE_H = 38;
const NODES = [
  { x: 6, cy: 58, w: 108, label: "route.ts", sub: "entry", lit: false },
  { x: 154, cy: 58, w: 128, label: "api-guards.ts", sub: "guard", lit: true },
  { x: 312, cy: 26, w: 120, label: "rate-limit.ts", sub: "window", lit: true },
  { x: 312, cy: 90, w: 112, label: "plans.ts", sub: "ceiling", lit: false },
  { x: 458, cy: 26, w: 88, label: "redis.ts", sub: "store", lit: false },
];

const EDGES: [string, boolean][] = [
  ["M114 58 H154", false],
  ["M282 58 H291 Q297 58 297 52 V32 Q297 26 303 26 H312", true],
  ["M282 58 H291 Q297 58 297 64 V84 Q297 90 303 90 H312", false],
  ["M432 26 H458", false],
];

function Arrow({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  return (
    <path
      d={`M${x - 5} ${y - 3.2} L${x} ${y} L${x - 5} ${y + 3.2} Z`}
      fill={lit ? RED : "rgba(243,238,228,0.45)"}
    />
  );
}

function ImportMap({ reduced }: { reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 552 118"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full flex-1 p-1"
      aria-hidden
    >
      <defs>
        <pattern
          id="im-dots"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="0.6" cy="0.6" r="0.6" fill="rgba(243,238,228,0.055)" />
        </pattern>
        <linearGradient id="im-node" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(243,238,228,0.085)" />
          <stop offset="1" stopColor="rgba(243,238,228,0.028)" />
        </linearGradient>
        <linearGradient id="im-node-lit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(175,191,192,0.26)" />
          <stop offset="1" stopColor="rgba(175,191,192,0.07)" />
        </linearGradient>
        <radialGradient id="im-pool" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(175,191,192,0.09)" />
          <stop offset="1" stopColor="rgba(175,191,192,0)" />
        </radialGradient>
      </defs>

      <rect width="552" height="118" fill="url(#im-dots)" />
      <ellipse cx="310" cy="44" rx="235" ry="76" fill="url(#im-pool)" />
      {EDGES.filter(([, lit]) => lit).map(([d]) => (
        <path
          key={`glow-${d}`}
          d={d}
          stroke={RED}
          strokeOpacity="0.2"
          strokeWidth="6"
          strokeLinecap="round"
        />
      ))}
      {EDGES.map(([d, lit]) => (
        <path
          key={d}
          d={d}
          stroke={lit ? RED : "rgba(243,238,228,0.22)"}
          strokeOpacity={lit ? 0.9 : 1}
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      ))}
      {EDGES.map(([d, lit], i) => {
        const ends = [
          { x: 154, y: 58 },
          { x: 312, y: 26 },
          { x: 312, y: 90 },
          { x: 458, y: 26 },
        ];
        return <Arrow key={`tip-${d}`} x={ends[i].x} y={ends[i].y} lit={lit} />;
      })}
      {!reduced &&
        EDGES.filter(([, lit]) => lit).map(([d]) => (
          <circle key={`pulse-${d}`} r="2" fill={RED}>
            <animateMotion dur="3.4s" repeatCount="indefinite" path={d} />
            <animate
              attributeName="opacity"
              values="0;0.9;0.9;0"
              keyTimes="0;0.12;0.8;1"
              dur="3.4s"
              repeatCount="indefinite"
            />
          </circle>
        ))}

      {NODES.map((n) => {
        const y = n.cy - NODE_H / 2;
        const subject = n.label === "api-guards.ts";
        return (
          <g key={n.label}>
            {subject && (
              <rect
                x={n.x - 4}
                y={y - 4}
                width={n.w + 8}
                height={NODE_H + 8}
                fill="none"
                stroke={RED}
                strokeOpacity="0.22"
                strokeWidth="1"
              />
            )}
            <rect
              x={n.x + 1}
              y={y + 1.5}
              width={n.w}
              height={NODE_H}
              fill="rgba(0,0,0,0.45)"
            />
            <rect
              x={n.x}
              y={y}
              width={n.w}
              height={NODE_H}
              fill={n.lit ? "url(#im-node-lit)" : "url(#im-node)"}
              stroke={
                n.lit ? "rgba(175,191,192,0.72)" : "rgba(243,238,228,0.17)"
              }
              strokeWidth="1"
            />
            <line
              x1={n.x + 1}
              y1={y + 1}
              x2={n.x + n.w - 1}
              y2={y + 1}
              stroke="rgba(243,238,228,0.14)"
              strokeWidth="1"
            />
            <rect
              x={n.x}
              y={y}
              width="2.5"
              height={NODE_H}
              fill={n.lit ? RED : "rgba(243,238,228,0.22)"}
            />
            <text
              x={n.x + 12}
              y={n.cy - 3}
              className="font-mono"
              fontSize="11.5"
              fill={n.lit ? RED : "rgba(243,238,228,0.62)"}
            >
              {n.label}
            </text>
            <text
              x={n.x + 12}
              y={n.cy + 11}
              className="font-mono"
              fontSize="7.5"
              letterSpacing="0.09em"
              fill={n.lit ? "rgba(175,191,192,0.6)" : "rgba(243,238,228,0.34)"}
            >
              {n.sub.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function AnswerPanel() {
  const reduced = usePrefersReducedMotion();
  return (
    <div
      role="img"
      aria-label="RepoDoc answering a question about a repository: the question, the grounded answer, an import map of the ranked files, and the five source files the answer was built from"
      className="flex h-full w-full flex-col font-grotesk text-[12px]"
      style={{ backgroundColor: SCREEN }}
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
        <span className="font-mono text-[12px]" style={{ color: PAPER }}>
          acme/payments-api
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span
            className="px-1.5 py-0.5 font-mono text-[10px] text-white/45"
            style={{ backgroundColor: "rgba(243,238,228,0.06)" }}
          >
            main
          </span>
          <span
            className="px-1.5 py-0.5 font-mono text-[10px] text-white/45"
            style={{ backgroundColor: "rgba(243,238,228,0.06)" }}
          >
            a1c39f2
          </span>
        </span>
      </div>

      <div
        className="grid grid-cols-3 border-b"
        style={{ borderColor: LINE, backgroundColor: "rgba(243,238,228,0.02)" }}
      >
        {META.map((m, i) => (
          <div
            key={m.label}
            className="px-4 py-2.5"
            style={i > 0 ? { borderLeft: `1px solid ${LINE}` } : undefined}
          >
            <div className="text-[9.5px] uppercase tracking-[0.1em] text-white/45">
              {m.label}
            </div>
            <div className="mt-1 truncate font-mono text-[10.5px] text-white/70">
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div
          className="flex items-start gap-2.5 px-3 py-2.5"
          style={{ backgroundColor: "rgba(243,238,228,0.05)" }}
        >
          <span className="mt-px font-mono text-[10px] text-white/45">?</span>
          <span className="text-[12.5px]" style={{ color: PAPER }}>
            Where are rate limits configured?
          </span>
        </div>

        <div className="flex items-start gap-2.5">
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center font-mono text-[9px]"
            style={{ backgroundColor: "rgba(175,191,192,0.16)", color: RED }}
            aria-hidden
          >
            R
          </span>
          <p className="text-[12px] font-light leading-[1.45] text-white/60">
            Every request passes one shared guard before any model call, so the
            ceiling lives in a single place. The window and the limit are read
            from the owner&apos;s plan.
          </p>
        </div>

        <div
          className="mt-1 flex min-h-[96px] flex-1 flex-col"
          style={{
            border: `1px solid ${LINE}`,
            backgroundColor: "rgba(243,238,228,0.015)",
          }}
        >
          <div
            className="flex items-center gap-2 border-b px-3 py-1.5"
            style={{ borderColor: LINE }}
          >
            <span className="text-[9.5px] uppercase tracking-[0.1em] text-white/45">
              Import map
            </span>
            <span className="ml-auto font-mono text-[9.5px] text-white/45">
              from require and import statements
            </span>
          </div>
          <ImportMap reduced={reduced} />
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-1">
          <div className="text-[9.5px] uppercase tracking-[0.1em] text-white/45">
            5 sources
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SOURCES.map((s) => (
              <span
                key={s.file}
                className="inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[10.5px] text-white/55"
                style={{
                  backgroundColor: "rgba(243,238,228,0.04)",
                  border: `1px solid ${LINE}`,
                }}
              >
                {s.file}
                <span className="text-white/45">{s.score}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Intro() {
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
              <PixelBadge>Introducing RepoDoc</PixelBadge>
            </div>
            <h2
              className="font-display text-[clamp(2.25rem,3.05vw,2.75rem)] font-medium leading-[1.12] tracking-[-0.012em] pb-2"
              style={{ color: PAPER }}
            >
              See everything your codebase does
            </h2>
            <p className="font-grotesk text-[18px] font-light leading-[1.28] text-white/70 lg:text-[21px] pb-2">
              Point RepoDoc at a GitHub repository. It reads every file, maps
              how the modules import one another, and turns the whole thing into
              something you can ask questions of.
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
                    <IconIndex />
                  </PixelTile>
                  <h3
                    className="font-grotesk text-[20px] font-bold leading-[1.2]"
                    style={{ color: PAPER }}
                  >
                    One index behind every answer
                  </h3>
                  <p className="font-grotesk text-[15px] font-light leading-[1.35] text-white/55">
                    RepoDoc summarizes every file in the repo and embeds that
                    summary, so retrieval ranks by what a file is for rather
                    than which words it happens to contain. Ask in plain English
                    and the answer comes back with the files it was built from,
                    ranked by similarity.
                  </p>
                </div>
                <div>
                  <PixelCta href="/documentation">
                    Explore the documentation
                  </PixelCta>
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
                    <AnswerPanel />
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
