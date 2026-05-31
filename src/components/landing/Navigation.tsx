"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useUser as useClerkUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { LoadingButton } from "@/components/LoadingButton";

const INK = "#180b06";
const PAPER = "#f3eee4";
const CHAMFER = "polygon(0 0, 100% 0, 100% 100%, 14px 100%, 0 calc(100% - 14px))";
const LINKS = [
  { href: "/documentation", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navigation() {
  const [overHero, setOverHero] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const { isSignedIn } = useClerkUser();
  const router = useRouter();

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const hero = document.querySelector("section");
      const bottom = hero
        ? hero.getBoundingClientRect().bottom
        : window.innerHeight;
      setOverHero(bottom > 80);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onCTA = () => {
    if (navigating) return;
    setNavigating(true);
    router.push(isSignedIn ? "/dashboard" : "/sign-in");
  };

  const fg = overHero ? INK : PAPER;
  const dim = overHero ? "rgba(24,11,6,0.6)" : "rgba(243,238,228,0.6)";

  return (
    <motion.nav
      className="fixed inset-x-0 top-0 z-50 bg-transparent"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:h-20 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/repodoc.png"
            alt="RepoDoc"
            width={30}
            height={30}
            className="rounded-md"
          />
          <span
            className="text-lg font-bold tracking-tight transition-colors duration-300"
            style={{ color: fg }}
          >
            RepoDoc
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hidden text-[13px] font-medium transition-colors duration-300 hover:opacity-100 sm:block"
              style={{ color: dim }}
            >
              {l.label}
            </Link>
          ))}

          <LoadingButton
            type="button"
            onClick={onCTA}
            loading={navigating}
            style={{
              backgroundColor: overHero ? INK : PAPER,
              color: overHero ? PAPER : INK,
              clipPath: CHAMFER,
            }}
            className="px-4 py-2 font-mono text-[12.5px] font-medium tracking-wide transition-all duration-300 hover:brightness-110"
          >
            {isSignedIn ? "Dashboard" : "Get Started"}
          </LoadingButton>

          <button
            type="button"
            aria-label="Toggle menu"
            className="transition-colors duration-300 sm:hidden"
            style={{ color: fg }}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/10 bg-black/95 backdrop-blur-xl sm:hidden"
          >
            <div className="space-y-1 px-5 py-4">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
