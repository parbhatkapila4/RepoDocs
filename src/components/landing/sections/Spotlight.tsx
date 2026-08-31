"use client";

import React from "react";
import { motion } from "motion/react";

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
  LINE_SOLID,
} from "./shared";

function IconGraph() {
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
        <circle cx="5" cy="6" r="2.4" />
        <circle cx="19" cy="6" r="2.4" />
        <circle cx="12" cy="12.5" r="2.6" />
        <circle cx="5" cy="19" r="2.4" />
        <circle cx="19" cy="19" r="2.4" />
        <line x1="6.9" y1="7.5" x2="10.2" y2="11.1" opacity="0.7" />
        <line x1="17.1" y1="7.5" x2="13.8" y2="11.1" opacity="0.7" />
        <line x1="10.2" y1="14" x2="6.9" y2="17.5" opacity="0.7" />
        <line x1="13.8" y1="14" x2="17.1" y2="17.5" opacity="0.7" />
      </g>
    </svg>
  );
}

const NODE_H = 32;
const G_NODES = [
  { x: 16, cy: 44, w: 88, label: "index.ts", tone: "dim" },
  { x: 16, cy: 110, w: 88, label: "server.ts", tone: "dim" },
  { x: 140, cy: 44, w: 104, label: "routes.ts", tone: "in" },
  { x: 140, cy: 156, w: 104, label: "webhook.ts", tone: "in" },
  { x: 280, cy: 100, w: 120, label: "api-guards.ts", tone: "sel" },
  { x: 436, cy: 44, w: 104, label: "plans.ts", tone: "out" },
  { x: 436, cy: 156, w: 104, label: "budget.ts", tone: "out" },
  { x: 576, cy: 100, w: 88, label: "prisma.ts", tone: "dim" },
];
const G_EDGES = [
  [0, 2, false],
  [1, 2, false],
  [1, 3, false],
  [2, 4, true],
  [3, 4, true],
  [4, 5, true],
  [4, 6, true],
  [5, 7, false],
  [6, 7, false],
];

const TONE = {
  sel: {
    grad: "url(#sp-node-lit)",
    stroke: "rgba(175,191,192,0.72)",
    bar: RED,
    text: RED,
  },
  in: {
    grad: "url(#sp-node)",
    stroke: "rgba(243,238,228,0.24)",
    bar: "rgba(243,238,228,0.36)",
    text: "rgba(243,238,228,0.78)",
  },
  out: {
    grad: "url(#sp-node)",
    stroke: "rgba(243,238,228,0.2)",
    bar: "rgba(243,238,228,0.28)",
    text: "rgba(243,238,228,0.7)",
  },
  dim: {
    grad: "url(#sp-node-dim)",
    stroke: "rgba(243,238,228,0.15)",
    bar: "rgba(243,238,228,0.18)",
    text: "rgba(243,238,228,0.5)",
  },
} as const;

function GraphSvg() {
  const outgoing = new Map<number, number[]>();
  const incoming = new Map<number, number[]>();
  G_EDGES.forEach(([a, b]) => {
    const from = a as number;
    const to = b as number;
    if (!outgoing.has(from)) outgoing.set(from, []);
    if (!incoming.has(to)) incoming.set(to, []);
    outgoing.get(from)!.push(to);
    incoming.get(to)!.push(from);
  });
  const fan = (list: number[] | undefined, of: number) => {
    if (!list || list.length < 2) return 0;
    const i = list.indexOf(of);
    return (i - (list.length - 1) / 2) * 9;
  };

  const edges = G_EDGES.map(([a, b, lit]) => {
    const from = G_NODES[a as number];
    const to = G_NODES[b as number];
    const x1 = from.x + from.w;
    const y1 = from.cy + fan(outgoing.get(a as number), b as number);
    const x2 = to.x;
    const y2 = to.cy + fan(incoming.get(b as number), a as number);
    return {
      key: `${from.label}-${to.label}`,
      lit: lit as boolean,
      x1,
      y1,
      x2,
      y2,
      angle: (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI,
    };
  });

  return (
    <svg
      viewBox="0 0 680 196"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full flex-1 p-2"
      aria-hidden
    >
      <defs>
        <pattern
          id="sp-dots"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="0.6" cy="0.6" r="0.6" fill="rgba(243,238,228,0.05)" />
        </pattern>
        <linearGradient id="sp-node" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(243,238,228,0.085)" />
          <stop offset="1" stopColor="rgba(243,238,228,0.028)" />
        </linearGradient>
        <linearGradient id="sp-node-dim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(243,238,228,0.05)" />
          <stop offset="1" stopColor="rgba(243,238,228,0.018)" />
        </linearGradient>
        <linearGradient id="sp-node-lit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(175,191,192,0.26)" />
          <stop offset="1" stopColor="rgba(175,191,192,0.07)" />
        </linearGradient>
        <radialGradient id="sp-pool" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(175,191,192,0.1)" />
          <stop offset="1" stopColor="rgba(175,191,192,0)" />
        </radialGradient>
      </defs>

      <rect width="680" height="196" fill="url(#sp-dots)" />
      <ellipse cx="340" cy="100" rx="230" ry="94" fill="url(#sp-pool)" />
      {edges
        .filter((e) => e.lit)
        .map((e) => (
          <line
            key={`glow-${e.key}`}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke={RED}
            strokeOpacity="0.16"
            strokeWidth="5"
            strokeLinecap="round"
          />
        ))}
      {edges.map((e) => (
        <line
          key={e.key}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          stroke={e.lit ? RED : "rgba(243,238,228,0.2)"}
          strokeOpacity={e.lit ? 0.8 : 1}
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      ))}
      {edges.map((e) => (
        <path
          key={`tip-${e.key}`}
          d={`M${e.x2 - 4.6} ${e.y2 - 2.9} L${e.x2} ${e.y2} L${e.x2 - 4.6} ${e.y2 + 2.9} Z`}
          fill={e.lit ? RED : "rgba(243,238,228,0.42)"}
          transform={`rotate(${e.angle} ${e.x2} ${e.y2})`}
        />
      ))}

      {G_NODES.map((n) => {
        const t = TONE[n.tone as keyof typeof TONE];
        const y = n.cy - NODE_H / 2;
        return (
          <g key={n.label}>
            {n.tone === "sel" && (
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
              fill={t.grad}
              stroke={t.stroke}
              strokeWidth="1"
            />
            <line
              x1={n.x + 1}
              y1={y + 1}
              x2={n.x + n.w - 1}
              y2={y + 1}
              stroke="rgba(243,238,228,0.13)"
              strokeWidth="1"
            />
            <rect x={n.x} y={y} width="2.5" height={NODE_H} fill={t.bar} />
            <text
              x={n.x + 11}
              y={n.cy + 4}
              className="font-mono"
              fontSize="11.5"
              fill={t.text}
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const INSPECTOR = [
  { dir: "Imports this file", files: ["routes.ts", "webhook.ts"] },
  { dir: "This file imports", files: ["plans.ts", "budget.ts"] },
];

function MapPanel() {
  return (
    <div
      role="img"
      aria-label="RepoDoc's architecture map: a graph of indexed files with import edges drawn, one file selected, and the inspector listing the files that import it and the files it imports"
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
            <rect x="1" y="1" width="3" height="3" />
            <rect x="8" y="1" width="3" height="3" />
            <rect x="4.5" y="4.5" width="3" height="3" />
            <rect x="1" y="8" width="3" height="3" />
            <rect x="8" y="8" width="3" height="3" />
          </svg>
        </span>
        <span className="font-mono text-[12px]" style={{ color: PAPER }}>
          acme/payments-api
        </span>
        <span className="text-[11px] text-white/45">architecture</span>
        <span className="ml-auto font-mono text-[10px] text-white/45">
          static analysis
        </span>
      </div>

      <div
        className="flex min-h-[130px] flex-1 flex-col"
        style={{ backgroundColor: "rgba(243,238,228,0.015)" }}
      >
        <GraphSvg />
      </div>

      <div
        className="grid grid-cols-1 border-t sm:grid-cols-2"
        style={{ borderColor: LINE }}
      >
        {INSPECTOR.map((col, i) => (
          <div
            key={col.dir}
            className="flex flex-col gap-2 px-4 py-3"
            style={i > 0 ? { borderLeft: `1px solid ${LINE}` } : undefined}
          >
            <span className="text-[9.5px] uppercase tracking-[0.1em] text-white/45">
              {col.dir}
            </span>
            <span className="flex flex-wrap gap-1.5">
              {col.files.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center px-2 py-1 font-mono text-[10.5px] text-white/55"
                  style={{
                    backgroundColor: "rgba(243,238,228,0.04)",
                    border: `1px solid ${LINE}`,
                  }}
                >
                  {f}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Spotlight() {
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
              <PixelBadge>Architecture</PixelBadge>
            </div>
            <h2
              className="font-display text-[clamp(2.25rem,3.05vw,2.75rem)] font-medium leading-[1.12] tracking-[-0.012em] pb-2"
              style={{ color: PAPER }}
            >
              The whole repo, not a folder tree.
            </h2>
            <p className="font-grotesk text-[18px] font-light leading-[1.28] text-white/70 lg:text-[21px] pb-2">
              Every indexed file in one map, with the edges between them read
              straight out of the import statements. Pick a file to see what it
              pulls in and what pulls it in.
            </p>
          </div>

          <div className="relative flex flex-col gap-3 lg:grid lg:grid-cols-[2fr_1fr]">
            <div className="flex h-full w-full flex-col gap-3 lg:min-h-0">
              <div className="relative w-full lg:h-full lg:min-h-0 lg:flex-1">
                <div className="relative w-full overflow-clip lg:absolute lg:inset-0">
                  <div
                    className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border"
                    style={{ borderColor: LINE, backgroundColor: SCREEN }}
                  >
                    <MapPanel />
                  </div>
                </div>
              </div>
            </div>

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
                    <IconGraph />
                  </PixelTile>
                  <h3
                    className="font-grotesk text-[20px] font-bold leading-[1.2]"
                    style={{ color: PAPER }}
                  >
                    Parsed, not guessed
                  </h3>
                  <p className="font-grotesk text-[15px] font-light leading-[1.35] text-white/55">
                    The edges come from a sweep of the real import and require
                    statements in the stored source, so no model is inventing a
                    relationship that is not there. Relative paths resolve
                    today, and aliased ones such as{" "}
                    <span className="font-mono text-[13.5px] text-white/70">
                      @/lib/...
                    </span>{" "}
                    do not resolve yet.
                  </p>
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
