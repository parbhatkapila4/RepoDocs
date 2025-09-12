import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Code, GitBranch, Shield } from "lucide-react"

export default function Features() {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything you need to document your code
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            From AI-powered analysis to one-click PRs, RepoDoc handles the entire documentation workflow.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="glass-card border-subtle hover:border-accent transition-all duration-300 hover:scale-105">
            <CardHeader>
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4 border border-subtle glow-subtle">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl text-white">AI-driven README & Docs</CardTitle>
              <CardDescription className="text-white/60">
                One-click generation with installation guides, usage examples, and API documentation.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="glass-card border-subtle hover:border-accent transition-all duration-300 hover:scale-105">
            <CardHeader>
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4 border border-subtle glow-subtle">
                <Code className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl text-white">Repo Intelligence</CardTitle>
              <CardDescription className="text-white/60">
                File summaries, TODOs, env vars, and API routes automatically extracted and organized.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="glass-card border-subtle hover:border-accent transition-all duration-300 hover:scale-105">
            <CardHeader>
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4 border border-subtle glow-subtle">
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl text-white">One-click PR & Share</CardTitle>
              <CardDescription className="text-white/60">
                Open a PR to add docs or publish a public docs page with a shareable link.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="glass-card border-subtle hover:border-accent transition-all duration-300 hover:scale-105">
            <CardHeader>
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4 border border-subtle glow-subtle">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl text-white">Secure & Fast</CardTitle>
              <CardDescription className="text-white/60">
                Only public repos by default, OAuth for private access, and intelligent caching for speed.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  )
}
