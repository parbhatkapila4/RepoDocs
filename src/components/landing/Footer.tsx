"use client"
import React from 'react'
import Link from 'next/link'
import { Github, Twitter, Linkedin, Youtube } from "lucide-react"
import { RepoDocLogo } from "@/components/ui/repodoc-logo"

export default function Footer() {
  return (
    <footer className="relative bg-[#0a0a0f] overflow-hidden">
      {/* Red glassy gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Bottom left red glow */}
        <div 
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(127, 29, 29, 0.8) 0%, rgba(127, 29, 29, 0.4) 30%, rgba(127, 29, 29, 0.1) 50%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* Bottom right red glow */}
        <div 
          className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(153, 27, 27, 0.7) 0%, rgba(127, 29, 29, 0.3) 40%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        {/* Subtle top accent */}
        <div 
          className="absolute -top-20 left-1/3 w-[300px] h-[200px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(185, 28, 28, 0.5) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />
      </div>
      
      {/* Noise texture overlay for glass effect */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Main Footer Content */}
      <div className="relative z-10">
        {/* Top section with subtle border */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
            {/* Footer Links Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
              {/* Logo Column */}
              <div className="col-span-2">
                <div className="flex items-center space-x-3 mb-5">
                  <RepoDocLogo size="md" />
                  <span className="text-[22px] font-semibold text-white tracking-tight">RepoDoc</span>
                </div>
                <p className="text-[#8b949e] text-sm leading-relaxed max-w-xs">
                  Transform your GitHub repositories into intelligent, queryable knowledge bases with RAG technology.
                </p>
              </div>

              {/* Product */}
              <div>
                <h3 className="text-white font-medium mb-4 text-sm">Product</h3>
                <ul className="space-y-3">
                  <li><Link href="/dashboard" className="text-[#8b949e] hover:text-white transition-colors text-sm">Dashboard</Link></li>
                  <li><Link href="/pricing" className="text-[#8b949e] hover:text-white transition-colors text-sm">Pricing</Link></li>
                  <li><Link href="/create" className="text-[#8b949e] hover:text-white transition-colors text-sm">Create Project</Link></li>
                </ul>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-white font-medium mb-4 text-sm">Features</h3>
                <ul className="space-y-3">
                  <li><Link href="/docs" className="text-[#8b949e] hover:text-white transition-colors text-sm">Documentation</Link></li>
                  <li><Link href="/chat" className="text-[#8b949e] hover:text-white transition-colors text-sm">AI Chat</Link></li>
                  <li><Link href="/readme" className="text-[#8b949e] hover:text-white transition-colors text-sm">README Generator</Link></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-white font-medium mb-4 text-sm">Resources</h3>
                <ul className="space-y-3">
                  <li><Link href="/about" className="text-[#8b949e] hover:text-white transition-colors text-sm">About</Link></li>
                  <li><Link href="/contact" className="text-[#8b949e] hover:text-white transition-colors text-sm">Contact</Link></li>
                  <li><a href="https://github.com/parbhatkapila4/RepoDocs" target="_blank" rel="noopener noreferrer" className="text-[#8b949e] hover:text-white transition-colors text-sm">GitHub</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-white font-medium mb-4 text-sm">Legal</h3>
                <ul className="space-y-3">
                  <li><Link href="/privacy" className="text-[#8b949e] hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-[#8b949e] hover:text-white transition-colors text-sm">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-6 text-xs text-[#8b949e]">
                <span>© 2025 RepoDoc, Inc.</span>
                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              </div>
              
              {/* Social Icons */}
              <div className="flex items-center gap-5">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-[#8b949e] hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-[#8b949e] hover:text-white transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-[#8b949e] hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="https://github.com/parbhatkapila4/RepoDocs" target="_blank" rel="noopener noreferrer" className="text-[#8b949e] hover:text-white transition-colors">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
