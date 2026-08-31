"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const MIST = "#F1F0E0";
const ACCENT = "#3ED9C4";
function Thumb({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={372}
      height={234}
      unoptimized
      className="h-full w-full object-cover"
    />
  );
}

function ArrowIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect y="0.0268555" width="23.4" height="23.4" rx="3.6" fill="#1E1E1E" />
      <rect
        x="0.45"
        y="0.476855"
        width="22.5"
        height="22.5"
        rx="3.15"
        stroke={MIST}
        strokeOpacity="0.1"
        strokeWidth="0.9"
      />
      <path
        d="M7.85162 7.95068C10.0527 7.95068 13.2295 7.95068 14.4626 7.95068C14.7489 7.95068 14.979 8.18277 14.979 8.46907L14.979 15.0268"
        stroke={MIST}
        strokeWidth="1.03678"
      />
      <path
        d="M14.693 8.23573L7.92188 15.0068"
        stroke={MIST}
        strokeWidth="1.03678"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-colors duration-300"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="11"
        fill="none"
        className="stroke-[#F1F0E0]/30 transition-colors duration-300 group-hover:stroke-[#121212] group-focus-visible:stroke-[#121212]"
      />
      <polygon
        points="9,7 17,12 9,17"
        className="fill-[#F1F0E0] transition-colors duration-300 group-hover:fill-[#121212] group-focus-visible:fill-[#121212]"
      />
    </svg>
  );
}

const CARD =
  "group relative flex justify-between gap-3 overflow-hidden rounded-lg bg-[#121212] p-2 text-left outline-none transition-[transform,opacity,color,visibility] delay-[900ms] duration-500 focus-visible:ring-2 focus-visible:ring-[#F1F0E0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]";

function reveal(revealed: boolean) {
  return revealed
    ? "visible translate-y-0 opacity-100"
    : "invisible translate-y-[25%] opacity-0";
}

function CardBody({
  label,
  title,
  thumb,
  icon,
}: {
  label: string;
  title: string;
  thumb: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <>
      <div className="absolute inset-0 z-0 rounded-lg border border-[#373633] transition-[opacity,border,background] duration-300 group-hover:border-[#F1F0E0] group-hover:bg-[#F1F0E0] group-focus-visible:border-[#F1F0E0] group-focus-visible:bg-[#F1F0E0]" />
      <div className="relative z-10 flex items-center gap-4">
        <div className="aspect-[124/78] w-full max-w-[124px] shrink-0 overflow-hidden rounded-[3px] ring-1 ring-[#F1F0E0]/10">
          {thumb}
        </div>
        <div>
          <div className="font-pixel text-[10px] uppercase tracking-[0.01em] text-[#3ED9C4] transition-colors duration-300 group-hover:text-[#0A5F68] group-focus-visible:text-[#0A5F68]">
            {label}
          </div>
          <div className="mt-2 line-clamp-2 max-w-[230px] font-body text-[15px] font-light leading-[1.2] text-[#F1F0E0] transition-colors duration-300 group-hover:text-[#121212] group-focus-visible:text-[#121212]">
            {title}
          </div>
        </div>
      </div>
      <div className="relative z-10">{icon}</div>
    </>
  );
}

export function ChangelogCard({ revealed }: { revealed: boolean }) {
  return (
    <Link href="/changelog" className={`${CARD} ${reveal(revealed)}`}>
      <CardBody
        label="Changelog"
        title="Release notes and product updates for RepoDoc"
        thumb={<Thumb src="/hero/changelog.webp" />}
        icon={<ArrowIcon />}
      />
    </Link>
  );
}

export function DemoCard({
  revealed,
  onOpen,
  disabled = false,
}: {
  revealed: boolean;
  onOpen: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      title={disabled ? "Demo video coming soon" : undefined}
      className={`${CARD} ${reveal(revealed)} w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <CardBody
        label="Demo"
        title="Watch the walkthrough: connect a repo, index it, ask it questions"
        thumb={<Thumb src="/hero/demo.webp" />}
        icon={<PlayIcon />}
      />
    </button>
  );
}
