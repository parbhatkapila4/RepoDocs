"use client";
import React, { useEffect, useCallback, useState } from 'react';
import { useProjectsContext } from '@/context/ProjectsContext';
import { useRepository } from '@/hooks/useRepository';
import { useUser } from '@/hooks/useUser';
import { motion } from "motion/react";
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
  Check,
  Sparkles,
  TrendingUp,
  Zap,
  RefreshCw,
  X
} from "lucide-react";
import { toast } from "sonner";

// Dracula-inspired terminal colors
const terminalColors = {
  green: '#50fa7b',
  cyan: '#8be9fd',
  purple: '#bd93f9',
  pink: '#ff79c6',
  yellow: '#f1fa8c',
  orange: '#ffb86c',
  red: '#ff5555',
  white: '#f8f8f2',
};

function ReposPage() {
  const { projects, selectedProjectId } = useProjectsContext();
  const { 
    currentRepository: repoInfo, 
    isLoading: loading, 
    error, 
    fetchRepository,
    refreshRepository 
  } = useRepository();
  const { isLoading: userLoading } = useUser();
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

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
      month: 'short',
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
      'Python': '#14b8a6',
      'Java': '#ed8b00',
      'C++': '#f472b6',
      'C#': '#239120',
      'C': '#a855f7',
      'Go': '#00add8',
      'Rust': '#dea584',
      'PHP': '#777bb4',
      'Ruby': '#cc342d',
      'Swift': '#fa7343',
      'Kotlin': '#7f52ff',
      'HTML': '#e34f26',
      'CSS': '#a78bfa',
      'SCSS': '#c6538c',
      'Vue': '#4fc08d',
      'Shell': '#89e051',
      'PLpgSQL': '#336791',
      'Dockerfile': '#0db7ed',
      'Makefile': '#427819',
      'MDX': '#fcb32c',
      'Prisma': '#2d3748',
    };
    return colors[language] || '#6b7280';
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#333] border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#666] font-mono text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] relative">
        {/* Grain texture */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        
        <div className="relative flex items-center justify-center min-h-screen p-6">
          <motion.div 
            className="text-center max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center mx-auto mb-6">
              <Github className="w-8 h-8 text-[#666]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">No Project Selected</h1>
            <p className="text-[#666] text-sm">
              Please select a project from the sidebar to view repository information
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      {/* Grain texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#333] to-transparent" />

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[#666] text-xs font-mono tracking-wide uppercase mb-2 block">
                Repository Dashboard
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                {currentProject.name}
              </h1>
        </div>
            <button
          onClick={handleRefresh} 
          disabled={loading}
              className="group px-4 py-2 bg-[#1a1a1a] text-white font-medium rounded-lg flex items-center gap-2 hover:bg-[#252525] transition-colors border border-[#333] hover:border-[#444] disabled:opacity-50"
        >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
      </div>
        </motion.div>

        {/* Error state */}
      {error && (
          <motion.div 
            className="mb-8 p-4 bg-[#1a1a1a] border border-red-500/30 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          </motion.div>
      )}

        {/* Loading skeleton */}
      {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-[#333] rounded w-1/2 mb-4" />
                <div className="h-6 bg-[#333] rounded w-3/4" />
              </div>
          ))}
        </div>
      )}

        {/* Main content */}
      {repoInfo && !loading && (
          <div className="space-y-8">
            {/* Stats row */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {[
                { icon: Star, value: repoInfo.stars.toLocaleString(), label: 'Stars', color: terminalColors.yellow },
                { icon: GitFork, value: repoInfo.forks.toLocaleString(), label: 'Forks', color: terminalColors.cyan },
                { icon: Eye, value: repoInfo.watchers.toLocaleString(), label: 'Watchers', color: terminalColors.green },
                { icon: AlertCircle, value: repoInfo.openIssues.toLocaleString(), label: 'Issues', color: terminalColors.orange },
              ].map((stat) => (
                <div 
                  key={stat.label} 
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5 hover:border-[#444] transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                    <span className="text-2xl font-bold text-white font-mono">{stat.value}</span>
                  </div>
                  <span className="text-[#666] text-sm">{stat.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Main info card */}
            <motion.div 
              className="bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Header bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#252525] border-b border-[#333]">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-[#666] text-sm font-mono">{repoInfo.fullName}</span>
              </div>

              <div className="p-6">
                {/* Repo header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#252525] border border-[#333] flex items-center justify-center flex-shrink-0">
                      <Github className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">{repoInfo.fullName}</h2>
                      <p className="text-[#888] text-sm max-w-xl">
                        {repoInfo.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {repoInfo.isPrivate ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-xs font-medium">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full text-xs font-medium">
                        <Globe className="w-3 h-3" />
                        Public
                      </span>
                    )}
                    {repoInfo.isArchived && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#333] text-[#888] rounded-full text-xs font-medium">
                        <Archive className="w-3 h-3" />
                        Archived
                      </span>
                    )}
                  </div>
                </div>

                {/* Language & Topics */}
                <div className="space-y-4 mb-6">
                  {repoInfo.language && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getLanguageColor(repoInfo.language) }}
                      />
                      <span className="text-white text-sm font-medium">{repoInfo.language}</span>
                      {Object.keys(repoInfo.languages).length > 1 && (
                        <span className="text-[#666] text-sm">
                          + {Object.keys(repoInfo.languages).length - 1} more
                        </span>
                      )}
                    </div>
                  )}

                  {repoInfo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {repoInfo.topics.map((topic) => (
                        <span 
                          key={topic} 
                          className="px-2 py-1 bg-[#252525] text-[#8be9fd] rounded text-xs font-mono"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href={repoInfo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white text-black font-medium rounded-lg flex items-center gap-2 hover:bg-[#eee] transition-colors text-sm"
                  >
                    View on GitHub
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setIsCloneModalOpen(true)}
                    className="px-4 py-2 text-[#888] font-medium rounded-lg flex items-center gap-2 hover:text-white transition-colors border border-[#333] hover:border-[#555] text-sm"
                  >
                    <Terminal className="w-4 h-4" />
                    Clone
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Details grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Owner */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5">
                <span className="text-[#666] text-xs font-mono uppercase tracking-wide">Owner</span>
                <div className="flex items-center gap-3 mt-3">
                  <img 
                    src={repoInfo.owner.avatarUrl} 
                    alt={repoInfo.owner.login}
                    className="w-10 h-10 rounded-full border border-[#333]"
                  />
                  <div>
                    <p className="text-white font-medium text-sm">{repoInfo.owner.login}</p>
                    <p className="text-[#666] text-xs capitalize">{repoInfo.owner.type}</p>
                  </div>
                </div>
              </div>

              {/* Size */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5">
                <span className="text-[#666] text-xs font-mono uppercase tracking-wide">Size</span>
                <div className="mt-3">
                  <p className="text-white font-bold text-xl font-mono">{formatFileSize(repoInfo.size)}</p>
                  <p className="text-[#666] text-xs mt-1">Branch: {repoInfo.defaultBranch}</p>
                </div>
              </div>

              {/* License */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5">
                <span className="text-[#666] text-xs font-mono uppercase tracking-wide">License</span>
                <div className="flex items-center gap-2 mt-3">
                  <Shield className="w-5 h-5 text-[#bd93f9]" />
                  <p className="text-white font-medium text-sm">
                    {repoInfo.license?.name || 'No license'}
                  </p>
                </div>
                </div>

              {/* Updated */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5">
                <span className="text-[#666] text-xs font-mono uppercase tracking-wide">Last Updated</span>
                <div className="flex items-center gap-2 mt-3">
                  <Calendar className="w-5 h-5 text-[#50fa7b]" />
                  <p className="text-white font-medium text-sm">{formatDate(repoInfo.pushedAt)}</p>
                </div>
                </div>
            </motion.div>

            {/* Features & Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Features */}
              <motion.div 
                className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="w-5 h-5 text-[#bd93f9]" />
                  <h3 className="text-white font-semibold">Features</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Issues', enabled: repoInfo.hasIssues, icon: AlertCircle },
                    { label: 'Wiki', enabled: repoInfo.hasWiki, icon: BookOpen },
                    { label: 'Downloads', enabled: repoInfo.hasDownloads, icon: Download },
                    { label: 'Pages', enabled: repoInfo.hasPages, icon: Globe },
                  ].map((feature) => (
                    <div 
                      key={feature.label}
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        feature.enabled 
                          ? 'bg-green-500/10 border border-green-500/20' 
                          : 'bg-[#252525] border border-[#333]'
                      }`}
                    >
                      <feature.icon 
                        className={`w-4 h-4 ${feature.enabled ? 'text-green-400' : 'text-[#666]'}`} 
                      />
                      <span className={`text-sm ${feature.enabled ? 'text-white' : 'text-[#666]'}`}>
                        {feature.label}
                      </span>
                </div>
                  ))}
                </div>
              </motion.div>

              {/* Activity */}
              <motion.div 
                className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-5 h-5 text-[#50fa7b]" />
                  <h3 className="text-white font-semibold">Activity</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#888] text-sm">Created</span>
                    <span className="text-white text-sm font-mono">{formatDate(repoInfo.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#888] text-sm">Last push</span>
                    <span className="text-white text-sm font-mono">{formatDate(repoInfo.pushedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#888] text-sm">Updated</span>
                    <span className="text-white text-sm font-mono">{formatDate(repoInfo.updatedAt)}</span>
                  </div>
                  <div className="pt-3 border-t border-[#333]">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#f1fa8c]" />
                      <span className="text-[#888] text-sm">
                        {new Date(repoInfo.pushedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                          ? 'Actively maintained'
                          : 'Last activity over 30 days ago'}
                      </span>
                </div>
              </div>
                </div>
              </motion.div>
                </div>

            {/* Languages breakdown */}
            {Object.keys(repoInfo.languages).length > 0 && (
              <motion.div 
                className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <Code className="w-5 h-5 text-[#8be9fd]" />
                  <h3 className="text-white font-semibold">Languages</h3>
              </div>

                {/* Language bar */}
                <div className="h-2 rounded-full overflow-hidden flex mb-4">
                  {Object.entries(repoInfo.languages).map(([lang, bytes]) => {
                    const total = Object.values(repoInfo.languages).reduce((a, b) => a + b, 0);
                    const percentage = (bytes / total) * 100;
                    return (
                      <div
                        key={lang}
                        className="h-full"
                        style={{ 
                          width: `${percentage}%`, 
                          backgroundColor: getLanguageColor(lang),
                          minWidth: percentage > 0 ? '2px' : '0'
                        }}
                      />
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-4">
                  {Object.entries(repoInfo.languages).map(([lang, bytes]) => {
                    const total = Object.values(repoInfo.languages).reduce((a, b) => a + b, 0);
                    const percentage = ((bytes / total) * 100).toFixed(1);
                    return (
                      <div key={lang} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getLanguageColor(lang) }}
                        />
                        <span className="text-white text-sm">{lang}</span>
                        <span className="text-[#666] text-xs font-mono">{percentage}%</span>
                  </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Bottom stats */}
            <motion.div 
              className="pt-8 border-t border-[#222]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { 
                    value: repoInfo.stars > 1000 ? `${(repoInfo.stars / 1000).toFixed(1)}k` : repoInfo.stars, 
                    label: 'Community stars showing project popularity' 
                  },
                  { 
                    value: Object.keys(repoInfo.languages).length, 
                    label: 'Different languages used in this project' 
                  },
                  { 
                    value: repoInfo.topics.length, 
                    label: 'Topics tagged for discoverability' 
                  },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-white mb-1 font-mono">{stat.value}</div>
                    <div className="text-sm text-[#666]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
                </div>
              )}
                      </div>

      {/* Clone Modal */}
      {isCloneModalOpen && repoInfo && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsCloneModalOpen(false)}
        >
          <motion.div 
            className="bg-[#1a1a1a] border border-[#333] rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-[#333]">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#50fa7b]" />
                <h2 className="text-white font-semibold">Clone Repository</h2>
              </div>
              <button 
                onClick={() => setIsCloneModalOpen(false)}
                className="text-[#666] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
                  </div>

            {/* Modal content */}
            <div className="p-6 space-y-6">
              {/* Step 1 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-[#50fa7b] text-black text-xs font-bold flex items-center justify-center">1</div>
                  <span className="text-white font-medium text-sm">Navigate to your folder</span>
                </div>
                <div className="relative">
                  <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-3 pr-12 font-mono text-sm text-[#50fa7b]">
                    cd /path/to/your/folder
                  </div>
                  <button
                    onClick={() => copyToClipboard('cd /path/to/your/folder', 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-[#252525] rounded transition-colors"
                  >
                    {copiedStep === 1 ? (
                      <Check className="w-4 h-4 text-[#50fa7b]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#666]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
                    <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-[#50fa7b] text-black text-xs font-bold flex items-center justify-center">2</div>
                  <span className="text-white font-medium text-sm">Clone the repository</span>
                    </div>
                <div className="relative">
                  <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-3 pr-12 font-mono text-sm text-[#50fa7b] break-all">
                    git clone {repoInfo.cloneUrl}
                  </div>
                  <button
                    onClick={() => copyToClipboard(`git clone ${repoInfo.cloneUrl}`, 2)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-[#252525] rounded transition-colors"
                  >
                    {copiedStep === 2 ? (
                      <Check className="w-4 h-4 text-[#50fa7b]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#666]" />
                    )}
                  </button>
                    </div>
                  </div>

              {/* Step 3 */}
                    <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-[#50fa7b] text-black text-xs font-bold flex items-center justify-center">3</div>
                  <span className="text-white font-medium text-sm">Enter the directory</span>
                    </div>
                <div className="relative">
                  <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-3 pr-12 font-mono text-sm text-[#50fa7b]">
                    cd {repoInfo.name}
                  </div>
                  <button
                    onClick={() => copyToClipboard(`cd ${repoInfo.name}`, 3)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-[#252525] rounded transition-colors"
                  >
                    {copiedStep === 3 ? (
                      <Check className="w-4 h-4 text-[#50fa7b]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#666]" />
                    )}
                  </button>
                  </div>
              </div>

              {/* Note */}
              <div className="p-4 bg-[#252525] border border-[#333] rounded-lg">
                <p className="text-[#888] text-sm">
                  <span className="text-[#8be9fd] font-medium">Tip:</span> Make sure you have Git installed. 
                  Download from <a href="https://git-scm.com" target="_blank" rel="noopener noreferrer" className="text-[#bd93f9] hover:underline">git-scm.com</a>
                </p>
              </div>
          </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default ReposPage;
