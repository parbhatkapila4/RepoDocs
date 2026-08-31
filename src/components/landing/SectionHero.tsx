"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionTemplate,
  useTime,
  useTransform,
} from "motion/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { DemoVideoModal } from "./hero/DemoVideoModal";
import { HeroCanvas } from "./hero/HeroCanvas";
import { SplitText } from "./hero/SplitText";
import { HeroButton } from "./hero/HeroButton";
import { ChangelogCard, DemoCard } from "./hero/HeroCards";
import { CornerMark } from "./hero/CornerMark";
import { STAGE } from "./sections/shared";

const DEMO_VIDEO_URL: string =
  "https://lcbcrithcxdbqynfmtxk.supabase.co/storage/v1/object/public/Videos/Loom-Repodoc-1.mp4";

const GOLD = "#FCDF71";
const ICE = "#DDEBF4";
const TEAL = "#3ED9C4";
const STROKE = "#373633";
const GRID_DOTS =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='3' height='3'%3E%3Crect width='1' height='1' fill='%233E3E3B'/%3E%3C/svg%3E\")";

const REVEAL_MS = 2200;
const GRADIENT_MS = 3200;
const SETTLE_MS = 1000;

const HEADLINE = {
  lead: "Understand any",
  accent: "codebase.",
  tail: "No guesswork.",
};

const DESCRIPTION = (
  <>
    Connect a GitHub repository and ask it questions in plain English. Every
    file is summarized and embedded, so each answer arrives with the source
    files it was drawn from.
    <br />
    <br />
    Built for the codebase you inherited: public or private repos, indexed in
    the background, with the cost of every query tracked per project.
  </>
);

function GradientWord({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const time = useTime();
  const phase = useTransform(time, (t) => 1 - ((t / 5000) % 1));
  const first = useTransform(
    phase,
    [0, 0.33, 0.66, 1],
    [GOLD, ICE, TEAL, GOLD],
  );
  const middle = useTransform(
    phase,
    [0, 0.33, 0.66, 1],
    [ICE, TEAL, GOLD, ICE],
  );
  const last = useTransform(phase, [0, 0.33, 0.66, 1], [TEAL, GOLD, ICE, TEAL]);
  const backgroundImage = useMotionTemplate`linear-gradient(120deg, ${first} 37.5%, ${middle} 56.56%, ${last} 79.81%)`;

  return (
    <motion.span
      className={`bg-clip-text text-transparent ${className}`}
      style={{ backgroundImage, WebkitBackgroundClip: "text" }}
    >
      {text}
    </motion.span>
  );
}

export default function SectionHero() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const reduceMotion = usePrefersReducedMotion();

  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { once: false });

  const [revealed, setRevealed] = useState(false);
  const [gradientPhase, setGradientPhase] = useState(true);
  const [gradientMounted, setGradientMounted] = useState(true);
  const [videoOpen, setVideoOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const hasVideo =
    DEMO_VIDEO_URL && DEMO_VIDEO_URL !== "REPLACE_WITH_SUPABASE_VIDEO_URL";

  useEffect(() => {
    if (reduceMotion) return;
    const reveal = window.setTimeout(() => setRevealed(true), REVEAL_MS);
    const settle = window.setTimeout(
      () => setGradientPhase(false),
      GRADIENT_MS,
    );
    const unmount = window.setTimeout(
      () => setGradientMounted(false),
      GRADIENT_MS + SETTLE_MS,
    );
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(settle);
      window.clearTimeout(unmount);
    };
  }, [reduceMotion]);

  const onGetStarted = () => {
    if (navigating) return;
    setNavigating(true);
    router.push(isSignedIn ? "/create" : "/sign-in");
  };

  const shown = revealed || reduceMotion;
  const frameIn = shown ? "scale-100 opacity-100" : "scale-90 opacity-0";
  const slideIn = shown
    ? "visible translate-x-0 opacity-100"
    : "invisible -translate-x-[25%] opacity-0";
  const riseIn = shown
    ? "translate-y-0 opacity-100"
    : "translate-y-[25%] opacity-0";

  return (
    <section
      className="relative pt-16 pb-6 lg:pt-20 lg:pb-8"
      style={{ backgroundColor: STAGE }}
    >
      <div className="pt-6 lg:pt-8">
        <h1 className="sr-only">
          RepoDoc: understand any codebase. No guesswork.
        </h1>

        <div ref={frameRef} className="relative md:px-10">
          <div className="relative mx-[10px] h-[calc(100svh-112px)] min-h-[380px] origin-top-left rounded-xl px-6 pb-6 pt-8 md:h-[calc(100svh-120px)] md:max-h-[1040px] md:px-8 md:py-12 lg:h-[calc(100vh-144px)] lg:min-h-[580px]">
            <div
              className={`pointer-events-none absolute inset-[-1px] mx-[10px] overflow-hidden rounded-xl border transition-[opacity,transform] delay-[400ms] duration-500 ${frameIn}`}
              style={{ borderColor: STROKE }}
            />

            <div
              className={`absolute inset-0 mx-[10px] overflow-hidden rounded-xl transition-[opacity,transform] delay-[400ms] duration-500 ${
                shown ? "scale-100 opacity-90" : "scale-90 opacity-0"
              }`}
            >
              <HeroCanvas active={inView} still={reduceMotion} />
            </div>

            <div
              className={`pointer-events-none absolute inset-0 mx-[10px] overflow-hidden rounded-xl transition-opacity delay-500 duration-500 will-change-transform ${
                shown ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="absolute inset-x-[-2.5px] inset-y-[-1px] overflow-hidden">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage: GRID_DOTS,
                    backgroundSize: "3px 3px",
                  }}
                />
              </div>
            </div>

            <div className="flex h-full flex-col justify-between gap-y-7 min-[480px]:gap-y-12">
              <div>
                <div className="pointer-events-none relative min-w-[30px] max-w-max">
                  <div className="absolute left-0 top-[-20px]">
                    <CornerMark />
                  </div>
                  <div className="absolute right-0 top-[-20px]">
                    <CornerMark className="rotate-90" />
                  </div>
                  <div
                    className={`absolute left-0 transition-[bottom] duration-500 ${
                      shown ? "bottom-[-20px]" : "bottom-[-10px]"
                    }`}
                  >
                    <CornerMark className="-rotate-90" />
                  </div>
                  <div
                    className={`absolute right-0 transition-[bottom] duration-500 ${
                      shown ? "bottom-[-20px]" : "bottom-[-10px]"
                    }`}
                  >
                    <CornerMark className="rotate-180" />
                  </div>

                  <motion.div
                    aria-hidden
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: reduceMotion ? 0 : 0.4,
                      duration: 0.5,
                    }}
                    className="relative max-w-[300px] pb-4 pl-3 font-heading text-[clamp(1.6875rem,-6.75rem+17.578125vw,4.5rem)] font-[350] uppercase leading-[0.85] tracking-[-0.05em] [word-spacing:2px] sm:max-w-[830px] sm:pb-8 sm:pl-6 md:pr-11 md:[word-spacing:7px] xl:pl-12"
                  >
                    <span className="inline text-white">
                      <SplitText
                        text={HEADLINE.lead}
                        delay={0.4}
                        disabled={reduceMotion}
                        className="inline"
                      />
                    </span>{" "}
                    <motion.span
                      className="inline"
                      initial={reduceMotion ? false : { opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: reduceMotion ? 0 : 1,
                        duration: 0.4,
                      }}
                    >
                      <span className="relative inline-block">
                        <span
                          className={`transition-opacity duration-1000 ${
                            gradientPhase && !reduceMotion
                              ? "opacity-0"
                              : "opacity-100"
                          }`}
                          style={{ color: GOLD }}
                        >
                          {HEADLINE.accent}
                        </span>
                        {gradientMounted && !reduceMotion && (
                          <GradientWord
                            text={HEADLINE.accent}
                            className={`absolute inset-0 transition-opacity duration-1000 ${
                              gradientPhase ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        )}
                      </span>
                    </motion.span>{" "}
                    <span className="inline text-white">
                      <SplitText
                        text={HEADLINE.tail}
                        delay={0.65}
                        disabled={reduceMotion}
                        className="inline"
                      />
                    </span>
                  </motion.div>
                </div>

                <div
                  className={`relative mt-3 flex gap-[10px] pl-3 transition-[opacity,visibility] duration-500 sm:pl-6 xl:pl-12 ${
                    shown ? "visible opacity-100" : "invisible opacity-0"
                  }`}
                >
                  <HeroButton
                    tone="mist"
                    label="Connect a repo"
                    onClick={onGetStarted}
                    busy={navigating}
                    className={`transition-[transform,opacity,visibility] delay-[700ms] duration-300 ${slideIn}`}
                  />
                  <HeroButton
                    tone="space"
                    label="Read the docs"
                    href="/documentation"
                    className={`transition-[transform,opacity,visibility] delay-[500ms] duration-300 ${slideIn}`}
                  />
                </div>
              </div>

              <div
                className={`pointer-events-none max-w-[637px] flex-1 px-3 font-body text-[clamp(0.9375rem,1.953125vw,1.25rem)] leading-[1.35] tracking-[0.01em] text-white transition-[transform,opacity] delay-[750ms] duration-500 [text-shadow:0_1px_8px_rgba(0,0,0,0.8)] sm:px-6 lg:hidden ${
                  shown
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-[10%] opacity-0"
                }`}
              >
                {DESCRIPTION}
              </div>

              <div className="relative flex w-full flex-col justify-between gap-5 gap-y-12 px-2 sm:px-6 sm:pb-3 lg:flex-row lg:items-center xl:px-12">
                <div
                  className={`pointer-events-none hidden max-w-[650px] flex-1 font-body text-[clamp(0.9375rem,1.953125vw,1.25rem)] leading-[1.35] text-white transition-[transform,opacity] delay-[800ms] duration-500 [text-shadow:0_1px_8px_rgba(0,0,0,0.8)] lg:block ${riseIn}`}
                >
                  {DESCRIPTION}
                </div>

                <div className="flex flex-col gap-3">
                  <ChangelogCard revealed={shown} />
                  <DemoCard
                    revealed={shown}
                    onOpen={() => setVideoOpen(true)}
                    disabled={!hasVideo}
                  />
                </div>
              </div>
            </div>
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
