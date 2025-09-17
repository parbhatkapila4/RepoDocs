"use client"
import React from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Github, Play, Zap } from "lucide-react"
import { motion } from "motion/react"
import { Vortex } from "@/components/ui/vortex"
import { cn } from "@/lib/utils"

export default function Hero() {
  return (
    <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <Vortex
        backgroundColor="black"
        className="flex items-center flex-col justify-center px-2 md:px-10 py-4 w-full h-full mb-52"
      >
        <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm glass-card text-white/90 border-subtle">
            <Zap className="w-4 h-4 mr-2 text-white/80" />
            AI-powered documentation in 60 seconds
          </Badge>
          
          <motion.h1 
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            initial={{  opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            {["AI", "generates", "documentation", "from", "your", "GitHub", "repo", "instantly."].map((word, index) => (
              <motion.span
                key={index}
                initial={{ 
                  opacity: 0, 
                  y: 10,
                  filter: "blur(8px)",
                  scale: 0.2
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  filter: "blur(0px)",
                  scale: 1
                }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className={word === "professional" || word === "documentation" ? "text-white/90 text-glow-subtle" : ""}
              >
                {word}{' '}
              </motion.span>
            ))}
          </motion.h1>
          
          <p className="text-xl text-white/60 mb-8 max-w-3xl mx-auto leading-relaxed">
            {["Paste", "your", "GitHub", "URL.", "AI", "analyzes", "your", "code", "and", "generates", "README", "files", "and", "docs", "instantly."].map((word, index) => (
              <motion.span
                key={index}
                initial={{ 
                  opacity: 0, 
                  y: 10,
                  filter: "blur(8px)",
                  scale: 0.2
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  filter: "blur(0px)",
                  scale: 1
                }}
                transition={{
                  duration: 0.8,
                  delay: (index * 0.08),
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                {word}{' '}
              </motion.span>
            ))}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-white/10 hover:bg-white/20 text-white h-12 px-8 text-lg border border-subtle glow-subtle"
              aria-label="Sign in with GitHub to analyze your repositories"
            >
              <Github className="w-5 h-5 mr-2" />
              Analyze My Repos
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-12 px-8 text-lg border-subtle text-white/70 hover:text-white hover:bg-white/5 glass-card"
              aria-label="View demo of AI-generated documentation"
            >
              <Play className="w-5 h-5 mr-2" />
              See AI Demo
            </Button>
          </div>
          
          {/* Hero Visual */}
          <div className="relative max-w-5xl mx-auto">
            <div className="glass-card rounded-2xl p-8 shadow-2xl border-subtle floating">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="glass-card rounded-lg p-4 border-subtle">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-4 bg-white/10 rounded w-1/2"></div>
                      <div className="h-4 bg-white/10 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="text-sm text-white/50">
                    <p>🤖 AI analyzing codebase...</p>
                    <p>📊 Understanding architecture</p>
                    <p>📝 Generating documentation</p>
                  </div>
                </div>
                <div className="glass-card rounded-lg p-6 border-subtle">
                  <h3 className="font-semibold mb-3 text-white">AI-Generated Documentation</h3>
                  <div className="space-y-2 text-sm">
                    <div className="h-3 bg-white/10 rounded w-full"></div>
                    <div className="h-3 bg-white/10 rounded w-4/5"></div>
                    <div className="h-3 bg-white/10 rounded w-3/4"></div>
                    <div className="h-3 bg-white/10 rounded w-5/6"></div>
                  </div>
                  <div className="mt-4 p-3 bg-white/5 rounded border-l-4 border-white/20">
                    <div className="h-2 bg-white/10 rounded w-full mb-1"></div>
                    <div className="h-2 bg-white/10 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </Vortex>
    </section>
  )
}
