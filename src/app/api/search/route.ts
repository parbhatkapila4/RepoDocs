import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Octokit } from "octokit";

export interface SearchFilters {
  query: string;
  backendLanguages?: string[];
  frontendLanguages?: string[];
  databases?: string[];
  page?: number;
  perPage?: number;
}

export interface GitHubSearchResult {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
  owner: {
    login: string;
    avatarUrl: string;
    htmlUrl: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SearchFilters = await request.json();
    const {
      query,
      backendLanguages = [],
      frontendLanguages = [],
      databases = [],
      page = 1,
      perPage = 10,
    } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    let searchQuery = query.trim();

    const languageSet = new Set<string>();

    if (backendLanguages && backendLanguages.length > 0) {
      backendLanguages.forEach((lang) => {
        if (lang && lang.trim()) {
          languageSet.add(lang.trim());
        }
      });
    }

    if (frontendLanguages && frontendLanguages.length > 0) {
      frontendLanguages.forEach((lang) => {
        if (lang && lang.trim()) {
          languageSet.add(lang.trim());
        }
      });
    }

    if (databases && databases.length > 0) {
      const dbTerms = databases
        .filter((db) => db && db.trim())
        .map((db) => db.trim());
      if (dbTerms.length > 0) {
        searchQuery += ` ${dbTerms.join(" OR ")}`;
      }
    }

    const frontendTopics: Record<string, string> = {
      React: "react",
      Vue: "vue",
      Svelte: "svelte",
      Angular: "angular",
    };

    const languageFilters = Array.from(languageSet).map(
      (lang) => `language:${lang}`
    );

    const topicFilters: string[] = [];
    if (frontendLanguages && frontendLanguages.length > 0) {
      frontendLanguages.forEach((lang) => {
        if (lang && frontendTopics[lang]) {
          topicFilters.push(`topic:${frontendTopics[lang]}`);
        }
      });
    }

    if (languageFilters.length > 0 || topicFilters.length > 0) {
      const allFilters: string[] = [...languageFilters, ...topicFilters];
      if (allFilters.length === 1) {
        searchQuery = `${searchQuery} ${allFilters[0]}`;
      } else {
        searchQuery = `${searchQuery} (${allFilters.join(" OR ")})`;
      }
    }

    searchQuery += " is:public";

    const token = process.env.GITHUB_TOKEN;
    const octokit = new Octokit({
      auth: token || undefined,
    });

    try {
      const pageNumber = Math.max(1, page);
      const perPageNumber = Math.min(100, Math.max(1, perPage));

      const response = await octokit.rest.search.repos({
        q: searchQuery,
        sort: "stars",
        order: "desc",
        per_page: perPageNumber,
        page: pageNumber,
      });

      const results: GitHubSearchResult[] = response.data.items
        .filter((repo) => repo.owner !== null)
        .map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          htmlUrl: repo.html_url,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          updatedAt: repo.updated_at,
          owner: {
            login: repo.owner!.login,
            avatarUrl: repo.owner!.avatar_url,
            htmlUrl: repo.owner!.html_url,
          },
        }));

      return NextResponse.json({
        success: true,
        results,
        totalCount: response.data.total_count,
        page: pageNumber,
        perPage: perPageNumber,
        hasMore: pageNumber * perPageNumber < response.data.total_count,
      });
    } catch (error: any) {
      console.error("GitHub API error:", error);

      if (error.status === 403) {
        return NextResponse.json(
          { error: "GitHub API rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }

      if (error.status === 422) {
        return NextResponse.json(
          {
            error: "Invalid search query. Please try a different search term.",
          },
          { status: 400 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("Error searching GitHub repositories:", error);
    return NextResponse.json(
      { error: "Failed to search repositories" },
      { status: 500 }
    );
  }
}
