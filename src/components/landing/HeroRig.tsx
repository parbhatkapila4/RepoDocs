"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { DemoVideoModal } from "./hero/DemoVideoModal";
import { LoadingButton } from "@/components/LoadingButton";

const DEMO_VIDEO_URL: string =
  "https://lcbcrithcxdbqynfmtxk.supabase.co/storage/v1/object/public/Videos/Loom-Repodoc-1.mp4";
const RED = "#AFBFC0";
const INK = "#180b06";
const CHAMFER =
  "polygon(0 0, 100% 0, 100% 100%, 13px 100%, 0 calc(100% - 13px))";
const NOISE_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 320 320' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
const MARQUEE = [
  "Any GitHub repo",
  "Indexed in ~30s",
  "Line-level citations",
  "Public + private",
  "Architecture maps",
  "Plain-English answers",
  "Docs that stay true",
];

function HeroBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute -left-[7%] top-1/2 w-[clamp(20rem,40vw,44rem)] -translate-y-1/2 text-black opacity-[0.05]">
        <svg viewBox="0 0 200 200" fill="none" className="h-auto w-full">
          <rect
            x="22"
            y="22"
            width="156"
            height="156"
            rx="38"
            stroke="currentColor"
            strokeWidth="13"
          />
          <rect
            x="58"
            y="68"
            width="86"
            height="13"
            rx="6.5"
            fill="currentColor"
          />
          <rect
            x="58"
            y="100"
            width="62"
            height="13"
            rx="6.5"
            fill="currentColor"
          />
          <rect
            x="58"
            y="132"
            width="78"
            height="13"
            rx="6.5"
            fill="currentColor"
          />
        </svg>
      </div>

      <span
        aria-hidden
        className="absolute -top-[3.5vw] right-[-3%] select-none whitespace-nowrap font-black leading-none tracking-[-0.04em] text-[clamp(9rem,26vw,24rem)] text-black/[0.06]"
      >
        RepoDoc
      </span>

      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 110% 60% at 50% -10%, rgba(255,150,100,0.12), transparent 60%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{ backgroundImage: NOISE_URL }}
      />
    </div>
  );
}

export default function HeroRig() {
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
    <section
      className="relative isolate flex min-h-[92vh] flex-col overflow-hidden"
      style={{ backgroundColor: RED }}
    >
      <HeroBackdrop />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pt-32 pb-16 lg:pt-36">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-[clamp(2.6rem,6.8vw,5rem)] font-black leading-[0.95] tracking-[-0.035em]"
          style={{ color: INK }}
        >
          Understand any codebase.
          <br />
          No grep. No guesswork.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-md text-[15px] font-medium leading-[1.5]"
          style={{ color: "rgba(24,11,6,0.72)" }}
        >
          A coding agent&apos;s worth of context for any GitHub repo. Indexed
          locally, mapped end to end, every answer cited to the exact line.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap items-center gap-3.5"
        >
          <LoadingButton
            type="button"
            onClick={onGetStarted}
            loading={navigating}
            style={{ backgroundColor: INK, clipPath: CHAMFER }}
            className="px-6 py-3 font-mono text-[13px] font-medium tracking-wide text-[#fdeee8] transition-all hover:brightness-150"
          >
            Connect a repo
          </LoadingButton>
          <button
            type="button"
            onClick={() => setVideoOpen(true)}
            disabled={!hasVideo}
            style={{ clipPath: CHAMFER }}
            className="border border-[#180b06]/40 px-6 py-3 font-mono text-[13px] tracking-wide text-[#180b06] transition-colors enabled:hover:bg-[#180b06]/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Watch the product walkthrough"
            title={hasVideo ? undefined : "Demo video coming soon"}
          >
            Watch the demo
          </button>
        </motion.div>
      </div>
      <div className="relative z-10 overflow-hidden border-t border-[#180b06]/15 py-4">
        <motion.div
          className="flex w-max items-center"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
        >
          {[...MARQUEE, ...MARQUEE].map((f, i) => (
            <span key={i} className="flex items-center">
              <span
                aria-hidden
                className="mx-7 h-1 w-1 rounded-full"
                style={{ backgroundColor: "rgba(24,11,6,0.35)" }}
              />
              <span className="whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#180b06]/70">
                {f}
              </span>
            </span>
          ))}
        </motion.div>
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
