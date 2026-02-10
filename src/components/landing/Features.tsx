"use client";

import { motion } from "motion/react";

const features = [
  {
    number: "01",
    title: "Semantic Understanding",
    description:
      "Not keyword matching. Actual understanding of what your code does, how components connect, and why certain patterns exist.",
  },
  {
    number: "02",
    title: "Precise References",
    description:
      "Every answer includes exact file paths and line numbers. Click to jump directly to the relevant code.",
  },
  {
    number: "03",
    title: "Hybrid Search",
    description:
      "Combines vector embeddings with traditional search. 89% recall rate, even on complex architectural questions.",
  },
  {
    number: "04",
    title: "Auto Documentation",
    description:
      "Generate README files, API docs, and architecture diagrams. Open a PR with one click.",
  },
];

export default function Features() {
  return (
    <section className="bg-[#0a0a0a] py-32 border-t border-[#1a1a1a] relative">
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="mb-20">
          <span className="text-[#666] text-sm font-mono tracking-wide block mb-4">
            CAPABILITIES
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white max-w-2xl leading-tight">
            Built different.
          </h2>
        </div>

        <div className="space-y-0">
          {features.map((feature, index) => (
            <motion.div
              key={feature.number}
              className="group py-12 border-t border-[#222] first:border-t-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="grid md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-1">
                  <span className="text-[#444] font-mono text-sm">
                    {feature.number}
                  </span>
                </div>
                <div className="md:col-span-4">
                  <h3 className="text-2xl font-semibold text-white group-hover:text-[#888] transition-colors">
                    {feature.title}
                  </h3>
                </div>
                <div className="md:col-span-7">
                  <p className="text-[#888] text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
