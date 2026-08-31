"use client";

import React from "react";
import { motion, type Variants } from "motion/react";
const item: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 160, damping: 20 },
  },
};

function container(delay: number): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: delay },
    },
  };
}

interface SplitTextProps {
  text: string;
  delay?: number;
  disabled?: boolean;
  className?: string;
}

export function SplitText({
  text,
  delay = 0,
  disabled = false,
  className = "",
}: SplitTextProps) {
  if (disabled) return <span className={className}>{text}</span>;

  const words = text.split(/(\S+)/).filter((w) => w.length > 0);

  return (
    <motion.span
      initial="hidden"
      animate="visible"
      variants={container(delay)}
      className={className}
    >
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block whitespace-pre">
          {word.split("").map((ch, j) => (
            <motion.span
              key={j}
              variants={item}
              className={`inline-block whitespace-pre ${
                ch === " " ? "mr-[2px] sm:mr-2" : ""
              }`}
            >
              {ch}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.span>
  );
}
