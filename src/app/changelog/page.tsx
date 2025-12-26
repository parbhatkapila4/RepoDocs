import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Shield,
  Rocket,
  Bug,
  Settings,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface ChangelogEntry {
  version: string;
  type: "major" | "minor" | "patch";
  changes: {
    type: "added" | "changed" | "fixed" | "security" | "deprecated" | "removed";
    items: string[];
  }[];
}

const changelogEntries: ChangelogEntry[] = [
  {
    version: "1.0.0",
    type: "major",
    changes: [
      {
        type: "added",
        items: [
          "GitHub repository integration using LangChain GithubRepoLoader",
          "RAG-powered conversational code search with Gemini 2.5 Flash",
          "Vector embeddings using text-embedding-004 (768 dimensions)",
          "PostgreSQL + pgvector for vector similarity search",
          "One-click documentation generation from codebase",
          "Automated README generation with AI analysis",
          "Shareable documentation links with token-based access",
          "Shareable README links with token-based access",
          "Repository analytics dashboard with language distribution",
          "Multi-project support with project management",
          "Clerk authentication integration",
          "Stripe payment integration with subscription plans",
          "Rate limiting and API protection",
          "OpenRouter integration as LLM fallback",
          "Conversation history tracking in chat interface",
          "Code reference citations in AI responses",
          "Syntax highlighting in code snippets using react-syntax-highlighter",
          "Iterative documentation refinement through QnA",
          "QnA history for docs and README",
          "Semantic code search API endpoint",
          "Project sidebar with quick navigation",
          "Dark theme with glass-morphism design",
        ],
      },
    ],
  },
  {
    version: "0.9.0",
    type: "minor",
    changes: [
      {
        type: "added",
        items: [
          "Public share link functionality for documentation",
          "Public share link functionality for README",
          "Share link revocation capability",
          "Markdown rendering with remark-gfm support",
          "Repository information display with GitHub stats",
          "Language distribution visualization",
          "Repository metadata display (stars, forks, watchers)",
        ],
      },
      {
        type: "changed",
        items: [
          "Improved RAG pipeline with better code chunking",
          "Enhanced embedding quality with optimized prompts",
          "Better error handling and retry logic",
          "Improved UI/UX with loading states",
        ],
      },
      {
        type: "fixed",
        items: [
          "Fixed vector search accuracy for large codebases",
          "Resolved GitHub API rate limiting issues",
          "Fixed embedding generation for large files",
        ],
      },
    ],
  },
  {
    version: "0.8.0",
    type: "minor",
    changes: [
      {
        type: "added",
        items: [
          "Redux Toolkit for state management",
          "Project context and custom hooks",
          "Analytics page with platform metrics",
          "Database indexes for improved query performance",
          "Error handling and monitoring infrastructure",
        ],
      },
      {
        type: "changed",
        items: [
          "Migrated to Next.js 16 with App Router",
          "Upgraded to Prisma 6 with pgvector support",
          "Optimized database queries",
          "Refactored API routes for better organization",
        ],
      },
      {
        type: "security",
        items: [
          "Input validation with Zod schemas",
          "SQL injection prevention with Prisma parameterized queries",
          "Rate limiting with token bucket algorithm",
          "CSRF protection and XSS safeguards",
        ],
      },
    ],
  },
  {
    version: "0.7.0",
    type: "minor",
    changes: [
      {
        type: "added",
        items: [
          "Landing page with demo video",
          "Pricing page with subscription plans",
          "About page with technical documentation",
          "Terms of Service and Privacy Policy pages",
          "Contact page",
        ],
      },
      {
        type: "changed",
        items: [
          "Improved landing page design and messaging",
          "Enhanced mobile responsiveness",
          "Better SEO optimization",
        ],
      },
    ],
  },
  {
    version: "0.6.0",
    type: "minor",
    changes: [
      {
        type: "added",
        items: [
          "Jest testing framework setup",
          "React Testing Library for component tests",
          "API route tests",
          "RAG pipeline tests",
        ],
      },
      {
        type: "changed",
        items: [
          "Improved code quality with linting",
          "TypeScript strict mode",
          "Enhanced type safety across codebase",
        ],
      },
    ],
  },
];

const changeTypeConfig = {
  added: {
    icon: CheckCircle2,
    color: "text-green-400",
    bg: "bg-green-400/10",
    label: "Added",
  },
  changed: {
    icon: Settings,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    label: "Changed",
  },
  fixed: {
    icon: Bug,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    label: "Fixed",
  },
  security: {
    icon: Shield,
    color: "text-red-400",
    bg: "bg-red-400/10",
    label: "Security",
  },
  deprecated: {
    icon: AlertCircle,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    label: "Deprecated",
  },
  removed: {
    icon: AlertCircle,
    color: "text-gray-400",
    bg: "bg-gray-400/10",
    label: "Removed",
  },
};

const versionTypeConfig = {
  major: {
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    label: "Major",
  },
  minor: {
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    label: "Minor",
  },
  patch: {
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    label: "Patch",
  },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen black-bg relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              Product Updates
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-white via-purple-100 to-blue-100 bg-clip-text text-transparent">
            Changelog
          </h1>

          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8 leading-relaxed">
            All notable changes and updates to RepoDoc. We're constantly
            improving to make codebase intelligence better for developers.
          </p>
        </div>

        <div className="space-y-6">
          {changelogEntries.map((entry, entryIndex) => {
            const versionConfig = versionTypeConfig[entry.type];
            const versionIcons = {
              major: Rocket,
              minor: Zap,
              patch: Settings,
            };
            const VersionIcon = versionIcons[entry.type];

            return (
              <Card
                key={entry.version}
                className="glass-card border-subtle relative overflow-hidden group hover:border-white/20 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-blue-500/0 to-indigo-500/0 group-hover:from-purple-500/5 group-hover:via-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-500 pointer-events-none"></div>

                {entryIndex < changelogEntries.length - 1 && (
                  <div className="absolute left-10 top-24 bottom-0 w-0.5 bg-gradient-to-b from-white/20 via-white/10 to-transparent"></div>
                )}

                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-2 border-purple-500/30 flex items-center justify-center shrink-0 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                          <VersionIcon className="w-10 h-10 text-white/80" />
                        </div>
                        {entryIndex === 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black/20 animate-pulse"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <CardTitle className="text-white text-3xl font-bold">
                            Version {entry.version}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`${versionConfig.color} border backdrop-blur-sm font-semibold`}
                          >
                            {versionConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 relative z-10">
                  {entry.changes.map((changeGroup, groupIndex) => {
                    const config = changeTypeConfig[changeGroup.type];
                    const Icon = config.icon;

                    return (
                      <div key={groupIndex} className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center border ${config.color.replace("text-", "border-")}/30 backdrop-blur-sm`}
                          >
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <h3 className="text-white font-semibold text-xl">
                            {config.label}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-14">
                          {changeGroup.items.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-200 group/item"
                            >
                              <div className="w-1.5 h-1.5 bg-white/60 rounded-full mt-2 shrink-0 group-hover/item:bg-white transition-colors"></div>
                              <span className="leading-relaxed text-white/80 group-hover/item:text-white transition-colors text-sm">
                                {item}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
