"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { FileText, Menu, X } from "lucide-react"
import { useUser } from "@clerk/nextjs"

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isSignedIn } = useUser()

  return (
    <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br border-none from-white/20 to-white/5 rounded-2xl flex items-center justify-center  shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">RepoDoc</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3">
            {isSignedIn ? (
              <Link href="/dashboard">
                <HoverBorderGradient
                  containerClassName="rounded-2xl"
                  as="button"
                  className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2 px-4 py-1"
                >
                  <span className="font-medium">Dashboard</span>
                </HoverBorderGradient>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl px-4 py-2 transition-all duration-200">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <HoverBorderGradient
                    containerClassName="rounded-2xl"
                    as="button"
                    className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2 px-4 py-1"
                  >
                    <span className="font-medium">Sign Up</span>
                  </HoverBorderGradient>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl p-2 transition-all duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass-card backdrop-blur-xl">
            <div className="px-4 pt-4 pb-4 space-y-3">
              {isSignedIn ? (
                <Link href="/dashboard" className="w-full">
                  <HoverBorderGradient
                    containerClassName="rounded-2xl w-full"
                    as="button"
                    className="dark:bg-black bg-white text-black dark:text-white flex items-center justify-center space-x-2 w-full py-3"
                  >
                    <span className="font-medium">Dashboard</span>
                  </HoverBorderGradient>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="w-full">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10 rounded-xl py-3 transition-all duration-200">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up" className="w-full">
                    <HoverBorderGradient
                      containerClassName="rounded-2xl w-full"
                      as="button"
                      className="dark:bg-black bg-white text-black dark:text-white flex items-center justify-center space-x-2 w-full py-3"
                    >
                      <span className="font-medium">Sign Up</span>
                    </HoverBorderGradient>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
