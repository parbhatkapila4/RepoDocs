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
} from "./shared";

const ICON_CLS = "h-7 w-7 sm:h-8 sm:w-8";
const STROKE = {
  stroke: "currentColor",
  strokeWidth: "1.85",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconDayOne() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={ICON_CLS} aria-hidden>
      <g {...STROKE}>
        <circle cx="12" cy="12" r="8.4" />
        <path d="M12 6.6v5.4l3.6 2.2" />
        <path d="M3.6 12a8.4 8.4 0 0 1 4-7.2" opacity="0.7" />
      </g>
    </svg>
  );
}

function IconDrift() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={ICON_CLS} aria-hidden>
      <g {...STROKE}>
        <circle cx="5.5" cy="12" r="2.4" />
        <circle cx="18.5" cy="5.5" r="2.4" />
        <circle cx="18.5" cy="18.5" r="2.4" />
        <path d="M7.9 11.1 16.2 6.6" opacity="0.7" />
        <path d="M7.9 12.9 16.2 17.4" />
      </g>
    </svg>
  );
}

function IconMemory() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={ICON_CLS} aria-hidden>
      <g {...STROKE}>
        <rect x="3.5" y="4" width="17" height="5" />
        <rect x="3.5" y="11" width="17" height="5" />
        <path d="M3.5 18h11" opacity="0.7" />
        <path d="M17.5 18.2v3.4l2-1.4 2 1.4v-3.4" />
      </g>
    </svg>
  );
}

function IconReadme() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={ICON_CLS} aria-hidden>
      <g {...STROKE}>
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9L20 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5Z" />
        <path d="M14.5 4v5.5H20" />
        <path d="m9.6 12.4.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" />
      </g>
    </svg>
  );
}

function IconPrivate() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={ICON_CLS} aria-hidden>
      <g {...STROKE}>
        <rect x="4" y="10.5" width="16" height="9.5" />
        <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
        <line x1="12" y1="14" x2="12" y2="16.6" opacity="0.7" />
      </g>
    </svg>
  );
}

function IconCeiling() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={ICON_CLS} aria-hidden>
      <g {...STROKE}>
        <line x1="3.5" y1="6.5" x2="20.5" y2="6.5" />
        <rect x="5.5" y="11" width="3.4" height="9" opacity="0.7" />
        <rect x="10.8" y="14" width="3.4" height="6" opacity="0.7" />
        <rect x="16.1" y="9" width="3.4" height="11" opacity="0.7" />
      </g>
    </svg>
  );
}

const CARDS = [
  {
    title: "Answers before the index has finished",
    body: "You do not have to wait. While the run is going, questions are answered from a live fetch of the files that orient you fastest: the README, the manifests, the framework config and the entry points.",
    Icon: IconDayOne,
  },
  {
    title: "Knows how far the repo moved",
    body: "The commit it indexed at is pinned. Ask for the changes since then and it compares that baseline against the branch head, then reports which parts of its own understanding have gone stale.",
    Icon: IconDrift,
  },
  {
    title: "Remembers what it worked out",
    body: "Durable facts, decisions and module relationships are pulled out of each exchange and embedded, then fed back into later questions about the same repo. Where memory and code disagree, the code wins.",
    Icon: IconMemory,
  },
  {
    title: "Writes the README from the code",
    body: "Generated from the per-file summaries, not copied from the README already sitting there. Re-index when the repo has moved on, then regenerate.",
    Icon: IconReadme,
  },
  {
    title: "Takes private repos, not just public ones",
    body: "Paste a URL. If the repo is private, add a token and it is encrypted before it is stored. Indexing then runs as a background job with progress you can watch.",
    Icon: IconPrivate,
  },
  {
    title: "Stops at the ceiling you set",
    body: "Every project can carry an optional cost limit, summed from the token counts each answer records and priced at list rates. It is checked before every question and every diff analysis.",
    Icon: IconCeiling,
  },
];

export default function Capabilities() {
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
              <PixelBadge>Capabilities</PixelBadge>
            </div>
            <h2
              className="pb-2 font-display text-[clamp(2.25rem,3.05vw,2.75rem)] font-medium leading-[1.12] tracking-[-0.012em]"
              style={{ color: PAPER }}
            >
              The index does not stop at answers.
            </h2>
            <p className="pb-2 font-grotesk text-[18px] font-light leading-[1.28] text-white/70 lg:text-[21px]">
              Reading the repo is the expensive part and it happens once. Most
              of what follows is what that pass buys, and the rest is what
              happens while it is still running.
            </p>
          </div>

          <div className="relative w-full p-3">
            <PixelFrame dissolve={RED} />
            <div
              className="relative flex flex-col"
              style={{ backgroundColor: PANEL, backgroundImage: SCANLINES }}
            >
              <ul className="grid grid-cols-1 gap-x-8 gap-y-7 p-4 sm:p-6 lg:grid-cols-3 lg:p-8">
                {CARDS.map((c) => (
                  <li key={c.title} className="flex gap-4">
                    <PixelTile>
                      <c.Icon />
                    </PixelTile>
                    <div className="flex min-w-0 max-w-[34rem] flex-col gap-0.5 pt-0.5 lg:max-w-none">
                      <h3
                        className="font-grotesk text-[14px] font-bold uppercase leading-[1.25] tracking-[0.02em]"
                        style={{ color: PAPER }}
                      >
                        {c.title}
                      </h3>
                      <p className="font-grotesk text-[15px] font-light leading-[1.3] text-white/55">
                        {c.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
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
