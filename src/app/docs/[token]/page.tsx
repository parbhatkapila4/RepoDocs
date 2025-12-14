import React from "react";
import { getPublicDocs } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  Star,
  GitFork,
  Globe,
  Calendar,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PublicDocsPageProps {
  params: {
    token: string;
  };
}

export default async function PublicDocsPage({ params }: PublicDocsPageProps) {
  try {
    const share = await getPublicDocs(params.token);

    if (!share) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-white/20 bg-gray-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto text-white/50 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Documentation Not Found
                </h3>
                <p className="text-white/50">
                  This documentation link is invalid or has expired.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    const { docs } = share;
    const { project } = docs;

    return (
      <div className="min-h-screen bg-gray-900">
        <div className="border-b border-white/10 bg-gray-800/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 border border-white/20 rounded-xl">
                  <BookOpen className="h-6 w-6 text-white/70" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {project.name} - Technical Documentation
                  </h1>
                  <p className="text-white/50 mt-1">Public documentation</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="border-white/20 text-white/70"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Repository
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <Card className="border border-white/20 shadow-xl bg-gray-800/50">
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-8">
                  <div className="max-w-4xl mx-auto">
                    <div className="prose prose-invert prose-lg max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        className="text-white"
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-3xl font-bold text-white mb-6 border-b border-white/20 pb-3">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-2xl font-semibold text-white mb-4 mt-8">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-xl font-semibold text-white mb-3 mt-6">
                              {children}
                            </h3>
                          ),
                          h4: ({ children }) => (
                            <h4 className="text-lg font-semibold text-white mb-2 mt-4">
                              {children}
                            </h4>
                          ),
                          p: ({ children }) => {
                            const hasOnlyImages = React.Children.toArray(
                              children
                            ).every(
                              (child) =>
                                React.isValidElement(child) &&
                                child.type === "img"
                            );

                            return (
                              <p
                                className={`text-white/80 leading-relaxed ${hasOnlyImages ? "mb-4" : "mb-4"}`}
                              >
                                {children}
                              </p>
                            );
                          },
                          ul: ({ children }) => (
                            <ul className="text-white/80 mb-4 space-y-2">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="text-white/80 mb-4 space-y-2 list-decimal list-inside">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="flex items-baseline gap-2">
                              <span className="text-white/40 leading-relaxed">
                                •
                              </span>
                              <span className="leading-relaxed">
                                {children}
                              </span>
                            </li>
                          ),
                          code: ({ children }) => (
                            <code className="bg-white/10 text-white/90 px-2 py-1 rounded text-sm font-mono">
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <div className="relative mb-4">
                              <div className="overflow-x-auto max-w-full scrollbar-thin">
                                <pre className="bg-gray-900/50 border border-white/10 rounded-lg p-4 text-sm whitespace-pre min-w-max">
                                  {children}
                                </pre>
                              </div>
                            </div>
                          ),
                          img: ({ src, alt, ...props }) => (
                            <img
                              src={src}
                              alt={alt}
                              {...props}
                              className="inline-block mr-2 mb-2"
                              style={{
                                display: "inline-block",
                                marginRight: "8px",
                                marginBottom: "8px",
                              }}
                            />
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-white/20 pl-4 italic text-white/70 mb-4">
                              {children}
                            </blockquote>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto mb-4">
                              <table className="w-full border-collapse border border-white/20">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="border border-white/20 px-4 py-2 bg-white/10 text-white font-semibold text-left">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="border border-white/20 px-4 py-2 text-white/80">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {docs.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="border-t border-white/10 bg-gray-800/50 backdrop-blur-sm mt-8">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between text-white/50 text-sm">
              <div className="flex items-center gap-4">
                <span>Generated by RepoDocs</span>
                <span>•</span>
                <span>
                  Last updated: {new Date(docs.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Created: {new Date(docs.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching public docs:", error);

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border border-white/20 bg-gray-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-white/50 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Documentation Not Found
              </h3>
              <p className="text-white/50">
                This documentation link is invalid or has expired.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
