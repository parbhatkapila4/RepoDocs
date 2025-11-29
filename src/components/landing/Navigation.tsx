"use client"
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Crown, Sparkles, Zap } from "lucide-react"
import { RepoDocLogo } from "@/components/ui/repodoc-logo"
import { useUser as useClerkUser, useClerk } from "@clerk/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { usePathname, useSearchParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions'
import { Badge } from "@/components/ui/badge"

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userPlan, setUserPlan] = useState<string | null>(null)
  const { user, isSignedIn } = useClerkUser()
  const { signOut } = useClerk()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Check if we just completed a payment
  const paymentStatus = searchParams.get('payment')
  const planFromUrl = searchParams.get('plan')

  // Check if we're in a payment success state - if so, don't fetch from DB
  const isPaymentSuccess = paymentStatus === 'success' && planFromUrl

  // Fetch user plan function - but skip if we're handling a payment success
  const fetchUserPlan = useCallback(async () => {
    // IMPORTANT: If we just completed a payment, DON'T fetch from DB
    // The PaymentStatusHandler will sync and redirect to dashboard
    if (isPaymentSuccess) {
      console.log('Skipping fetchUserPlan - payment success in progress')
      return
    }
    
    if (isSignedIn) {
      try {
        const dbUser = await getCurrentUser()
        if (dbUser?.plan) {
          setUserPlan(dbUser.plan)
        }
      } catch (error) {
        console.error('Error fetching user plan:', error)
      }
    }
  }, [isSignedIn, isPaymentSuccess])

  // Handle successful payment - set plan from URL IMMEDIATELY and lock it
  useEffect(() => {
    if (paymentStatus === 'success' && planFromUrl) {
      console.log('Payment success detected, setting plan to:', planFromUrl)
      setUserPlan(planFromUrl)
    }
  }, [paymentStatus, planFromUrl])

  // Fetch user plan when signed in (but not during payment success)
  useEffect(() => {
    if (!isPaymentSuccess) {
      fetchUserPlan()
    }
  }, [fetchUserPlan, isPaymentSuccess])

  const getPlanBadge = () => {
    if (!userPlan) return null
    
    switch (userPlan) {
      case 'professional':
        return (
          <div className="absolute -bottom-1.5 -right-1.5">
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-full shadow-lg shadow-amber-500/30">
              <Zap className="h-2 w-2 text-white" />
              <span className="text-[7px] font-black text-white tracking-wider">PRO</span>
            </div>
          </div>
        )
      case 'enterprise':
        return (
          <div className="absolute -bottom-1.5 -right-1.5">
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full shadow-lg shadow-purple-500/30">
              <Crown className="h-2 w-2 text-white" />
              <span className="text-[7px] font-black text-white tracking-wider">ENT</span>
            </div>
          </div>
        )
      case 'starter':
      default:
        return null // No badge for free users
    }
  }

  return (
    <nav className="bg-transparent">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto py-4 pl-0 pr-4">
        <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse pl-4 md:pl-0">
          <RepoDocLogo size="md" className="text-white" />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">RepoDoc</span>
        </Link>

        <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          {isSignedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="relative flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                  id="user-menu-button"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open user menu</span>
                  <Image
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                    src={user.imageUrl || "/docs/images/people/profile-picture-3.jpg"}
                    alt="user photo"
                    unoptimized
                  />
                  {getPlanBadge()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-50 my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow-sm dark:bg-gray-700 dark:divide-gray-600 w-56"
              >
                {/* User Info & Plan */}
                <div className="px-4 py-3">
                  <span className="block text-sm text-gray-900 dark:text-white font-medium truncate">
                    {user.firstName || user.username || 'User'}
                  </span>
                  <span className="block text-sm text-gray-500 truncate dark:text-gray-400">
                    {user.emailAddresses[0]?.emailAddress}
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    {userPlan === 'professional' ? (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-0.5 font-semibold border-0">
                        <Crown className="h-3 w-3 mr-1" />
                        Professional
                      </Badge>
                    ) : userPlan === 'enterprise' ? (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 font-semibold border-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Enterprise
                      </Badge>
                    ) : (
                      <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs px-2 py-0.5 font-semibold border-0">
                        Starter
                      </Badge>
                    )}
                  </div>
                </div>
                <ul className="py-2" aria-labelledby="user-menu-button">
                  {userPlan === 'starter' && (
                    <li>
                      <Link
                        href="/pricing"
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-amber-400 font-medium"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Pro
                      </Link>
                    </li>
                  )}
                  <li>
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                    >
                      Sign out
                    </button>
                  </li>
                </ul>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/sign-in"
                className="text-sm text-white hover:text-blue-400 transition"
              >
                Sign In
              </Link>
            </div>
          )}

          <button
            data-collapse-toggle="navbar-user"
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-white rounded-lg md:hidden hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-user"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Desktop Menu - unchanged */}
        <div
          className="items-center justify-between w-full hidden md:flex md:w-auto md:order-1 md:-ml-[5rem]"
          id="navbar-user-desktop"
        >
          <ul className="flex flex-col font-medium md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent dark:bg-transparent">
            <li>
              <Link
                href="/"
                className={`block py-2 px-3 rounded-sm md:p-0 ${
                  pathname === "/"
                    ? "text-blue-400 bg-blue-700 md:bg-transparent md:text-blue-400"
                    : "text-white hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-400 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                }`}
                aria-current={pathname === "/" ? "page" : undefined}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className={`block py-2 px-3 rounded-sm md:p-0 ${
                  pathname === "/about"
                    ? "text-blue-400 bg-blue-700 md:bg-transparent md:text-blue-400"
                    : "text-white hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-400 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                }`}
                aria-current={pathname === "/about" ? "page" : undefined}
              >
                About
              </Link>
            </li>
            {isSignedIn ? (
              <li>
                <Link
                  href="/dashboard"
                  className={`block py-2 px-3 rounded-sm md:p-0 ${
                    pathname === "/dashboard"
                      ? "text-blue-400 bg-blue-700 md:bg-transparent md:text-blue-400"
                      : "text-white hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-400 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  }`}
                  aria-current={pathname === "/dashboard" ? "page" : undefined}
                >
                  Dashboard
                </Link>
              </li>
            ) : (
              <li>
                <Link
                  href="/contact"
                  className={`block py-2 px-3 rounded-sm md:p-0 ${
                    pathname === "/contact"
                      ? "text-blue-400 bg-blue-700 md:bg-transparent md:text-blue-400"
                      : "text-white hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-400 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  }`}
                  aria-current={pathname === "/contact" ? "page" : undefined}
                >
                  Contact
                </Link>
              </li>
            )}
            <li>
              <Link
                href="/pricing"
                className={`block py-2 px-3 rounded-sm md:p-0 ${
                  pathname === "/pricing"
                    ? "text-blue-400 bg-blue-700 md:bg-transparent md:text-blue-400"
                    : "text-white hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-400 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                }`}
                aria-current={pathname === "/pricing" ? "page" : undefined}
              >
                Pricing
              </Link>
            </li>
          </ul>
        </div>

        {/* Mobile Menu - Compact Sheet from right side */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="right" className="w-[200px] bg-gray-900 border-white/10 md:hidden p-0 m-2 rounded-lg" data-mobile-menu>
            <div className="flex flex-col p-2">
              <div className="p-2 border-b border-white/10 mb-1">
                <SheetTitle className="text-white text-sm font-semibold">Menu</SheetTitle>
              </div>
              <ul className="flex flex-col font-medium p-1 space-y-1">
                <li>
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block py-2.5 px-3 rounded-md text-sm transition-colors ${
                      pathname === "/"
                        ? "text-blue-400 bg-blue-700/20 font-medium"
                        : "text-white hover:bg-gray-800"
                    }`}
                    aria-current={pathname === "/" ? "page" : undefined}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block py-2.5 px-3 rounded-md text-sm transition-colors ${
                      pathname === "/about"
                        ? "text-blue-400 bg-blue-700/20 font-medium"
                        : "text-white hover:bg-gray-800"
                    }`}
                    aria-current={pathname === "/about" ? "page" : undefined}
                  >
                    About
                  </Link>
                </li>
                {isSignedIn ? (
                  <li>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block py-2.5 px-3 rounded-md text-sm transition-colors ${
                        pathname === "/dashboard"
                          ? "text-blue-400 bg-blue-700/20 font-medium"
                          : "text-white hover:bg-gray-800"
                      }`}
                      aria-current={pathname === "/dashboard" ? "page" : undefined}
                    >
                      Dashboard
                    </Link>
                  </li>
                ) : (
                  <li>
                    <Link
                      href="/contact"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block py-2.5 px-3 rounded-md text-sm transition-colors ${
                        pathname === "/contact"
                          ? "text-blue-400 bg-blue-700/20 font-medium"
                          : "text-white hover:bg-gray-800"
                      }`}
                      aria-current={pathname === "/contact" ? "page" : undefined}
                    >
                      Contact
                    </Link>
                  </li>
                )}
                <li>
                  <Link
                    href="/pricing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block py-2.5 px-3 rounded-md text-sm transition-colors ${
                      pathname === "/pricing"
                        ? "text-blue-400 bg-blue-700/20 font-medium"
                        : "text-white hover:bg-gray-800"
                    }`}
                    aria-current={pathname === "/pricing" ? "page" : undefined}
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
