"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RepoDocLogo } from "@/components/ui/repodoc-logo"
import { useUser as useClerkUser, UserButton } from "@clerk/nextjs"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useUser as useAppUser } from "@/hooks/useUser"

const baseNavLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
]

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isSignedIn } = useClerkUser()
  const { user: appUser, isAuthenticated } = useAppUser()
  const pathname = usePathname()

  const handleToggle = () => setIsMobileMenuOpen((open) => !open)

  const navLinks = isSignedIn
    ? [
        ...baseNavLinks,
        { href: "/dashboard", label: "Dashboard" },
      ]
    : baseNavLinks

  const planLabel = appUser?.plan
    ? appUser.plan.charAt(0) + appUser.plan.slice(1).toLowerCase()
    : null

  return (
    <nav className="sticky top-0 z-50 bg-transparent backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <RepoDocLogo size="md" className="text-white" />
          <span className="text-xl font-semibold text-white">RepoDoc</span>
        </Link>

        <div className="flex items-center gap-4 md:order-2">
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              {planLabel && isAuthenticated && (
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-100 border border-blue-400/40">
                  {planLabel}
                </Badge>
              )}
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox:
                      "h-9 w-9 border border-white/20 shadow-md shadow-blue-500/10",
                  },
                }}
                afterSignOutUrl="/"
              />
            </div>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Link href="/sign-up">
                <HoverBorderGradient
                  containerClassName="rounded-2xl"
                  as="button"
                  className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2 px-4 py-1"
                >
                  <span className="font-medium">Sign Up</span>
                </HoverBorderGradient>
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={handleToggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white/70 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 md:hidden"
            aria-controls="primary-navigation"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="sr-only">Toggle menu</span>
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div
          id="primary-navigation"
          className={cn(
            "w-full md:w-auto md:flex md:items-center md:justify-center md:order-1",
            isMobileMenuOpen ? "block" : "hidden"
          )}
        >
          <ul className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-medium text-white md:flex-row md:items-center md:gap-8 md:border-transparent md:bg-transparent md:p-0 md:text-base">
            {navLinks.map((link) => {
              const isActive = link.href !== "/" ? pathname.startsWith(link.href) : pathname === "/"
              const linkClasses = cn(
                "rounded-lg px-3 py-2 transition",
                isActive
                  ? "bg-white/10 text-white shadow-md shadow-blue-500/20 md:bg-transparent md:text-white md:underline md:decoration-blue-400 md:decoration-2 md:underline-offset-8"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )

              if (link.external) {
                return (
                  <li key={link.href}>
                    <a href={link.href} className={linkClasses}>
                      {link.label}
                    </a>
                  </li>
                )
              }

              return (
                <li key={link.href}>
                  <Link href={link.href} className={linkClasses} onClick={() => setIsMobileMenuOpen(false)}>
                    {link.label}
                  </Link>
                </li>
              )
            })}

            {!isSignedIn && (
              <li className="md:hidden">
                <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-lg border-white/30 text-white hover:bg-white/10">
                    Sign Up
                  </Button>
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
