"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { STAGE, RED, SCANLINES } from "./shared";

const WHITE = "#FFFFFF";

const INK = STAGE;
const INK_MUTED = "rgba(4,4,6,0.52)";
const ROW_LINE = "1px solid rgba(4,4,6,0.13)";
const OPEN_BG = "rgba(4,4,6,0.035)";

interface Faq {
  q: string;
  a: string;
}

const FAQS: Faq[] = [
  {
    q: "What does RepoDoc do with a repository?",
    a: "It reads the whole thing once. The repo arrives as a tarball pinned to a single commit, every file gets a summary and an embedding, and everything after that - the answers, the architecture map, the README - is built from that one index rather than from a fresh crawl each time you ask.",
  },
  {
    q: "Do I have to wait for the index to finish?",
    a: "No. While the run is going, questions are answered from a live fetch of the files that orient you fastest: the README, the manifests, the framework config and the entry points. The full index takes over on its own once the pass completes.",
  },
  {
    q: "Does it work on private repositories?",
    a: "Yes. Paste the URL and add a GitHub token on the project. The token is encrypted before it is stored, and indexing then runs as a background job with progress you can watch.",
  },
  {
    q: "Which branch does it index?",
    a: "The repository's default branch, pinned to the commit that was its head when the run started. Indexing a second branch means creating a second project, which is why a project is one repository pinned to one branch.",
  },
  {
    q: "How do I know an answer was not invented?",
    a: "Every answer comes back with the files it was built from, so the sources the model saw are the sources you can check. Citations are whole files rather than lines, because whole files are the unit retrieval works in.",
  },
  {
    q: "What counts as a project?",
    a: "One connected GitHub repository. The limit is checked when you create a project, so hitting it stops the next one from being made and never touches the ones you already have.",
  },
  {
    q: "What do I get without paying?",
    a: "Starter is permanently free: up to 3 projects, the dashboard and analytics, and a README and docs preview built from repository metadata. Indexing, chat and the architecture map read your actual source, and those start on Professional.",
  },
];
const DISSOLVE = [
  "1111111111",
  "0011110110",
  "1101000100",
  "1110101100",
  "0011100000",
  "1111000000",
];

const ACCENT = { left: { row: 0, col: 2 }, right: { row: 2, col: 3 } };

function Dissolve({ flip = false }: { flip?: boolean }) {
  const { row: accentRow, col: accentCol } = flip ? ACCENT.right : ACCENT.left;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute top-16 hidden select-none xl:block ${
        flip ? "right-0" : "left-0"
      }`}
    >
      {DISSOLVE.map((row, r) => (
        <div key={r} className={`flex ${flip ? "flex-row-reverse" : ""}`}>
          {row.split("").map((cell, c) => (
            <span
              key={c}
              className="block h-7 w-7 2xl:h-9 2xl:w-9"
              style={{
                backgroundColor:
                  cell === "0"
                    ? "transparent"
                    : r === accentRow && c === accentCol
                      ? RED
                      : WHITE,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function PlusMinus({ open }: { open: boolean }) {
  return (
    <span aria-hidden className="relative block h-3.5 w-3.5 shrink-0">
      <span
        className="absolute left-0 top-1/2 h-px w-full"
        style={{ backgroundColor: INK, transform: "translateY(-50%)" }}
      />
      <span
        className="absolute left-1/2 top-0 h-full w-px transition-transform duration-300 ease-out"
        style={{
          backgroundColor: INK,
          transform: `translateX(-50%) scaleY(${open ? 0 : 1})`,
        }}
      />
    </span>
  );
}

function Row({
  item,
  index,
  open,
  onToggle,
}: {
  item: Faq;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        borderTop: ROW_LINE,
        backgroundColor: open ? OPEN_BG : "transparent",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`faq-panel-${index}`}
        className="flex w-full cursor-pointer items-center justify-between gap-6 px-5 py-3.5 text-left outline-none transition-colors hover:bg-black/[0.025] focus-visible:bg-black/[0.04] sm:px-6"
        style={{ color: INK }}
      >
        <span className="font-grotesk text-[15px] font-normal leading-[1.3]">
          {item.q}
        </span>
        <PlusMinus open={open} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`faq-panel-${index}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p
              className="px-5 pb-4 font-grotesk text-[13px] font-light leading-[1.55] sm:px-6"
              style={{ color: INK_MUTED }}
            >
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative overflow-hidden scroll-mt-20"
      style={{ backgroundColor: STAGE }}
    >
      <Dissolve />
      <Dissolve flip />

      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 lg:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-[660px]"
          style={{ backgroundColor: WHITE }}
        >
          <div className="px-6 py-16 text-center">
            <h2
              className="mx-auto max-w-[20ch] font-mono text-[clamp(1.75rem,3.2vw,2.5rem)] font-medium leading-[1.16] tracking-[-0.02em]"
              style={{ color: INK }}
            >
              Frequently asked questions
            </h2>
          </div>

          <div className="flex flex-col" style={{ borderBottom: ROW_LINE }}>
            {FAQS.map((item, i) => (
              <Row
                key={item.q}
                item={item}
                index={i}
                open={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>

          <div className="h-10" />
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
