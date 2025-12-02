"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Github, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/repodoc.png" alt="RepoDoc" width={28} height={28} />
              <span className="text-white font-semibold">RepoDoc</span>
            </Link>
            <p className="text-[#666] text-sm max-w-xs mb-6">
              RAG-powered code intelligence. Ask your codebase anything.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://github.com/parbhatkapila4" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#666] hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="https://x.com/Parbhat03" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#666] hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-medium mb-4">Product</h4>
            <ul className="space-y-3">
              {['Pricing', 'Documentation', 'Changelog'].map((item) => (
                <li key={item}>
                  <Link href={`/${item.toLowerCase()}`} className="text-[#666] hover:text-white transition-colors text-sm">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Company</h4>
            <ul className="space-y-3">
              {['About', 'Contact', 'Privacy'].map((item) => (
                <li key={item}>
                  <Link href={`/${item.toLowerCase()}`} className="text-[#666] hover:text-white transition-colors text-sm">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-[#1a1a1a] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#555] text-sm">
            © 2025 RepoDoc. All rights reserved.
          </p>
          <Link href="/terms" className="text-[#555] hover:text-white transition-colors text-sm">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  )
}
