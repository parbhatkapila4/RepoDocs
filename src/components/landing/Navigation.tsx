"use client"
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Crown, Sparkles, Zap, ArrowRight } from "lucide-react"
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
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "motion/react"

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userPlan, setUserPlan] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const { user, isSignedIn } = useClerkUser()
  const { signOut } = useClerk()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Check if we just completed a payment
  const paymentStatus = searchParams.get('payment')
  const planFromUrl = searchParams.get('plan')

  // Check if we're in a payment success state - if so, don't fetch from DB
  const isPaymentSuccess = paymentStatus === 'success' && planFromUrl

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch user plan function - but skip if we're handling a payment success
  const fetchUserPlan = useCallback(async () => {
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
          <div className="absolute -bottom-1 -right-1">
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-full shadow-lg shadow-amber-500/30">
              <Zap className="h-2 w-2 text-white" />
              <span className="text-[7px] font-black text-white tracking-wider">PRO</span>
            </div>
          </div>
        )
      case 'enterprise':
        return (
          <div className="absolute -bottom-1 -right-1">
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full shadow-lg shadow-purple-500/30">
              <Crown className="h-2 w-2 text-white" />
              <span className="text-[7px] font-black text-white tracking-wider">ENT</span>
            </div>
          </div>
        )
      case 'starter':
      default:
        return null
    }
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    ...(isSignedIn ? [{ href: '/dashboard', label: 'Dashboard' }] : [{ href: '/contact', label: 'Contact' }]),
    { href: '/pricing', label: 'Pricing' },
  ]

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/10' 
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <RepoDocLogo size="md" className="text-white group-hover:scale-105 transition-transform" />
            <span className="text-xl font-semibold text-white tracking-tight">RepoDoc</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  pathname === link.href
                    ? 'text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-white/10 rounded-lg -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isSignedIn && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="relative flex items-center gap-2 p-1 pr-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="relative">
                      <Image
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full ring-2 ring-white/20"
                        src={user.imageUrl || "/docs/images/people/profile-picture-3.jpg"}
                        alt="user photo"
                        unoptimized
                      />
                      {getPlanBadge()}
                    </div>
                    <span className="text-sm text-white/80 hidden sm:block">
                      {user.firstName || 'Account'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="z-50 mt-2 w-64 bg-[#0c0c0f]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                >
                  {/* User Info & Plan */}
                  <div className="px-4 py-3 border-b border-white/10">
                    <span className="block text-sm text-white font-medium truncate">
                      {user.firstName || user.username || 'User'}
                    </span>
                    <span className="block text-xs text-white/50 truncate">
                      {user.emailAddresses[0]?.emailAddress}
                    </span>
                    <div className="mt-2">
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
                        <Badge className="bg-white/10 text-white/80 text-xs px-2 py-0.5 font-medium border border-white/20">
                          Starter
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="py-2">
                    {userPlan === 'starter' && (
                      <Link
                        href="/pricing"
                        className="flex items-center w-full text-left px-4 py-2.5 text-sm text-amber-400 hover:bg-white/5 transition-colors"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Pro
                        <ArrowRight className="h-3 w-3 ml-auto" />
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="flex items-center w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="hidden sm:block px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Button
                  size="sm"
                  className="h-9 px-4 bg-white text-black hover:bg-white/90 rounded-lg font-medium"
                  onClick={() => router.push('/sign-up')}
                >
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open menu</span>
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!isSignedIn && (
                <div className="pt-2 mt-2 border-t border-white/10">
                  <Link
                    href="/sign-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-white/60 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
