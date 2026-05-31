"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

import { RigEyebrow, STAGE, RED } from "./shared";

const GREEN = "#22c55e";
const PAPER = "#f3eee4";
const LINE = "rgba(243,238,228,0.14)";

const LEFT = [
  { title: "RAG pipeline", desc: "Retrieval over your indexed source" },
  { title: "pgvector", desc: "Embeddings stored and searched fast" },
  { title: "Architecture graph", desc: "Repo-wide relationship mapping" },
];
const RIGHT = [
  { title: "Gemini summaries", desc: "Every file distilled to its intent" },
  { title: "Line-level citations", desc: "Proof attached to every answer" },
  { title: "Command palette", desc: "⌘K to jump anywhere, instantly" },
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
      <div className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: PAPER }}>
        {title}
      </div>
      <div className="mt-1 text-[11px] leading-snug text-white/30">{desc}</div>
    </div>
  );
  const line = <span className="h-px flex-1" style={{ backgroundColor: LINE }} />;
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

const OUTPUT_COUNT = 6;
const TYPING = 'ask "where is auth handled?"';

function outputLine(i: number) {
  switch (i) {
    case 0:
      return (
        <>
          <span style={{ color: RED }}>λ </span>
          <span className="text-white/90">repodoc index github.com/vercel/next.js</span>
        </>
      );
    case 1:
      return <span className="text-white/40">&gt; cloning default branch…</span>;
    case 2:
      return <span className="text-white/40">&gt; 4,812 files · 92,140 symbols</span>;
    case 3:
      return <span className="text-white/40">&gt; embedding into pgvector</span>;
    case 4:
      return (
        <span className="text-white/40">
          &gt; architecture graph resolved <span style={{ color: GREEN }}>OK</span>
        </span>
      );
    default:
      return (
        <>
          <span style={{ color: GREEN }}>✓ </span>
          <span className="text-white/75">Ready.</span>
          <span className="text-white/35">
            {" "}Cited: <span style={{ color: GREEN }}>ON</span> · Grounded:{" "}
            <span style={{ color: GREEN }}>ON</span>
          </span>
        </>
      );
  }
}

function Monitor() {
  const [shown, setShown] = useState(0);
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    let active = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (fn: () => void, ms: number) =>
      timers.push(
        setTimeout(() => {
          if (active) fn();
        }, ms)
      );
    const run = () => {
      setShown(0);
      setTyped(0);
      let t = 500;
      for (let i = 1; i <= OUTPUT_COUNT; i++) {
        const n = i;
        at(() => setShown(n), t);
        t += 480;
      }
      t += 320;
      for (let c = 1; c <= TYPING.length; c++) {
        const n = c;
        at(() => setTyped(n), t);
        t += 55;
      }
      t += 2600;
      at(run, t);
    };
    run();
    return () => {
      active = false;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      className="relative w-full max-w-[560px] shrink-0 rounded-2xl border border-white/[0.08] p-3.5 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]"
      style={{ backgroundColor: "#100e10" }}
    >
      <div className="mb-2.5 flex justify-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="h-0.5 w-7 rounded-full bg-white/[0.06]" />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.07]" style={{ backgroundColor: "#08070a" }}>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">
            repodoc://index · live
          </span>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: RED }} />
        </div>

        <div className="space-y-1.5 px-5 py-5 font-mono text-[12.5px] leading-[1.55]">
          {Array.from({ length: OUTPUT_COUNT }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: i < shown ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className={i === 5 ? "pt-1" : undefined}
            >
              {outputLine(i)}
            </motion.div>
          ))}
          <motion.div
            animate={{ opacity: shown >= OUTPUT_COUNT ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="pt-1"
          >
            <span style={{ color: RED }}>λ </span>
            <span className="text-white/90">{TYPING.slice(0, typed)}</span>
            <span className="ml-0.5 inline-block h-3.5 w-2 translate-y-0.5 animate-pulse bg-white/70" />
          </motion.div>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 pt-3 font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">
        <span>RAG engine</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full" style={{ backgroundColor: RED }} />
          <span style={{ color: RED }}>pgvector</span>
        </span>
        <span>grounded</span>
      </div>
    </div>
  );
}

export default function RigEngineered() {
  return (
    <section className="relative mt-16 overflow-hidden lg:mt-24" style={{ backgroundColor: STAGE }}>
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
              <div key={a.title} className="p-5" style={{ backgroundColor: STAGE }}>
                <div className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: PAPER }}>
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
