"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";

import { BATCHES, type Example } from "./examples";

const PHASE_ASK = 350; 
const PHASE_THINK = 600; 
const PHASE_ANSWER = 800; 
const PHASE_READ = 700; 
const BATCH_HOLD = 2200;
const BATCH_FADE = 400; 

type Phase = "asking" | "thinking" | "answering" | "settled";

interface State {
  loop: number;
  batch: number;
  index: number;
  phase: Phase;
}

export default function AnswerShowcase() {
  const [state, setState] = useState<State>({
    loop: 0,
    batch: 0,
    index: 0,
    phase: "asking",
  });
  const [resetting, setResetting] = useState(false);

  const batch = BATCHES[state.batch];

  useEffect(() => {
    if (resetting) return;

    let next: ReturnType<typeof setTimeout> | null = null;

    if (state.phase === "asking") {
      next = setTimeout(
        () => setState((s) => ({ ...s, phase: "thinking" })),
        PHASE_ASK
      );
    } else if (state.phase === "thinking") {
      next = setTimeout(
        () => setState((s) => ({ ...s, phase: "answering" })),
        PHASE_THINK
      );
    } else if (state.phase === "answering") {
      next = setTimeout(
        () => setState((s) => ({ ...s, phase: "settled" })),
        PHASE_ANSWER
      );
    } else {
      const isLastInBatch = state.index >= batch.examples.length - 1;
      if (isLastInBatch) {
        next = setTimeout(() => setResetting(true), BATCH_HOLD);
      } else {
        next = setTimeout(
          () =>
            setState((s) => ({ ...s, index: s.index + 1, phase: "asking" })),
          PHASE_READ
        );
      }
    }

    return () => {
      if (next) clearTimeout(next);
    };
  }, [state.phase, state.index, state.batch, resetting, batch.examples.length]);

  useEffect(() => {
    if (!resetting) return;
    const t = setTimeout(() => {
      setState((s) => ({
        loop: s.loop + 1,
        batch: (s.batch + 1) % BATCHES.length,
        index: 0,
        phase: "asking",
      }));
      setResetting(false);
    }, BATCH_FADE);
    return () => clearTimeout(t);
  }, [resetting]);

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-12 -bottom-16 -top-2 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 55% 65% at 50% 80%, rgba(0,0,0,0.6), transparent 70%)",
        }}
      />

      <article
        aria-label="Live RepoDoc transcript"
        className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#08080b] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7),0_60px_140px_-40px_rgba(0,0,0,0.5)]"
      >
        <Header batchLabel={batch.label} batchIndex={state.batch} />
        <Transcript state={state} resetting={resetting} />
        <Footer
          example={batch.examples[Math.min(state.index, batch.examples.length - 1)]}
          showMeta={state.phase === "answering" || state.phase === "settled"}
        />
      </article>
    </div>
  );
}

function Header({
  batchLabel,
  batchIndex,
}: {
  batchLabel: string;
  batchIndex: number;
}) {
  return (
    <header className="flex items-center justify-between border-b border-white/[0.05] px-7 py-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/55" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/55">
          live · session
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={batchIndex}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.25 }}
            className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-amber-200/70"
          >
            · {batchLabel}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2">
        {BATCHES.map((_, i) => (
          <span
            key={i}
            className={[
              "h-1 w-5 rounded-full transition-colors",
              i === batchIndex
                ? "bg-amber-400/55"
                : i < batchIndex
                  ? "bg-white/15"
                  : "bg-white/[0.06]",
            ].join(" ")}
          />
        ))}
      </div>
    </header>
  );
}

function Transcript({
  state,
  resetting,
}: {
  state: State;
  resetting: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const batch = BATCHES[state.batch];

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [state.index, state.phase, state.batch]);

  const visible = batch.examples.slice(0, state.index + 1);

  return (
    <div
      ref={scrollRef}
      className="relative h-[420px] overflow-y-auto px-7 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <AnimatePresence>
        {!resetting &&
          visible.map((ex, i) => {
            const isCurrent = i === state.index;
            const phase: Phase = isCurrent ? state.phase : "settled";
            return (
              <Exchange
                key={`${state.loop}-${state.batch}-${ex.id}`}
                example={ex}
                phase={phase}
                isLast={i === visible.length - 1}
              />
            );
          })}
      </AnimatePresence>

      <AnimatePresence>
        {resetting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-[#08080b]"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Exchange({
  example,
  phase,
  isLast,
}: {
  example: Example;
  phase: Phase;
  isLast: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`grid gap-y-4 ${isLast ? "" : "mb-6 border-b border-white/[0.04] pb-6"}`}
    >
      <div className="grid grid-cols-[64px_minmax(0,1fr)] items-baseline gap-x-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
          you
        </span>
        <p className="text-[14.5px] leading-snug text-white/90">
          {example.question}
        </p>
      </div>

      <div className="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-x-4">
        <span className="mt-[3px] inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300/80">
          <Sparkles className="h-2.5 w-2.5 text-amber-300" />
          repodoc
        </span>
        <div className="min-h-[1.6em]">
          <AnimatePresence mode="wait" initial={false}>
            {phase === "asking" || phase === "thinking" ? (
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <ThinkingDots />
              </motion.div>
            ) : (
              <motion.p
                key="answer"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="text-[14.5px] leading-[1.65] text-white/82"
              >
                {example.answer.map((part, i) =>
                  part.kind === "cite" ? (
                    <span
                      key={i}
                      className="mx-[0.18em] inline-flex items-center rounded-sm border border-amber-400/25 bg-amber-400/[0.08] px-1.5 py-[1px] align-baseline font-mono text-[12px] text-amber-200"
                    >
                      {part.value}
                    </span>
                  ) : (
                    <span key={i}>{part.value}</span>
                  )
                )}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function Footer({
  example,
  showMeta,
}: {
  example: Example;
  showMeta: boolean;
}) {
  return (
    <div className="border-t border-white/[0.05] px-7 py-3">
      <div className="flex items-center justify-between font-mono text-[10.5px] text-white/35">
        <AnimatePresence mode="wait">
          {showMeta ? (
            <motion.span
              key={example.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-amber-200/70"
            >
              ◆ {example.meta.model}
            </motion.span>
          ) : (
            <motion.span
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/25"
            >
              ◆ thinking
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {showMeta ? (
            <motion.span
              key={`m-${example.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <span>{example.meta.tokens} tokens</span>
              <span className="text-white/15">·</span>
              <span>{example.meta.latency}</span>
            </motion.span>
          ) : (
            <span />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white/45"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.0,
            repeat: Infinity,
            delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}
