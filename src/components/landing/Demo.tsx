"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Github } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

export default function Demo() {
  const { isAuthenticated } = useUser();
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const destination = isAuthenticated
      ? `/create${repoUrl ? `?url=${encodeURIComponent(repoUrl)}` : ""}`
      : `/sign-up${repoUrl ? `?url=${encodeURIComponent(repoUrl)}` : ""}`;
    router.push(destination);
  };

  const popularRepos = [
    { name: "vercel/next.js", stars: "120k" },
    { name: "facebook/react", stars: "220k" },
    { name: "microsoft/vscode", stars: "160k" },
  ];

  return (
    <section className="bg-[#0a0a0a] py-32 border-t border-[#1a1a1a] relative">
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <span className="text-[#666] text-sm font-mono tracking-wide block mb-4">
            TRY IT NOW
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pick a repo.
          </h2>
          <p className="text-[#888] text-lg">
            See it work on real code. No signup required for public repos.
          </p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="github.com/owner/repo"
                className="w-full h-12 pl-12 pr-4 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder:text-[#555] focus:outline-none focus:border-[#555] font-mono text-sm"
              />
            </div>
            <button
              type="submit"
              className="h-12 px-6 bg-white text-black font-medium rounded-lg flex items-center gap-2 hover:bg-[#eee] transition-colors"
            >
              Analyze
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.form>

        <div className="flex flex-wrap justify-center gap-3">
          {popularRepos.map((repo) => (
            <button
              key={repo.name}
              onClick={() =>
                router.push(
                  isAuthenticated
                    ? `/create?url=https://github.com/${repo.name}`
                    : `/sign-up?url=https://github.com/${repo.name}`
                )
              }
              className="px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-[#888] hover:text-white hover:border-[#555] transition-colors text-sm font-mono"
            >
              {repo.name}
              <span className="text-[#555] ml-2">★ {repo.stars}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
