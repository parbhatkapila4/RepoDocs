"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search as SearchIcon,
  Github,
  Star,
  GitFork,
  ExternalLink,
  Code,
  Database,
  Server,
  Globe,
  Loader2,
  Plus,
  RotateCcw,
} from "lucide-react";
import { GitHubSearchResult } from "@/app/api/search/route";
import { toast } from "sonner";
import { createProject } from "@/lib/actions";
import { useProjectsContext } from "@/context/ProjectsContext";

const BACKEND_LANGUAGES = [
  { value: "Python", label: "Python" },
  { value: "Java", label: "Java" },
  { value: "JavaScript", label: "Node.js" },
  { value: "TypeScript", label: "TypeScript" },
  { value: "Go", label: "Go" },
  { value: "Ruby", label: "Ruby" },
  { value: "PHP", label: "PHP" },
  { value: "C#", label: "C#" },
  { value: "C++", label: "C++" },
  { value: "Rust", label: "Rust" },
  { value: "Scala", label: "Scala" },
];

const FRONTEND_LANGUAGES = [
  { value: "JavaScript", label: "JavaScript" },
  { value: "TypeScript", label: "TypeScript" },
  { value: "React", label: "React (via topic)" },
  { value: "Vue", label: "Vue.js" },
  { value: "Angular", label: "Angular (via topic)" },
  { value: "Svelte", label: "Svelte" },
  { value: "Dart", label: "Dart (Flutter)" },
];

const DATABASES = [
  { value: "PostgreSQL", label: "PostgreSQL" },
  { value: "MySQL", label: "MySQL" },
  { value: "MongoDB", label: "MongoDB" },
  { value: "Redis", label: "Redis" },
  { value: "SQLite", label: "SQLite" },
  { value: "MariaDB", label: "MariaDB" },
  { value: "Cassandra", label: "Cassandra" },
  { value: "Elasticsearch", label: "Elasticsearch" },
];

export default function SearchPage() {
  const router = useRouter();
  const { loadProjects } = useProjectsContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [backendLanguage, setBackendLanguage] = useState<string | undefined>(
    undefined
  );
  const [frontendLanguage, setFrontendLanguage] = useState<string | undefined>(
    undefined
  );
  const [database, setDatabase] = useState<string | undefined>(undefined);
  const [results, setResults] = useState<GitHubSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [addingRepoId, setAddingRepoId] = useState<number | null>(null);

  useEffect(() => {
    const mainElement = document.querySelector(
      'main[data-slot="sidebar-inset"]'
    );
    if (mainElement) {
      (mainElement as HTMLElement).style.backgroundColor = "#000000";
    }
    return () => {
      if (mainElement) {
        (mainElement as HTMLElement).style.backgroundColor = "";
      }
    };
  }, []);

  const handleSearch = async (page: number = 1, append: boolean = false) => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setHasSearched(true);
      setResults([]);
      setCurrentPage(1);
    }

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          backendLanguage: backendLanguage || undefined,
          frontendLanguage: frontendLanguage || undefined,
          database: database || undefined,
          page: page,
          perPage: 10,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search repositories");
      }

      if (append) {
        setResults((prev) => [...prev, ...(data.results || [])]);
      } else {
        setResults(data.results || []);
        setTotalCount(data.totalCount || 0);
      }

      setCurrentPage(page);
      setHasMore(data.hasMore || false);

      if (!append) {
        if (data.results && data.results.length === 0) {
          toast.info(
            "No repositories found. Try adjusting your search filters."
          );
        } else {
          toast.success(
            `Found ${data.totalCount} repositories. Showing top 10.`
          );
        }
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error(error.message || "Failed to search repositories");
      if (!append) {
        setResults([]);
        setTotalCount(0);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleShowMore = () => {
    if (hasMore && !isLoadingMore) {
      handleSearch(currentPage + 1, true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(1, false);
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setBackendLanguage(undefined);
    setFrontendLanguage(undefined);
    setDatabase(undefined);
    setResults([]);
    setHasSearched(false);
    setTotalCount(0);
    setCurrentPage(1);
    setHasMore(false);
  };

  const handleAddToMyRepos = async (repo: GitHubSearchResult) => {
    if (addingRepoId !== null) {
      return;
    }

    setAddingRepoId(repo.id);

    try {
      await createProject(repo.name, repo.htmlUrl);

      await loadProjects();

      toast.success("Repository added successfully!", {
        description: `${repo.fullName} has been added to your repositories.`,
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error: any) {
      console.error("Error adding repository:", error);
      toast.error("Failed to add repository", {
        description:
          error.message || "An error occurred while adding the repository.",
      });
      setAddingRepoId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 relative">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Search GitHub Repositories
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Discover public repositories by searching with filters for backend,
            frontend, and database technologies
          </p>
        </div>

        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <SearchIcon className="w-5 h-5" />
              Search Filters
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your search query and optionally filter by technology stack
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Search Query
              </label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="e.g., food app, e-commerce, todo list..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Backend Language
                </label>
                <Select
                  value={backendLanguage}
                  onValueChange={(value) => setBackendLanguage(value)}
                >
                  <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue placeholder="Any Backend" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {BACKEND_LANGUAGES.map((lang) => (
                      <SelectItem
                        key={lang.value}
                        value={lang.value}
                        className="text-white hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Frontend Language
                </label>
                <Select
                  value={frontendLanguage}
                  onValueChange={(value) => setFrontendLanguage(value)}
                >
                  <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue placeholder="Any Frontend" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {FRONTEND_LANGUAGES.map((lang) => (
                      <SelectItem
                        key={lang.value}
                        value={lang.value}
                        className="text-white hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Database
                </label>
                <Select
                  value={database}
                  onValueChange={(value) => setDatabase(value)}
                >
                  <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue placeholder="Any Database" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {DATABASES.map((db) => (
                      <SelectItem
                        key={db.value}
                        value={db.value}
                        className="text-white hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {db.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleSearch(1, false)}
                disabled={isLoading || !searchQuery.trim()}
                className="flex-1 sm:flex-initial bg-white text-black hover:bg-gray-200 font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <SearchIcon className="w-4 h-4 mr-2" />
                    Search Repositories
                  </>
                )}
              </Button>

              <Button
                onClick={handleReset}
                disabled={isLoading}
                variant="outline"
                className="flex-1 sm:flex-initial border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {hasSearched && (
          <div>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2 bg-gray-700" />
                      <Skeleton className="h-4 w-full mb-4 bg-gray-700" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-20 bg-gray-700" />
                        <Skeleton className="h-4 w-20 bg-gray-700" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="mb-4 text-gray-400 text-sm">
                  Found {totalCount.toLocaleString()} repositories. Showing{" "}
                  {results.length} of {totalCount.toLocaleString()} results:
                </div>
                <div className="space-y-4">
                  {results.map((repo) => (
                    <Card
                      key={repo.id}
                      className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Github className="w-5 h-5 text-gray-400 shrink-0" />
                              <a
                                href={repo.htmlUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xl font-semibold text-white hover:text-blue-400 transition-colors truncate"
                              >
                                {repo.fullName}
                              </a>
                              <ExternalLink className="w-4 h-4 text-gray-500 shrink-0" />
                            </div>

                            {repo.description && (
                              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                {repo.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              {repo.language && (
                                <div className="flex items-center gap-2">
                                  <Code className="w-4 h-4 text-gray-400" />
                                  <Badge
                                    variant="outline"
                                    className="border-gray-600 text-gray-300"
                                  >
                                    {repo.language}
                                  </Badge>
                                </div>
                              )}

                              <div className="flex items-center gap-1 text-gray-400">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span>{repo.stars.toLocaleString()}</span>
                              </div>

                              <div className="flex items-center gap-1 text-gray-400">
                                <GitFork className="w-4 h-4" />
                                <span>{repo.forks.toLocaleString()}</span>
                              </div>

                              <div className="text-gray-500 text-xs">
                                Updated{" "}
                                {new Date(repo.updatedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <Button
                              onClick={() => handleAddToMyRepos(repo)}
                              disabled={
                                addingRepoId === repo.id ||
                                addingRepoId !== null
                              }
                              className="bg-white text-black hover:bg-gray-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              size="sm"
                            >
                              {addingRepoId === repo.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add to My Repos
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-6 mb-8 flex justify-center">
                    <Button
                      onClick={handleShowMore}
                      disabled={isLoadingMore}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white min-w-[200px]"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Show More ({results.length} of{" "}
                          {totalCount.toLocaleString()})
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Github className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    No repositories found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your search query or filters to find more
                    results.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!hasSearched && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-12 text-center">
              <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                Start Searching
              </h3>
              <p className="text-gray-500 mb-6">
                Enter a search query above to discover GitHub repositories. You
                can filter by backend, frontend, and database technologies.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge
                  variant="outline"
                  className="border-gray-600 text-gray-400"
                >
                  Example: "food app"
                </Badge>
                <Badge
                  variant="outline"
                  className="border-gray-600 text-gray-400"
                >
                  Example: "e-commerce"
                </Badge>
                <Badge
                  variant="outline"
                  className="border-gray-600 text-gray-400"
                >
                  Example: "todo list"
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
