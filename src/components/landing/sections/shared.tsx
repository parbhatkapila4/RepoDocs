"use client";

import React from "react";
import Link from "next/link";

export const RED = "#AFBFC0";

export const STAGE = "#040406";
export const PAPER = "#f3eee4";
export const PANEL = "#121219";
export const TILE = "#1D1D26";
export const SCREEN = "#0B0B10";
export const LINE = "rgba(243,238,228,0.09)";
export const LINE_SOLID = "rgba(243,238,228,0.18)";
export const ICON = "#ded8ce";

export const SCANLINES =
  "repeating-linear-gradient(to bottom, rgba(243,238,228,0.04) 0px, rgba(243,238,228,0.04) 1px, transparent 1px, transparent 6px)";
export const TILE_SHADOW =
  "inset -3px 3px 0 rgba(243,238,228,0.07), inset 3px -3px 0 rgba(0,0,0,0.55)";

export function pixelBorder(tone: string, w = 2): string {
  return [
    `0 -${w}px 0 0 ${tone}`,
    `0 ${w}px 0 0 ${tone}`,
    `-${w}px 0 0 0 ${tone}`,
    `${w}px 0 0 0 ${tone}`,
  ].join(", ");
}
export const PIXEL_CORNERS =
  "polygon(0 4px, 4px 4px, 4px 0, calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px))";

const CORNER = [1, 1, 1, 1, 0, 1, 1, 1, 1];
const FADE = [0, 1, 0, 1, 0, 1, 0, 1, 0];

function Dither({ mask }: { mask: number[] }) {
  return (
    <div className="grid h-3 w-3 shrink-0 grid-cols-3 grid-rows-3" aria-hidden>
      {mask.map((on, i) => (
        <span key={i} className={on ? "h-1 w-1 bg-current" : "h-1 w-1"} />
      ))}
    </div>
  );
}

function EdgeRow({ dissolve }: { dissolve?: string }) {
  return (
    <div className="flex h-3 shrink-0">
      <Dither mask={CORNER} />
      <Dither mask={FADE} />
      {dissolve ? (
        <div className="flex h-3 flex-1 flex-col">
          <div
            className="h-1 w-full"
            style={{
              backgroundImage: `repeating-linear-gradient(to right, transparent 0 4px, ${dissolve}99 4px 8px, transparent 8px 16px)`,
            }}
          />
          <div
            className="h-1 w-full"
            style={{
              backgroundImage: `repeating-linear-gradient(to right, ${dissolve} 0 4px, transparent 4px 8px)`,
            }}
          />
          <div
            className="h-1 w-full"
            style={{
              backgroundImage: `repeating-linear-gradient(to right, transparent 0 4px, ${dissolve}99 4px 8px, transparent 8px 16px)`,
            }}
          />
        </div>
      ) : (
        <div className="flex h-3 flex-1 flex-col justify-center">
          <div className="h-1 w-full bg-current" />
        </div>
      )}
      <Dither mask={FADE} />
      <Dither mask={CORNER} />
    </div>
  );
}

function Rail() {
  return (
    <div className="flex w-3 shrink-0 justify-center">
      <div className="h-full w-1 bg-current" />
    </div>
  );
}

export function PixelFrame({
  tone = PANEL,
  dissolve,
  className = "inset-0",
}: {
  tone?: string;
  dissolve?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute select-none ${className}`}
      style={{ color: tone }}
    >
      <div className="flex h-full w-full flex-col">
        <EdgeRow />
        <div className="flex flex-1">
          <Rail />
          <div className="flex-1" />
          <Rail />
        </div>
        <EdgeRow dissolve={dissolve} />
      </div>
    </div>
  );
}
export function PixelRule({ tone = LINE_SOLID }: { tone?: string }) {
  return (
    <div className="flex h-3 shrink-0 items-center" aria-hidden>
      <div
        className="h-1 w-full"
        style={{
          backgroundImage: `repeating-linear-gradient(to right, ${tone} 0 4px, transparent 4px 8px)`,
        }}
      />
    </div>
  );
}

export function PixelTile({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-16 w-16 shrink-0 items-center justify-center sm:h-20 sm:w-20 ${className}`}
      style={{
        backgroundColor: TILE,
        backgroundImage: SCANLINES,
        boxShadow: TILE_SHADOW,
        color: ICON,
      }}
    >
      {children}
    </div>
  );
}

export function PixelBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="relative inline-flex w-fit shrink-0 items-center px-3 py-1.5 font-grotesk text-[11px]/[12px] font-bold uppercase tracking-[0.08em]"
      style={{
        backgroundColor: "#1A1A22",
        color: RED,
        boxShadow: pixelBorder(RED),
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-[6px] bottom-1 top-1 w-1"
        style={{ backgroundColor: RED }}
      />
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-[6px] bottom-1 top-1 w-1"
        style={{ backgroundColor: RED }}
      />
    </span>
  );
}

export function PixelCta({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group/btn relative inline-flex w-fit cursor-pointer outline-none"
    >
      <span
        className="flex flex-1 items-center justify-start gap-2 px-6 py-3 font-grotesk text-[12px] font-bold uppercase tracking-[0.06em]"
        style={{
          backgroundColor: RED,
          color: STAGE,
          clipPath: PIXEL_CORNERS,
        }}
      >
        {children}
      </span>
      <PixelFrame
        tone={PAPER}
        className="-inset-3 opacity-0 group-hover/btn:opacity-50 group-active/btn:opacity-100 group-focus-visible/btn:opacity-100"
      />
    </Link>
  );
}
