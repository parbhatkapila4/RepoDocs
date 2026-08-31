"use client";

import React from "react";
import { motion } from "motion/react";

import {
  STAGE,
  RED,
  PAPER,
  PANEL,
  TILE,
  SCANLINES,
  PixelFrame,
  PixelRule,
  PixelTile,
  PixelBadge,
  TILE_SHADOW,
} from "./shared";

function IconIndexPass() {
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
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9L20 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5Z" />
        <path d="M14.5 4v5.5H20" />
        <line x1="7.5" y1="13" x2="14" y2="13" opacity="0.7" />
        <line x1="7.5" y1="16.2" x2="11.5" y2="16.2" opacity="0.7" />
      </g>
    </svg>
  );
}

function IconMapPass() {
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
        <rect x="3" y="9.5" width="6" height="5" />
        <rect x="15" y="4" width="6" height="5" />
        <rect x="15" y="15" width="6" height="5" />
        <path d="M9 11.6h3v-5h3" opacity="0.7" />
        <path d="M9 12.4h3v5h3" opacity="0.7" />
      </g>
    </svg>
  );
}

function IconCitePass() {
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
        <path d="M4 5.4A1.4 1.4 0 0 1 5.4 4h13.2A1.4 1.4 0 0 1 20 5.4v7.2a1.4 1.4 0 0 1-1.4 1.4H10l-3.6 2.9V14H5.4A1.4 1.4 0 0 1 4 12.6Z" />
        <line x1="7.5" y1="7.6" x2="14.5" y2="7.6" opacity="0.7" />
        <line x1="7.5" y1="10.4" x2="12" y2="10.4" opacity="0.7" />
        <path d="M8 20.5h8" />
        <path d="M10 17.6v2.9M14 17.6v2.9" opacity="0.7" />
      </g>
    </svg>
  );
}

interface Fact {
  k: string;
  v: string;
  lit?: boolean;
}

interface Step {
  n: string;
  title: string;
  body: string;
  factTitle: string;
  facts: Fact[];
  Icon: () => React.JSX.Element;
}

const STEPS: Step[] = [
  {
    n: "01",
    title: "Pin the repo to one commit, then read all of it",
    body: "The repo arrives as a single tarball pinned to one commit, so every summary and every vector in the index describes the same snapshot rather than a branch that keeps moving underneath it. A run that gets interrupted picks up at the file it stopped on instead of starting the repo over.",
    factTitle: "What the walker takes in",
    facts: [
      { k: "source", v: "tarball at one commit", lit: true },
      { k: "skipped", v: "lockfiles, .git, node_modules" },
      { k: "per file", v: "summary, then embedding" },
      { k: "interrupted", v: "resumes at the last file" },
    ],
    Icon: IconIndexPass,
  },
  {
    n: "02",
    title: "Resolve every import against what was indexed",
    body: "The nodes on the map are the files that were actually read, and an edge only lands when an import resolves to another one of them. That makes it a picture of what RepoDoc has seen rather than a claim about the repo, and an import it cannot resolve stays a visible gap instead of a guessed line.",
    factTitle: "Where the edges come from",
    facts: [
      { k: "nodes", v: "files actually indexed", lit: true },
      { k: "edges", v: "import and require" },
      { k: "relative paths", v: "resolved" },
      { k: "aliased paths", v: "not yet" },
    ],
    Icon: IconMapPass,
  },
  {
    n: "03",
    title: "Hand back the context the answer was built from",
    body: "The context for a question is bounded, and it is listed. The files retrieval pulled are the files you get back, so an answer you doubt can be checked against the same sources the model saw. Citations are whole files rather than lines, because whole files are the unit retrieval works in.",
    factTitle: "Context assembled per question",
    facts: [
      { k: "code files", v: "top 5", lit: true },
      { k: "repo memory", v: "top 3" },
      { k: "on conflict", v: "code wins" },
      { k: "citations", v: "whole files" },
    ],
    Icon: IconCitePass,
  },
];

function FactBlock({ title, facts }: { title: string; facts: Fact[] }) {
  return (
    <dl
      className="flex flex-col self-start"
      style={{ backgroundColor: TILE, boxShadow: TILE_SHADOW }}
    >
      <div className="px-4 pt-3">
        <span className="font-grotesk text-[9.5px] uppercase tracking-[0.1em] text-white/50">
          {title}
        </span>
      </div>
      <div className="px-4">
        <PixelRule />
      </div>
      <div className="flex flex-col px-4 pb-3">
        {facts.map((f) => (
          <div
            key={f.k}
            className="flex items-baseline justify-between gap-4 py-1.5"
          >
            <dt className="font-grotesk text-[9.5px] uppercase tracking-[0.1em] text-white/50">
              {f.k}
            </dt>
            <dd
              className="text-right font-mono text-[11px]"
              style={{ color: f.lit ? RED : "rgba(243,238,228,0.75)" }}
            >
              {f.v}
            </dd>
          </div>
        ))}
      </div>
    </dl>
  );
}

export default function Approach() {
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
              <PixelBadge>Our approach</PixelBadge>
            </div>
            <h2
              className="pb-2 font-display text-[clamp(2.25rem,3.05vw,2.75rem)] font-medium leading-[1.12] tracking-[-0.012em]"
              style={{ color: PAPER }}
            >
              Index it, map it, then cite it.
            </h2>
            <p className="pb-2 font-grotesk text-[18px] font-light leading-[1.28] text-white/70 lg:text-[21px]">
              Three things RepoDoc does with the same index, each doing one job.
              The settings each one runs with are listed beside it.
            </p>
          </div>

          <div className="relative w-full p-3">
            <PixelFrame />
            <div
              className="relative flex flex-col"
              style={{ backgroundColor: PANEL, backgroundImage: SCANLINES }}
            >
              {STEPS.map((s, i) => (
                <React.Fragment key={s.n}>
                  {i > 0 && (
                    <div className="px-4 sm:px-6 lg:px-8">
                      <PixelRule />
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[5fr_4fr] lg:gap-10 lg:p-8">
                    <div className="flex gap-4">
                      <PixelTile>
                        <s.Icon />
                      </PixelTile>
                      <div className="flex min-w-0 flex-col gap-1.5 pt-0.5">
                        <span
                          className="font-mono text-[10.5px] tracking-[0.14em]"
                          style={{ color: RED }}
                        >
                          {s.n}
                        </span>
                        <h3
                          className="font-grotesk text-[14px] font-bold uppercase leading-[1.25] tracking-[0.02em]"
                          style={{ color: PAPER }}
                        >
                          {s.title}
                        </h3>
                        <p className="font-grotesk text-[15px] font-light leading-[1.3] text-white/55">
                          {s.body}
                        </p>
                      </div>
                    </div>
                    <FactBlock title={s.factTitle} facts={s.facts} />
                  </div>
                </React.Fragment>
              ))}
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
