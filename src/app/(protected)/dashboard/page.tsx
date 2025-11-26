"use client";
import React, { useEffect, useCallback, useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  ExternalLink,
  Terminal,
  Copy,
  Check
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
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

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

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedStep(null), 2000);
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
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md mx-auto">
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
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md mx-auto">
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
    <div className="w-full p-2 sm:p-4 md:p-6 space-y-2 sm:space-y-4 md:space-y-6 dashboard-mobile mobile-layout">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mobile-no-truncate">Repository Information</h1>
          <p className="text-gray-400 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base mobile-no-truncate">
            Detailed information about {currentProject.name}
          </p>
        </div>
        <Button 
          variant="default"
          onClick={handleRefresh} 
          disabled={loading}
          className="w-full sm:w-auto text-xs sm:text-sm"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Repository Info */}
          <Card className="xl:col-span-2 mobile-card">
            <CardHeader className="mobile-card-content">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  <Github className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg md:text-xl text-white mobile-no-truncate leading-tight">
                      {repoInfo.fullName}
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-xs sm:text-sm md:text-base mobile-no-truncate mt-1">
                      {repoInfo.description || 'No description available'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {repoInfo.isPrivate && <Lock className="h-4 w-4 text-yellow-400" />}
                  {repoInfo.isArchived && <Archive className="h-4 w-4 text-gray-400" />}
                  <Badge variant={repoInfo.isPrivate ? "destructive" : "secondary"}>
                    {repoInfo.visibility}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 mobile-card-content">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  <span className="text-white text-sm sm:text-base font-medium">{repoInfo.stars.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitFork className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-white text-sm sm:text-base font-medium">{repoInfo.forks.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="text-white text-sm sm:text-base font-medium">{repoInfo.watchers.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span className="text-white text-sm sm:text-base font-medium">{repoInfo.openIssues.toLocaleString()}</span>
                </div>
              </div>

              {/* Languages */}
              {repoInfo.language && (
                <div>
                  <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">Primary Language</h4>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: getLanguageColor(repoInfo.language) }}
                    />
                    <span className="text-white text-sm sm:text-base">{repoInfo.language}</span>
                  </div>
                </div>
              )}

              {/* All Languages */}
              {Object.keys(repoInfo.languages).length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(repoInfo.languages).map(([lang]) => (
                      <Badge key={lang} variant="outline" className="text-white border-gray-600 text-xs sm:text-sm">
                        <div 
                          className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0" 
                          style={{ backgroundColor: getLanguageColor(lang) }}
                        />
                        <span>{lang}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {repoInfo.topics.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {repoInfo.topics.map((topic) => (
                      <Badge key={topic} variant="secondary" className="text-white bg-gray-700 text-xs sm:text-sm">
                        <span>{topic}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(repoInfo.htmlUrl, '_blank')}
                  className="border-gray-600 text-white hover:bg-gray-700 w-full sm:w-auto text-xs sm:text-sm"
                >
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="mobile-no-truncate">View on GitHub</span>
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-gray-600 text-white hover:bg-gray-700 w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <Terminal className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="mobile-no-truncate">How to Clone</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-xl w-full p-4 sm:p-6 lg:p-5 max-h-[90vh] lg:max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader className="pr-6 sm:pr-0 lg:pr-6">
                      <DialogTitle className="text-lg sm:text-xl lg:text-lg font-bold text-white flex items-center gap-2">
                        <Terminal className="h-4 w-4 sm:h-5 sm:w-5 lg:h-4 lg:w-4 text-blue-400" />
                        How to Clone This Repository
                      </DialogTitle>
                      <DialogDescription className="text-sm sm:text-base lg:text-sm text-gray-400">
                        Follow these steps to clone and set up the repository on your local machine
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-3 sm:space-y-4 lg:space-y-3 mt-2 sm:mt-4 lg:mt-3 max-h-[60vh] sm:max-h-none lg:max-h-[65vh] overflow-y-auto pr-1 lg:pr-2">
                      {/* Step 1 */}
                      <div className="space-y-1.5 sm:space-y-2 lg:space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 rounded-full bg-blue-600 text-white text-xs sm:text-sm lg:text-xs font-bold flex-shrink-0">
                            1
                          </div>
                          <h4 className="font-semibold text-white text-sm sm:text-base lg:text-sm">Open Terminal</h4>
                        </div>
                        <p className="text-xs sm:text-sm lg:text-xs text-gray-400 ml-6 sm:ml-8 lg:ml-7">
                          Open your terminal or command prompt on your computer.
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div className="space-y-1.5 sm:space-y-2 lg:space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 rounded-full bg-blue-600 text-white text-xs sm:text-sm lg:text-xs font-bold flex-shrink-0">
                            2
                          </div>
                          <h4 className="font-semibold text-white text-sm sm:text-base lg:text-sm">Navigate to Your Directory</h4>
                        </div>
                        <p className="text-xs sm:text-sm lg:text-xs text-gray-400 ml-6 sm:ml-8 lg:ml-7 mb-1.5 sm:mb-2 lg:mb-1.5">
                          Navigate to the folder where you want to clone the repository:
                        </p>
                        <div className="ml-6 sm:ml-8 lg:ml-7 relative">
                          <div className="bg-gray-950 border border-gray-700 rounded-lg p-2 sm:p-3 lg:p-2 pr-10 sm:pr-12 lg:pr-10">
                            <code className="text-xs sm:text-sm lg:text-xs text-green-400 break-all">cd /path/to/your/folder</code>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-1.5 sm:right-2 lg:right-1.5 top-1.5 sm:top-2 lg:top-1.5 h-6 w-6 sm:h-7 sm:w-7 lg:h-6 lg:w-6 p-0"
                            onClick={() => copyToClipboard('cd /path/to/your/folder', 2)}
                          >
                            {copiedStep === 2 ? (
                              <Check className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3 lg:w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3 lg:w-3 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="space-y-1.5 sm:space-y-2 lg:space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 rounded-full bg-blue-600 text-white text-xs sm:text-sm lg:text-xs font-bold flex-shrink-0">
                            3
                          </div>
                          <h4 className="font-semibold text-white text-sm sm:text-base lg:text-sm">Clone the Repository</h4>
                        </div>
                        <p className="text-xs sm:text-sm lg:text-xs text-gray-400 ml-6 sm:ml-8 lg:ml-7 mb-1.5 sm:mb-2 lg:mb-1.5">
                          Run the following command to clone the repository:
                        </p>
                        <div className="ml-6 sm:ml-8 lg:ml-7 relative">
                          <div className="bg-gray-950 border border-gray-700 rounded-lg p-2 sm:p-3 lg:p-2 pr-10 sm:pr-12 lg:pr-10">
                            <code className="text-xs sm:text-sm lg:text-xs text-green-400 break-all">
                              git clone {repoInfo.cloneUrl}
                            </code>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-1.5 sm:right-2 lg:right-1.5 top-1.5 sm:top-2 lg:top-1.5 h-6 w-6 sm:h-7 sm:w-7 lg:h-6 lg:w-6 p-0"
                            onClick={() => copyToClipboard(`git clone ${repoInfo.cloneUrl}`, 3)}
                          >
                            {copiedStep === 3 ? (
                              <Check className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3 lg:w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3 lg:w-3 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="space-y-1.5 sm:space-y-2 lg:space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 rounded-full bg-blue-600 text-white text-xs sm:text-sm lg:text-xs font-bold flex-shrink-0">
                            4
                          </div>
                          <h4 className="font-semibold text-white text-sm sm:text-base lg:text-sm">Navigate into the Repository</h4>
                        </div>
                        <p className="text-xs sm:text-sm lg:text-xs text-gray-400 ml-6 sm:ml-8 lg:ml-7 mb-1.5 sm:mb-2 lg:mb-1.5">
                          Move into the cloned repository directory:
                        </p>
                        <div className="ml-6 sm:ml-8 lg:ml-7 relative">
                          <div className="bg-gray-950 border border-gray-700 rounded-lg p-2 sm:p-3 lg:p-2 pr-10 sm:pr-12 lg:pr-10">
                            <code className="text-xs sm:text-sm lg:text-xs text-green-400 break-all">
                              cd {repoInfo.name}
                            </code>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-1.5 sm:right-2 lg:right-1.5 top-1.5 sm:top-2 lg:top-1.5 h-6 w-6 sm:h-7 sm:w-7 lg:h-6 lg:w-6 p-0"
                            onClick={() => copyToClipboard(`cd ${repoInfo.name}`, 4)}
                          >
                            {copiedStep === 4 ? (
                              <Check className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3 lg:w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3 lg:w-3 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Step 5 */}
                      <div className="space-y-1.5 sm:space-y-2 lg:space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 rounded-full bg-blue-600 text-white text-xs sm:text-sm lg:text-xs font-bold flex-shrink-0">
                            5
                          </div>
                          <h4 className="font-semibold text-white text-sm sm:text-base lg:text-sm">Start Working!</h4>
                        </div>
                        <p className="text-xs sm:text-sm lg:text-xs text-gray-400 ml-6 sm:ml-8 lg:ml-7">
                          You&apos;re all set! You can now start working on the repository. Don&apos;t forget to install dependencies if needed.
                        </p>
                      </div>

                      {/* Additional Info */}
                      <div className="mt-6 lg:mt-4 p-4 lg:p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 lg:h-4 lg:w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-sm lg:text-xs font-semibold text-blue-400">Note:</p>
                            <p className="text-sm lg:text-xs text-gray-300">
                              Make sure you have Git installed on your system. If not, download it from{' '}
                              <a 
                                href="https://git-scm.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline"
                              >
                                git-scm.com
                              </a>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Repository Details */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Owner Info */}
            <Card className="mobile-card">
              <CardHeader className="mobile-card-content">
                <CardTitle className="text-sm sm:text-base md:text-lg text-white">Owner</CardTitle>
              </CardHeader>
              <CardContent className="mobile-card-content">
                <div className="flex items-center gap-2 sm:gap-3">
                  <img 
                    src={repoInfo.owner.avatarUrl} 
                    alt={repoInfo.owner.login}
                    width={32}
                    height={32}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-xs sm:text-sm mobile-no-truncate">{repoInfo.owner.login}</p>
                    <p className="text-gray-400 text-xs sm:text-sm capitalize mobile-no-truncate">{repoInfo.owner.type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Repository Details */}
            <Card className="mobile-card">
              <CardHeader className="mobile-card-content">
                <CardTitle className="text-sm sm:text-base md:text-lg text-white">Repository Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 mobile-card-content">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Code className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-white text-xs sm:text-sm mobile-no-truncate">Size: {formatFileSize(repoInfo.size)}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <GitFork className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-white text-xs sm:text-sm mobile-no-truncate">Default Branch: {repoInfo.defaultBranch}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-white text-xs sm:text-sm mobile-no-truncate">Created: {formatDate(repoInfo.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-white text-xs sm:text-sm mobile-no-truncate">Updated: {formatDate(repoInfo.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-white text-xs sm:text-sm mobile-no-truncate">Pushed: {formatDate(repoInfo.pushedAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="mobile-card">
              <CardHeader className="mobile-card-content">
                <CardTitle className="text-sm sm:text-base md:text-lg text-white">Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 sm:space-y-2 mobile-card-content">
                <div className="flex items-center gap-1 sm:gap-2">
                  <AlertCircle className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${repoInfo.hasIssues ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className="text-white text-xs sm:text-sm mobile-no-truncate">Issues {repoInfo.hasIssues ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <BookOpen className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${repoInfo.hasWiki ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className="text-white text-xs sm:text-sm mobile-no-truncate">Wiki {repoInfo.hasWiki ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Download className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${repoInfo.hasDownloads ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className="text-white text-xs sm:text-sm mobile-no-truncate">Downloads {repoInfo.hasDownloads ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Globe className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${repoInfo.hasPages ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className="text-white text-xs sm:text-sm mobile-no-truncate">Pages {repoInfo.hasPages ? 'Enabled' : 'Disabled'}</span>
                </div>
              </CardContent>
            </Card>

            {/* License */}
            {repoInfo.license && (
              <Card className="mobile-card">
                <CardHeader className="mobile-card-content">
                  <CardTitle className="text-sm sm:text-base md:text-lg text-white">License</CardTitle>
                </CardHeader>
                <CardContent className="mobile-card-content">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                    <span className="text-white text-xs sm:text-sm mobile-no-truncate">{repoInfo.license.name}</span>
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