"use client"
import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Star, Users, Code, FileText, Globe } from "lucide-react"

// Metric card data
const metrics = [
  {
    stars: 5,
    quote: "34% better retrieval accuracy vs naive splitting. Measured on 100 real user queries against Next.js repo.",
    initial: "P",
    title: "Performance",
    subtitle: "Semantic Chunking"
  },
  {
    stars: 5,
    quote: "89% recall vs 67% with vector-only. Hybrid search combining dense vectors with BM25 keyword search.",
    initial: "S",
    title: "Search Quality",
    subtitle: "Hybrid RAG"
  },
  {
    stars: 3,
    quote: "847 files/min indexing speed on Next.js repo (33k files). 142ms p50 query latency with 73% cache hit rate.",
    initial: "S",
    title: "Speed",
    subtitle: "Production Metrics"
  },
  {
    stars: 5,
    quote: "$50-70/month total cost for production deployment. 60% cost savings with Gemini Flash vs GPT-4.",
    initial: "C",
    title: "Cost Efficient",
    subtitle: "Production Ready"
  },
  {
    stars: 5,
    quote: "P@5=0.89, R@5=0.76, MRR=0.82. Handles 50 concurrent queries maintaining <500ms p95 latency.",
    initial: "A",
    title: "Accuracy",
    subtitle: "RAG Testing"
  },
  {
    stars: 5,
    quote: "Open-source RAG system with PostgreSQL + pgvector. Same 180ms p99 latency as Pinecone at $0 marginal cost.",
    initial: "O",
    title: "Open Source",
    subtitle: "Self-Hosted"
  }
]

// Single metric card component
const MetricCard = ({ metric }: { metric: typeof metrics[0] }) => (
  <Card className="glass-card border-subtle shadow-2xl hover:border-accent transition-all duration-300 flex-shrink-0 w-72 sm:w-80 h-64">
    <CardContent className="p-5 sm:p-6 h-full flex flex-col">
      <div className="flex items-center mb-3 sm:mb-4">
        <div className="flex text-white/60">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`w-4 h-4 sm:w-5 sm:h-5 ${i < metric.stars ? 'fill-current text-yellow-400' : 'text-white/20'}`} 
            />
          ))}
        </div>
      </div>
      <p className="text-white/60 mb-3 sm:mb-4 flex-grow leading-relaxed text-sm sm:text-base">
        &quot;{metric.quote}&quot;
      </p>
      <div className="flex items-center mt-auto">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center mr-3 border border-subtle glow-subtle">
          <span className="text-white font-bold text-sm sm:text-base">{metric.initial}</span>
        </div>
        <div>
          <p className="font-medium text-white text-sm sm:text-base">{metric.title}</p>
          <p className="text-xs sm:text-sm text-white/60">{metric.subtitle}</p>
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function SocialProof() {
  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      {/* CSS for infinite scroll animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-infinite-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-infinite-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Built for production scale
          </h2>
          <p className="text-base sm:text-xl text-white/70 max-w-2xl mx-auto">
            Real performance metrics from production deployment with proven RAG architecture.
          </p>
        </div>
        
        {/* Infinite Scroll Carousel */}
        <div className="relative mb-12 sm:mb-16">
          {/* Gradient Overlays for smooth fade effect */}
          <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-black via-black/80 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-black via-black/80 to-transparent z-10 pointer-events-none"></div>
          
          {/* Scrolling Container */}
          <div className="overflow-hidden">
            <div className="animate-infinite-scroll flex gap-6 sm:gap-8 w-max">
              {/* First set of cards */}
              {metrics.map((metric, index) => (
                <MetricCard key={`first-${index}`} metric={metric} />
              ))}
              {/* Duplicate set for seamless loop */}
              {metrics.map((metric, index) => (
                <MetricCard key={`second-${index}`} metric={metric} />
              ))}
            </div>
          </div>
        </div>
        
        {/* Target Audience Icons */}
        <div className="text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 items-center">
            <div className="text-center group">
              <div className="inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 mx-auto mb-2 group-hover:scale-110 group-hover:border-purple-400/50 transition-all duration-300">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white/70 group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs sm:text-sm text-white/60 group-hover:text-white/80 transition-colors">Open Source Maintainers</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 mx-auto mb-2 group-hover:scale-110 group-hover:border-purple-400/50 transition-all duration-300">
                <Code className="w-6 h-6 sm:w-8 sm:h-8 text-white/70 group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs sm:text-sm text-white/60 group-hover:text-white/80 transition-colors">Engineering Teams</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 mx-auto mb-2 group-hover:scale-110 group-hover:border-purple-400/50 transition-all duration-300">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white/70 group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs sm:text-sm text-white/60 group-hover:text-white/80 transition-colors">Technical Writers</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 mx-auto mb-2 group-hover:scale-110 group-hover:border-purple-400/50 transition-all duration-300">
                <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-white/70 group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs sm:text-sm text-white/60 group-hover:text-white/80 transition-colors">Startup Founders</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
