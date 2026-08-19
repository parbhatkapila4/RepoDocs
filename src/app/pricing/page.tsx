"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { LoadingButton } from "@/components/LoadingButton";

type Plan = {
  name: string;
  tag: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
  gumroadUrl?: string;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    tag: "free",
    price: "$0",
    cadence: "/ month",
    description: "Connect a few repositories and see what RepoDoc makes of them.",
    features: [
      "Up to 3 projects",
      "Public and private GitHub repositories",
      "Repository dashboard and analytics",
      "Preview README and docs from repository metadata",
    ],
    cta: "Start free",
  },
  {
    name: "Professional",
    tag: "popular",
    price: "$20",
    cadence: "/ month",
    description: "For working developers who live inside the codebase.",
    features: [
      "Everything in Starter",
      "Up to 10 projects",
      "Full codebase indexing - every file summarized and embedded",
      "Chat with your codebase, with the source files behind each answer",
      "Architecture map of every indexed file",
      "Public share links for docs and README, revocable at any time",
      "Email support",
    ],
    cta: "Get Professional",
    featured: true,
    gumroadUrl: "https://kapilavibes4.gumroad.com/l/nvfiwo",
  },
  {
    name: "Enterprise",
    tag: "teams",
    price: "$49",
    cadence: "/ month",
    description: "For people indexing more repositories than a seat limit allows.",
    features: [
      "Everything in Professional",
      "Unlimited projects",
      "Priority support and onboarding",
      "Direct line for custom work",
    ],
    cta: "Get Enterprise",
    gumroadUrl: "https://kapilavibes4.gumroad.com/l/sesqgd",
  },
];

const FAQ = [
  {
    q: "Can I change plans later?",
    a: "Yes. Upgrades take effect immediately and downgrades apply at the end of the current billing period. Project count limits are enforced at create time, never destructively.",
  },
  {
    q: "What counts as a project?",
    a: "One connected GitHub repository, pinned to one branch. Indexing a second branch of the same repository means creating a second project, which uses another slot.",
  },
  {
    q: "Is there a team or multi-seat plan?",
    a: "Not yet. Projects are single-owner today  -  there are no shared workspaces or seats on any plan. Published docs and README pages can be shared by link, which is what people mostly use for this.",
  },
  {
    q: "Are there usage limits?",
    a: "Plans aren't usage-billed, so there are no query buckets to roll over. Two limits do exist: a 20 requests-per-minute rate limit per identity, and an optional per-project monthly AI spend cap you set yourself  -  queries return 402 once a project passes it. Neither is a plan differentiator.",
  },
  {
    q: "What do I get on the free plan?",
    a: "Connect up to 3 repositories, browse the dashboard and analytics, and generate a preview README and docs from repository metadata. Codebase indexing, chat, and the architecture map read your actual source and are on Professional and above.",
  },
  {
    q: "Is there a free trial on paid plans?",
    a: "The Starter tier is permanently free, so you can see how RepoDoc handles your repositories before paying. We don't run separate time-limited trials.",
  },
];

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const handleClick = (plan: Plan) => {
    if (plan.name === "Starter") {
      router.push(isSignedIn ? "/dashboard" : "/sign-in");
      return;
    }

    if (!isSignedIn) {
      toast.error("Please sign in first", {
        description: "You need to be signed in to purchase a plan.",
      });
      router.push("/sign-in");
      return;
    }

    if (plan.gumroadUrl) {
      window.open(plan.gumroadUrl, "_blank", "noopener,noreferrer");
      return;
    }

    toast.error("Checkout not available", {
      description: "This plan does not have a configured checkout URL.",
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#040406]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh]"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(245,158,11,0.04), transparent 70%)",
        }}
      />

      <TopBar />

      <section className="relative mx-auto max-w-[1800px] px-6 sm:px-10 lg:px-20 pt-20 pb-14">
        <Eyebrow>pricing</Eyebrow>
        <h1 className="mt-6 text-[clamp(2rem,4.4vw,3.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white">
          Simple, predictable pricing.
          <br />
          <span className="text-white/45">Pay for projects, not tokens.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[1.6] text-white/55">
          Three plans, flat monthly pricing, no usage meters to watch. Start
          free and upgrade when a project earns its keep.
        </p>
      </section>

      <section>
        <div className="mx-auto max-w-[1800px] px-6 sm:px-10 lg:px-20 py-14">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.name}
                plan={plan}
                onClick={() => handleClick(plan)}
              />
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1800px] px-6 sm:px-10 lg:px-20 py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            <div className="md:col-span-3">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/35">
                faq
              </div>
              <h2 className="mt-3 text-[22px] font-medium tracking-[-0.02em] text-white">
                Common questions
              </h2>
            </div>
            <div className="md:col-span-9">
              <dl className="divide-y divide-white/[0.05]">
                {FAQ.map((item) => (
                  <div key={item.q} className="py-5 first:pt-0 last:pb-0">
                    <dt className="text-[15px] font-medium text-white">
                      {item.q}
                    </dt>
                    <dd className="mt-2 max-w-2xl text-[14px] leading-[1.65] text-white/55">
                      {item.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1800px] px-6 sm:px-10 lg:px-20 py-14">
          <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h3 className="text-[18px] font-medium tracking-[-0.02em] text-white">
                Need something custom?
              </h3>
              <p className="mt-1.5 text-[14px] text-white/55">
                Higher project limits, on-prem, or a procurement track  -
                we&apos;re happy to talk.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-[13px] font-medium text-black transition-all hover:bg-white/95"
            >
              Contact sales
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function PlanCard({
  plan,
  onClick,
}: {
  plan: Plan;
  onClick: () => void;
}) {
  return (
    <div
      className={[
        "relative flex flex-col rounded-2xl border bg-white/[0.015] p-6 transition-colors",
        plan.featured
          ? "border-white/[0.18] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
          : "border-white/[0.08] hover:border-white/[0.14]",
      ].join(" ")}
    >
      {plan.featured && (
        <div className="absolute -top-px left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
      )}

      <div className="flex items-center justify-between">
        <span className="text-[15px] font-medium text-white">{plan.name}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
          {plan.tag}
        </span>
      </div>

      <div className="mt-7 flex items-baseline gap-1.5">
        <span className="text-[40px] font-medium tracking-[-0.03em] text-white">
          {plan.price}
        </span>
        <span className="text-[13px] text-white/45">{plan.cadence}</span>
      </div>

      <p className="mt-4 text-[13.5px] leading-[1.55] text-white/55">
        {plan.description}
      </p>

      <ul className="mt-7 space-y-2.5">
        {plan.features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2.5 text-[13.5px] leading-[1.55] text-white/65"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/45" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex-1" />

      <LoadingButton
        type="button"
        onClick={onClick}
        className={[
          "h-10 w-full rounded-md text-[13px] font-medium transition-all disabled:opacity-60",
          plan.featured
            ? "bg-white text-black hover:bg-white/95"
            : "border border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08]",
        ].join(" ")}
      >
        {plan.cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </LoadingButton>
    </div>
  );
}

function TopBar() {
  return (
    <div className="border-b border-white/[0.05]">
      <div className="flex items-center px-6 sm:px-8 lg:px-12 py-4">
        <Link
          href="/"
          className="group inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white/40 transition-all group-hover:-translate-x-0.5 group-hover:text-white/70" />
          <Image
            src="/repodoc.png"
            alt="RepoDoc"
            width={20}
            height={20}
            className="rounded-[5px]"
          />
          <span className="text-[13.5px] font-medium tracking-[-0.01em] text-white/85 transition-colors group-hover:text-white">
            RepoDoc
          </span>
        </Link>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/45">
      <span className="h-1 w-1 rounded-full bg-amber-400" />
      {children}
    </div>
  );
}
