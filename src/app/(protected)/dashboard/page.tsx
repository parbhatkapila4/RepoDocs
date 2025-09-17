"use client";
import React, { useEffect, useCallback } from 'react';
import { useProjectsContext } from '@/context/ProjectsContext';
import { useRepository } from '@/hooks/useRepository';
import { useUser } from '@/hooks/useUser';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Github, 
  Star, 
  GitFork, 
  Eye, 
  AlertCircle, 
  Calendar,
  Code,
  Shield,
  Globe,
  Download,
  BookOpen,
  Archive,
  Lock,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

function ReposPage() {
  const { projects, selectedProjectId } = useProjectsContext();
  const { 
    currentRepository: repoInfo, 
    isLoading: loading, 
    error, 
    fetchRepository,
    refreshRepository 
  } = useRepository();
  const { user, isLoading: userLoading } = useUser();

  const currentProject = projects.find(p => p.id === selectedProjectId);

  const fetchRepoInfo = useCallback(async () => {
    if (!currentProject?.repoUrl) {
      return;
    }

    try {
      const info = await fetchRepository(currentProject.repoUrl);
      if (info) {
        toast.success('Repository information loaded successfully');
      } else {
        toast.error('Failed to load repository information');
      }
    } catch (err) {
      console.error('Error fetching repo info:', err);
      toast.error('Failed to load repository information');
    }
  }, [currentProject?.repoUrl, fetchRepository]);

  const handleRefresh = useCallback(async () => {
    if (!currentProject?.repoUrl) {
      return;
    }

    try {
      const info = await refreshRepository(currentProject.repoUrl);
      if (info) {
        toast.success('Repository information refreshed successfully');
      } else {
        toast.error('Failed to refresh repository information');
      }
    } catch (err) {
      console.error('Error refreshing repo info:', err);
      toast.error('Failed to refresh repository information');
    }
  }, [currentProject?.repoUrl, refreshRepository]);

  useEffect(() => {
    if (currentProject?.repoUrl) {
      fetchRepoInfo();
    }
  }, [currentProject?.repoUrl, fetchRepoInfo]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (sizeInKB: number) => {
    if (sizeInKB < 1024) return `${sizeInKB} KB`;
    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      'JavaScript': '#f7df1e',
      'TypeScript': '#3178c6',
      'Python': '#3776ab',
      'Java': '#ed8b00',
      'C++': '#00599c',
      'C#': '#239120',
      'Go': '#00add8',
      'Rust': '#000000',
      'PHP': '#777bb4',
      'Ruby': '#cc342d',
      'Swift': '#fa7343',
      'Kotlin': '#7f52ff',
      'HTML': '#e34f26',
      'CSS': '#1572b6',
      'Vue': '#4fc08d',
      'React': '#61dafb',
      'Angular': '#dd0031',
      'Svelte': '#ff3e00',
      'Dart': '#0175c2',
      'Scala': '#dc322f',
      'Clojure': '#5881d8',
      'Haskell': '#5d4f85',
      'Elixir': '#4b275f',
      'Erlang': '#a90533',
      'Lua': '#000080',
      'Perl': '#39457e',
      'R': '#276dc3',
      'MATLAB': '#e16737',
      'Shell': '#89e051',
      'PowerShell': '#012456',
      'Dockerfile': '#2496ed',
      'YAML': '#cb171e',
      'JSON': '#000000',
      'Markdown': '#083fa1',
      'TeX': '#3d6117',
      'Assembly': '#6e4c13',
      'C': '#a8b9cc',
      'Objective-C': '#438eff',
      'CoffeeScript': '#244776',
      'F#': '#378bba',
      'OCaml': '#3be133',
      'Pascal': '#e3f171',
      'Prolog': '#74283c',
      'Tcl': '#e4cc98',
      'Vim script': '#199f4b',
      'Emacs Lisp': '#c065db',
      'Common Lisp': '#3fb68b',
      'Scheme': '#1e4a72',
      'Smalltalk': '#596706',
      'Ada': '#02f88c',
      'Fortran': '#4d41b1',
      'COBOL': '#ff6d01',
      'Forth': '#341708',
      'APL': '#5a8164',
      'J': '#9e0202',
      'K': '#28430a',
      'Q': '#0040cd',
      'Raku': '#0000fb',
      'Nim': '#ffc200',
      'Crystal': '#000100',
      'Julia': '#9558b2',
      'D': '#ba595e',
      'Zig': '#f7a41d',
      'V': '#4f87c4',
      'Odin': '#60afff',
      'Pony': '#e2a4ff',
      'Red': '#f50000',
      'Rebol': '#358a5b',
      'Factor': '#636746',
      'PostScript': '#da291c',
      'Io': '#a9188d',
      'Ioke': '#078193',
      'Nu': '#c9df40',
      'Opa': '#ce7c00',
      'Oz': '#feb95c',
      'Pike': '#005390',
      'Racket': '#3c5caa',
      'Self': '#0579aa',
      'Squirrel': '#800000',
      'Standard ML': '#dc566d',
      'SuperCollider': '#46390b',
      'SystemVerilog': '#dae1c2',
      'Turing': '#cf142b',
      'Unified Parallel C': '#4e3617',
      'Uno': '#9933cc',
      'UnrealScript': '#a54c4d',
      'Vala': '#fbe5cd',
      'Verilog': '#b2b7f8',
      'VHDL': '#adb2cb',
      'Visual Basic .NET': '#945db7',
      'Volt': '#1f1f1f',
      'WebAssembly': '#654ff0',
      'wisp': '#7582d9',
      'X10': '#4b6bef',
      'xBase': '#403a40',
      'XC': '#99da07',
      'Xojo': '#81bd41',
      'XPL0': '#000000',
      'XProc': '#52b9e9',
      'XQuery': '#5232e7',
      'XSLT': '#eb8ceb',
      'Xtend': '#24255d',
      'Yacc': '#4b6c4b',
      'YARA': '#220000',
      'YASnippet': '#32ab90',
      'ZAP': '#0d665e',
      'Zephir': '#118f9e',
      'ZIL': '#dc75e5',
      'Zsh': '#89e051'
    };
    return colors[language] || '#6b7280';
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Loading...</CardTitle>
            <CardDescription className="text-center">
              Please wait while we load your information
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">No Project Selected</CardTitle>
            <CardDescription className="text-center">
              Please select a project to view repository information
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Repository Information</h1>
          <p className="text-gray-400 mt-2">
            Detailed information about {currentProject.name}
          </p>
        </div>
        <Button 
          variant="default"
          onClick={handleRefresh} 
          disabled={loading}
          className=""
        >
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {repoInfo && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Repository Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Github className="h-8 w-8 text-white" />
                  <div>
                    <CardTitle className="text-xl text-white">
                      {repoInfo.fullName}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {repoInfo.description || 'No description available'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {repoInfo.isPrivate && <Lock className="h-4 w-4 text-yellow-400" />}
                  {repoInfo.isArchived && <Archive className="h-4 w-4 text-gray-400" />}
                  <Badge variant={repoInfo.isPrivate ? "destructive" : "secondary"}>
                    {repoInfo.visibility}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-white">{repoInfo.stars.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitFork className="h-4 w-4 text-blue-400" />
                  <span className="text-white">{repoInfo.forks.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-green-400" />
                  <span className="text-white">{repoInfo.watchers.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-white">{repoInfo.openIssues.toLocaleString()}</span>
                </div>
              </div>

              {/* Languages */}
              {repoInfo.language && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Primary Language</h4>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getLanguageColor(repoInfo.language) }}
                    />
                    <span className="text-white">{repoInfo.language}</span>
                  </div>
                </div>
              )}

              {/* All Languages */}
              {Object.keys(repoInfo.languages).length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(repoInfo.languages).map(([lang]) => (
                      <Badge key={lang} variant="outline" className="text-white border-gray-600">
                        <div 
                          className="w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: getLanguageColor(lang) }}
                        />
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {repoInfo.topics.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {repoInfo.topics.map((topic) => (
                      <Badge key={topic} variant="secondary" className="text-white bg-gray-700">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(repoInfo.htmlUrl, '_blank')}
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on GitHub
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(repoInfo.cloneUrl, '_blank')}
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Clone
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Repository Details */}
          <div className="space-y-6">
            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-white">Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <img 
                    src={repoInfo.owner.avatarUrl} 
                    alt={repoInfo.owner.login}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full"
                  />
    <div>
                    <p className="text-white font-medium">{repoInfo.owner.login}</p>
                    <p className="text-gray-400 text-sm capitalize">{repoInfo.owner.type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Repository Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-white">Repository Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-blue-400" />
                  <span className="text-white">Size: {formatFileSize(repoInfo.size)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitFork className="h-4 w-4 text-blue-400" />
                  <span className="text-white">Default Branch: {repoInfo.defaultBranch}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-white">Created: {formatDate(repoInfo.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-white">Updated: {formatDate(repoInfo.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-white">Pushed: {formatDate(repoInfo.pushedAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-white">Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className={`h-4 w-4 ${repoInfo.hasIssues ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className="text-white">Issues {repoInfo.hasIssues ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className={`h-4 w-4 ${repoInfo.hasWiki ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className="text-white">Wiki {repoInfo.hasWiki ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className={`h-4 w-4 ${repoInfo.hasDownloads ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className="text-white">Downloads {repoInfo.hasDownloads ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className={`h-4 w-4 ${repoInfo.hasPages ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className="text-white">Pages {repoInfo.hasPages ? 'Enabled' : 'Disabled'}</span>
                </div>
              </CardContent>
            </Card>

            {/* License */}
            {repoInfo.license && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-white">License</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-400" />
                    <span className="text-white">{repoInfo.license.name}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReposPage;