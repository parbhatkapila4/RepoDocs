"use client"

import React from 'react'
import { motion } from "motion/react"

export default function HowItWorks() {
  return (
    <section className="bg-[#0a0a0a] py-32 border-t border-[#1a1a1a]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left - Content */}
          <div>
            <span className="text-[#666] text-sm font-mono tracking-wide block mb-4">
              HOW IT WORKS
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
              Three commands.
              <br />
              <span className="text-[#666]">That's it.</span>
            </h2>
            <p className="text-[#888] text-lg leading-relaxed mb-8">
              No complex setup. No configuration files. 
              Connect your repo and start asking questions in under a minute.
            </p>
          </div>

          {/* Right - Steps */}
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Connect',
                description: 'Paste a GitHub URL or sign in with OAuth. We handle the rest.',
                code: '$ repodoc connect vercel/next.js'
              },
              {
                step: '2', 
                title: 'Index',
                description: 'We analyze every file, build semantic embeddings, create a searchable knowledge base.',
                code: 'Indexing 33,847 files... done (23s)'
              },
              {
                step: '3',
                title: 'Ask',
                description: 'Query in plain English. Get answers with exact code references.',
                code: '$ repodoc ask "How does auth work?"'
              },
            ].map((item, index) => (
              <motion.div 
                key={item.step}
                className="group"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border border-[#333] flex items-center justify-center text-[#666] text-sm font-mono">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-[#666] mb-3">{item.description}</p>
                    <code className="text-sm text-[#50fa7b] font-mono bg-[#1a1a1a] px-3 py-1.5 rounded inline-block">
                      {item.code}
                    </code>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
