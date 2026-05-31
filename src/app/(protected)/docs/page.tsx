"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useProjectsContext } from "@/context/ProjectsContext";
import { useRepository } from "@/hooks/useRepository";
import { useUser } from "@/hooks/useUser";
import { useMountedRef } from "@/hooks/useMountedRef";
import {
  getProjectDocs,
  enqueueDocsRegeneration,
  getBackgroundJob,
  modifyDocsWithQna,
  getDocsQnaHistory,
  createDocsShare,
  revokeDocsShare,
  getDocsShare,
  deleteDocsQnaRecord,
  deleteAllDocsQnaHistory,
  checkEmbeddingsStatus,
} from "@/lib/actions";
import { useBackgroundRegenJob } from "@/hooks/useBackgroundRegenJob";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  Crown,
  Lock,
  Download,
} from "lucide-react";
import NextLink from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import GitHubRateLimitNotice, {
  isRateLimitError,
} from "@/components/GitHubRateLimitNotice";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { exportMarkdownToPdf } from "@/lib/export-pdf";
import {
  exportMarkdownToDocx,
  exportMarkdownToFile,
} from "@/lib/export-docx";
import {
  fetchProjectRepositoryInfo,
  type RepositoryInfoResult,
} from "@/lib/repository-info";
import {
  DeleteQnaDialog,
  DeleteAllQnaDialog,
} from "@/components/docs-readme/QnaDialogs";
import { QnaPanel } from "@/components/docs-readme/QnaPanel";

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
  const { currentRepository: repoInfo, fetchRepository } = useRepository();
  const { user } = useUser();
  const [docsData, setDocsData] = useState<DocsData | null>(null);
  const [metadata, setMetadata] = useState<DocsMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [qnaHistory, setQnaHistory] = useState<QnaRecord[]>([]);
  const [isProcessingQna, setIsProcessingQna] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
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
  const [hasShownIndexingCompleteToast, setHasShownIndexingCompleteToast] =
    useState(false);
  const [hasEmbeddings, setHasEmbeddings] = useState<boolean | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const projectsRef = useRef(projects);
  const [repositoryInfo, setRepositoryInfo] = useState<any>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const disclaimerRef = useRef<HTMLDivElement>(null);
  const docsMountedRef = useMountedRef();
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkCollision = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!headingRef.current || !disclaimerRef.current) {
          setShowDisclaimer(true);
          return;
        }

        const headingRect = headingRef.current.getBoundingClientRect();
        const disclaimerRect = disclaimerRef.current.getBoundingClientRect();

        const horizontalOverlap =
          disclaimerRect.left < headingRect.right &&
          disclaimerRect.right > headingRect.left;

        const verticalOverlap =
          disclaimerRect.top < headingRect.bottom &&
          disclaimerRect.bottom > headingRect.top;

        const isTooClose =
          horizontalOverlap &&
          Math.abs(disclaimerRect.left - headingRect.right) < 30;

        const shouldHide = (horizontalOverlap && verticalOverlap) || isTooClose;
        setShowDisclaimer(!shouldHide);
      }, 100);
    };

    const initialTimeout = setTimeout(checkCollision, 200);

    window.addEventListener("resize", checkCollision, { passive: true });
    window.addEventListener("scroll", checkCollision, { passive: true });

    const resizeObserver = new ResizeObserver(checkCollision);
    if (headingRef.current) resizeObserver.observe(headingRef.current);
    if (disclaimerRef.current) resizeObserver.observe(disclaimerRef.current);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(initialTimeout);
      window.removeEventListener("resize", checkCollision);
      window.removeEventListener("scroll", checkCollision);
      resizeObserver.disconnect();
    };
  }, [docsData, selectedProject]);

  const parseDocsHeading = useCallback(
    (content: string) => {
      const lines = content.split("\n");
      let headingText = "";
      let badges: Array<{ text: string; color: string; icon?: string }> = [];
      let contentWithoutHeading = content;
      let firstH1Index = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("# ") && firstH1Index === -1) {
          headingText = line.substring(2).trim();
          firstH1Index = i;
          let endIdx = i + 1;
          for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
            if (
              lines[j].trim().startsWith("![") &&
              lines[j].includes("shields.io")
            ) {
              const badgeMatch = lines[j].match(/badge\/([^-]+)-([^)]+)\)/);
              if (badgeMatch) {
                const badgeText = badgeMatch[1]
                  .replace(/_/g, " ")
                  .replace(/🏷️\s*/, "")
                  .trim();
                const badgeColor = badgeMatch[2];
                if (badgeText && badgeColor) {
                  badges.push({ text: badgeText, color: badgeColor });
                }
              }
              endIdx = j + 1;
            } else if (lines[j].trim() && !lines[j].trim().startsWith("!")) {
              break;
            }
          }
          contentWithoutHeading = lines.slice(endIdx).join("\n");
          break;
        }
      }

      if (!headingText && selectedProject) {
        headingText = `${selectedProject.name} - Comprehensive Technical Documentation`;
      }

      return { headingText, badges, contentWithoutHeading };
    },
    [selectedProject]
  );

  const parseDocsMetadata = useCallback(
    (
      content: string,
      repositoryInfo?: RepositoryInfoResult | null
    ): DocsMetadata => {
      const lines = content.split("\n");
      let title = "Technical Documentation";
      let description = "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("# ")) {
          title = line.substring(2);
        } else if (
          line.startsWith("## ") &&
          line.toLowerCase().includes("overview")
        ) {
          if (i + 1 < lines.length) {
            description = lines[i + 1].trim();
          }
        }
      }

      let stars = repositoryInfo?.stars ?? repositoryInfo?.stargazersCount ?? 0;
      let forks = repositoryInfo?.forks ?? repositoryInfo?.forksCount ?? 0;
      let language: string | null = repositoryInfo?.language || null;
      const rawLicense = repositoryInfo?.license;
      let license: string | null =
        (typeof rawLicense === "object" && rawLicense?.name) ||
        (typeof rawLicense === "string" ? rawLicense : null) ||
        null;

      const hasValidRepoInfo =
        repositoryInfo &&
        (stars > 0 ||
          forks > 0 ||
          (language && language !== "Unknown") ||
          (license && license !== "Unknown" && license !== null));

      if (!hasValidRepoInfo) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.includes("stars") && line.includes("img.shields.io")) {
            const match = line.match(/stars\/(\d+)/);
            if (match) stars = parseInt(match[1]);
          } else if (
            line.includes("forks") &&
            line.includes("img.shields.io")
          ) {
            const match = line.match(/forks\/(\d+)/);
            if (match) forks = parseInt(match[1]);
          } else if (line.includes("Language-")) {
            const langMatch = line.match(/Language-([\w\+#]+)/);
            if (langMatch) language = langMatch[1];
          } else if (line.includes("License-")) {
            const licenseMatch = line.match(/License-([\w\-\.]+)/);
            if (licenseMatch) license = licenseMatch[1];
          }
        }
      }

      if (!language) language = "Unknown";
      if (!license) license = "Unknown";

      return { title, description, stars, forks, language, license };
    },
    []
  );

  const handleCopyCode = async () => {
    if (!docsData?.content) return;

    try {
      await navigator.clipboard.writeText(docsData.content);
      setIsCopied(true);
      toast.success("Documentation copied to clipboard!", {
        description: "The markdown content has been copied successfully.",
      });

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy documentation", {
        description: "Unable to copy content to clipboard.",
      });
    }
  };

  const fetchRepositoryInfo = useCallback(
    (projectId: string, repoUrl: string | null | undefined) =>
      fetchProjectRepositoryInfo(projectId, repoUrl),
    []
  );

  const fetchDocs = useCallback(async () => {
    if (!selectedProjectId) return;

    if (docsMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const project = projectsRef.current.find(
        (p) => p.id === selectedProjectId
      );

      const repoUrl = project?.repoUrl;

      let fetchedRepoInfo = null;
      if (repoUrl) {
        fetchedRepoInfo = await fetchRepositoryInfo(selectedProjectId, repoUrl);

        if (fetchedRepoInfo && docsMountedRef.current) {
          setRepositoryInfo(fetchedRepoInfo);
        }
      }

      const docs = await getProjectDocs(selectedProjectId);
      if (!docsMountedRef.current) return;

      setDocsData(docs);

      if (docs?.content) {
        setMetadata(parseDocsMetadata(docs.content, fetchedRepoInfo));
      }

      const embeddingsStatus = await checkEmbeddingsStatus(selectedProjectId);
      if (!docsMountedRef.current) return;
      setHasEmbeddings(embeddingsStatus.hasEmbeddings);
    } catch (err) {
      console.error("Error fetching docs:", err);
      if (docsMountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch documentation"
        );
      }
    } finally {
      if (docsMountedRef.current) setIsLoading(false);
    }
  }, [selectedProjectId, parseDocsMetadata, fetchRepositoryInfo, docsMountedRef]);

  const docsBgJob = useBackgroundRegenJob({
    projectId: selectedProjectId,
    storageKey: "docs",
    enqueue: enqueueDocsRegeneration,
    getJob: getBackgroundJob,
    onSync: () => fetchDocs(),
    setBusy: setIsRegenerating,
    onUpgradeRequired: () => setUpgradeRequired(true),
    toastSuccessActive: {
      title: "Documentation regenerated",
      description:
        "The technical documentation has been updated with the latest codebase analysis.",
    },
    toastSuccessAway: {
      title: "Documentation is ready",
      description:
        "Generation finished while you were on another screen or idle. Content has been refreshed.",
    },
    toastFailed: (message) => ({
      title: "Documentation generation failed",
      description: message,
    }),
  });

  const handleRegenerateDocs = () => {
    if (!selectedProjectId) return;
    setError(null);
    setUpgradeRequired(false);
    void docsBgJob.start();
  };

  const handleQnaSubmit = (questionValue: string): Promise<boolean> => {
    if (!selectedProjectId || !questionValue.trim())
      return Promise.resolve(false);

    setIsProcessingQna(true);
    setError(null);
    setUpgradeRequired(false);

    return (async () => {
      try {
        const result = await modifyDocsWithQna(
          selectedProjectId,
          questionValue
        );
        toast.success("Documentation updated successfully!", {
          description:
            "Your request has been processed and the documentation has been modified.",
        });
        if (docsMountedRef.current) {
          setDocsData(result.docs);
          if (result.docs.content) {
            setMetadata(parseDocsMetadata(result.docs.content));
          }
          setQnaHistory((prev) => [result.qnaRecord, ...prev]);
          setActiveTab("preview");
        }
        return true;
      } catch (err) {
        console.error("Error processing Q&A:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to modify documentation";

        if (errorMessage.includes("UPGRADE_REQUIRED")) {
          if (docsMountedRef.current) setUpgradeRequired(true);
          toast.error("Upgrade required", {
            description:
              "Upgrade to Professional for 10 projects or Enterprise for unlimited.",
          });
        } else {
          if (docsMountedRef.current) setError(errorMessage);
          toast.error("Failed to modify documentation", {
            description: errorMessage,
          });
        }
        return false;
      } finally {
        if (docsMountedRef.current) setIsProcessingQna(false);
      }
    })();
  };

  const fetchQnaHistory = useCallback(async () => {
    if (!selectedProjectId) return;

    try {
      const docsWithQna = await getDocsQnaHistory(selectedProjectId);
      if (docsWithQna?.qnaHistory) {
        setQnaHistory(docsWithQna.qnaHistory);
      }
    } catch (err) {
      console.error("Error fetching Q&A history:", err);
    }
  }, [selectedProjectId]);

  const fetchShareData = useCallback(async () => {
    if (!selectedProjectId) return;

    try {
      const share = await getDocsShare(selectedProjectId);
      if (share && share.isActive) {
        setShareToken(share.shareToken);
      }
    } catch (err) {
      console.error("Error fetching share data:", err);
    }
  }, [selectedProjectId]);

  const handleCreateShare = async () => {
    if (!selectedProjectId) return;

    setIsCreatingShare(true);
    setError(null);

    try {
      const share = await createDocsShare(selectedProjectId);
      setShareToken(share.shareToken);
      setShowShareModal(true);

      if (share.isActive) {
        toast.success("Share link ready!", {
          description: "Your documentation is publicly accessible.",
        });
      } else {
        toast.success("Share link created!", {
          description: "Your documentation is now publicly accessible.",
        });
      }
    } catch (err) {
      console.error("Error creating share:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create share link";
      setError(errorMessage);
      toast.error("Failed to create share link", {
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

      toast.success("Share link revoked!", {
        description: "Your documentation is no longer publicly accessible.",
      });
    } catch (err) {
      console.error("Error revoking share:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to revoke share link";
      setError(errorMessage);
      toast.error("Failed to revoke share link", {
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
      toast.success("Share link copied!", {
        description: "The public link has been copied to your clipboard.",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy share link", {
        description: "Unable to copy link to clipboard.",
      });
    }
  };

  const handleDeleteQnaRecord = async (qnaId: string) => {
    if (!selectedProjectId) return;

    setIsDeletingQna(true);
    setError(null);

    try {
      await deleteDocsQnaRecord(selectedProjectId, qnaId);
      setQnaHistory((prev) => prev.filter((qna) => qna.id !== qnaId));
      setShowDeleteDialog(false);
      setQnaToDelete(null);

      toast.success("Q&A record deleted!", {
        description: "The conversation has been removed from history.",
      });
    } catch (err) {
      console.error("Error deleting Q&A record:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete Q&A record";
      setError(errorMessage);
      toast.error("Failed to delete Q&A record", {
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

      toast.success("All Q&A history deleted!", {
        description: "All conversations have been removed from history.",
      });
    } catch (err) {
      console.error("Error deleting all Q&A history:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete Q&A history";
      setError(errorMessage);
      toast.error("Failed to delete Q&A history", {
        description: errorMessage,
      });
    } finally {
      setIsDeletingAllQna(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!docsData?.content) return;
    exportMarkdownToFile({
      markdown: docsData.content,
      fileName: `${selectedProject?.name || "documentation"}-docs.md`,
    });
    toast.success("Documentation downloaded as Markdown");
  };

  const handleDownloadPDF = async () => {
    if (!docsData?.content) return;
    try {
      await exportMarkdownToPdf({
        markdown: docsData.content,
        fileName: `${selectedProject?.name || "documentation"}-docs.pdf`,
      });
      toast.success("Documentation downloaded as PDF");
    } catch (error) {
      console.error("Error generating PDF:", error);
      const msg = error instanceof Error ? error.message : String(error);
      toast.error("Failed to generate PDF", {
        description: msg.includes("Markdown")
          ? msg
          : "Please try downloading as Markdown instead.",
      });
    }
  };

  const handleDownloadDOCX = async () => {
    if (!docsData?.content) return;
    try {
      await exportMarkdownToDocx({
        markdown: docsData.content,
        fileName: `${selectedProject?.name || "documentation"}-docs.docx`,
      });
      toast.success("Documentation downloaded as DOCX");
    } catch (error) {
      console.error("Error generating DOCX:", error);
      toast.error("Failed to generate DOCX", {
        description: "Please try downloading as Markdown instead.",
      });
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
    setRepositoryInfo(null);
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchDocs();
      fetchQnaHistory();
      fetchShareData();
    }
  }, [selectedProjectId, fetchDocs, fetchQnaHistory, fetchShareData]);

  useEffect(() => {
    if (docsData?.content) {
      setMetadata(parseDocsMetadata(docsData.content, repositoryInfo));
    }
  }, [repositoryInfo, docsData?.id, parseDocsMetadata]);

  useEffect(() => {
    if (!selectedProjectId || !docsData) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const isPreview =
      docsData.prompt?.toLowerCase().includes("demo") ||
      docsData.prompt?.toLowerCase().includes("preview");

    if (
      isPreview &&
      hasEmbeddings === false &&
      !hasShownIndexingCompleteToast
    ) {
      const maxPollingTime = 60 * 60 * 1000;
      const pollingStartTime = Date.now();

      pollingIntervalRef.current = setInterval(async () => {
        try {
          if (Date.now() - pollingStartTime > maxPollingTime) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            return;
          }

          const status = await checkEmbeddingsStatus(selectedProjectId);

          setHasEmbeddings(status.hasEmbeddings);

          if (status.hasEmbeddings && status.count > 0) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            setHasShownIndexingCompleteToast(true);

            toast.success("🎉 Embedding is done!", {
              description: "You can regenerate now for better documentation.",
              duration: 3000,
            });
          }
        } catch (error) {
          console.error("Error checking embeddings status:", error);
        }
      }, 30000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [
    selectedProjectId,
    docsData?.id,
    hasEmbeddings,
    hasShownIndexingCompleteToast,
  ]);

  useEffect(() => {
    setHasShownIndexingCompleteToast(false);
    setHasEmbeddings(null);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, [selectedProjectId]);

  if (!selectedProjectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-white/50 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No Project
              </h3>
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
              <h3 className="text-lg font-semibold text-white mb-2">
                Project Not Found
              </h3>
              <p className="text-white/50">Project not found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col mobile-layout">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 mt-2 sm:mt-4 px-2 sm:px-4 gap-3 sm:gap-4">
        <div
          ref={headingRef}
          className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0"
        >
          <div className="p-2 sm:p-3 bg-white/10 border border-white/20 rounded-xl shrink-0">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white/70" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mobile-no-truncate">
              {"Technical Documentation"}
            </h1>
            <p className="text-white/50 mt-1 text-xs sm:text-sm md:text-base mobile-no-truncate">
              {selectedProject.name}
            </p>
          </div>
        </div>

        <div
          ref={disclaimerRef}
          className={`hidden show-disclaimer items-center justify-start flex-1 -ml-16 ${!showDisclaimer ? "invisible" : ""
            }`}
        >
          <p className="text-white/40 text-xs italic text-center animate-pulse">
            ✨ This may take time because we focus on quality documentation
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            onClick={() => setIsQnaPanelOpen(!isQnaPanelOpen)}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 px-3 sm:px-4 md:px-6 py-2 rounded-lg transition-all duration-200 w-full sm:w-auto text-xs sm:text-sm"
          >
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
            <span className="mobile-no-truncate">Need Help?</span>
          </Button>

          {user?.plan === "starter" ? (
            <Button
              asChild
              className="bg-gray-600 hover:bg-gray-500 text-white px-3 sm:px-4 md:px-6 py-2 rounded-lg transition-all duration-200 w-full sm:w-auto text-xs sm:text-sm"
            >
              <NextLink href="/pricing">
                <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                <span className="mobile-no-truncate">Upgrade to Share</span>
              </NextLink>
            </Button>
          ) : shareToken ? (
            <Button
              onClick={() => setShowShareModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 md:px-6 py-2 rounded-lg transition-all duration-200 w-full sm:w-auto text-xs sm:text-sm"
            >
              <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
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
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin shrink-0" />
                  <span className="mobile-no-truncate">Creating...</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
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
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin shrink-0" />
                <span className="mobile-no-truncate">Regenerating...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                <span className="mobile-no-truncate">Regenerate Docs</span>
              </>
            )}
          </Button>

          {docsData?.content && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={isLoading}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 sm:px-4 md:px-6 py-2 rounded-lg transition-all duration-200 w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                  <span className="mobile-no-truncate">Download</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-gray-800 border-white/20"
              >
                <DropdownMenuItem
                  onClick={handleDownloadMarkdown}
                  className="text-white hover:bg-white/10 focus:bg-white/10"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Download as Markdown (.md)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDownloadPDF}
                  className="text-white hover:bg-white/10 focus:bg-white/10"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Download as PDF (.pdf)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDownloadDOCX}
                  className="text-white hover:bg-white/10 focus:bg-white/10"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Download as DOCX (.docx)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {isRegenerating && (
        <div className="mx-2 sm:mx-4 mb-4 sm:mb-6">
          <div className="bg-white/10 border border-white/20 rounded-lg px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 flex-wrap">
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-spin shrink-0" />
            <span className="text-white text-sm sm:text-base font-medium mobile-no-truncate">
              Regenerating documentation...
            </span>
            <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-white/20">
              <span className="text-orange-400 text-xs">✨</span>
              <span className="text-white/50 text-xs italic">
                This may take time because we focus on quality documentation and
                keep detailing in mind
              </span>
            </div>
          </div>
        </div>
      )}

      <GitHubRateLimitNotice error={error} className="mb-6 mx-4" />
      {error && !isRateLimitError(error) && (
        <Alert className="mb-6 mx-4 border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      {upgradeRequired && (
        <div className="mb-6 mx-2 sm:mx-4">
          <div className="bg-linear-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 rounded-lg p-4">
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
                    This project exceeds your starter plan limit. Upgrade to
                    Professional for 10 projects or Enterprise for unlimited.
                  </p>
                </div>
              </div>
              <Button
                asChild
                className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6"
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

      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden border border-white/20 shadow-xl mx-1 sm:mx-2 md:mx-4 mb-2 sm:mb-4 mobile-card">
        <CardContent className="flex flex-1 min-h-0 flex-col overflow-hidden p-0 mobile-card-content">
          {isLoading ? (
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-6 sm:p-10 space-y-10">
              <div className="space-y-3">
                <Skeleton className="h-7 w-2/5" />
                <Skeleton className="h-[3px] w-12" />
              </div>
              <div className="space-y-2.5">
                <Skeleton className="h-[14px] w-full" />
                <Skeleton className="h-[14px] w-[92%]" />
                <Skeleton className="h-[14px] w-[78%]" />
                <Skeleton className="h-[14px] w-[88%]" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-1/4" />
                <div className="space-y-2.5">
                  <Skeleton className="h-[14px] w-full" />
                  <Skeleton className="h-[14px] w-[85%]" />
                  <Skeleton className="h-[14px] w-[70%]" />
                  <Skeleton className="h-[14px] w-[93%]" />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <div className="space-y-2.5">
                  <Skeleton className="h-[14px] w-[95%]" />
                  <Skeleton className="h-[14px] w-full" />
                  <Skeleton className="h-[14px] w-[60%]" />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-2/5" />
                <div className="space-y-2.5">
                  <Skeleton className="h-[14px] w-full" />
                  <Skeleton className="h-[14px] w-[75%]" />
                  <Skeleton className="h-[14px] w-[90%]" />
                  <Skeleton className="h-[14px] w-[82%]" />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-1/5" />
                <div className="space-y-2.5">
                  <Skeleton className="h-[14px] w-[88%]" />
                  <Skeleton className="h-[14px] w-full" />
                  <Skeleton className="h-[14px] w-[65%]" />
                </div>
              </div>
              <div className="space-y-2.5">
                <Skeleton className="h-[14px] w-full" />
                <Skeleton className="h-[14px] w-[80%]" />
                <Skeleton className="h-[14px] w-[72%]" />
              </div>
            </div>
          ) : docsData ? (
            <div className="h-full min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 rounded-lg shadow-sm backdrop-blur-sm overflow-hidden flex flex-col">
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden smooth-scroll-docs">
                    <div className="p-2 sm:p-4 md:p-8 mobile-card-content">
                      <div className="prose prose-lg max-w-none text-white mobile-no-truncate mobile-prose">
                        {(() => {
                          const { headingText, badges, contentWithoutHeading } =
                            parseDocsHeading(docsData.content);
                          const headingParts = headingText.split(" - ");
                          const projectName =
                            headingParts[0] ||
                            selectedProject?.name ||
                            "Project";
                          const description =
                            headingParts[1]
                              ?.replace("Comprehensive", "")
                              .trim() || "";
                          const hasComprehensive =
                            headingText.includes("Comprehensive");

                          const techBadges = [];

                          if (selectedProject?.name) {
                            techBadges.push({
                              text: selectedProject.name,
                              color: "#3b82f6",
                              icon: "pin",
                            });
                          }

                          techBadges.push({
                            text: "AI POWERED",
                            color: "#f97316",
                          });

                          if (metadata?.language) {
                            const langColors: Record<string, string> = {
                              TypeScript: "#3178c6",
                              JavaScript: "#f7df1e",
                              Python: "#3776ab",
                              Java: "#ed8b00",
                              Go: "#00add8",
                              Rust: "#000000",
                            };
                            techBadges.push({
                              text: metadata.language,
                              color: langColors[metadata.language] || "#3178c6",
                            });
                          }

                          if (
                            repositoryInfo?.description
                              ?.toLowerCase()
                              .includes("next.js") ||
                            selectedProject?.name
                              ?.toLowerCase()
                              .includes("next")
                          ) {
                            techBadges.push({
                              text: "Next.js",
                              color: "#000000",
                            });
                          }
                          if (
                            repositoryInfo?.description
                              ?.toLowerCase()
                              .includes("postgresql") ||
                            repositoryInfo?.description
                              ?.toLowerCase()
                              .includes("postgres")
                          ) {
                            techBadges.push({
                              text: "PostgreSQL",
                              color: "#22c55e",
                            });
                          }
                          if (
                            repositoryInfo?.description
                              ?.toLowerCase()
                              .includes("clerk")
                          ) {
                            techBadges.push({
                              text: "Clerk",
                              color: "#a855f7",
                            });
                          }
                          if (
                            repositoryInfo?.description
                              ?.toLowerCase()
                              .includes("langchain")
                          ) {
                            techBadges.push({
                              text: "LangChain",
                              color: "#f97316",
                            });
                          }

                          if (
                            metadata?.stars !== undefined &&
                            metadata.stars > 0
                          ) {
                            techBadges.push({
                              text: `STARS ${metadata.stars.toLocaleString()}`,
                              color: "#fbbf24",
                              icon: "star",
                            });
                          }
                          if (
                            metadata?.forks !== undefined &&
                            metadata.forks > 0
                          ) {
                            techBadges.push({
                              text: `FORKS ${metadata.forks.toLocaleString()}`,
                              color: "#6b7280",
                              icon: "fork",
                            });
                          }

                          const badgeTexts = new Set(
                            badges.map((b) => b.text.toLowerCase())
                          );
                          const uniqueTechBadges = techBadges.filter(
                            (b) => !badgeTexts.has(b.text.toLowerCase())
                          );
                          const allBadges = [...badges, ...uniqueTechBadges];

                          return (
                            <>
                              <div className="mb-6 sm:mb-8">
                                <div className="flex items-start gap-3 sm:gap-4 mb-4">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-cyan-500/20 border border-cyan-500/30 rounded flex items-center justify-center shrink-0 mt-1">
                                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                                  </div>
                                  <div className="flex-1">
                                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-2">
                                      {projectName}
                                      {description && (
                                        <>
                                          {": "}
                                          <span className="font-normal">
                                            {description}
                                          </span>
                                        </>
                                      )}
                                      {hasComprehensive && " - Comprehensive"}
                                    </h1>
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white/90">
                                      Technical Documentation
                                    </h2>
                                  </div>
                                </div>

                                <div className="h-px bg-white/20 mb-4" />

                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                  {allBadges
                                    .filter(
                                      (b) =>
                                        !b.text.includes("STARS") &&
                                        !b.text.includes("FORKS") &&
                                        b.text !== metadata?.language &&
                                        b.text !== metadata?.license
                                    )
                                    .map((badge, idx) => {
                                      const badgeColors: Record<
                                        string,
                                        string
                                      > = {
                                        blue: "#3b82f6",
                                        orange: "#f97316",
                                        green: "#22c55e",
                                        purple: "#a855f7",
                                        yellow: "#fbbf24",
                                        gray: "#6b7280",
                                        grey: "#6b7280",
                                        black: "#000000",
                                        red: "#ef4444",
                                        cyan: "#06b6d4",
                                      };

                                      const bgColor =
                                        badgeColors[
                                        badge.color.toLowerCase()
                                        ] ||
                                        badge.color ||
                                        "#3b82f6";
                                      const isProjectBadge =
                                        badge.icon === "pin" ||
                                        badge.text.toLowerCase() ===
                                        selectedProject?.name?.toLowerCase();

                                      return (
                                        <div
                                          key={idx}
                                          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium text-white"
                                          style={{ backgroundColor: bgColor }}
                                        >
                                          {isProjectBadge && (
                                            <span className="text-yellow-400">
                                              📌
                                            </span>
                                          )}
                                          <span>{badge.text}</span>
                                        </div>
                                      );
                                    })}

                                  <div className="flex items-center bg-gray-600 rounded-sm overflow-hidden shadow-sm">
                                    <div className="flex items-center gap-1 px-1.5 sm:gap-1.5 sm:px-2 py-1 bg-gray-600">
                                      <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white shrink-0" />
                                      <span className="text-white text-xs font-medium mobile-no-truncate">
                                        Stars
                                      </span>
                                    </div>
                                    <div className="px-1.5 sm:px-2 py-1 bg-gray-500">
                                      <span className="text-white text-xs font-medium mobile-no-truncate">
                                        {metadata?.stars ??
                                          repositoryInfo?.stars ??
                                          repositoryInfo?.stargazersCount ??
                                          0}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center bg-gray-600 rounded-sm overflow-hidden shadow-sm">
                                    <div className="flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-gray-600">
                                      <GitFork className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white shrink-0" />
                                      <span className="text-white text-xs font-medium mobile-no-truncate">
                                        Forks
                                      </span>
                                    </div>
                                    <div className="px-1.5 sm:px-2 py-1 bg-gray-500">
                                      <span className="text-white text-xs font-medium mobile-no-truncate">
                                        {metadata?.forks ??
                                          repositoryInfo?.forks ??
                                          repositoryInfo?.forksCount ??
                                          0}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center bg-gray-600 rounded-sm overflow-hidden shadow-sm">
                                    <div className="px-1.5 sm:px-2 py-1 bg-gray-600">
                                      <span className="text-white text-xs font-medium mobile-no-truncate">
                                        Language
                                      </span>
                                    </div>
                                    <div className="px-1.5 sm:px-2 py-1 bg-blue-500">
                                      <span className="text-white text-xs font-medium mobile-no-truncate">
                                        {metadata?.language ||
                                          repositoryInfo?.language ||
                                          "Unknown"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center bg-gray-600 rounded-sm overflow-hidden shadow-sm">
                                    <div className="px-1.5 sm:px-2 py-1 bg-gray-600">
                                      <span className="text-white text-xs font-medium mobile-no-truncate">
                                        License
                                      </span>
                                    </div>
                                    <div className="px-1.5 sm:px-2 py-1 bg-green-500">
                                      <span className="text-white text-xs font-medium mobile-no-truncate">
                                        {metadata?.license ||
                                          repositoryInfo?.license?.name ||
                                          repositoryInfo?.license ||
                                          "Unknown"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ children, ...props }) => {
                                    const h1Text =
                                      typeof children === "string"
                                        ? children
                                        : Array.isArray(children)
                                          ? children.join("")
                                          : "";
                                    if (
                                      h1Text === headingText ||
                                      h1Text.includes(projectName)
                                    ) {
                                      return null;
                                    }
                                    return (
                                      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 md:mb-6 border-b border-white/20 pb-1 sm:pb-2 md:pb-3 mobile-no-truncate">
                                        {children}
                                      </h1>
                                    );
                                  },
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
                                    <li className="flex items-baseline gap-1 sm:gap-2 mobile-no-truncate">
                                      <span className="text-white/40 shrink-0 leading-relaxed">
                                        •
                                      </span>
                                      <span className="mobile-no-truncate leading-relaxed">
                                        {children}
                                      </span>
                                    </li>
                                  ),
                                  code: ({ children }) => (
                                    <code className="bg-white/10 text-white/90 px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-mono mobile-no-truncate">
                                      {children}
                                    </code>
                                  ),
                                  pre: ({ children }) => (
                                    <div className="relative mb-2 sm:mb-3 md:mb-4">
                                      <div className="overflow-x-auto max-w-full scrollbar-thin">
                                        <pre className="bg-gray-900/50 text-white/90 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 text-xs sm:text-sm whitespace-pre min-w-max">
                                          {children}
                                        </pre>
                                      </div>
                                    </div>
                                  ),
                                  img: ({ src, alt, ...props }) => (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={src}
                                      alt={alt}
                                      {...props}
                                      className="inline-block mr-1 sm:mr-2 mb-1 sm:mb-2 max-w-full h-auto"
                                      style={{
                                        display: "inline-block",
                                        marginRight: "4px",
                                        marginBottom: "4px",
                                      }}
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
                                {contentWithoutHeading}
                              </ReactMarkdown>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <QnaPanel
                open={isQnaPanelOpen}
                onOpenChange={setIsQnaPanelOpen}
                isProcessing={isProcessingQna}
                history={qnaHistory}
                onSubmit={handleQnaSubmit}
                onDelete={openDeleteDialog}
                onDeleteAll={openDeleteAllDialog}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-md">
                <div className="p-6 bg-white/10 border border-white/20 rounded-2xl mb-6 inline-block">
                  <BookOpen className="h-16 w-16 text-white/50" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  No Documentation
                </h3>
                <p className="text-white/50 mb-6">
                  Generate comprehensive technical documentation for your
                  codebase.
                </p>
                <Button
                  onClick={handleRegenerateDocs}
                  disabled={isRegenerating}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3 rounded-lg transition-all duration-200"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin shrink-0" />
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
                <label className="text-sm font-medium text-white/80">
                  Public Link
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/docs/${shareToken}`}
                    readOnly
                    className="bg-white/5 border-white/20 text-white text-xs font-mono"
                    style={{
                      wordBreak: "break-all",
                      overflowWrap: "break-word",
                    }}
                    title={`${typeof window !== "undefined" ? window.location.origin : ""}/docs/${shareToken}`}
                  />
                  <Button
                    onClick={handleCopyShareLink}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-white/50 break-all">
                  Full URL:{" "}
                  {typeof window !== "undefined" ? window.location.origin : ""}
                  /docs/{shareToken}
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">
                    Public Access
                  </span>
                </div>
                <p className="text-xs text-white/60">
                  Anyone with this link can view your technical documentation.
                  The link will remain active until you revoke it.
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
                    "Revoke Access"
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

      <DeleteQnaDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        loading={isDeletingQna}
        onConfirm={() => qnaToDelete && handleDeleteQnaRecord(qnaToDelete)}
      />

      <DeleteAllQnaDialog
        open={showDeleteAllDialog}
        onOpenChange={setShowDeleteAllDialog}
        loading={isDeletingAllQna}
        onConfirm={handleDeleteAllQnaHistory}
      />
    </div>
  );
}

export default DocsPage;
