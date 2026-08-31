"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";

import { STAGE, RED, SCANLINES, PixelBadge } from "./shared";

const WHITE = "#FFFFFF";
const INK = STAGE;
const INK_SOFT = "rgba(4,4,6,0.82)";
const INK_MUTED = "rgba(4,4,6,0.55)";
const INK_FAINT = "rgba(4,4,6,0.36)";
const CARD_LINE = "1px solid rgba(4,4,6,0.14)";
const ROW_LINE = "rgba(243,238,228,0.2)";

interface Plan {
  name: string;
  tagline: string;
  price: string;
  cadence: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    tagline: "See what RepoDoc makes of a few repositories.",
    price: "$0",
    cadence: "/month",
    features: [
      "Up to 3 projects",
      "Public and private GitHub repositories",
      "Repository dashboard and analytics",
      "README and docs preview from repo metadata",
    ],
    cta: "Start free",
    href: "/sign-in",
  },
  {
    name: "Professional",
    tagline: "For developers who live inside the codebase.",
    price: "$20",
    cadence: "/month",
    features: [
      "Everything in Starter",
      "Up to 10 projects",
      "Full indexing, every file summarized and embedded",
      "Chat that hands back the files behind each answer",
      "Architecture map of every indexed file",
      "Public share links, revocable at any time",
      "Email support",
    ],
    cta: "Get Professional",
    href: "/pricing",
    featured: true,
  },
  {
    name: "Enterprise",
    tagline: "For more repositories than a seat limit allows.",
    price: "$49",
    cadence: "/month",
    features: [
      "Everything in Professional",
      "Unlimited projects",
      "Priority support and onboarding",
      "Direct line for custom work",
    ],
    cta: "Get Enterprise",
    href: "/pricing",
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className="flex h-full flex-col"
      style={{ backgroundColor: WHITE, color: INK }}
    >
      <div
        className="flex items-start justify-between gap-3 px-5 py-5"
        style={{ borderBottom: CARD_LINE }}
      >
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="font-grotesk text-[25px] font-normal leading-[1.05] tracking-[-0.02em]">
            {plan.name}
          </h3>
          <p
            className="font-grotesk text-[13px] font-light leading-[1.3]"
            style={{ color: INK_MUTED }}
          >
            {plan.tagline}
          </p>
        </div>
        {plan.featured && (
          <span
            className="shrink-0 px-1.5 py-1 font-mono text-[9px] uppercase leading-none tracking-[0.12em]"
            style={{ backgroundColor: INK, color: WHITE }}
          >
            popular
          </span>
        )}
      </div>

      <div
        className="flex items-baseline px-5 py-5"
        style={{ borderBottom: CARD_LINE }}
      >
        <span className="font-grotesk text-[32px] font-normal leading-none tracking-[-0.03em]">
          {plan.price}
        </span>
        <span
          className="font-grotesk text-[32px] font-normal leading-none tracking-[-0.03em]"
          style={{ color: INK_FAINT }}
        >
          {plan.cadence}
        </span>
      </div>

      <ul className="flex flex-1 flex-col gap-3 px-5 py-5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span
              aria-hidden
              className="mt-[5px] h-[7px] w-[7px] shrink-0"
              style={{ backgroundColor: INK }}
            />
            <span
              className="font-grotesk text-[13.5px] font-light leading-[1.35]"
              style={{ color: INK_SOFT }}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>
      <div className="p-2.5">
        <Link
          href={plan.href}
          className="flex w-full items-center justify-center px-4 py-3.5 font-grotesk text-[13.5px] font-bold leading-none transition-opacity hover:opacity-85"
          style={{ backgroundColor: INK, color: WHITE }}
        >
          {plan.cta}
        </Link>
      </div>
    </div>
  );
}

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden scroll-mt-20"
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
          <div className="flex max-w-3xl flex-col gap-6">
            <div className="mb-3">
              <PixelBadge>Pricing</PixelBadge>
            </div>
            <h2
              className="pb-2 font-display text-[clamp(2.25rem,3.05vw,2.75rem)] font-medium leading-[1.12] tracking-[-0.012em]"
              style={{ color: WHITE }}
            >
              Pay for projects, not tokens.
            </h2>
            <p className="pb-2 font-grotesk text-[18px] font-light leading-[1.28] text-white/70 lg:text-[21px]">
              Three plans, one flat price a month, nothing metered underneath. A
              project is one repository pinned to one branch, and the count is
              most of what separates the tiers.
            </p>
          </div>

          <div className="flex flex-col">
            <div
              className="h-px w-full"
              style={{ backgroundColor: ROW_LINE }}
            />
            <div className="grid grid-cols-1 gap-2.5 px-2.5 md:grid-cols-3">
              {PLANS.map((plan) => (
                <PlanCard key={plan.name} plan={plan} />
              ))}
            </div>
            <div
              className="h-px w-full"
              style={{ backgroundColor: ROW_LINE }}
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <p className="max-w-3xl font-grotesk text-[13.5px] font-light leading-[1.35] text-white/45">
              Nothing is metered per answer, and the one rate limit is the same
              on every plan: 20 requests a minute, per identity. What the tiers
              do decide is whether the index reads your source at all, which is
              what indexing, chat and the map all run on.
            </p>
            <Link
              href="/pricing"
              className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.14em] transition-opacity hover:opacity-70"
              style={{ color: RED }}
            >
              Full pricing and FAQ
            </Link>
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
