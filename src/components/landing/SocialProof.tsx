"use client"

import React from 'react'
import { motion } from "motion/react"
import { Github, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SocialProof() {
  return (
    <section className="bg-[#0a0a0a] py-32 border-t border-[#1a1a1a]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl">
          <span className="text-[#666] text-sm font-mono tracking-wide block mb-4">
            OPEN SOURCE
          </span>
          <h2 className="text-4xl font-bold text-white mb-6">
            See how it works.
          </h2>
          <p className="text-[#888] text-lg leading-relaxed mb-8">
            RepoDoc is open source. Read the code, run it locally, 
            or contribute. No black boxes.
          </p>
          
          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <a 
              href="https://github.com/Pranav-Patel-123/Repodoc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white hover:border-[#555] transition-colors"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </a>
            <Link 
              href="/sign-up"
              className="inline-flex items-center gap-2 px-5 py-3 text-[#888] hover:text-white transition-colors"
            >
              Try it free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Tech stack - real info */}
        <motion.div 
          className="mt-16 pt-12 border-t border-[#222]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="text-[#555] text-sm font-mono block mb-6">BUILT WITH</span>
          <div className="flex flex-wrap gap-6 text-[#666] text-sm font-mono">
            {['Next.js 15', 'PostgreSQL + pgvector', 'Gemini AI', 'Prisma', 'Clerk Auth'].map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
