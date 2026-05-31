"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Github, Loader2, MousePointerClick, Sparkles } from "lucide-react";

import WhatChangesGraph from "./WhatChangesGraph";
import WhatChangesPreview from "./WhatChangesPreview";

const STAGES = [
  { id: "connect", label: "connect repo", icon: Github },
  { id: "index", label: "indexing", icon: Loader2 },
  { id: "map", label: "architecture map", icon: Sparkles },
  { id: "explore", label: "explore", icon: MousePointerClick },
] as const;

const STAGE_DELAY_MS = 700;

const CYCLE_ORDER = [
  "repo",
  "api",
  "ui",
  "database",
  "services",
  "auth",
] as const;
const CYCLE_MS = 3000;
const PIN_PAUSE_MS = 8000;

export default function WhatChanges() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-15%" });

  const [selectedId, setSelectedId] = useState<string>(CYCLE_ORDER[0]);
  const [paused, setPaused] = useState(false);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const tick = () => {
      i = (i + 1) % STAGES.length;
      setStage(i);
    };
    const id = setInterval(tick, STAGE_DELAY_MS);
    const stop = setTimeout(() => {
      clearInterval(id);
      setStage(STAGES.length - 1);
    }, STAGE_DELAY_MS * STAGES.length + 200);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, [inView]);

  useEffect(() => {
    if (!inView || paused) return;
    const id = setInterval(() => {
      setSelectedId((curr) => {
        const idx = CYCLE_ORDER.indexOf(curr as (typeof CYCLE_ORDER)[number]);
        const nextIdx = idx === -1 ? 0 : (idx + 1) % CYCLE_ORDER.length;
        return CYCLE_ORDER[nextIdx];
      });
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [inView, paused]);

  const onSelect = (id: string) => {
    setSelectedId(id);
    setPaused(true);
    window.setTimeout(() => setPaused(false), PIN_PAUSE_MS);
  };

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#040406]"
      aria-labelledby="what-changes-heading"
    >
      <div className="mx-auto max-w-6xl px-6 py-32">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="max-w-2xl"
        >
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-amber-300/70">
            what changes
          </span>
          <h2
            id="what-changes-heading"
            className="mt-3 text-[clamp(2rem,4.4vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white"
          >
            See the whole system in 30 seconds.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-[1.6] text-white/55">
            Connect a repository. RepoDoc walks the import graph, wires
            services to schemas to route handlers, and renders it as an
            interactive map. Click any node. Trace any edge. No digging.
          </p>
        </motion.header>

        <motion.ol
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2"
        >
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const reached = i <= stage;
            return (
              <li key={s.id} className="flex items-center gap-3">
                <div
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all",
                    reached
                      ? "border-amber-400/30 bg-amber-400/[0.06]"
                      : "border-white/[0.06] bg-white/[0.02]",
                  ].join(" ")}
                >
                  <Icon
                    className={`h-3 w-3 ${
                      reached
                        ? s.id === "index"
                          ? "animate-spin text-amber-300/80"
                          : "text-amber-300/80"
                        : "text-white/30"
                    }`}
                    style={
                      s.id === "index" && reached
                        ? { animationDuration: "2s" }
                        : undefined
                    }
                  />
                  <span
                    className={`font-mono text-[10.5px] uppercase tracking-[0.18em] ${
                      reached ? "text-amber-100/80" : "text-white/35"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <span
                    className={`block h-px w-6 transition-colors ${
                      reached ? "bg-amber-400/30" : "bg-white/[0.06]"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </motion.ol>

        <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-10">
          <div className="relative">
            <WhatChangesGraph
              selectedId={selectedId}
              onSelect={onSelect}
              inView={inView}
            />
            <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/35">
              <span className="inline-flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full ${
                      paused ? "bg-white/30" : "animate-ping bg-amber-400/55"
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                      paused ? "bg-white/55" : "bg-amber-400"
                    }`}
                  />
                </span>
                {paused ? "pinned · resuming soon" : "auto-tour · click to pin"}
              </span>
              <span className="text-white/25">
                {selectedId} <span className="text-white/15">·</span>{" "}
                {(CYCLE_ORDER.indexOf(
                  selectedId as (typeof CYCLE_ORDER)[number]
                ) +
                  1) ||
                  1}
                /{CYCLE_ORDER.length}
              </span>
            </div>
          </div>

          <WhatChangesPreview nodeId={selectedId} />
        </div>
      </div>
    </section>
  );
}
