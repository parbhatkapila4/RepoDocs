import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  Code,
  Database,
  MessageSquare,
  FileText,
  Search,
  BarChart3,
  Github,
  Zap,
  Shield,
  Key,
  Play,
} from "lucide-react";
import Link from "next/link";

export default function DocumentationPage() {
  return (
    <div className="min-h-screen black-bg relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Button
            variant="outline"
            className="border-subtle text-white/70 hover:text-white hover:bg-white/5 glass-card backdrop-blur-sm"
            asChild
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 mb-6 backdrop-blur-sm">
            <span className="text-sm font-medium text-white/90">
              Documentation
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-white via-purple-100 to-blue-100 bg-clip-text text-transparent">
            Documentation
          </h1>

          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8 leading-relaxed">
            Complete guide to using RepoDoc. Learn how to connect repositories,
            query your codebase, and generate documentation.
          </p>
        </div>

        <div className="space-y-8">
          <Card className="glass-card border-subtle">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Play className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle className="text-white text-2xl">
                  Getting Started
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-sm font-semibold">1</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Sign Up</h3>
                    <p className="text-white/70 text-sm">
                      Create an account using Clerk authentication. Sign in with
                      your GitHub account or email.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      Create a Project
                    </h3>
                    <p className="text-white/70 text-sm">
                      Navigate to the Create page and add a GitHub repository
                      URL. RepoDoc will automatically index your codebase.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-sm font-semibold">3</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      Start Querying
                    </h3>
                    <p className="text-white/70 text-sm">
                      Once indexing is complete, use the Chat page to ask
                      questions about your codebase in natural language.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-subtle">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-white text-2xl">Features</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <MessageSquare className="w-5 h-5 text-purple-400 mb-2" />
                  <h3 className="text-white font-semibold mb-1">
                    Chat with Code
                  </h3>
                  <p className="text-white/70 text-sm">
                    Ask questions about your codebase using natural language.
                    Get answers with code references and citations.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <FileText className="w-5 h-5 text-blue-400 mb-2" />
                  <h3 className="text-white font-semibold mb-1">
                    Documentation Generation
                  </h3>
                  <p className="text-white/70 text-sm">
                    Generate comprehensive technical documentation from your
                    codebase automatically.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <BookOpen className="w-5 h-5 text-green-400 mb-2" />
                  <h3 className="text-white font-semibold mb-1">
                    README Generation
                  </h3>
                  <p className="text-white/70 text-sm">
                    Create professional README files with installation, usage,
                    and API documentation sections.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <Search className="w-5 h-5 text-yellow-400 mb-2" />
                  <h3 className="text-white font-semibold mb-1">
                    Semantic Search
                  </h3>
                  <p className="text-white/70 text-sm">
                    Search your codebase semantically to find relevant code
                    sections based on meaning, not just keywords.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <BarChart3 className="w-5 h-5 text-indigo-400 mb-2" />
                  <h3 className="text-white font-semibold mb-1">
                    Repository Analytics
                  </h3>
                  <p className="text-white/70 text-sm">
                    View repository statistics including language distribution,
                    GitHub stats, and project metrics.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <Github className="w-5 h-5 text-pink-400 mb-2" />
                  <h3 className="text-white font-semibold mb-1">
                    Public Sharing
                  </h3>
                  <p className="text-white/70 text-sm">
                    Generate shareable links for your documentation and README
                    files with token-based access control.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-subtle">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <Code className="w-6 h-6 text-green-400" />
                </div>
                <CardTitle className="text-white text-2xl">
                  API Reference
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <span className="text-green-400">POST</span>
                    <code className="text-white/90">/api/query</code>
                  </h3>
                  <p className="text-white/70 text-sm mb-3">
                    Query your codebase with natural language questions.
                  </p>
                  <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                    <pre className="text-white/80 text-xs overflow-x-auto">
                      {`{
  "projectId": "uuid",
  "question": "How does authentication work?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "previous question"
    },
    {
      "role": "assistant",
      "content": "previous answer"
    }
  ]
}`}
                    </pre>
                  </div>
                  <div className="mt-3 bg-black/30 rounded-lg p-4 border border-white/10">
                    <p className="text-white/70 text-xs mb-2">Response:</p>
                    <pre className="text-white/80 text-xs overflow-x-auto">
                      {`{
  "answer": "Authentication in this codebase...",
  "sources": [
    {
      "fileName": "src/lib/auth.ts",
      "similarity": 0.89,
      "summary": "Handles user authentication..."
    }
  ]
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <span className="text-green-400">POST</span>
                    <code className="text-white/90">/api/search</code>
                  </h3>
                  <p className="text-white/70 text-sm mb-3">
                    Perform semantic search across your codebase.
                  </p>
                  <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                    <pre className="text-white/80 text-xs overflow-x-auto">
                      {`{
  "projectId": "uuid",
  "query": "rate limiting",
  "limit": 10
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <span className="text-blue-400">GET</span>
                    <code className="text-white/90">/api/analytics</code>
                  </h3>
                  <p className="text-white/70 text-sm">
                    Get platform analytics and metrics. Requires authentication.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-subtle">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-400" />
                </div>
                <CardTitle className="text-white text-2xl">
                  Authentication
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/70 text-sm">
                RepoDoc uses Clerk for authentication. All protected routes
                require a valid session.
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Key className="w-4 h-4 text-white/60 mt-0.5 shrink-0" />
                  <p className="text-white/70 text-sm">
                    Sign in with GitHub or email to access your projects
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Key className="w-4 h-4 text-white/60 mt-0.5 shrink-0" />
                  <p className="text-white/70 text-sm">
                    API endpoints require authentication via Clerk session
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Key className="w-4 h-4 text-white/60 mt-0.5 shrink-0" />
                  <p className="text-white/70 text-sm">
                    Projects are scoped to the authenticated user
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-subtle">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Database className="w-6 h-6 text-indigo-400" />
                </div>
                <CardTitle className="text-white text-2xl">
                  Technical Details
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="text-white font-semibold mb-2">
                    RAG Pipeline
                  </h3>
                  <p className="text-white/70 text-sm mb-2">
                    RepoDoc uses a Retrieval-Augmented Generation (RAG) system:
                  </p>
                  <ul className="space-y-1 ml-4 text-white/70 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-white/40 mt-1">•</span>
                      <span>
                        GitHub repository files are loaded using LangChain's
                        GithubRepoLoader
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white/40 mt-1">•</span>
                      <span>
                        Each file is summarized using Google Gemini 2.5 Flash
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white/40 mt-1">•</span>
                      <span>
                        Summaries are embedded using text-embedding-004 (768
                        dimensions)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white/40 mt-1">•</span>
                      <span>
                        Vectors are stored in PostgreSQL with pgvector extension
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white/40 mt-1">•</span>
                      <span>
                        Queries use vector similarity search to find relevant
                        code
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2">Database</h3>
                  <p className="text-white/70 text-sm">
                    PostgreSQL with pgvector extension for vector similarity
                    search. Prisma ORM is used for database access.
                  </p>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2">AI Models</h3>
                  <p className="text-white/70 text-sm">
                    Google Gemini 2.5 Flash for code summarization and answer
                    generation. OpenRouter is used as a fallback for LLM
                    requests.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-subtle">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-yellow-400" />
                </div>
                <CardTitle className="text-white text-2xl">
                  Usage Examples
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="text-white font-semibold mb-2">
                    Example Questions
                  </h3>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white/90 text-sm">
                        "How does authentication work in this project?"
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white/90 text-sm">
                        "Where is the API rate limiting implemented?"
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white/90 text-sm">
                        "Explain the main components of this codebase"
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2">
                    Documentation Refinement
                  </h3>
                  <p className="text-white/70 text-sm">
                    After generating documentation or README, you can refine it
                    through QnA. Ask questions like "Add a troubleshooting
                    section" or "Update the API examples" to modify the
                    generated content.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-white/60 text-sm mb-4">
            Need more help? Check out our GitHub repository or contact support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              className="border-subtle text-white/70 hover:text-white hover:bg-white/5 backdrop-blur-sm"
              asChild
            >
              <a
                href="https://github.com/parbhatkapila4/RepoDocs"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-4 h-4 mr-2" />
                View on GitHub
              </a>
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-purple-500/25"
              asChild
            >
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
