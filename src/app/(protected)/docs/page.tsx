"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useProjectsContext } from '@/context/ProjectsContext';
import { useRepository } from '@/hooks/useRepository';
import { getProjectDocs, regenerateProjectDocs, modifyDocsWithQna, getDocsQnaHistory, createDocsShare, revokeDocsShare, getDocsShare, deleteDocsQnaRecord, deleteAllDocsQnaHistory } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  RefreshCw, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Code,
  Star,
  GitFork,
  Shield,
  Globe,
  Copy,
  Check,
  MessageSquare,
  Send,
  History,
  Bot,
  Share2,
  Link,
  X,
  FileText,
  Settings,
  Database,
  Zap,
  Layers,
  ChevronLeft,
  ChevronRight,
  Trash2,
  MoreVertical,
  Crown
} from 'lucide-react';
import NextLink from 'next/link';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocsData {
  id: string;
  content: string;
  prompt: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DocsMetadata {
  title: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  license: string;
}

interface QnaRecord {
  id: string;
  question: string;
  answer: string;
  updatedContent: string;
  createdAt: Date;
}

interface DocsWithQna extends DocsData {
  qnaHistory?: QnaRecord[];
}

function DocsPage() {
  const { selectedProjectId, projects } = useProjectsContext();
  const { 
    currentRepository: repoInfo, 
    fetchRepository 
  } = useRepository();
  const [docsData, setDocsData] = useState<DocsData | null>(null);
  const [metadata, setMetadata] = useState<DocsMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [qnaHistory, setQnaHistory] = useState<QnaRecord[]>([]);
  const [qnaQuestion, setQnaQuestion] = useState('');
  const [isProcessingQna, setIsProcessingQna] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const qnaInputRef = useRef<HTMLTextAreaElement>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [isRevokingShare, setIsRevokingShare] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isQnaPanelOpen, setIsQnaPanelOpen] = useState(false);
  const [isDeletingQna, setIsDeletingQna] = useState(false);
  const [isDeletingAllQna, setIsDeletingAllQna] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [qnaToDelete, setQnaToDelete] = useState<string | null>(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const parseDocsMetadata = useCallback((content: string): DocsMetadata => {
    const lines = content.split('\n');
    let title = 'Technical Documentation';
    let description = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('# ')) {
        title = line.substring(2);
      } else if (line.startsWith('## ') && line.toLowerCase().includes('overview')) {
        if (i + 1 < lines.length) {
          description = lines[i + 1].trim();
        }
      }
    }

    // Use actual repository info from GitHub API instead of parsing from content
    const stars = repoInfo?.stars || repoInfo?.stargazersCount || 0;
    const forks = repoInfo?.forks || repoInfo?.forksCount || 0;
    const language = repoInfo?.language || 'Unknown';
    const license = repoInfo?.license?.name || 'Unknown';

    return { title, description, stars, forks, language, license };
  }, [repoInfo]);

  const handleCopyCode = async () => {
    if (!docsData?.content) return;
    
    try {
      await navigator.clipboard.writeText(docsData.content);
      setIsCopied(true);
      toast.success('Documentation copied to clipboard!', {
        description: 'The markdown content has been copied successfully.',
      });
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy documentation', {
        description: 'Unable to copy content to clipboard.',
      });
    }
  };

  const fetchDocs = async () => {
    if (!selectedProjectId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch repository info first
      if (selectedProject?.repoUrl) {
        await fetchRepository(selectedProject.repoUrl);
      }
      
      // Then fetch docs
      const docs = await getProjectDocs(selectedProjectId);
      setDocsData(docs);
      if (docs?.content) {
        setMetadata(parseDocsMetadata(docs.content));
      }
    } catch (err) {
      console.error('Error fetching docs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch documentation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateDocs = async () => {
    if (!selectedProjectId) return;
    
    setIsRegenerating(true);
    setError(null);
    setUpgradeRequired(false);
    
    try {
      const newDocs = await regenerateProjectDocs(selectedProjectId);
      setDocsData(newDocs);
      if (newDocs.content) {
        setMetadata(parseDocsMetadata(newDocs.content));
      }
      toast.success('Documentation regenerated successfully!', {
        description: 'The technical documentation has been updated with the latest codebase analysis.',
      });
    } catch (err) {
      console.error('Error regenerating docs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate documentation';
      
      if (errorMessage.includes('UPGRADE_REQUIRED')) {
        setUpgradeRequired(true);
        toast.error('Upgrade required', {
          description: 'Upgrade to Professional for 10 projects or Enterprise for unlimited.',
        });
      } else {
        setError(errorMessage);
        toast.error('Failed to regenerate documentation', {
          description: errorMessage,
        });
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleQnaSubmit = async () => {
    // Get value from ref if available, otherwise use state
    const questionValue = qnaInputRef.current?.value || qnaQuestion;
    if (!selectedProjectId || !questionValue.trim()) return;
    
    setIsProcessingQna(true);
    setError(null);
    setUpgradeRequired(false);
    
    try {
      const result = await modifyDocsWithQna(selectedProjectId, questionValue);
      setDocsData(result.docs);
      if (result.docs.content) {
        setMetadata(parseDocsMetadata(result.docs.content));
      }
      
      // Add to Q&A history
      setQnaHistory(prev => [result.qnaRecord, ...prev]);
      setQnaQuestion('');
      if (qnaInputRef.current) {
        qnaInputRef.current.value = '';
      }
      
      // Switch to preview tab to show the updated docs
      setActiveTab('preview');
      
      toast.success('Documentation updated successfully!', {
        description: 'Your request has been processed and the documentation has been modified.',
      });
    } catch (err) {
      console.error('Error processing Q&A:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to modify documentation';
      
      if (errorMessage.includes('UPGRADE_REQUIRED')) {
        setUpgradeRequired(true);
        toast.error('Upgrade required', {
          description: 'Upgrade to Professional for 10 projects or Enterprise for unlimited.',
        });
      } else {
        setError(errorMessage);
        toast.error('Failed to modify documentation', {
          description: errorMessage,
        });
      }
    } finally {
      setIsProcessingQna(false);
    }
  };

  // Optimized onChange handler to prevent lag - debounced state update for button disabled state
  const handleQnaQuestionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Update state with a small delay to prevent blocking the input
    // The input itself updates immediately (uncontrolled), state syncs for button logic
    setTimeout(() => {
      setQnaQuestion(value);
    }, 0);
  }, []);

  const fetchQnaHistory = async () => {
    if (!selectedProjectId) return;
    
    try {
      const docsWithQna = await getDocsQnaHistory(selectedProjectId);
      if (docsWithQna?.qnaHistory) {
        setQnaHistory(docsWithQna.qnaHistory);
      }
    } catch (err) {
      console.error('Error fetching Q&A history:', err);
    }
  };

  const fetchShareData = async () => {
    if (!selectedProjectId) return;
    
    try {
      const share = await getDocsShare(selectedProjectId);
      if (share && share.isActive) {
        setShareToken(share.shareToken);
      }
    } catch (err) {
      console.error('Error fetching share data:', err);
    }
  };

  const handleCreateShare = async () => {
    if (!selectedProjectId) return;
    
    setIsCreatingShare(true);
    setError(null);
    
    try {
      const share = await createDocsShare(selectedProjectId);
      setShareToken(share.shareToken);
      setShowShareModal(true);
      
      if (share.isActive) {
        toast.success('Share link ready!', {
          description: 'Your documentation is publicly accessible.',
        });
      } else {
        toast.success('Share link created!', {
          description: 'Your documentation is now publicly accessible.',
        });
      }
    } catch (err) {
      console.error('Error creating share:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create share link';
      setError(errorMessage);
      toast.error('Failed to create share link', {
        description: errorMessage,
      });
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!selectedProjectId) return;
    
    setIsRevokingShare(true);
    setError(null);
    
    try {
      await revokeDocsShare(selectedProjectId);
      setShareToken(null);
      setShowShareModal(false);
      
      toast.success('Share link revoked!', {
        description: 'Your documentation is no longer publicly accessible.',
      });
    } catch (err) {
      console.error('Error revoking share:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke share link';
      setError(errorMessage);
      toast.error('Failed to revoke share link', {
        description: errorMessage,
      });
    } finally {
      setIsRevokingShare(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareToken) return;
    
    const shareUrl = `${window.location.origin}/docs/${shareToken}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied!', {
        description: 'The public link has been copied to your clipboard.',
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy share link', {
        description: 'Unable to copy link to clipboard.',
      });
    }
  };

  const handleDeleteQnaRecord = async (qnaId: string) => {
    if (!selectedProjectId) return;
    
    setIsDeletingQna(true);
    setError(null);
    
    try {
      await deleteDocsQnaRecord(selectedProjectId, qnaId);
      setQnaHistory(prev => prev.filter(qna => qna.id !== qnaId));
      setShowDeleteDialog(false);
      setQnaToDelete(null);
      
      toast.success('Q&A record deleted!', {
        description: 'The conversation has been removed from history.',
      });
    } catch (err) {
      console.error('Error deleting Q&A record:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete Q&A record';
      setError(errorMessage);
      toast.error('Failed to delete Q&A record', {
        description: errorMessage,
      });
    } finally {
      setIsDeletingQna(false);
    }
  };

  const handleDeleteAllQnaHistory = async () => {
    if (!selectedProjectId) return;
    
    setIsDeletingAllQna(true);
    setError(null);
    
    try {
      await deleteAllDocsQnaHistory(selectedProjectId);
      setQnaHistory([]);
      setShowDeleteAllDialog(false);
      
      toast.success('All Q&A history deleted!', {
        description: 'All conversations have been removed from history.',
      });
    } catch (err) {
      console.error('Error deleting all Q&A history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete Q&A history';
      setError(errorMessage);
      toast.error('Failed to delete Q&A history', {
        description: errorMessage,
      });
    } finally {
      setIsDeletingAllQna(false);
    }
  };

  const openDeleteDialog = (qnaId: string) => {
    setQnaToDelete(qnaId);
    setShowDeleteDialog(true);
  };

  const openDeleteAllDialog = () => {
    setShowDeleteAllDialog(true);
  };

  useEffect(() => {
    fetchDocs();
    fetchQnaHistory();
    fetchShareData();
  }, [selectedProjectId]);

  // Update metadata when repoInfo or docsData changes
  useEffect(() => {
    if (docsData?.content) {
      setMetadata(parseDocsMetadata(docsData.content));
    }
  }, [repoInfo, docsData, parseDocsMetadata]);

  if (!selectedProjectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-white/50 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Project</h3>
              <p className="text-white/50">
                Select a project to view technical documentation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Project Not Found</h3>
              <p className="text-white/50">
                Project not found.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col mobile-layout">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 mt-2 sm:mt-4 px-2 sm:px-4 gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <div className="p-2 sm:p-3 bg-white/10 border border-white/20 rounded-xl flex-shrink-0">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white/70" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mobile-no-truncate">
              { 'Technical Documentation'}
            </h1>
            <p className="text-white/50 mt-1 text-xs sm:text-sm md:text-base mobile-no-truncate">
              {selectedProject.name}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            onClick={() => setIsQnaPanelOpen(!isQnaPanelOpen)}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 px-3 sm:px-4 md:px-6 py-2 rounded-lg transition-all duration-200 w-full sm:w-auto text-xs sm:text-sm"
          >
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="mobile-no-truncate">Need Help?</span>
          </Button>
          
          {shareToken ? (
            <Button
              onClick={() => setShowShareModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 md:px-6 py-2 rounded-lg transition-all duration-200 w-full sm:w-auto text-xs sm:text-sm"
            >
              <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="mobile-no-truncate">View Share Link</span>
            </Button>
          ) : (
            <Button
              onClick={handleCreateShare}
              disabled={isCreatingShare || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 md:px-6 py-2 rounded-lg transition-all duration-200 w-full sm:w-auto text-xs sm:text-sm"
            >
              {isCreatingShare ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin flex-shrink-0" />
                  <span className="mobile-no-truncate">Creating...</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="mobile-no-truncate">Share Publicly</span>
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={handleRegenerateDocs}
            disabled={isRegenerating || isLoading}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 sm:px-4 md:px-6 py-2 rounded-lg transition-all duration-200 w-full sm:w-auto text-xs sm:text-sm"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin flex-shrink-0" />
                <span className="mobile-no-truncate">Regenerating...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="mobile-no-truncate">Regenerate Docs</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Regenerating Status Indicator */}
      {isRegenerating && (
        <div className="mx-2 sm:mx-4 mb-4 sm:mb-6">
          <div className="bg-white/10 border border-white/20 rounded-lg px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-spin flex-shrink-0" />
            <span className="text-white text-sm sm:text-base mobile-no-truncate">Regenerating documentation...</span>
          </div>
        </div>
      )}

      {metadata && (
        <div className="px-2 sm:px-4 mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-1 sm:gap-2 md:gap-3">
            <div className="flex items-center bg-gray-600 rounded-sm overflow-hidden shadow-sm">
              <div className="flex items-center gap-1 px-1.5 sm:gap-1.5 sm:px-2 py-1 bg-gray-600">
                <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white flex-shrink-0" />
                <span className="text-white text-xs font-medium mobile-no-truncate">Stars</span>
              </div>
              <div className="px-1.5 sm:px-2 py-1 bg-gray-500">
                <span className="text-white text-xs font-medium mobile-no-truncate">{metadata.stars}</span>
              </div>
            </div>
            
            <div className="flex items-center bg-gray-600 rounded-sm overflow-hidden shadow-sm">
              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-gray-600">
                <GitFork className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white flex-shrink-0" />
                <span className="text-white text-xs font-medium mobile-no-truncate">Forks</span>
              </div>
              <div className="px-1.5 sm:px-2 py-1 bg-gray-500">
                <span className="text-white text-xs font-medium mobile-no-truncate">{metadata.forks}</span>
              </div>
            </div>
            
            <div className="flex items-center bg-gray-600 rounded-sm overflow-hidden shadow-sm">
              <div className="px-1.5 sm:px-2 py-1 bg-gray-600">
                <span className="text-white text-xs font-medium mobile-no-truncate">Language</span>
              </div>
              <div className="px-1.5 sm:px-2 py-1 bg-blue-500">
                <span className="text-white text-xs font-medium mobile-no-truncate">{metadata.language}</span>
              </div>
            </div>
            
            <div className="flex items-center bg-gray-600 rounded-sm overflow-hidden shadow-sm">
              <div className="px-1.5 sm:px-2 py-1 bg-gray-600">
                <span className="text-white text-xs font-medium mobile-no-truncate">License</span>
              </div>
              <div className="px-1.5 sm:px-2 py-1 bg-green-500">
                <span className="text-white text-xs font-medium mobile-no-truncate">{metadata.license}</span>
              </div>
            </div>
          </div>
          {metadata.description && (
            <p className="text-white/60 mt-2 sm:mt-3 text-xs sm:text-sm max-w-3xl mobile-no-truncate">
              {metadata.description}
            </p>
          )}
        </div>
      )}

      {error && (
        <Alert className="mb-6 mx-4 border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {upgradeRequired && (
        <div className="mb-6 mx-2 sm:mx-4">
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Crown className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-400">
                    Upgrade Required
                  </h3>
                  <p className="text-amber-300/80 text-sm mt-1">
                    This project exceeds your starter plan limit. Upgrade to Professional for 10 projects or Enterprise for unlimited.
                  </p>
                </div>
              </div>
              <Button
                asChild
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6"
              >
                <NextLink href="/pricing">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </NextLink>
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="flex-1 flex flex-col border border-white/20 shadow-xl mx-1 sm:mx-2 md:mx-4 mb-2 sm:mb-4 mobile-card">
        <CardContent className="flex-1 p-0 mobile-card-content">
          {isLoading ? (
            <div className="p-4 sm:p-8 space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-12 w-1/2 bg-gray-700/50 rounded-lg" />
                <div className="h-1 w-20 bg-gray-700/30 rounded-full"></div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full bg-gray-700/50 rounded" />
                <Skeleton className="h-4 w-5/6 bg-gray-700/50 rounded" />
                <Skeleton className="h-4 w-4/5 bg-gray-700/50 rounded" />
              </div>
              <div className="space-y-4 mt-8">
                <Skeleton className="h-8 w-1/3 bg-gray-700/50 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-gray-700/50 rounded" />
                  <Skeleton className="h-4 w-3/4 bg-gray-700/50 rounded" />
                  <Skeleton className="h-4 w-5/6 bg-gray-700/50 rounded" />
                </div>
              </div>
            </div>
          ) : docsData ? (
            <div className="h-full">
              {/* Docs Preview - Full width, no layout changes */}
              <div className="h-full rounded-lg shadow-sm backdrop-blur-sm overflow-hidden">
                <div className="h-full overflow-hidden">
                  <ScrollArea className="h-full overflow-x-hidden">
                    <div className="p-2 sm:p-4 md:p-8 mobile-card-content">
                      <div className="prose prose-lg max-w-none text-white mobile-no-truncate mobile-prose">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 md:mb-6 border-b border-white/20 pb-1 sm:pb-2 md:pb-3 mobile-no-truncate">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-white mb-2 sm:mb-3 md:mb-4 mt-4 sm:mt-6 md:mt-8 mobile-no-truncate">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-white mb-2 sm:mb-3 md:mb-3 mt-3 sm:mt-4 md:mt-6 mobile-no-truncate">
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-1 sm:mb-2 mt-2 sm:mt-3 md:mt-4 mobile-no-truncate">
                                {children}
                              </h4>
                            ),
                            p: ({ children }) => (
                              <p className="text-white/80 leading-relaxed mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base mobile-no-truncate">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="text-white/80 mb-2 sm:mb-3 md:mb-4 space-y-1 sm:space-y-2 text-xs sm:text-sm md:text-base mobile-no-truncate">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="text-white/80 mb-2 sm:mb-3 md:mb-4 space-y-1 sm:space-y-2 list-decimal list-inside text-xs sm:text-sm md:text-base mobile-no-truncate">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="flex items-start gap-1 sm:gap-2 mobile-no-truncate">
                                <span className="text-white/40 mt-1 sm:mt-2 flex-shrink-0">•</span>
                                <span className="mobile-no-truncate">{children}</span>
                              </li>
                            ),
                            code: ({ children }) => (
                              <code className="bg-white/10 text-white/90 px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-mono mobile-no-truncate">
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className="bg-gray-900/50 text-white/90 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 overflow-x-auto mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm mobile-no-truncate">
                                {children}
                              </pre>
                            ),
                            img: ({ src, alt, ...props }) => (
                              <img 
                                src={src} 
                                alt={alt} 
                                {...props}
                                className="inline-block mr-1 sm:mr-2 mb-1 sm:mb-2 max-w-full h-auto"
                                style={{ display: 'inline-block', marginRight: '4px', marginBottom: '4px' }}
                              />
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-white/20 pl-2 sm:pl-3 md:pl-4 italic text-white/70 mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base mobile-no-truncate">
                                {children}
                              </blockquote>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto mb-2 sm:mb-3 md:mb-4">
                                <table className="w-full border-collapse border border-white/20 text-xs sm:text-sm mobile-no-truncate">
                                  {children}
                                </table>
                              </div>
                            ),
                            th: ({ children }) => (
                              <th className="border border-white/20 px-1 sm:px-2 md:px-4 py-1 sm:py-1.5 md:py-2 bg-white/10 text-white font-semibold text-left text-xs sm:text-sm mobile-no-truncate">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="border border-white/20 px-1 sm:px-2 md:px-4 py-1 sm:py-1.5 md:py-2 text-white/80 text-xs sm:text-sm mobile-no-truncate">
                                {children}
                              </td>
                            ),
                          }}
                        >
                          {docsData.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Q&A Sheet - Proper overlay that doesn't affect main content */}
              <Sheet open={isQnaPanelOpen} onOpenChange={setIsQnaPanelOpen}>
                <SheetContent side="right" className="min-w-[300px] sm:min-w-[400px] md:min-w-[500px] w-[90vw] sm:w-[400px] md:w-[500px] bg-black/30 border-l border-white/10 backdrop-blur-md px-2 sm:px-4">
                  <SheetHeader className="pb-4 sm:pb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                        <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <SheetTitle className="text-lg sm:text-xl md:text-2xl font-semibold text-white leading-tight mobile-no-truncate">Ask a question</SheetTitle>
                        <SheetDescription className="text-white/60 text-xs sm:text-sm mt-1 mobile-no-truncate">Modify your documentation</SheetDescription>
                      </div>
                    </div>
                  </SheetHeader>
                  
                  {/* Q&A Input Section */}
                  <div className="pb-4 sm:pb-6 border-b border-white/10">
                    <div className="space-y-4 sm:space-y-6">
                      <textarea
                        ref={qnaInputRef}
                        defaultValue={qnaQuestion}
                        onChange={handleQnaQuestionChange}
                        placeholder="Which file contains authentication logic?"
                        className="w-full h-[60px] sm:h-[80px] p-2 sm:p-3 bg-black/30 border border-white/20 rounded-lg resize-none text-sm sm:text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-no-truncate"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            e.preventDefault();
                            handleQnaSubmit();
                          }
                        }}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                      />
                      <Button
                        onClick={handleQnaSubmit}
                        disabled={isProcessingQna || !(qnaInputRef.current?.value || qnaQuestion).trim()}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 sm:py-3 rounded-lg transition-colors h-[40px] sm:h-[48px] text-sm sm:text-base font-medium"
                      >
                        {isProcessingQna ? (
                          <>
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin flex-shrink-0" />
                            <span className="mobile-no-truncate">Processing...</span>
                          </>
                        ) : (
                          <span className="mobile-no-truncate">Ask RepoDocs</span>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Q&A History */}
                  <div className="flex-1 mt-4 sm:mt-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <History className="h-3 w-3 sm:h-4 sm:w-4 text-white/60 flex-shrink-0" />
                        <h4 className="text-sm sm:text-base font-medium text-white/80 mobile-no-truncate">Recent Questions</h4>
                      </div>
                      {qnaHistory.length > 0 && (
                        <Button
                          onClick={openDeleteAllDialog}
                          variant="outline"
                          size="sm"
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 text-xs px-2 sm:px-3 py-1 h-6 sm:h-7"
                        >
                          <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                          <span className="mobile-no-truncate">Clear All</span>
                        </Button>
                      )}
                    </div>
                    
                    <ScrollArea className="h-full max-h-[400px]">
                      <div className="pr-4">
                        {qnaHistory.length > 0 ? (
                          <div className="space-y-3 sm:space-y-4">
                            {qnaHistory.map((qna, index) => (
                              <div key={qna.id} className="bg-black/30 border border-white/10 rounded-lg p-3 sm:p-4">
                                <div className="space-y-2 sm:space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white/90 text-sm sm:text-base font-medium mb-1 mobile-no-truncate">Your Question:</p>
                                      <p className="text-white/70 text-sm sm:text-base break-words mobile-no-truncate">{qna.question}</p>
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-white/50 hover:text-white/80 hover:bg-white/10 ml-1 sm:ml-2 flex-shrink-0"
                                        >
                                          <MoreVertical className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="bg-gray-800 border-white/20">
                                        <DropdownMenuItem
                                          onClick={() => openDeleteDialog(qna.id)}
                                          className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
                                        >
                                          <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-2" />
                                          <span className="mobile-no-truncate">Delete</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  
                                  <div>
                                    <p className="text-white/90 text-sm sm:text-base font-medium mb-1 mobile-no-truncate">AI Response:</p>
                                    <p className="text-white/70 text-sm sm:text-base break-words mobile-no-truncate">{qna.answer}</p>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 sm:gap-2 text-xs text-white/50 pt-1 sm:pt-2 border-t border-white/10">
                                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                    <span className="mobile-no-truncate">{new Date(qna.createdAt).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 sm:py-8">
                            <div className="p-3 sm:p-4 bg-black/30 border border-white/20 rounded-2xl mb-3 sm:mb-4 inline-block">
                              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-white/50" />
                            </div>
                            <h4 className="text-sm sm:text-base font-semibold text-white mb-2 mobile-no-truncate">No questions yet</h4>
                            <p className="text-white/60 text-xs sm:text-sm mb-3 sm:mb-4 mobile-no-truncate">
                              Ask questions to modify your documentation
                            </p>
                            <div className="space-y-1 text-xs text-white/50">
                              <p className="mobile-no-truncate">Try asking:</p>
                              <p className="mobile-no-truncate">&quot;Add API examples&quot;</p>
                              <p className="mobile-no-truncate">&quot;Update installation guide&quot;</p>
                              <p className="mobile-no-truncate">&quot;Add troubleshooting section&quot;</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-md">
                <div className="p-6 bg-white/10 border border-white/20 rounded-2xl mb-6 inline-block">
                  <BookOpen className="h-16 w-16 text-white/50" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">No Documentation</h3>
                <p className="text-white/50 mb-6">
                  Generate comprehensive technical documentation for your codebase.
                </p>
                <Button
                  onClick={handleRegenerateDocs}
                  disabled={isRegenerating}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3 rounded-lg transition-all duration-200"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin flex-shrink-0" />
                      <span>Generating Documentation...</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-5 w-5 mr-2" />
                      Generate Documentation
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Modal */}
      {showShareModal && shareToken && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border border-white/20 bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Share Documentation</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareModal(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Public Link</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/docs/${shareToken}`}
                    readOnly
                    className="bg-white/5 border-white/20 text-white text-sm"
                  />
                  <Button
                    onClick={handleCopyShareLink}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Public Access</span>
                </div>
                <p className="text-xs text-white/60">
                  Anyone with this link can view your technical documentation. The link will remain active until you revoke it.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleRevokeShare}
                  disabled={isRevokingShare}
                  variant="outline"
                  className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  {isRevokingShare ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Revoking...
                    </>
                  ) : (
                    'Revoke Access'
                  )}
                </Button>
                <Button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Single Q&A Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gray-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Q&A Record</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Cancel
            </Button>
            <Button
              onClick={() => qnaToDelete && handleDeleteQnaRecord(qnaToDelete)}
              disabled={isDeletingQna}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingQna ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Q&A Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="bg-gray-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Delete All Q&A History</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete all conversation history? This action cannot be undone and will remove all Q&A records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteAllDialog(false)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAllQnaHistory}
              disabled={isDeletingAllQna}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingAllQna ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting All...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DocsPage;

