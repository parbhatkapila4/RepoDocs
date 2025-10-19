import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Star, Users, Code, FileText, Globe } from "lucide-react"

export default function SocialProof() {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Built for production scale
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Real performance metrics from production deployment with proven RAG architecture.
          </p>
        </div>
        
        <div className="relative overflow-hidden mb-16">
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>
          <div className="flex animate-scroll">
            <div className="flex gap-8 min-w-max">
              <Card className="glass-card border-subtle shadow-2xl hover:border-accent transition-all duration-300 flex-shrink-0 w-80 min-h-64">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="flex text-white/60">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/60 mb-4 flex-grow leading-relaxed">
                    &quot;34% better retrieval accuracy vs naive splitting. Measured on 100 real user queries against Next.js repo.&quot;
                  </p>
                  <div className="flex items-center mt-auto">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mr-3 border border-subtle glow-subtle">
                      <span className="text-white font-bold">P</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">Performance</p>
                      <p className="text-sm text-white/60">Semantic Chunking</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-subtle shadow-2xl hover:border-accent transition-all duration-300 flex-shrink-0 w-80 min-h-64">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="flex text-white/60">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/60 mb-4 flex-grow leading-relaxed">
                    &quot;89% recall vs 67% with vector-only. Hybrid search combining dense vectors with BM25 keyword search.&quot;
                  </p>
                  <div className="flex items-center mt-auto">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mr-3 border border-subtle glow-subtle">
                      <span className="text-white font-bold">S</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">Search Quality</p>
                      <p className="text-sm text-white/60">Hybrid RAG</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-subtle shadow-2xl hover:border-accent transition-all duration-300 flex-shrink-0 w-80 min-h-64">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="flex text-white/60">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/60 mb-4 flex-grow leading-relaxed">
                    &quot;847 files/min indexing speed on Next.js repo (33k files). 142ms p50 query latency with 73% cache hit rate.&quot;
                  </p>
                  <div className="flex items-center mt-auto">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mr-3 border border-subtle glow-subtle">
                      <span className="text-white font-bold">S</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">Speed</p>
                      <p className="text-sm text-white/60">Production Metrics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-subtle shadow-2xl hover:border-accent transition-all duration-300 flex-shrink-0 w-80 min-h-64">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="flex text-white/60">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/60 mb-4 flex-grow leading-relaxed">
                    &quot;$50-70/month total cost for production deployment. 60% cost savings with Gemini Flash vs GPT-4.&quot;
                  </p>
                  <div className="flex items-center mt-auto">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mr-3 border border-subtle glow-subtle">
                      <span className="text-white font-bold">C</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">Cost Efficient</p>
                      <p className="text-sm text-white/60">Production Ready</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-subtle shadow-2xl hover:border-accent transition-all duration-300 flex-shrink-0 w-80 min-h-64">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="flex text-white/60">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/60 mb-4 flex-grow leading-relaxed">
                    &quot;P@5=0.89, R@5=0.76, MRR=0.82. Handles 50 concurrent queries maintaining &lt;500ms p95 latency.&quot;
                  </p>
                  <div className="flex items-center mt-auto">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mr-3 border border-subtle glow-subtle">
                      <span className="text-white font-bold">A</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">Accuracy</p>
                      <p className="text-sm text-white/60">RAG Testing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-subtle shadow-2xl hover:border-accent transition-all duration-300 flex-shrink-0 w-80 min-h-64">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="flex text-white/60">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/60 mb-4 flex-grow leading-relaxed">
                    &quot;Open-source RAG system with PostgreSQL + pgvector. Same 180ms p99 latency as Pinecone at $0 marginal cost.&quot;
                  </p>
                  <div className="flex items-center mt-auto">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mr-3 border border-subtle glow-subtle">
                      <span className="text-white font-bold">O</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">Open Source</p>
                      <p className="text-sm text-white/60">Self-Hosted</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-40">
            <div className="text-center">
              <div className="relative inline-flex h-16 w-16 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 mx-auto mb-2">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-slate-950 backdrop-blur-3xl">
                  <Users className="w-8 h-8 text-white brightness-150" />
                </span>
              </div>
              <p className="text-sm text-white brightness-150">Open Source Maintainers</p>
            </div>
            <div className="text-center">
              <div className="relative inline-flex h-16 w-16 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 mx-auto mb-2">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-slate-950 backdrop-blur-3xl">
                  <Code className="w-8 h-8 text-white brightness-150" />
                </span>
              </div>
              <p className="text-sm text-white brightness-150">Engineering Teams</p>
            </div>
            <div className="text-center">
              <div className="relative inline-flex h-16 w-16 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 mx-auto mb-2">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-slate-950 backdrop-blur-3xl">
                  <FileText className="w-8 h-8 text-white brightness-150" />
                </span>
              </div>
              <p className="text-sm text-white brightness-150">Technical Writers</p>
            </div>
            <div className="text-center">
              <div className="relative inline-flex h-16 w-16 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 mx-auto mb-2">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-slate-950 backdrop-blur-3xl">
                  <Globe className="w-8 h-8 text-white brightness-150" />
                </span>
              </div>
              <p className="text-sm text-white brightness-150">Startup Founders</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
