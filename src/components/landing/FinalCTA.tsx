"use client"

import React from 'react'
import { ArrowRight } from "lucide-react"
import { motion } from "motion/react"
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'

export default function FinalCTA() {
  const { isAuthenticated } = useUser()
  const router = useRouter()

  return (
    <section className="py-32 bg-[#0a0a0a] border-t border-[#1a1a1a] relative">
      {/* Grain texture */}
      <div 
        className="absolute inset-0 opacity-[0.12] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Stop reading code.
            <br />
            <span className="text-[#666]">Start understanding it.</span>
          </h2>
          
          <p className="text-[#888] text-xl mb-10 max-w-xl mx-auto">
            Free for public repos. No credit card required.
          </p>

          <button
            onClick={() => router.push(isAuthenticated ? '/create' : '/sign-up')}
            className="group px-8 py-4 bg-white text-black font-medium rounded-lg inline-flex items-center gap-3 hover:bg-[#eee] transition-colors text-lg"
          >
            Get started free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  )
}
