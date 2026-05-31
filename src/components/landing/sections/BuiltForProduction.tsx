"use client";

import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Activity, AlertTriangle, BarChart3, Shield } from "lucide-react";

const STATS = [
  { icon: BarChart3, label: "Per-request cost tracking" },
  { icon: AlertTriangle, label: "Budget guardrails + alerts" },
  { icon: Shield, label: "Model fallback strategy" },
  { icon: Activity, label: "Health status: healthy / warning / critical" },
] as const;

export default function BuiltForProduction() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-15%" });

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#040406]"
      aria-labelledby="built-for-production-heading"
    >
      <div className="mx-auto max-w-6xl px-6 py-32 lg:py-40">
        <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55 }}
            className="relative lg:pl-10"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 top-[8%] hidden h-[84%] w-px overflow-hidden lg:block"
              style={{
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(251,191,36,0.5) 22%, rgba(251,191,36,0.5) 78%, transparent 100%)",
              }}
            />

            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber-300/95">
                04
              </span>
              <span
                className="h-px w-12"
                style={{ background: "rgba(251,191,36,0.6)" }}
              />
            </div>

            <h2
              id="built-for-production-heading"
              className="mt-5 text-[clamp(1.5rem,3.4vw,2.25rem)] font-medium leading-[1.2] tracking-[-0.025em] text-white"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              Built for production,
              <br />
              <span className="text-white/40">not demos.</span>
            </h2>

            <p className="mt-5 max-w-md text-[14px] leading-[1.65] tracking-[-0.005em] text-white/62">
              Most RAG projects retrieve chunks and call an LLM. RepoDoc runs
              as infrastructure  -  every AI request tracked for tokens,
              latency, and cost. Per-project budget limits and health status
              built in. Deterministic model fallback under rate limits.
              Observable and auditable by default.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {STATS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="group relative rounded-xl border border-white/[0.08] bg-white/[0.015] px-5 py-6 transition-colors hover:border-amber-400/30 hover:bg-amber-400/[0.025]"
              >
                <Icon
                  className="h-4 w-4 text-amber-300/70 transition-colors group-hover:text-amber-300"
                  aria-hidden
                />
                <p className="mt-4 text-[14px] leading-[1.5] tracking-[-0.005em] text-white/72">
                  {label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
