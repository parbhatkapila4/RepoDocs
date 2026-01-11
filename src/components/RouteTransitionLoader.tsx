"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";

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
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center"
        >
          <div className="relative z-10 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-16 h-16 border-4 border-[#333] rounded-full"
                style={{
                  borderTopColor: colors.cyan,
                  borderRightColor: colors.green,
                  borderBottomColor: colors.purple,
                  borderLeftColor: colors.pink,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2
                  className="w-6 h-6 animate-spin"
                  style={{ color: colors.cyan }}
                />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <p
                className="text-sm font-mono tracking-wider"
                style={{ color: colors.cyan }}
              >
                Loading...
              </p>
            </motion.div>

            <motion.div
              className="flex gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.cyan }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          </div>

          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at center, ${colors.cyan}15 0%, transparent 70%)`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
