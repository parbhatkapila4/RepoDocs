"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, LogOut, Loader2 } from "lucide-react";
import { useUser as useClerkUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { LoadingButton } from "@/components/LoadingButton";
import { UserAvatar } from "@/components/ui/user-avatar";

const INK = "#180b06";
const PAPER = "#f3eee4";
const CHAMFER = "polygon(0 0, 100% 0, 100% 100%, 14px 100%, 0 calc(100% - 14px))";
const LINKS = [
  { href: "/documentation", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const { isSignedIn, user } = useClerkUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!avatarOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [avatarOpen]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut({ redirectUrl: "/" });
    } catch {
      setLoggingOut(false);
    }
  };

  const onCTA = () => {
    if (navigating) return;
    setNavigating(true);
    router.push(isSignedIn ? "/dashboard" : "/sign-in");
  };

  const fg = PAPER;
  const dim = "rgba(243,238,228,0.6)";

  return (
    <motion.nav
      className="fixed inset-x-0 top-0 z-50 bg-transparent"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mx-auto flex h-16 w-full items-center justify-between px-5 md:px-12 lg:h-20">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/repodoc.png"
            alt="RepoDoc"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
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
              backgroundColor: PAPER,
              color: INK,
              clipPath: CHAMFER,
            }}
            className="px-4 py-2 font-mono text-[12.5px] font-medium tracking-wide transition-all duration-300 hover:brightness-110"
          >
            {isSignedIn ? "Dashboard" : "Get Started"}
          </LoadingButton>

          {isSignedIn && user && (
            <div className="relative hidden sm:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setAvatarOpen((v) => !v)}
                aria-label="Account menu"
                aria-expanded={avatarOpen}
                className="flex rounded-full transition hover:opacity-90 focus:outline-none"
              >
                <UserAvatar
                  src={user.imageUrl}
                  name={user.fullName}
                  email={user.primaryEmailAddress?.emailAddress}
                  className="h-9 w-9 ring-1 ring-white/20"
                />
              </button>

              <AnimatePresence>
                {avatarOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-60 overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0f] shadow-2xl shadow-black/60"
                  >
                    <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                      <UserAvatar
                        src={user.imageUrl}
                        name={user.fullName}
                        email={user.primaryEmailAddress?.emailAddress}
                        className="h-9 w-9"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {user.fullName || user.firstName || "Account"}
                        </p>
                        <p className="truncate text-xs text-white/50">
                          {user.primaryEmailAddress?.emailAddress}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60"
                    >
                      {loggingOut ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      {loggingOut ? "Signing out…" : "Log out"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

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
              {isSignedIn && (
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60"
                >
                  {loggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {loggingOut ? "Signing out…" : "Log out"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
