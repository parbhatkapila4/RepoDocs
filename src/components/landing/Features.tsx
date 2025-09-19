"use client";

import React from 'react'
import { Brain, Code, GitBranch, Shield, Zap } from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"

export default function Features() {
  return (
    <section className="py-10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything you need to document your code
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            From AI-powered analysis to one-click PRs, RepoDoc handles the entire documentation workflow.
          </p>
        </div>
        
        <ul className="grid grid-cols-1 grid-rows-none gap-4 sm:gap-6 md:grid-cols-12 md:grid-rows-4 lg:gap-8 xl:max-h-[40rem] xl:grid-rows-3">
          <GridItem
            area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
            icon={<Brain className="h-4 w-4 text-neutral-400" />}
            title="AI-driven README & Docs"
            description="One-click generation with installation guides, usage examples, and API documentation."
          />

          <GridItem
            area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
            icon={<Code className="h-4 w-4 text-neutral-400" />}
            title="Repo Intelligence"
            description="File summaries, TODOs, env vars, and API routes automatically extracted and organized."
          />

          <GridItem
            area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
            icon={<GitBranch className="h-4 w-4 text-neutral-400" />}
            title="One-click PR & Share"
            description="Open a PR to add docs or publish a public docs page with a shareable link."
          />

          <GridItem
            area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
            icon={<Shield className="h-4 w-4 text-neutral-400" />}
            title="Secure & Fast"
            description="Only public repos by default, OAuth for private access, and intelligent caching for speed."
          />

          <GridItem
            area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
            icon={<Zap className="h-4 w-4 text-neutral-400" />}
            title="Lightning Fast Processing"
            description="Advanced caching and optimized algorithms ensure your documentation is generated in seconds, not minutes."
          />
        </ul>
      </div>
    </section>
  )
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={`min-h-[12rem] sm:min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border p-2 md:rounded-3xl md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="border-0.75 relative flex h-full flex-col justify-between gap-3 sm:gap-4 overflow-hidden rounded-xl p-4 sm:p-6 md:p-6 shadow-[0px_0px_27px_0px_#2D2D2D]">
          <div className="relative flex flex-1 flex-col justify-between gap-3 sm:gap-4">
            <div className="w-fit rounded-lg border border-gray-600 p-2">
              {icon}
            </div>
            <div className="space-y-2 sm:space-y-3">
              <h3 className="-tracking-4 pt-0.5 font-sans text-lg/[1.25rem] sm:text-xl/[1.375rem] font-semibold text-balance md:text-2xl/[1.875rem] text-white">
                {title}
              </h3>
              <h2 className="font-sans text-sm/[1.125rem] md:text-base/[1.375rem] text-neutral-400 [&_b]:md:font-semibold [&_strong]:md:font-semibold">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
