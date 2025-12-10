"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { ArrowRight, Play } from "lucide-react"
import { motion } from "motion/react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { VideoModal } from "./VideoModal"

// Terminal component with real feel
const Terminal = () => {
  const [lines, setLines] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState(0)
  
  const terminalLines = useMemo(() => [
    '$ repodoc init',
    'Connecting to github.com/vercel/next.js...',
    'Indexing 33,847 files...',
    '████████████████████ 100%',
    '',
    '✓ Knowledge base ready',
    '',
    '$ repodoc ask "How does routing work?"',
    '',
    'The App Router in Next.js uses a file-system',
    'based router built on React Server Components.',
    '',
    'See: app/page.tsx (L12-45)',
    '     lib/router.ts (L89-124)',
  ], [])

  useEffect(() => {
    if (currentLine < terminalLines.length) {
      const timeout = setTimeout(() => {
        setLines(prev => [...prev, terminalLines[currentLine]])
        setCurrentLine(prev => prev + 1)
      }, currentLine === 0 ? 500 : terminalLines[currentLine] === '' ? 200 : 
         terminalLines[currentLine].includes('████') ? 800 : 100)
      return () => clearTimeout(timeout)
    } else {
      // Reset after a pause
      const timeout = setTimeout(() => {
        setLines([])
        setCurrentLine(0)
      }, 4000)
      return () => clearTimeout(timeout)
    }
  }, [currentLine, terminalLines])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#333] shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 bg-[#252525] border-b border-[#333]">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-[#666] text-sm font-mono">terminal</span>
        </div>
        <div className="p-6 font-mono text-sm min-h-[320px]">
          {lines.map((line, i) => (
            <div 
              key={i} 
              className={`${
                line.startsWith('$') ? 'text-[#50fa7b]' :
                line.startsWith('✓') ? 'text-[#50fa7b]' :
                line.includes('████') ? 'text-[#8be9fd]' :
                line.startsWith('See:') ? 'text-[#bd93f9]' :
                line.includes('L12') || line.includes('L89') ? 'text-[#bd93f9]' :
                'text-[#f8f8f2]'
              }`}
            >
              {line || '\u00A0'}
            </div>
          ))}
          <span className="inline-block w-2 h-4 bg-[#f8f8f2] animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  const { isSignedIn } = useUser()
  const router = useRouter()
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  return (
    <section className="min-h-screen bg-[#0a0a0a] relative">
      {/* Grain texture */}
      <div 
        className="absolute inset-0 opacity-[0.12] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Single accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#333] to-transparent" />
      
      <div className="max-w-6xl mx-auto px-6 pt-32 pb-20 relative z-10">
        {/* Small label */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-[#666] text-sm font-mono tracking-wide">
            RAG-POWERED CODE INTELLIGENCE
          </span>
        </motion.div>

        {/* Main headline - Big, bold, simple */}
        <motion.h1 
          className="text-[clamp(3rem,8vw,7rem)] font-bold leading-[0.95] tracking-tight text-white mb-8 max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Ask your codebase
          <br />
          <span className="text-[#666]">anything.</span>
        </motion.h1>

        {/* Subheadline - Concise */}
        <motion.p 
          className="text-xl text-[#888] max-w-xl mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Connect a GitHub repo. Get instant answers with precise code references. 
          No more digging through files.
        </motion.p>

        {/* CTAs - Clean and simple */}
        <motion.div 
          className="flex flex-wrap gap-4 mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <button
            onClick={() => router.push(isSignedIn ? '/create' : '/sign-up')}
            className="group px-6 py-3 bg-white text-black font-medium rounded-lg flex items-center gap-2 hover:bg-[#eee] transition-colors"
          >
            Get started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          
          <button
            onClick={() => setIsVideoModalOpen(true)}
            className="px-6 py-3 text-[#888] font-medium rounded-lg flex items-center gap-2 hover:text-white transition-colors border border-[#333] hover:border-[#555]"
          >
            <Play className="w-4 h-4" />
            Watch demo
          </button>
        </motion.div>

        {/* Terminal demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Terminal />
        </motion.div>

        {/* What makes this different */}
        <motion.div 
          className="mt-20 pt-12 border-t border-[#222]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { value: 'pgvector', label: 'Real vector search, not keyword matching' },
              { value: 'Line-level', label: 'Answers cite exact file:line references' },
              { value: 'Shareable', label: 'Generate public links to docs & READMEs' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-xl font-bold text-white mb-1 font-mono">{stat.value}</div>
                <div className="text-sm text-[#666]">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      
      <VideoModal
        videoSrc="/Repodoc-demo.mp4"
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </section>
  )
}
