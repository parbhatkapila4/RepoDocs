"use client";

import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { FEATURE_LOCK, type PaidFeature } from "@/lib/plan";

export function UpgradePanel({
  feature,
  className = "",
}: {
  feature: PaidFeature;
  className?: string;
}) {
  const { title, body } = FEATURE_LOCK[feature];

  return (
    <div
      className={`bg-[#1a1a1a] border border-[#333] rounded-lg p-6 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#252525] border border-[#3a3a3a] flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-[#888]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-white text-[15px] font-semibold">{title}</h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#888]">
            {body}
          </p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-[13px] font-medium text-black transition-all hover:bg-white/90"
          >
            See plans
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
