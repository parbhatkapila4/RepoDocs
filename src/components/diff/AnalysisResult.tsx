"use client";

import React from "react";
import { Wand2, AlertCircle } from "lucide-react";
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

export function AnalysisResult({ analysis }: { analysis: DiffAnalysisResult }) {
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 bg-[#252525] border border-[#333] rounded-t-lg">
        <Wand2 className="w-4 h-4" style={{ color: colors.yellow }} />
        <span className="text-[#888] text-sm font-mono">Analysis result</span>
      </div>

      <div className="bg-[#1a1a1a] border border-t-0 border-[#333] rounded-b-lg overflow-hidden">
        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-xs font-mono text-[#666] uppercase tracking-wider mb-2">
              Summary
            </h3>
            <p className="text-white text-sm leading-relaxed">
              {analysis.summary || "-"}
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

          {analysis.impactedFiles && analysis.impactedFiles.length > 0 && (
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

          {analysis.impactedModules && analysis.impactedModules.length > 0 && (
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

          {analysis.testsToUpdate && analysis.testsToUpdate.length > 0 && (
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
    </>
  );
}
