"use client";

import React from "react";
import Link from "next/link";
import { motion, type Variants } from "motion/react";

const MotionLink = motion.create(Link);

const SPRING = { type: "spring", stiffness: 300, damping: 18 } as const;

const TONES = {
  mist: "bg-[#F1F0E0] text-[#121212] border-[#F1F0E0] group-hover:bg-[#121212] group-hover:text-[#F1F0E0] group-hover:border-[#F1F0E0]/10 group-focus-visible:bg-[#121212] group-focus-visible:text-[#F1F0E0] group-focus-visible:border-[#F1F0E0]/10",
  space:
    "bg-[#121212] text-[#F1F0E0] border-[#F1F0E0]/10 group-hover:bg-[#F1F0E0] group-hover:text-[#121212] group-hover:border-[#121212]/10 group-focus-visible:bg-[#F1F0E0] group-focus-visible:text-[#121212] group-focus-visible:border-[#121212]/10",
} as const;

const FOCUS =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#F1F0E0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]";

function letterVariants(
  index: number,
  count: number,
  isSpace: boolean,
  duplicate: boolean,
): Variants {
  const out = isSpace ? 0 : 0.02 * (count - 1 - index);
  const back = isSpace ? 0 : 0.02 * index;
  return {
    initial: {
      opacity: duplicate ? 0 : 1,
      x: duplicate ? -10 : 0,
      transition: {
        ...SPRING,
        delay: duplicate ? back : back + 0.3,
        opacity: { duration: 0.1, delay: duplicate ? back + 0.1 : back + 0.3 },
      },
    },
    hover: {
      opacity: duplicate ? 1 : 0,
      x: duplicate ? 0 : 10,
      transition: {
        ...SPRING,
        delay: duplicate ? out + 0.3 : out,
        opacity: { duration: 0.2, delay: duplicate ? out + 0.3 : out },
      },
    },
  };
}

function Letters({ label, duplicate }: { label: string; duplicate: boolean }) {
  const chars = label.split("");
  return (
    <>
      {chars.map((ch, i) => {
        const isSpace = ch === " ";
        return (
          <motion.span
            key={`${ch}-${i}-${duplicate ? "d" : "c"}`}
            variants={letterVariants(i, chars.length, isSpace, duplicate)}
            className={`inline-block ${isSpace ? "whitespace-pre" : ""}`}
          >
            {ch}
          </motion.span>
        );
      })}
    </>
  );
}

function Face({
  label,
  tone,
  busy,
}: {
  label: string;
  tone: Tone;
  busy: boolean;
}) {
  return (
    <span
      className={`inline-block select-none whitespace-nowrap rounded border px-4 pb-[11.5px] pt-[11.5px] font-body text-[clamp(0.75rem,0.1875rem+1.171875vw,0.9375rem)] font-normal leading-[1] transition-colors delay-200 duration-[400ms] md:pb-[13px] ${TONES[tone]} ${
        busy ? "opacity-70" : ""
      }`}
    >
      <span className="pointer-events-none relative" aria-hidden>
        <Letters label={label} duplicate={false} />
        <span className="absolute inset-0 top-[0.1em]">
          <Letters label={label} duplicate />
        </span>
      </span>
    </span>
  );
}

type Tone = keyof typeof TONES;

interface HeroButtonProps {
  label: string;
  tone: Tone;
  href?: string;
  onClick?: () => void;
  busy?: boolean;
  className?: string;
}

export function HeroButton({
  label,
  tone,
  href,
  onClick,
  busy = false,
  className = "",
}: HeroButtonProps) {
  const gestures = {
    initial: "initial",
    whileHover: "hover",
    whileFocus: "hover",
    whileTap: { scale: 0.975 },
  } as const;

  if (href) {
    return (
      <MotionLink
        href={href}
        aria-label={label}
        className={`group inline-block ${FOCUS} ${className}`}
        {...gestures}
      >
        <Face label={label} tone={tone} busy={busy} />
      </MotionLink>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-busy={busy || undefined}
      className={`group inline-block cursor-pointer ${FOCUS} ${className}`}
      {...gestures}
    >
      <Face label={label} tone={tone} busy={busy} />
    </motion.button>
  );
}
