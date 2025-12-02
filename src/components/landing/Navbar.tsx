"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUser } from "@clerk/nextjs"
import { useRouter } from 'next/navigation'
import { Menu, X, ArrowRight } from 'lucide-react'

export default function Navbar() {
  const { isSignedIn } = useUser()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#1a1a1a]' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/repodoc.png" alt="RepoDoc" width={28} height={28} />
            <span className="text-white font-semibold">RepoDoc</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className="text-[#888] hover:text-white transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            {isSignedIn ? (
              <button 
                onClick={() => router.push('/create')}
                className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-[#eee] transition-colors flex items-center gap-1.5"
              >
                Get started
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <Link 
                  href="/sign-in"
                  className="text-[#888] hover:text-white transition-colors text-sm"
                >
                  Sign in
                </Link>
                <button 
                  onClick={() => router.push('/sign-up')}
                  className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-[#eee] transition-colors flex items-center gap-1.5"
                >
                  Get started
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#1a1a1a]">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="text-[#888] hover:text-white transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-[#1a1a1a]">
                {isSignedIn ? (
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false)
                      router.push('/create')
                    }}
                    className="block w-full px-4 py-2 bg-white text-black text-center font-medium rounded-md"
                  >
                    Get started
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false)
                      router.push('/sign-up')
                    }}
                    className="block w-full px-4 py-2 bg-white text-black text-center font-medium rounded-md"
                  >
                    Get started
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

