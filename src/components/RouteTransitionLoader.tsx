"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

export default function RouteTransitionLoader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const prevPathnameRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[href]");

      if (link) {
        const href = link.getAttribute("href");
        if (href && href.startsWith("/") && !href.startsWith("//")) {
          const currentPath = window.location.pathname;
          if (href !== currentPath) {
            isNavigatingRef.current = true;
            setIsLoading(true);
          }
        }
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  useEffect(() => {
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      return;
    }

    if (pathname !== prevPathnameRef.current) {
      setIsLoading(true);
      isNavigatingRef.current = true;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        prevPathnameRef.current = pathname;
        isNavigatingRef.current = false;
      }, 500);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } else {
      prevPathnameRef.current = pathname;

      if (isNavigatingRef.current) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setIsLoading(false);
          isNavigatingRef.current = false;
        }, 300);
      }
    }
  }, [pathname]);

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-md min-h-screen w-full"
        >
          <div className="flex flex-col items-center justify-center gap-4 shrink-0">
            <div
              className="w-8 h-8 rounded-full border-2 border-[#333] border-t-[#8be9fd] animate-spin"
              aria-hidden
            />
            <p className="text-sm font-mono text-[#666]">Loading…</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
