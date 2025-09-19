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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center glass-card p-6 sm:p-8 rounded-2xl border-subtle hover:border-accent transition-all duration-300">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-subtle glow-subtle floating">
              <span className="text-xl sm:text-2xl font-bold text-white">1</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white">Connect & Analyze</h3>
            <p className="text-white/60 text-sm sm:text-base">
              Sign in with GitHub or paste a repo URL. RepoDoc fetches key files via Octokit and analyzes your codebase structure.
            </p>
          </div>
          
          <div className="text-center glass-card p-6 sm:p-8 rounded-2xl border-subtle hover:border-accent transition-all duration-300">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-subtle glow-subtle floating" style={{animationDelay: '2s'}}>
              <span className="text-xl sm:text-2xl font-bold text-white">2</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white">AI Generation</h3>
            <p className="text-white/60 text-sm sm:text-base">
              Our AI summarizes code, extracts patterns, and generates comprehensive README, API docs, and architecture diagrams.
            </p>
          </div>
          
          <div className="text-center glass-card p-6 sm:p-8 rounded-2xl border-subtle hover:border-accent transition-all duration-300">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-subtle glow-subtle floating" style={{animationDelay: '4s'}}>
              <span className="text-xl sm:text-2xl font-bold text-white">3</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white">Share & Deploy</h3>
            <p className="text-white/60 text-sm sm:text-base">
              Download README, create a gist, open a PR, or share a public docs link — all with one click.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
