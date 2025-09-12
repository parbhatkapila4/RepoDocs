"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { FileText, Menu, X } from "lucide-react"
import { useUser } from "@clerk/nextjs"

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isSignedIn } = useUser()

  return (
    <nav className="glass sticky top-0 z-50 border-b border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-subtle glow-subtle">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">RepoDoc</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/5">
              Docs
            </Button>
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/5">
              GitHub
            </Button>
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button className="bg-white/10 hover:bg-white/20 text-white border border-subtle glow-subtle">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/5">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-white/10 hover:bg-white/20 text-white border border-subtle glow-subtle">
                    Sign Up
                  </Button>
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
              className="text-white/70 hover:text-white hover:bg-white/5"
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
          <div className="md:hidden border-t border-subtle glass-card">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Button variant="ghost" size="sm" className="w-full justify-start text-white/70 hover:text-white hover:bg-white/5">
                Docs
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-white/70 hover:text-white hover:bg-white/5">
                GitHub
              </Button>
              {isSignedIn ? (
                <Link href="/dashboard" className="w-full">
                  <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-subtle glow-subtle">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="w-full">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-white/70 hover:text-white hover:bg-white/5">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up" className="w-full">
                    <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-subtle glow-subtle">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
