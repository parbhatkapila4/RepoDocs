"use client";

import React from "react";
import { motion } from "motion/react";

import { RigEyebrow, STAGE } from "./shared";

const PAPER = "#f3eee4";

const CAPS = [
  {
    n: "01",
    title: "Understands your architecture.",
    body: "Builds a connected model of modules, dependencies, and relationships, so answers reason across files  -  not one snippet at a time.",
  },
  {
    n: "02",
    title: "Cites the exact source.",
    body: "Every claim links to the precise lines it came from. No hallucinated APIs, no 'trust me'  -  click through and verify.",
  },
  {
    n: "03",
    title: "Generates docs that stay true.",
    body: "READMEs and module docs written from the real code, regenerated as the repo changes so they never go stale.",
  },
  {
    n: "04",
    title: "Answers in seconds.",
    body: "Ask in plain English. Retrieval pulls the right files and a grounded answer arrives before you've switched tabs.",
  },
  {
    n: "05",
    title: "Maps the whole system.",
    body: "An interactive architecture view  -  trace a request from the route handler all the way down to the database.",
  },
  {
    n: "06",
    title: "Works with any GitHub repo.",
    body: "Public or private. Paste a URL, add a token if needed, and it indexes in around thirty seconds.",
  },
];

const METRICS = [
  { label: "Indexing", value: "~30s", note: "URL to queryable" },
  { label: "Cited", value: "100%", note: "Every answer sourced" },
  { label: "Questions", value: "∞", note: "Ask all you want" },
  { label: "Repo", value: "Any", note: "Public + private" },
];

export default function RigCapabilities() {
  return (
    <section className="relative mt-16 lg:mt-24" style={{ backgroundColor: STAGE }}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <RigEyebrow glyph="◆">Capabilities</RigEyebrow>
          <h2
            className="mx-auto mt-6 max-w-3xl text-[clamp(2.2rem,5vw,4rem)] font-black leading-[1.0] tracking-[-0.04em]"
            style={{ color: PAPER }}
          >
            Your codebase, unlocked.
          </h2>
        </motion.div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.08] md:grid-cols-2 lg:grid-cols-3">
          {CAPS.map((c, i) => (
            <motion.div
              key={c.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.07 }}
              className="flex flex-col gap-3.5 p-8"
              style={{ backgroundColor: STAGE }}
            >
              <span className="font-mono text-[11px] tracking-[0.25em] text-[#AFBFC0]">
                [ {c.n} ]
              </span>
              <h3
                className="text-[18px] font-bold tracking-[-0.01em]"
                style={{ color: PAPER }}
              >
                {c.title}
              </h3>
              <p className="text-[13px] leading-[1.62] text-white/45">{c.body}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.08] lg:grid-cols-4">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className="flex flex-col gap-1.5 px-7 py-8"
              style={{ backgroundColor: STAGE }}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#AFBFC0]">
                {m.label}
              </span>
              <span
                className="text-[clamp(26px,3vw,32px)] font-medium leading-none tracking-[-0.01em]"
                style={{ color: PAPER }}
              >
                {m.value}
              </span>
              <span className="text-[11.5px] text-white/35">{m.note}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
