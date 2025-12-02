"use client"

import React from 'react'
import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function CTASection() {
  const { isSignedIn } = useUser()
  const router = useRouter()

  return (
    <section className="bg-[#0a0a0a] py-32 border-t border-[#1a1a1a]">
      <div className="max-w-6xl mx-auto px-6">
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
            onClick={() => router.push(isSignedIn ? '/create' : '/sign-up')}
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

