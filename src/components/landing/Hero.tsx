"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Play } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import AnswerShowcase from "./hero/AnswerShowcase";
import SystemGraph from "./SystemGraph";
import { DemoVideoModal } from "./hero/DemoVideoModal";
import { LoadingButton } from "@/components/LoadingButton";

const DEMO_VIDEO_URL = "REPLACE_WITH_SUPABASE_VIDEO_URL";

const TRUSTED = [
  "vercel/next.js",
  "prisma/prisma",
  "shadcn/ui",
  "clerk/javascript",
  "langchain-ai/langchain",
  "xyflow/xyflow",
];

export default function Hero() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [videoOpen, setVideoOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const hasVideo =
    DEMO_VIDEO_URL && DEMO_VIDEO_URL !== "REPLACE_WITH_SUPABASE_VIDEO_URL";

  const onGetStarted = () => {
    if (navigating) return;
    setNavigating(true);
    router.push(isSignedIn ? "/create" : "/sign-in");
  };

  return (
    <section className="relative isolate overflow-hidden bg-[#040406]">
      <SystemGraph className="-z-20" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh]"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(245,158,11,0.04), transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-5xl px-6 pt-28 pb-20 lg:pt-36 lg:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/45"
          >
            <span className="h-1 w-1 rounded-full bg-amber-400" />
            an interface for software systems
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mt-7 text-[clamp(2rem,4.4vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white"
          >
            Understand the system.
            <br />
            <span className="text-white/45">Not just the code.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mx-auto mt-6 max-w-xl text-[15px] leading-[1.6] text-white/55"
          >
            You joined a new codebase three weeks ago. You&apos;re still
            grepping. RepoDoc indexes every file, traces the relationships
            between modules, and turns the codebase into something you can
            interrogate. Every answer cites the exact line it came from.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-9 flex items-center justify-center gap-4"
          >
            <LoadingButton
              type="button"
              onClick={onGetStarted}
              loading={navigating}
              className="group rounded-md bg-white px-4 py-2 text-[13px] font-medium text-black transition-all hover:bg-white/95 hover:shadow-[0_8px_30px_-8px_rgba(255,255,255,0.3)]"
            >
              Connect a repo
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </LoadingButton>
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              disabled={!hasVideo}
              className="group/demo inline-flex items-center gap-1.5 px-1 py-2 text-[13px] text-white/55 transition-colors enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Watch the product walkthrough"
              title={hasVideo ? undefined : "Demo video coming soon"}
            >
              <Play className="h-3 w-3 fill-white/40 text-white/40 transition-colors group-enabled/demo:group-hover/demo:fill-white group-enabled/demo:group-hover/demo:text-white" />
              Watch the demo
              <ArrowRight className="h-3 w-3 text-white/30" />
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 lg:mt-20"
        >
          <AnswerShowcase />
        </motion.div>
      </div>

      <div className="relative">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="text-center font-mono text-[10px] uppercase tracking-[0.22em] text-white/28">
            built with
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-9 gap-y-3">
            {TRUSTED.map((r) => (
              <span
                key={r}
                className="font-mono text-[12px] text-white/35 transition-colors hover:text-white/60"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      {hasVideo && (
        <DemoVideoModal
          open={videoOpen}
          onClose={() => setVideoOpen(false)}
          src={DEMO_VIDEO_URL}
        />
      )}
    </section>
  );
}
