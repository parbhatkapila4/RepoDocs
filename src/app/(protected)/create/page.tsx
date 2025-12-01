"use client";
import React, { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { useProjectsContext } from "@/context/ProjectsContext";
import { checkProjectLimit } from "@/lib/actions";
import { motion } from "motion/react";
import { 
  Github, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  Circle, 
  Code2, 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  Crown,
  ArrowLeft,
  Terminal,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// Dracula-inspired colors
const colors = {
  green: '#50fa7b',
  cyan: '#8be9fd',
  purple: '#bd93f9',
  pink: '#ff79c6',
  yellow: '#f1fa8c',
  orange: '#ffb86c',
  red: '#ff5555',
  white: '#f8f8f2',
};

// Form validation schema
const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .min(3, "Project name must be at least 3 characters")
    .max(50, "Project name must be less than 50 characters"),
  githubUrl: z
    .string()
    .min(1, "GitHub URL is required")
    .url("Please enter a valid URL")
    .refine((url) => {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname === "github.com";
      } catch {
        return false;
      }
    }, "Please enter a valid GitHub repository URL"),
  githubToken: z
    .string()
    .optional()
    .refine((token) => {
      if (!token) return true;
      return token.length >= 20;
    }, "GitHub token must be at least 20 characters long"),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

type LoadingStep = {
  id: number;
  label: string;
  status: 'pending' | 'loading' | 'completed';
  icon: React.ComponentType<{ className?: string }>;
};

interface ProjectLimitStatus {
  canCreate: boolean;
  reason?: string;
  currentCount?: number;
  maxProjects?: number;
  plan?: string;
}

function CreatePage() {
  const router = useRouter();
  const { createNewProject, isLoading } = useProjects();
  const { loadProjects, selectProject } = useProjectsContext();
  const isSubmittingRef = useRef(false);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([
    { id: 1, label: 'Creating project...', status: 'pending', icon: Plus },
    { id: 2, label: 'Loading repository files...', status: 'pending', icon: Github },
    { id: 3, label: 'Analyzing code...', status: 'pending', icon: Code2 },
    { id: 4, label: 'Generating embeddings...', status: 'pending', icon: Sparkles },
    { id: 5, label: 'Creating documentation...', status: 'pending', icon: FileText },
  ]);
  const [progress, setProgress] = useState(0);
  const [projectLimit, setProjectLimit] = useState<ProjectLimitStatus | null>(null);
  const [isCheckingLimit, setIsCheckingLimit] = useState(true);

  useEffect(() => {
    const checkLimit = async () => {
      try {
        setIsCheckingLimit(true);
        const limitStatus = await checkProjectLimit();
        setProjectLimit(limitStatus);
      } catch (error) {
        console.error('Error checking project limit:', error);
      } finally {
        setIsCheckingLimit(false);
      }
    };
    checkLimit();
  }, []);

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      githubUrl: "",
      githubToken: "",
    },
  });

  const updateStep = (stepId: number, status: 'loading' | 'completed') => {
    setLoadingSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const onSubmit = async (data: CreateProjectForm) => {
    if (isLoading || isSubmittingRef.current) {
      return;
    }
    
    isSubmittingRef.current = true;
    
    try {
      updateStep(1, 'loading');
      setProgress(10);
      
      const newProject = await createNewProject(data.name, data.githubUrl, process.env.GITHUB_TOKEN);
      
      updateStep(1, 'completed');
      setProgress(20);
      
      updateStep(2, 'loading');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStep(2, 'completed');
      setProgress(40);
      
      updateStep(3, 'loading');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStep(3, 'completed');
      setProgress(60);
      
      updateStep(4, 'loading');
      await new Promise(resolve => setTimeout(resolve, 1200));
      updateStep(4, 'completed');
      setProgress(80);
      
      updateStep(5, 'loading');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStep(5, 'completed');
      setProgress(100);
      
      await loadProjects();
      
      if (newProject?.id) {
        selectProject(newProject.id);
      }
      
      toast.success("Project created successfully!", {
        description: `${data.name} has been indexed and is ready to use!`,
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating project:", error);
      
      setLoadingSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
      setProgress(0);
      
      const errorMessage = error instanceof Error ? error.message : "Please try again or check your connection.";
      
      if (errorMessage.includes('PROJECT_LIMIT_REACHED')) {
        const limitStatus = await checkProjectLimit();
        setProjectLimit(limitStatus);
        
        const upgradeMessage = limitStatus.plan === 'professional'
          ? "Upgrade to Enterprise for unlimited projects."
          : "Upgrade to Professional for 10 projects or Enterprise for unlimited.";
        
        toast.error("Project limit reached", {
          description: upgradeMessage,
        });
      } else {
        toast.error("Failed to create project", {
          description: errorMessage,
        });
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const isFormDisabled = form.formState.isSubmitting || isLoading || isCheckingLimit || (projectLimit !== null && !projectLimit.canCreate);

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

      <div className="relative max-w-2xl mx-auto px-6 py-12">
        {/* Back button */}
        <motion.button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#666] hover:text-white transition-colors mb-8 group"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>

        {/* Header */}
        <motion.div 
          className="mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-[#666] text-xs font-mono tracking-wide uppercase mb-3 block">
            New Project
          </span>
          <h1 className="text-4xl font-bold text-white mb-3">
            Create Project
          </h1>
          <p className="text-[#888] text-sm max-w-md">
            Connect a GitHub repository to start asking questions about your codebase.
          </p>
        </motion.div>

        {/* Project Limit Warning */}
        {!isCheckingLimit && projectLimit && !projectLimit.canCreate && (
          <motion.div 
            className="mb-8 p-5 bg-[#1a1a1a] border border-[#ffb86c]/30 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-[#ffb86c]/10 border border-[#ffb86c]/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" style={{ color: colors.orange }} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    Project Limit Reached
                  </h3>
                  <p className="text-[#888] text-xs mt-0.5">
                    {projectLimit.currentCount} of {projectLimit.maxProjects} projects used on {projectLimit.plan === 'professional' ? 'Professional' : projectLimit.plan === 'enterprise' ? 'Enterprise' : 'Starter'} plan
                  </p>
                </div>
              </div>
              <Link
                href="/pricing"
                className="px-4 py-2 bg-gradient-to-r from-[#ffb86c] to-[#ff79c6] text-black font-medium rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity text-sm"
              >
                <Crown className="w-4 h-4" />
                Upgrade
              </Link>
            </div>
          </motion.div>
        )}

        {/* Project Usage Indicator */}
        {!isCheckingLimit && projectLimit && projectLimit.canCreate && (projectLimit.plan === 'starter' || projectLimit.plan === 'professional') && (
          <motion.div 
            className="mb-8 p-4 bg-[#1a1a1a] border border-[#333] rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4" style={{ color: colors.cyan }} />
                <span className="text-sm">
                  <span className="text-white font-medium">{projectLimit.currentCount}</span>
                  <span className="text-[#666]"> / {projectLimit.maxProjects} projects</span>
                </span>
              </div>
              {projectLimit.currentCount !== undefined && projectLimit.maxProjects !== undefined && (
                (projectLimit.plan === 'starter' && projectLimit.currentCount >= 2) || 
                (projectLimit.plan === 'professional' && projectLimit.currentCount >= 8)
              ) && (
                <Link
                  href="/pricing"
                  className="text-xs text-[#bd93f9] hover:text-white transition-colors flex items-center gap-1"
                >
                  <Crown className="w-3 h-3" />
                  Upgrade
                </Link>
              )}
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1 bg-[#252525] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${((projectLimit.currentCount || 0) / (projectLimit.maxProjects || 1)) * 100}%`,
                  backgroundColor: colors.cyan
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Main Form Card */}
        <motion.div 
          className="bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#252525] border-b border-[#333]">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-[#666] text-sm font-mono">new-project</span>
          </div>

          <div className="p-6">
            {/* Card header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#252525] border border-[#333] flex items-center justify-center">
                <Terminal className="w-5 h-5" style={{ color: colors.green }} />
              </div>
              <div>
                <h2 className="text-white font-semibold">Project Details</h2>
                <p className="text-[#666] text-xs">Enter repository information</p>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <label className="text-sm text-[#888] font-medium">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="my-awesome-project"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder:text-[#555] focus:border-[#50fa7b] focus:outline-none transition-colors font-mono text-sm"
                  {...form.register("name")}
                  disabled={isFormDisabled}
                />
                {form.formState.errors.name && (
                  <p className="text-xs" style={{ color: colors.red }}>
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* GitHub URL */}
              <div className="space-y-2">
                <label className="text-sm text-[#888] font-medium flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username/repository"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder:text-[#555] focus:border-[#50fa7b] focus:outline-none transition-colors font-mono text-sm"
                  {...form.register("githubUrl")}
                  disabled={isFormDisabled}
                />
                {form.formState.errors.githubUrl && (
                  <p className="text-xs" style={{ color: colors.red }}>
                    {form.formState.errors.githubUrl.message}
                  </p>
                )}
              </div>

              {/* Loading Progress */}
              {(form.formState.isSubmitting || isLoading) && (
                <motion.div 
                  className="p-5 bg-[#0a0a0a] border border-[#333] rounded-lg relative overflow-hidden"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  {/* Grain texture for this box */}
                  <div 
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                  />
                  
                  <div className="relative z-10">
                    {/* Progress header */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[#888] text-sm font-mono">Processing...</span>
                      <span className="text-sm font-mono" style={{ color: colors.cyan }}>
                        {progress}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 bg-[#252525] rounded-full overflow-hidden mb-5">
                      <motion.div 
                        className="h-full rounded-full"
                        style={{ backgroundColor: colors.green }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    {/* Steps */}
                    <div className="space-y-3">
                      {loadingSteps.map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-3 text-sm"
                        >
                          {step.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: colors.green }} />
                          ) : step.status === 'loading' ? (
                            <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" style={{ color: colors.cyan }} />
                          ) : (
                            <Circle className="w-4 h-4 flex-shrink-0 text-[#444]" />
                          )}
                          <step.icon 
                            className="w-4 h-4 flex-shrink-0" 
                            style={{ 
                              color: step.status === 'completed' 
                                ? colors.green 
                                : step.status === 'loading' 
                                  ? colors.cyan 
                                  : '#444' 
                            }} 
                          />
                          <span 
                            className="font-mono"
                            style={{ 
                              color: step.status === 'completed' 
                                ? colors.green 
                                : step.status === 'loading' 
                                  ? colors.cyan 
                                  : '#555' 
                            }}
                          >
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isFormDisabled}
                  className="flex-1 px-6 py-3 bg-white text-black font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-[#eee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingLimit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking...
                    </>
                  ) : form.formState.isSubmitting || isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : projectLimit !== null && !projectLimit.canCreate ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Upgrade Required
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Project
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={form.formState.isSubmitting || isLoading}
                  className="px-6 py-3 text-[#888] font-medium rounded-lg flex items-center justify-center gap-2 hover:text-white transition-colors border border-[#333] hover:border-[#555] disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div 
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="p-4 bg-[#1a1a1a] border border-[#333] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Github className="w-4 h-4" style={{ color: colors.purple }} />
              <span className="text-white text-sm font-medium">Public Repos</span>
            </div>
            <p className="text-[#666] text-xs">
              Works best with public repositories. Private repos require authentication.
            </p>
          </div>
          <div className="p-4 bg-[#1a1a1a] border border-[#333] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" style={{ color: colors.yellow }} />
              <span className="text-white text-sm font-medium">AI-Powered</span>
            </div>
            <p className="text-[#666] text-xs">
              We analyze your code structure and create embeddings for accurate answers.
            </p>
          </div>
        </motion.div>

        {/* Bottom stats */}
        <motion.div 
          className="mt-12 pt-8 border-t border-[#222]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="grid grid-cols-3 gap-8">
            {[
              { value: '30s', label: 'Average indexing time' },
              { value: 'RAG', label: 'Retrieval augmented' },
              { value: '∞', label: 'Questions to ask' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-bold text-white mb-1 font-mono">{stat.value}</div>
                <div className="text-xs text-[#666]">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default CreatePage;
