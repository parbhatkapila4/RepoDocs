import React from 'react'

export default function HowItWorks() {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            How it works
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Three simple steps to transform your repository into professional documentation.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center glass-card p-8 rounded-2xl border-subtle hover:border-accent transition-all duration-300">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-subtle glow-subtle floating">
              <span className="text-2xl font-bold text-white">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-white">Connect & Analyze</h3>
            <p className="text-white/60">
              Sign in with GitHub or paste a repo URL. RepoDoc fetches key files via Octokit and analyzes your codebase structure.
            </p>
          </div>
          
          <div className="text-center glass-card p-8 rounded-2xl border-subtle hover:border-accent transition-all duration-300">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-subtle glow-subtle floating" style={{animationDelay: '2s'}}>
              <span className="text-2xl font-bold text-white">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-white">AI Generation</h3>
            <p className="text-white/60">
              Our AI summarizes code, extracts patterns, and generates comprehensive README, API docs, and architecture diagrams.
            </p>
          </div>
          
          <div className="text-center glass-card p-8 rounded-2xl border-subtle hover:border-accent transition-all duration-300">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-subtle glow-subtle floating" style={{animationDelay: '4s'}}>
              <span className="text-2xl font-bold text-white">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-white">Share & Deploy</h3>
            <p className="text-white/60">
              Download README, create a gist, open a PR, or share a public docs link — all with one click.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
