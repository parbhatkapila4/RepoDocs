"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useProjectsContext } from "@/context/ProjectsContext";
import { motion } from "motion/react";
import {
  FileDiff,
  Loader2,
  Wand2,
  AlertCircle,
  Terminal,
  Github,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { DiffAnalysisResult } from "@/lib/diff";

const colors = {
  green: "#50fa7b",
  cyan: "#8be9fd",
  purple: "#bd93f9",
  pink: "#ff79c6",
  yellow: "#f1fa8c",
  orange: "#ffb86c",
  red: "#ff5555",
  white: "#f8f8f2",
};

export default function DiffPage() {
  const { projects, selectedProjectId } = useProjectsContext();
  const [diff, setDiff] = useState("");
  const [analysis, setAnalysis] = useState<DiffAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  useEffect(() => {
    const main = document.querySelector('main[data-slot="sidebar-inset"]');
    if (main) (main as HTMLElement).style.backgroundColor = "#000000";
    return () => {
      if (main) (main as HTMLElement).style.backgroundColor = "";
    };
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !diff.trim() || isLoading) return;

    setIsLoading(true);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze-diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: currentProject.id,
          diff: diff.trim(),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || err.error || "Analysis failed");
      }

      const data = await response.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        toast.success("Diff analyzed successfully");
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      console.error("Analyze diff error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to analyze diff"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-black relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#333] to-transparent" />
        <div className="relative w-full max-w-full px-6 sm:px-8 lg:px-12 py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center mb-6">
            <FileDiff className="w-8 h-8" style={{ color: colors.purple }} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 text-center">
            No Project Selected
          </h2>
          <p className="text-[#888] text-sm text-center max-w-md">
            Select a project from the sidebar to analyze a PR or git diff.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 px-4 py-2 text-[#888] hover:text-white border border-[#333] hover:border-[#555] rounded-lg text-sm font-medium transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#333] to-transparent" />

      <div className="relative w-full max-w-full px-6 sm:px-8 lg:px-12 py-8">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-[#666] text-xs font-mono tracking-wide uppercase mb-3 block">
            PR / Diff
          </span>
          <h1 className="text-4xl font-bold text-white mb-3">
            Analyze PR / Diff
          </h1>
          <p className="text-[#888] text-sm max-w-md">
            Paste a git diff or GitHub PR diff. We’ll analyze impact, risk, and
            suggest tests to update.
          </p>
        </motion.div>

        <motion.div
          className="bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 px-4 py-3 bg-[#252525] border-b border-[#333]">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-[#666] text-sm font-mono">
              analyze-diff
            </span>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#252525] border border-[#333] flex items-center justify-center">
                <Terminal
                  className="w-5 h-5"
                  style={{ color: colors.green }}
                />
              </div>
              <div>
                <h2 className="text-white font-semibold">Diff input</h2>
                <p className="text-[#666] text-xs">
                  Paste your unified diff (e.g. from git diff or a GitHub PR)
                </p>
              </div>
            </div>

            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-[#888] font-medium flex items-center gap-2">
                  <FileDiff className="w-4 h-4" />
                  Diff content
                </label>
                <textarea
                  value={diff}
                  onChange={(e) => setDiff(e.target.value)}
                  placeholder="Paste your diff here..."
                  disabled={isLoading}
                  rows={14}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder:text-[#555] focus:border-[#50fa7b] focus:outline-none transition-colors font-mono text-sm resize-y min-h-[200px] disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={!diff.trim() || isLoading}
                className="w-full px-6 py-3 bg-white text-black font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-[#eee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      style={{ color: "#000" }}
                    />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" style={{ color: "#000" }} />
                    Analyze
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {analysis && (
          <motion.div
            className="mt-8 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 px-4 py-3 bg-[#252525] border border-[#333] rounded-t-lg">
              <Wand2 className="w-4 h-4" style={{ color: colors.yellow }} />
              <span className="text-[#888] text-sm font-mono">
                Analysis result
              </span>
            </div>

            <div className="bg-[#1a1a1a] border border-t-0 border-[#333] rounded-b-lg overflow-hidden">
              <div className="p-6 space-y-6">
                <section>
                  <h3 className="text-xs font-mono text-[#666] uppercase tracking-wider mb-2">
                    Summary
                  </h3>
                  <p className="text-white text-sm leading-relaxed">
                    {analysis.summary || "—"}
                  </p>
                </section>

                <section>
                  <h3 className="text-xs font-mono text-[#666] uppercase tracking-wider mb-2">
                    Risk level
                  </h3>
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-mono font-medium border"
                    style={{
                      backgroundColor:
                        analysis.riskLevel === "high"
                          ? "rgba(255, 85, 85, 0.15)"
                          : analysis.riskLevel === "medium"
                            ? "rgba(255, 184, 108, 0.15)"
                            : "rgba(80, 250, 123, 0.15)",
                      color:
                        analysis.riskLevel === "high"
                          ? colors.red
                          : analysis.riskLevel === "medium"
                            ? colors.orange
                            : colors.green,
                      borderColor:
                        analysis.riskLevel === "high"
                          ? "rgba(255, 85, 85, 0.4)"
                          : analysis.riskLevel === "medium"
                            ? "rgba(255, 184, 108, 0.4)"
                            : "rgba(80, 250, 123, 0.4)",
                    }}
                  >
                    {analysis.riskLevel}
                  </span>
                </section>

                {analysis.whatChanged && analysis.whatChanged.length > 0 && (
                  <section>
                    <h3 className="text-xs font-mono text-[#666] uppercase tracking-wider mb-3">
                      What changed
                    </h3>
                    <ul className="list-disc list-inside space-y-1.5 text-[#f8f8f2] text-sm">
                      {analysis.whatChanged.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {analysis.impactedFiles &&
                  analysis.impactedFiles.length > 0 && (
                    <section>
                      <h3 className="text-xs font-mono text-[#666] uppercase tracking-wider mb-3">
                        Impacted files
                      </h3>
                      <ul className="space-y-1.5">
                        {analysis.impactedFiles.map((path, i) => (
                          <li key={i}>
                            <code
                              className="text-xs font-mono px-2 py-1 rounded bg-[#0a0a0a] border border-[#333]"
                              style={{ color: colors.cyan }}
                            >
                              {path}
                            </code>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                {analysis.impactedModules &&
                  analysis.impactedModules.length > 0 && (
                    <section>
                      <h3 className="text-xs font-mono text-[#666] uppercase tracking-wider mb-3">
                        Impacted modules
                      </h3>
                      <ul className="space-y-1.5 text-[#f8f8f2] text-sm">
                        {analysis.impactedModules.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                {analysis.architecturalImpact && (
                  <section>
                    <h3 className="text-xs font-mono text-[#666] uppercase tracking-wider mb-2">
                      Architectural impact
                    </h3>
                    <p className="text-white text-sm leading-relaxed">
                      {analysis.architecturalImpact}
                    </p>
                  </section>
                )}

                {analysis.testsToUpdate &&
                  analysis.testsToUpdate.length > 0 && (
                    <section>
                      <h3 className="text-xs font-mono text-[#666] uppercase tracking-wider mb-3">
                        Tests to update
                      </h3>
                      <ul className="space-y-1.5">
                        {analysis.testsToUpdate.map((t, i) => (
                          <li key={i}>
                            <code
                              className="text-xs font-mono px-2 py-1 rounded bg-[#0a0a0a] border border-[#333]"
                              style={{ color: colors.yellow }}
                            >
                              {t}
                            </code>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                {analysis.possibleRegressions &&
                  analysis.possibleRegressions.length > 0 && (
                    <section className="p-4 bg-[#0a0a0a] border border-[#333] rounded-lg">
                      <h3 className="text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                        <AlertCircle
                          className="w-4 h-4"
                          style={{ color: colors.orange }}
                        />
                        Possible regressions
                      </h3>
                      <ul className="list-disc list-inside space-y-1.5 text-[#f8f8f2] text-sm">
                        {analysis.possibleRegressions.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </section>
                  )}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-4 bg-[#1a1a1a] border border-[#333] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Github className="w-4 h-4" style={{ color: colors.purple }} />
              <span className="text-white text-sm font-medium">
                Git & GitHub
              </span>
            </div>
            <p className="text-[#666] text-xs">
              Works with <code className="text-[#888]">git diff</code> or
              copy-paste from any GitHub PR diff view.
            </p>
          </div>
          <div className="p-4 bg-[#1a1a1a] border border-[#333] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" style={{ color: colors.yellow }} />
              <span className="text-white text-sm font-medium">AI analysis</span>
            </div>
            <p className="text-[#666] text-xs">
              Cross-references your indexed codebase and repo memory for impact
              and risk.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
