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
} from "./shared";
function IconGrep() {
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
        <circle cx="10.5" cy="10.5" r="6.5" />
        <line x1="15.3" y1="15.3" x2="20.5" y2="20.5" />
        <line x1="7.4" y1="8.4" x2="13.6" y2="8.4" opacity="0.7" />
        <line x1="7.4" y1="10.9" x2="11.6" y2="10.9" opacity="0.7" />
        <line x1="7.4" y1="13.4" x2="13.6" y2="13.4" opacity="0.7" />
      </g>
    </svg>
  );
}

function IconStaleDoc() {
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
        <path d="M13.5 3H6.4A1.4 1.4 0 0 0 5 4.4v15.2A1.4 1.4 0 0 0 6.4 21H11" />
        <path d="M13.5 3 18.5 8v3.2" />
        <path d="M13.5 3v5h5" />
        <line x1="8" y1="11.4" x2="11.6" y2="11.4" opacity="0.7" />
        <circle cx="16.6" cy="16.6" r="4.4" />
        <path d="M16.6 14.4v2.3l1.6 1" />
      </g>
    </svg>
  );
}

function IconTribal() {
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
        <circle cx="8" cy="7.6" r="3.1" />
        <path d="M2.8 19.4v-1.1A4.9 4.9 0 0 1 7.7 13.4h.6a4.9 4.9 0 0 1 4.9 4.9v1.1" />
        <circle cx="17.2" cy="9.6" r="2.5" strokeDasharray="2.4 2.4" />
        <path
          d="M13.8 19.4v-.8a3.6 3.6 0 0 1 3.6-3.6h.2a3.6 3.6 0 0 1 3.6 3.6v.8"
          strokeDasharray="2.4 2.4"
        />
      </g>
    </svg>
  );
}

function IconUngrounded() {
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
        <path d="M4 5.4A1.4 1.4 0 0 1 5.4 4h13.2A1.4 1.4 0 0 1 20 5.4v8.2a1.4 1.4 0 0 1-1.4 1.4H10l-3.8 3.1V15H5.4A1.4 1.4 0 0 1 4 13.6Z" />
        <path d="M10.1 8.1a1.9 1.9 0 1 1 2.5 1.8c-.5.2-.8.6-.8 1.1v.3" />
        <line x1="11.8" y1="12.8" x2="11.8" y2="12.9" strokeWidth="2.3" />
        <g opacity="0.55">
          <line x1="3.5" y1="21.2" x2="6" y2="21.2" />
          <line x1="9" y1="21.2" x2="11.5" y2="21.2" />
          <line x1="14.5" y1="21.2" x2="17" y2="21.2" />
          <line x1="20" y1="21.2" x2="21" y2="21.2" />
        </g>
      </g>
    </svg>
  );
}

const CARDS = [
  {
    n: "001",
    title: "You can't grep for a concept",
    body: "Search matches strings, not intent. Asking where rate limits are configured only works if the code happens to use those words, so you open file after file hoping to recognize the one that matters.",
    Icon: IconGrep,
  },
  {
    n: "002",
    title: "The docs describe a repo that moved on",
    body: "A README rots from the day it is written and nothing tells you how far it has drifted. The only honest account of the system is the source itself, and reading all of it was never a plan.",
    Icon: IconStaleDoc,
  },
  {
    n: "003",
    title: "The why lives in someone's head",
    body: "Only two senior engineers know how the pieces fit and why each call was made. The rest is in a chat thread nobody can find. When they are busy, everyone else is blocked.",
    Icon: IconTribal,
  },
  {
    n: "004",
    title: "Confident AI that never read your code",
    body: "An assistant that has not seen your repo invents APIs and asserts them in the same tone as the truth. No files come back with the answer, so there is no way to tell the two apart.",
    Icon: IconUngrounded,
  },
];

export default function Problem() {
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
          <div className="flex max-w-3xl flex-col gap-8">
            <h2
              className="font-display text-[clamp(2.25rem,3.05vw,2.75rem)] font-medium leading-[1.12] tracking-[-0.012em]"
              style={{ color: PAPER }}
            >
              You&apos;re shipping in code you don&apos;t understand.
            </h2>
            <p className="font-grotesk text-[18px] font-light leading-[1.28] text-white/70 lg:text-[21px]">
              Every repo you didn&apos;t write is a wall of decisions made
              without you, and almost none of them are written down. You read
              until you run out of time, then ship on a guess.
            </p>
          </div>

          <div className="flex flex-col">
            <h3 className="px-3 pb-1 font-grotesk text-[12px] font-medium uppercase tracking-[0.02em] text-white/55">
              What it costs you
            </h3>
            <div className="relative w-full p-3">
              <PixelFrame dissolve={RED} />
              <ul
                className="relative grid grid-cols-1 gap-x-8 gap-y-7 p-4 sm:p-6 lg:grid-cols-2 lg:p-8"
                style={{ backgroundColor: PANEL, backgroundImage: SCANLINES }}
              >
                {CARDS.map((c) => (
                  <li key={c.n} className="flex gap-4">
                    <PixelTile>
                      <c.Icon />
                    </PixelTile>
                    <div className="flex min-w-0 max-w-[34rem] flex-col gap-0.5 pt-0.5 lg:max-w-none">
                      <h4
                        className="font-grotesk text-[14px] font-bold uppercase leading-[1.25] tracking-[0.02em]"
                        style={{ color: PAPER }}
                      >
                        {c.title}
                      </h4>
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
