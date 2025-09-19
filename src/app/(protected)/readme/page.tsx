"use client";

import React, { useState, useEffect } from 'react';
import { useProjectsContext } from '@/context/ProjectsContext';
import { getProjectReadme, regenerateProjectReadme, modifyReadmeWithQna, getReadmeQnaHistory, createReadmeShare, revokeReadmeShare, getReadmeShare, deleteReadmeQnaRecord, deleteAllReadmeQnaHistory } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
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
  Trash2,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ReadmeData {
  id: string;
  content: string;
  prompt: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ReadmeMetadata {
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

interface ReadmeWithQna extends ReadmeData {
  qnaHistory?: QnaRecord[];
}

function ReadmePage() {
  const { selectedProjectId, projects } = useProjectsContext();
  const [readmeData, setReadmeData] = useState<ReadmeData | null>(null);
  const [metadata, setMetadata] = useState<ReadmeMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [qnaHistory, setQnaHistory] = useState<QnaRecord[]>([]);
  const [qnaQuestion, setQnaQuestion] = useState('');
  const [isProcessingQna, setIsProcessingQna] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [isRevokingShare, setIsRevokingShare] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isDeletingQna, setIsDeletingQna] = useState(false);
  const [isDeletingAllQna, setIsDeletingAllQna] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [qnaToDelete, setQnaToDelete] = useState<string | null>(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const parseReadmeMetadata = (content: string): ReadmeMetadata => {
    const lines = content.split('\n');
    let title = 'README';
    let description = '';
    let stars = 0;
    let forks = 0;
    let language = 'Unknown';
    let license = 'Unknown';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('# ')) {
        title = line.substring(2);
      } else if (line.includes('stars') && line.includes('img.shields.io')) {
        const match = line.match(/stars\/(\d+)/);
        if (match) stars = parseInt(match[1]);
      } else if (line.includes('forks') && line.includes('img.shields.io')) {
        const match = line.match(/forks\/(\d+)/);
        if (match) forks = parseInt(match[1]);
      } else if (line.includes('Language-TypeScript')) {
        language = 'TypeScript';
      } else if (line.includes('License-MIT')) {
        license = 'MIT';
      } else if (line.startsWith('## ') && line.toLowerCase().includes('description')) {
        if (i + 1 < lines.length) {
          description = lines[i + 1].trim();
        }
      }
    }

    return { title, description, stars, forks, language, license };
  };

  const handleCopyCode = async () => {
    if (!readmeData?.content) return;
    
    try {
      await navigator.clipboard.writeText(readmeData.content);
      setIsCopied(true);
      toast.success('README copied to clipboard!', {
        description: 'The markdown content has been copied successfully.',
      });
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy README', {
        description: 'Unable to copy content to clipboard.',
      });
    }
  };

  const fetchReadme = async () => {
    if (!selectedProjectId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const readme = await getProjectReadme(selectedProjectId);
      setReadmeData(readme);
      if (readme?.content) {
        setMetadata(parseReadmeMetadata(readme.content));
      }
    } catch (err) {
      console.error('Error fetching README:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch README');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateReadme = async () => {
    if (!selectedProjectId) return;
    
    setIsRegenerating(true);
    setError(null);
    
    try {
      const newReadme = await regenerateProjectReadme(selectedProjectId);
      setReadmeData(newReadme);
      if (newReadme.content) {
        setMetadata(parseReadmeMetadata(newReadme.content));
      }
      toast.success('README regenerated successfully!', {
        description: 'The README has been updated with the latest codebase analysis.',
      });
    } catch (err) {
      console.error('Error regenerating README:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate README';
      setError(errorMessage);
      toast.error('Failed to regenerate README', {
        description: errorMessage,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleQnaSubmit = async () => {
    if (!selectedProjectId || !qnaQuestion.trim()) return;
    
    setIsProcessingQna(true);
    setError(null);
    
    try {
      const result = await modifyReadmeWithQna(selectedProjectId, qnaQuestion);
      setReadmeData(result.readme);
      if (result.readme.content) {
        setMetadata(parseReadmeMetadata(result.readme.content));
      }
      
      // Add to Q&A history
      setQnaHistory(prev => [result.qnaRecord, ...prev]);
      setQnaQuestion('');
      
      // Switch to preview tab to show the updated README
      setActiveTab('preview');
      
      toast.success('README updated successfully!', {
        description: 'Your request has been processed and the README has been modified.',
      });
    } catch (err) {
      console.error('Error processing Q&A:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to modify README';
      setError(errorMessage);
      toast.error('Failed to modify README', {
        description: errorMessage,
      });
    } finally {
      setIsProcessingQna(false);
    }
  };

  const fetchQnaHistory = async () => {
    if (!selectedProjectId) return;
    
    try {
      const readmeWithQna = await getReadmeQnaHistory(selectedProjectId);
      if (readmeWithQna?.qnaHistory) {
        setQnaHistory(readmeWithQna.qnaHistory);
      }
    } catch (err) {
      console.error('Error fetching Q&A history:', err);
    }
  };

  const fetchShareData = async () => {
    if (!selectedProjectId) return;
    
    try {
      const share = await getReadmeShare(selectedProjectId);
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
      const share = await createReadmeShare(selectedProjectId);
      setShareToken(share.shareToken);
      setShowShareModal(true);
      
      if (share.isActive) {
        toast.success('Share link ready!', {
          description: 'Your README is publicly accessible.',
        });
      } else {
        toast.success('Share link created!', {
          description: 'Your README is now publicly accessible.',
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
      await revokeReadmeShare(selectedProjectId);
      setShareToken(null);
      setShowShareModal(false);
      
      toast.success('Share link revoked!', {
        description: 'Your README is no longer publicly accessible.',
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
    
    const shareUrl = `${window.location.origin}/readme/${shareToken}`;
    
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
      await deleteReadmeQnaRecord(selectedProjectId, qnaId);
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
      await deleteAllReadmeQnaHistory(selectedProjectId);
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
    fetchReadme();
    fetchQnaHistory();
    fetchShareData();
  }, [selectedProjectId]);

  if (!selectedProjectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-white/50 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Project</h3>
              <p className="text-white/50">
                Select a project to view README.
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
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white/70" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mobile-no-truncate">
              {metadata?.title || 'README'}
            </h1>
            <p className="text-white/50 mt-1 text-xs sm:text-sm md:text-base mobile-no-truncate">
              {selectedProject.name}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
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
            onClick={handleRegenerateReadme}
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
                <span className="mobile-no-truncate">Regenerate README</span>
              </>
            )}
          </Button>
        </div>
      </div>

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
          ) : readmeData ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="border-b border-white/10 px-3 sm:px-6 py-2 pb-6 sm:pb-8">
                <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 text-xs sm:text-sm">
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="qna" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Q&A
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="preview" className="flex-1 m-0">
                <ScrollArea className="h-full overflow-x-hidden">
                  <div className="p-2 sm:p-4 md:p-8 mobile-card-content">
                    <div className="max-w-4xl mx-auto">
                      <div className="prose prose-invert prose-lg max-w-none mobile-no-truncate mobile-prose">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          className="text-white"
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
                            p: ({ children }) => {
                              // Check if this paragraph contains only images (badges)
                              const hasOnlyImages = React.Children.toArray(children).every(
                                child => React.isValidElement(child) && child.type === 'img'
                              );
                              
                              return (
                                <p className={`text-white/80 leading-relaxed ${hasOnlyImages ? 'mb-2 sm:mb-3 md:mb-4' : 'mb-2 sm:mb-3 md:mb-4'} text-xs sm:text-sm md:text-base mobile-no-truncate`}>
                                  {children}
                                </p>
                              );
                            },
                            ul: ({ children }) => (
                              <ul className="text-white/80 mb-2 sm:mb-3 md:mb-4 space-y-1 sm:space-y-2 text-xs sm:text-sm md:text-base mobile-no-truncate">
                                {children}
                              </ul>
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
                              <pre className="bg-gray-900/50 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 overflow-x-auto mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm mobile-no-truncate">
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
                          }}
                        >
                          {readmeData.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="code" className="flex-1 m-0">
                <ScrollArea className="h-full overflow-x-hidden">
                  <div className="p-2 sm:p-4 md:p-8 mobile-card-content">
                    <div className="max-w-4xl mx-auto">
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white">README.md</h3>
                          <Button
                            onClick={handleCopyCode}
                            variant="outline"
                            size="sm"
                            className="bg-white/5 hover:bg-white/10 text-white border-white/20"
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-4 w-4 mr-2 text-green-400" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Code
                              </>
                            )}
                          </Button>
                        </div>
                        <pre className="bg-gray-900/50 border border-white/10 rounded-lg p-6 overflow-x-auto">
                          <code className="text-white/90 text-sm font-mono whitespace-pre-wrap">
                            {readmeData.content}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="qna" className="flex-1 m-0">
                <div className="h-full flex flex-col">
                  <div className="p-2 sm:p-4 md:p-6 border-b border-white/10 mobile-card-content">
                    <div className="max-w-4xl mx-auto">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                          <Bot className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mobile-no-truncate">AI README Assistant</h3>
                          <p className="text-white/60 text-xs sm:text-sm mobile-no-truncate">Ask me to modify your README content</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                          value={qnaQuestion}
                          onChange={(e) => setQnaQuestion(e.target.value)}
                          placeholder="e.g., Add a deployment section, Update the installation instructions, Add more examples..."
                          className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/50 text-xs sm:text-sm mobile-no-truncate"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleQnaSubmit();
                            }
                          }}
                        />
                        <Button
                          onClick={handleQnaSubmit}
                          disabled={isProcessingQna || !qnaQuestion.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 md:px-6 w-full sm:w-auto text-xs sm:text-sm"
                        >
                          {isProcessingQna ? (
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
                          ) : (
                            <Send className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="mt-2 sm:mt-3 text-xs text-white/50 mobile-no-truncate">
                        Examples: &quot;Add a troubleshooting section&quot;, &quot;Include more code examples&quot;, &quot;Update the description&quot;
                      </div>
                    </div>
                  </div>
                  
                  <ScrollArea className="flex-1 overflow-x-hidden">
                    <div className="p-2 sm:p-4 md:p-6 mobile-card-content">
                      <div className="max-w-4xl mx-auto">
                        {qnaHistory.length > 0 ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-2">
                                <History className="h-4 w-4 text-white/60" />
                                <h4 className="text-sm font-medium text-white/80">Modification History</h4>
                              </div>
                              <Button
                                onClick={openDeleteAllDialog}
                                variant="outline"
                                size="sm"
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear All
                              </Button>
                            </div>
                            
                            {qnaHistory.map((qna, index) => (
                              <Card key={qna.id} className="bg-white/5 border-white/10">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                      <div className="p-1.5 bg-blue-500/20 border border-blue-500/30 rounded">
                                        <MessageSquare className="h-3 w-3 text-blue-400" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-white/90 text-sm font-medium mb-1">Your Request:</p>
                                        <p className="text-white/70 text-sm">{qna.question}</p>
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-white/50 hover:text-white/80 hover:bg-white/10"
                                          >
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-gray-800 border-white/20">
                                          <DropdownMenuItem
                                            onClick={() => openDeleteDialog(qna.id)}
                                            className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    
                                    <div className="flex items-start gap-3">
                                      <div className="p-1.5 bg-green-500/20 border border-green-500/30 rounded">
                                        <CheckCircle className="h-3 w-3 text-green-400" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-white/90 text-sm font-medium mb-1">AI Response:</p>
                                        <p className="text-white/70 text-sm">{qna.answer}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-xs text-white/50 pt-2 border-t border-white/10">
                                      <Clock className="h-3 w-3" />
                                      <span>{new Date(qna.createdAt).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="p-4 bg-white/10 border border-white/20 rounded-2xl mb-4 inline-block">
                              <MessageSquare className="h-12 w-12 text-white/50" />
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">No Modifications Yet</h4>
                            <p className="text-white/60 mb-6 max-w-md mx-auto">
                              Start a conversation with the AI to modify your README. Ask for changes, additions, or improvements.
                            </p>
                            <div className="space-y-2 text-sm text-white/50">
                              <p>Try asking:</p>
                              <p>"Add a troubleshooting section"</p>
                              <p>"Include more code examples"</p>
                              <p>"Update the installation instructions"</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-md">
                <div className="p-6 bg-white/10 border border-white/20 rounded-2xl mb-6 inline-block">
                  <FileText className="h-16 w-16 text-white/50" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">No README</h3>
                <p className="text-white/50 mb-6">
                  Generate AI-powered documentation for your codebase.
                </p>
                <Button
                  onClick={handleRegenerateReadme}
                  disabled={isRegenerating}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3 rounded-lg transition-all duration-200"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating README...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5 mr-2" />
                      Generate README
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
              <CardTitle className="text-white">Share README</CardTitle>
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
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/readme/${shareToken}`}
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
                  Anyone with this link can view your README. The link will remain active until you revoke it.
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

export default ReadmePage;