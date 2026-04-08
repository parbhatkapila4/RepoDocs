"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

export default function RouteTransitionLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathnameRef = useRef<string | null>(null);
  const isNavigatingRef = useRef(false);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const hideRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (hideRef.current) clearTimeout(hideRef.current);
    tickRef.current = null;
    hideRef.current = null;
  }, []);

  const start = useCallback(() => {
    clearTimers();
    setProgress(12);
    setVisible(true);
    isNavigatingRef.current = true;

    tickRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        const step = p < 30 ? 8 : p < 60 ? 4 : 1.5;
        return Math.min(p + step, 90);
      });
    }, 200);
  }, [clearTimers]);

  const finish = useCallback(() => {
    clearTimers();
    isNavigatingRef.current = false;
    setProgress(100);
    hideRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, [clearTimers]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[href]");
      if (link) {
        const href = link.getAttribute("href");
        if (href && href.startsWith("/") && !href.startsWith("//")) {
          if (href !== window.location.pathname) {
            start();
          }
        }
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [start]);

  useEffect(() => {
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      return;
    }

    if (pathname !== prevPathnameRef.current) {
      if (!isNavigatingRef.current) start();
      prevPathnameRef.current = pathname;
      const t = setTimeout(finish, 150);
      return () => clearTimeout(t);
    } else if (isNavigatingRef.current) {
      finish();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, start, finish]);

  useEffect(() => clearTimers, [clearTimers]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none">
      <div
        className="h-full bg-white/70 transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "200ms" : "400ms",
        }}
      />
    </div>
  );
}
