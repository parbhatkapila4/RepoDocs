"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { RigEyebrow, STAGE, RED } from "./shared";

const GREEN = "#22c55e";
const PAPER = "#f3eee4";
const LINE = "rgba(243,238,228,0.1)";
const HATCH =
  "repeating-linear-gradient(45deg, rgba(243,238,228,0.22) 0px, rgba(243,238,228,0.22) 1px, transparent 1px, transparent 5px)";

const STEPS = [
  {
    n: "01",
    title: "Index every file, not just the README.",
    body: [
      "RepoDoc walks the whole repo, summarizes each file with Gemini, and embeds that summary into pgvector  -  so retrieval ranks by what a file means, not by which words it happens to share with your question.",
      "Config, tests, the one helper module that actually matters. Only lockfiles and VCS metadata are skipped.",
    ],
  },
  {
    n: "02",
    title: "Read the repo as a file map.",
    body: [
      "The indexed source is parsed into a browsable map of every file in the repo, with the connections between them drawn from real import statements rather than guessed at by a model.",
      "Pick a file to see what it pulls in and what pulls it in.",
    ],
  },
  {
    n: "03",
    title: "Show the sources behind the answer.",
    body: [
      "Every answer lists the files it was grounded in, ranked by similarity. Open one and read the code yourself.",
      "The answer is built only from retrieved source  -  so you never have to take RepoDoc's word for it.",
    ],
  },
];

interface Row {
  name: string;
  pct: number;
  val: string;
  good?: boolean;
}
interface Panel {
  title: string;
  label: string;
  rows: Row[];
  note: string;
}

const PANELS: Panel[] = [
  {
    title: "INDEX SCOPE",
    label: "What the walker takes in",
    rows: [
      { name: "Indexed", pct: 100, val: "all source", good: true },
      { name: "Skipped", pct: 6, val: "lockfiles, .git" },
    ],
    note: "GithubRepoLoader walks the default branch. The ignore list is lockfiles, .git, .github and .DS_Store  -  nothing else.",
  },
  {
    title: "FILE MAP",
    label: "Where edges come from",
    rows: [
      { name: "Relative", pct: 100, val: "./ and ../", good: true },
      { name: "Aliased", pct: 0, val: "not resolved" },
    ],
    note: "Edges are parsed straight out of import and require statements. Path-aliased imports (@/lib/...) aren't resolved yet.",
  },
  {
    title: "GROUNDING",
    label: "Context assembled per question",
    rows: [
      { name: "Code files", pct: 100, val: "top 5", good: true },
      { name: "Repo memory", pct: 60, val: "top 3" },
    ],
    note: "Retrieved files plus durable facts from earlier answers. When memory and code disagree, the prompt tells the model the code wins.",
  },
];

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const CODE_BARS = (() => {
  const rand = seededRandom(13);
  const bars: { x: number; y: number; w: number }[] = [];
  for (let y = 10; y < 700; y += 15) {
    let x = 12 + rand() * 24;
    const segs = 1 + Math.floor(rand() * 3);
    for (let s = 0; s < segs; s++) {
      const w = 14 + rand() * 52;
      if (x + w > 288) break;
      bars.push({ x, y, w });
      x += w + 10 + rand() * 22;
    }
  }
  return bars;
})();

const SCAN_DUR = 7;

function CodeRain() {
  return (
    <svg
      viewBox="0 0 300 700"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="rig-scan-tail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GREEN} stopOpacity="0" />
          <stop offset="1" stopColor={GREEN} stopOpacity="0.12" />
        </linearGradient>
      </defs>

      <g fill="rgba(243,238,228,0.16)">
        {CODE_BARS.map((b, i) => {
          const arrival = ((b.y + 60) / 820) * SCAN_DUR;
          const isTyping = i % 9 === 4;
          return (
            <rect key={i} x={b.x} y={b.y} width={b.w} height="5" rx="1" opacity="0.35">
              <animate
                attributeName="opacity"
                values="0.35;1;0.35"
                keyTimes="0;0.1;1"
                dur={`${SCAN_DUR}s`}
                begin={`${(arrival - 0.7).toFixed(2)}s`}
                repeatCount="indefinite"
              />
              {isTyping && (
                <animate
                  attributeName="width"
                  values={`0;${b.w};${b.w}`}
                  keyTimes="0;0.3;1"
                  dur="6.3s"
                  begin={`${((i * 0.53) % 6.3).toFixed(2)}s`}
                  repeatCount="indefinite"
                />
              )}
            </rect>
          );
        })}
      </g>

      <g>
        <rect x="0" y="-56" width="300" height="56" fill="url(#rig-scan-tail)" />
        <rect x="0" y="0" width="300" height="1.5" fill={GREEN} opacity="0.5" />
        <animateTransform
          attributeName="transform"
          type="translate"
          from="0 -60"
          to="0 760"
          dur={`${SCAN_DUR}s`}
          repeatCount="indefinite"
        />
      </g>
    </svg>
  );
}

function StatPanel({ panel }: { panel: Panel }) {
  return (
    <div
      className="rounded-xl border p-5 lg:p-7 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]"
      style={{ borderColor: `${RED}55`, backgroundColor: "rgba(10,8,9,0.85)" }}
    >
      <div className="font-mono text-[12px] uppercase tracking-[0.22em]" style={{ color: PAPER }}>
        {panel.title}
      </div>
      <div className="mt-4 h-px w-full" style={{ backgroundColor: LINE }} />
      <div className="mt-6 font-mono text-[11px] tracking-wide text-white/40">{panel.label}</div>

      <div className="mt-4 space-y-3.5">
        {panel.rows.map((r) => (
          <div key={r.name} className="flex items-center gap-2 lg:gap-3 font-mono text-[11px]">
            <span className="w-24 shrink-0 lg:w-28" style={{ color: r.good ? GREEN : "rgba(243,238,228,0.45)" }}>
              {r.name}
            </span>
            <div
              className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-sm"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            >
              <motion.div
                className="h-full rounded-sm"
                initial={{ width: 0 }}
                animate={{ width: `${r.pct}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={
                  r.good
                    ? { backgroundColor: GREEN }
                    : { backgroundColor: "rgba(243,238,228,0.12)", backgroundImage: HATCH }
                }
              />
            </div>
            <span className="w-20 shrink-0 text-right lg:w-24" style={{ color: r.good ? GREEN : "rgba(243,238,228,0.45)" }}>
              {r.val}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 font-mono text-[11px] leading-[1.6] text-white/35">{panel.note}</div>
    </div>
  );
}

export default function RigApproach() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % STEPS.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative mt-16 lg:mt-24" style={{ backgroundColor: STAGE }}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <div className="rounded-2xl border border-white/[0.1]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="px-8 py-12 text-center lg:px-12 lg:py-14"
          >
            <RigEyebrow glyph="◆">Our approach</RigEyebrow>
            <h2
              className="mx-auto mt-6 max-w-3xl text-[clamp(2.2rem,5vw,4rem)] font-black leading-[1.0] tracking-[-0.04em]"
              style={{ color: PAPER }}
            >
              Grounded beats generic.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-[1.6] text-white/55">
              RepoDoc is a closed loop  -  indexing, retrieval, mapping, and
              sourcing  -  engineered together for one job: understanding real
              codebases, not guessing about them.
            </p>
          </motion.div>

          <div className="h-px w-full" style={{ backgroundColor: LINE }} />

          <div className="lg:grid lg:grid-cols-2">
            <div className="lg:border-r" style={{ borderColor: LINE }}>
              {STEPS.map((s, i) => {
                const isActive = active === i;
                return (
                  <div
                    key={s.n}
                    className={`flex flex-col justify-center border-b border-l-2 border-l-transparent px-8 py-9 lg:px-12 ${
                      isActive ? "lg:border-l-[#AFBFC0]" : ""
                    }`}
                    style={{ borderBottomColor: LINE }}
                  >
                    <span
                      className={`font-mono text-[11px] uppercase tracking-[0.22em] text-[#AFBFC0] ${
                        isActive ? "" : "lg:text-white/25"
                      }`}
                    >
                      Step {s.n}
                    </span>
                    <h3
                      className={`mt-3 text-[clamp(1.5rem,2.5vw,2.05rem)] font-bold leading-[1.08] tracking-[-0.02em] text-[#f3eee4] ${
                        isActive ? "" : "lg:text-white/25"
                      }`}
                    >
                      {s.title}
                    </h3>
                    <div>
                      <div className="space-y-3 pt-4">
                        {s.body.map((p, j) => (
                          <p
                            key={j}
                            className={`text-[14px] leading-[1.62] text-white/50 transition-colors duration-500 ${
                              isActive ? "" : "lg:text-white/[0.16]"
                            }`}
                          >
                            {p}
                          </p>
                        ))}
                      </div>
                      <div className="mt-6 lg:hidden">
                        <StatPanel panel={PANELS[i]} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative hidden lg:flex lg:items-center">
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-br-2xl">
                <CodeRain />
              </div>
              <div className="relative w-full px-10 py-12 xl:px-14">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <StatPanel panel={PANELS[active]} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
