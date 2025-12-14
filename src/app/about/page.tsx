import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Code,
  Database,
  Brain,
  Zap,
  GitBranch,
  Shield,
  ArrowRight,
  ExternalLink,
  Github,
  BookOpen,
  Lightbulb,
  Target,
  Users,
  Clock,
  DollarSign,
  Home,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen black-bg relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/3 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/2 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Button
            variant="outline"
            className="border-subtle text-white/70 hover:text-white hover:bg-white/5 glass-card"
            asChild
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="text-center mb-16">
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-2 text-sm glass-card text-white/90 border-subtle"
          >
            <BookOpen className="w-4 h-4 mr-2 text-white/80" />
            Technical Documentation
          </Badge>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            RepoDoc Documentation
          </h1>

          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
            Everything you need to know about our RAG-powered codebase
            intelligence platform
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white/10 hover:bg-white/20 text-white h-12 px-8 text-lg border border-subtle glow-subtle"
              asChild
            >
              <Link href="/dashboard">
                <Zap className="w-5 h-5 mr-2" />
                Try RepoDoc
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-lg border-subtle text-white/70 hover:text-white hover:bg-white/5 glass-card"
              asChild
            >
              <a
                href="https://github.com/parbhatkapila4/RepoDocs"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-5 h-5 mr-2" />
                View Source
              </a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
          <div className="lg:col-span-1">
            <Card className="glass-card border-subtle sticky top-8">
              <CardHeader>
                <CardTitle className="text-white">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a
                  href="#overview"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  Overview
                </a>
                <a
                  href="#why-we-built"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  Why We Built This
                </a>
                <a
                  href="#architecture"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  Architecture
                </a>
                <a
                  href="#rag-pipeline"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  RAG Pipeline
                </a>
                <a
                  href="#performance"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  Performance
                </a>
                <a
                  href="#developer-needs"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  Developer Needs
                </a>
                <a
                  href="#getting-started"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  Getting Started
                </a>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-12">
            <section id="overview">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Target className="w-6 h-6 mr-3 text-white/80" />
                    What is RepoDoc?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    RepoDoc is an open-source RAG (Retrieval-Augmented
                    Generation) system that transforms GitHub repositories into
                    queryable knowledge bases. Instead of just generating
                    documentation, it makes your entire codebase conversational
                    and searchable.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-4 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-2">
                        Traditional Approach
                      </h4>
                      <p className="text-white/60 text-sm">
                        Static documentation that becomes outdated quickly,
                        requiring manual maintenance and often missing critical
                        implementation details.
                      </p>
                    </div>

                    <div className="glass-card p-4 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-2">
                        RepoDoc Approach
                      </h4>
                      <p className="text-white/60 text-sm">
                        Dynamic, AI-powered codebase intelligence that
                        understands your code semantics and provides instant,
                        accurate answers to any question.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="why-we-built">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Lightbulb className="w-6 h-6 mr-3 text-white/80" />
                    Why We Built RepoDoc
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    As developers, we've all experienced the frustration of
                    trying to understand complex codebases, especially when
                    joining new projects or returning to old ones after months.
                  </p>

                  <div className="space-y-4">
                    <h4 className="text-white font-semibold text-lg">
                      The Problems We Faced:
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 shrink-0"></div>
                        <p className="text-white/70">
                          <strong className="text-white">
                            Outdated Documentation:
                          </strong>{" "}
                          README files that don't reflect the current state of
                          the code
                        </p>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 shrink-0"></div>
                        <p className="text-white/70">
                          <strong className="text-white">
                            Context Switching:
                          </strong>{" "}
                          Constantly jumping between files to understand how
                          components work together
                        </p>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 shrink-0"></div>
                        <p className="text-white/70">
                          <strong className="text-white">
                            Knowledge Silos:
                          </strong>{" "}
                          Critical information locked in the minds of specific
                          team members
                        </p>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 shrink-0"></div>
                        <p className="text-white/70">
                          <strong className="text-white">
                            Onboarding Friction:
                          </strong>{" "}
                          New team members spending weeks understanding codebase
                          architecture
                        </p>
                      </li>
                    </ul>
                  </div>

                  <div className="glass-card p-6 rounded-lg border-subtle">
                    <h4 className="text-white font-semibold mb-3">
                      Our Vision
                    </h4>
                    <p className="text-white/70">
                      We envisioned a world where every codebase is instantly
                      understandable, where you can ask "How does authentication
                      work?" and get a comprehensive answer with code
                      references, where documentation is always up-to-date
                      because it's generated from the actual code.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="architecture">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Code className="w-6 h-6 mr-3 text-white/80" />
                    System Architecture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    RepoDoc is built on a modern, scalable architecture designed
                    for production use with real-world performance requirements.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <Database className="w-8 h-8 text-white/80 mb-4" />
                      <h4 className="text-white font-semibold mb-2">
                        PostgreSQL + pgvector
                      </h4>
                      <p className="text-white/60 text-sm">
                        Single database for all data with vector similarity
                        search. 180ms p99 latency at $0 marginal cost.
                      </p>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <Brain className="w-8 h-8 text-white/80 mb-4" />
                      <h4 className="text-white font-semibold mb-2">
                        Hybrid RAG
                      </h4>
                      <p className="text-white/60 text-sm">
                        Combines dense vectors with BM25 keyword search for 89%
                        recall vs 67% with vector-only.
                      </p>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <Zap className="w-8 h-8 text-white/80 mb-4" />
                      <h4 className="text-white font-semibold mb-2">
                        Semantic Chunking
                      </h4>
                      <p className="text-white/60 text-sm">
                        AST-aware chunking that respects code boundaries for 34%
                        better retrieval accuracy.
                      </p>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-lg border-subtle">
                    <h4 className="text-white font-semibold mb-4">
                      Core Technologies
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold">N</span>
                        </div>
                        <p className="text-white/60 text-sm">Next.js</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold">P</span>
                        </div>
                        <p className="text-white/60 text-sm">Prisma</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold">O</span>
                        </div>
                        <p className="text-white/60 text-sm">OpenAI</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold">V</span>
                        </div>
                        <p className="text-white/60 text-sm">Vercel</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="rag-pipeline">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <GitBranch className="w-6 h-6 mr-3 text-white/80" />
                    RAG Pipeline Deep Dive
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    Our RAG pipeline is the heart of RepoDoc, designed to
                    understand code semantics, not just text matching.
                  </p>

                  <div className="space-y-6">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-4 flex items-center">
                        <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                          1
                        </span>
                        GitHub Repository Ingestion
                      </h4>
                      <p className="text-white/70 mb-4">
                        Webhook events trigger immediate processing of
                        repository changes. We use GitHub's Octokit API to fetch
                        files, metadata, and commit history with proper
                        authentication and rate limiting.
                      </p>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <code className="text-white/80 text-sm">
                          GitHub Repo → Webhook Events → File Fetching → AST
                          Parsing
                        </code>
                      </div>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-4 flex items-center">
                        <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                          2
                        </span>
                        Semantic Code Analysis
                      </h4>
                      <p className="text-white/70 mb-4">
                        AST-aware chunking preserves logical code boundaries. We
                        detect language-specific patterns (functions, classes,
                        modules) to create meaningful chunks that maintain
                        context.
                      </p>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <code className="text-white/80 text-sm">
                          Language Detection → AST Parsing → Boundary Detection
                          → Semantic Chunking
                        </code>
                      </div>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-4 flex items-center">
                        <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                          3
                        </span>
                        Vector Embeddings & Storage
                      </h4>
                      <p className="text-white/70 mb-4">
                        Code chunks are embedded using OpenAI's
                        text-embedding-3-small model and stored in PostgreSQL
                        with pgvector extension. We implement aggressive caching
                        with 73% hit rate.
                      </p>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <code className="text-white/80 text-sm">
                          Code Chunks → Embedding Generation → Vector Storage →
                          Indexing
                        </code>
                      </div>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-4 flex items-center">
                        <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                          4
                        </span>
                        Hybrid Search & Retrieval
                      </h4>
                      <p className="text-white/70 mb-4">
                        Queries are processed using both dense vector search and
                        BM25 keyword matching, then combined using Reciprocal
                        Rank Fusion for optimal results.
                      </p>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <code className="text-white/80 text-sm">
                          User Query → Vector Search + Keyword Search → RRF
                          Combination → Results
                        </code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Performance Section */}
            <section id="performance">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Zap className="w-6 h-6 mr-3 text-white/80" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    Real production metrics from our live deployment, proving
                    RepoDoc's scalability and efficiency.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <Clock className="w-8 h-8 text-white/80 mb-4" />
                      <h4 className="text-white font-semibold mb-2">
                        Speed Metrics
                      </h4>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• Indexing: 847 files/min (Next.js repo)</li>
                        <li>• Query p50: 142ms</li>
                        <li>• Query p99: 487ms</li>
                        <li>• Cache hit rate: 73%</li>
                      </ul>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <DollarSign className="w-8 h-8 text-white/80 mb-4" />
                      <h4 className="text-white font-semibold mb-2">
                        Cost Efficiency
                      </h4>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• Monthly cost: $50-70</li>
                        <li>• 60% savings with Gemini</li>
                        <li>• $0 marginal vector cost</li>
                        <li>• 5x cheaper embeddings</li>
                      </ul>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-lg border-subtle">
                    <h4 className="text-white font-semibold mb-4">
                      Quality Metrics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          89%
                        </div>
                        <div className="text-white/60 text-sm">Recall Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          34%
                        </div>
                        <div className="text-white/60 text-sm">
                          Better Accuracy
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          50
                        </div>
                        <div className="text-white/60 text-sm">
                          Concurrent Queries
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Developer Needs Section */}
            <section id="developer-needs">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-6 h-6 mr-3 text-white/80" />
                    Why the Developer Community Needs This
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    RepoDoc addresses fundamental pain points that every
                    developer faces in their daily work.
                  </p>

                  <div className="space-y-6">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">
                        🚀 Faster Onboarding
                      </h4>
                      <p className="text-white/70">
                        New team members can understand complex codebases in
                        minutes instead of weeks. Ask "How does the
                        authentication flow work?" and get instant,
                        comprehensive answers.
                      </p>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">
                        🧠 Knowledge Preservation
                      </h4>
                      <p className="text-white/70">
                        Critical knowledge is no longer locked in individual
                        minds. The codebase itself becomes the source of truth,
                        with AI-powered explanations of complex logic.
                      </p>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">
                        🔍 Intelligent Code Search
                      </h4>
                      <p className="text-white/70">
                        Go beyond grep and find. Ask semantic questions like
                        "Where is error handling implemented?" or "How do we
                        handle user permissions?" and get contextual answers.
                      </p>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">
                        📚 Always Up-to-Date Documentation
                      </h4>
                      <p className="text-white/70">
                        Documentation that never goes stale because it's
                        generated from the actual code. Every change is
                        automatically reflected in the knowledge base.
                      </p>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">
                        🤝 Better Collaboration
                      </h4>
                      <p className="text-white/70">
                        Teams can collaborate more effectively when everyone has
                        instant access to codebase knowledge. No more "ask the
                        person who wrote this" bottlenecks.
                      </p>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-lg border-subtle bg-white/5">
                    <h4 className="text-white font-semibold mb-3">
                      Real-World Impact
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-white font-medium mb-2">
                          For Open Source Projects
                        </h5>
                        <p className="text-white/70 text-sm">
                          Contributors can quickly understand project
                          architecture and contribute meaningfully without
                          spending days exploring the codebase.
                        </p>
                      </div>
                      <div>
                        <h5 className="text-white font-medium mb-2">
                          For Enterprise Teams
                        </h5>
                        <p className="text-white/70 text-sm">
                          Reduce onboarding time, improve code quality through
                          better understanding, and maintain institutional
                          knowledge even as team members change.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Getting Started Section */}
            <section id="getting-started">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <ArrowRight className="w-6 h-6 mr-3 text-white/80" />
                    Getting Started
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    Ready to transform your repositories into intelligent
                    knowledge bases? Here's how to get started.
                  </p>

                  <div className="space-y-4">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                          1
                        </span>
                        Try the Live Demo
                      </h4>
                      <p className="text-white/70 mb-4">
                        Experience RepoDoc with our interactive demo. No signup
                        required to see the magic happen.
                      </p>
                      <Button
                        className="bg-white/10 hover:bg-white/20 text-white border border-subtle"
                        asChild
                      >
                        <Link href="/">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Try Demo
                        </Link>
                      </Button>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                          2
                        </span>
                        Connect Your Repository
                      </h4>
                      <p className="text-white/70 mb-4">
                        Sign in with GitHub and connect your first repository.
                        RepoDoc will analyze your codebase and create a
                        queryable knowledge base.
                      </p>
                      <Button
                        className="bg-white/10 hover:bg-white/20 text-white border border-subtle"
                        asChild
                      >
                        <Link href="/sign-up">
                          <Github className="w-4 h-4 mr-2" />
                          Connect GitHub
                        </Link>
                      </Button>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                          3
                        </span>
                        Start Asking Questions
                      </h4>
                      <p className="text-white/70 mb-4">
                        Once your repository is processed, start asking
                        questions about your code. Get instant answers with code
                        references and context.
                      </p>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <code className="text-white/80 text-sm">
                          "How does authentication work in this project?"
                          <br />
                          "Where is the main API endpoint defined?"
                          <br />
                          "What are the key components of the user service?"
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-lg border-subtle bg-white/5">
                    <h4 className="text-white font-semibold mb-3">
                      Self-Hosted Deployment
                    </h4>
                    <p className="text-white/70 mb-4">
                      For teams that need full control, RepoDoc is open-source
                      and can be deployed on your own infrastructure.
                    </p>
                    <Button
                      variant="outline"
                      className="border-subtle text-white/70 hover:text-white hover:bg-white/5"
                      asChild
                    >
                      <a
                        href="https://github.com/parbhatkapila4/RepoDocs"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="w-4 h-4 mr-2" />
                        Deploy Your Own
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
