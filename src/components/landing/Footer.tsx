import React from 'react'
import Link from 'next/link'
import { Github } from "lucide-react"
import { RepoDocLogo } from "@/components/ui/repodoc-logo"

export default function Footer() {
  return (
    <footer className="glass-dark py-12 border-t border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <RepoDocLogo size="sm" className="text-white" />
              <span className="text-xl font-bold text-white">RepoDoc</span>
            </div>
            <p className="text-white/60 text-sm max-w-md">
              Turn your GitHub repositories into queryable knowledge bases with RAG technology. 
              Ask questions about your generated docs and README and get instant, accurate answers.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-white/60 hover:text-white transition-colors text-sm">About</Link></li>
              <li><Link href="/pricing" className="text-white/60 hover:text-white transition-colors text-sm">Pricing</Link></li>
            </ul>
          </div>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-white/60 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-white/60 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
              </ul>
            </div>
            {/* <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-white/60 hover:text-white transition-colors text-sm">Contact Us</Link></li>
                <li><Link href="/shipping" className="text-white/60 hover:text-white transition-colors text-sm">Shipping Policy</Link></li>
                <li><Link href="/cancellation" className="text-white/60 hover:text-white transition-colors text-sm">Cancellation & Refund</Link></li>
              </ul>
            </div> */}
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
              <span className="hidden h-3 w-px bg-white/20 md:inline-block" />
              <Link href="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link>
              <span className="hidden h-3 w-px bg-white/20 md:inline-block" />
              <Link href="/cancellation" className="hover:text-white transition-colors">Cancellation & Refund</Link>
            </div>
            <div className="flex items-center gap-6">
              <p className="text-white/60 text-sm">
                © 2025 RepoDoc. All rights reserved.
              </p>
              <a href="https://github.com/parbhatkapila4/RepoDocs" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-green-700 transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
