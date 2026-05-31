"use client";
import React, { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { useProjectsContext } from "@/context/ProjectsContext";
import { useMountedRef } from "@/hooks/useMountedRef";
import { checkProjectLimit } from "@/lib/actions";
import { motion } from "motion/react";
import {
  Github,
  Plus,
  Loader2,
  CheckCircle2,
  Circle,
  Sparkles,
  AlertTriangle,
  Crown,
  Terminal,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { LoadingButton } from "@/components/LoadingButton";

const colors = {
  green: "#50fa7b",
  cyan: "#8be9fd",
  purple: "#bd93f9",
  pink: "#ff79c6",
  yellow: "#f1fa8c",
  orange: "#ffb86c",
  red: "#ff5555",
  white: "#f8f8f2",
};

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
  status: "pending" | "loading" | "completed";
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
  const mountedRef = useMountedRef();
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([
    { id: 1, label: "Validating repository", status: "pending", icon: Github },
    { id: 2, label: "Creating project", status: "pending", icon: Plus },
    { id: 3, label: "Queueing indexer", status: "pending", icon: Sparkles },
  ]);
  const [progress, setProgress] = useState(0);
  const [projectLimit, setProjectLimit] = useState<ProjectLimitStatus | null>(
    null
  );
  const [isCheckingLimit, setIsCheckingLimit] = useState(true);

  useEffect(() => {
    const checkLimit = async () => {
      try {
        if (mountedRef.current) setIsCheckingLimit(true);
        const limitStatus = await checkProjectLimit();
        if (!mountedRef.current) return;
        setProjectLimit(limitStatus);
      } catch (error) {
        console.error("Error checking project limit:", error);
      } finally {
        if (mountedRef.current) setIsCheckingLimit(false);
      }
    };
    void checkLimit();
  }, [mountedRef]);

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      githubUrl: "",
      githubToken: "",
    },
  });

  const updateStep = (stepId: number, status: "loading" | "completed") => {
    setLoadingSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const onSubmit = async (data: CreateProjectForm) => {
    if (isLoading || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;

    const finishCreateInBackground = (newProject: { id: string } | null) => {
      toast.success("Project created successfully!", {
        description: `${data.name} is being indexed in the background. It will be ready shortly!`,
      });
      void loadProjects();
      if (newProject?.id) selectProject(newProject.id);
    };

    try {
      if (mountedRef.current) {
        updateStep(1, "loading");
        setProgress(20);
      }

      const newProject = await createNewProject(
        data.name,
        data.githubUrl,
        data.githubToken || undefined
      );

      if (!mountedRef.current) {
        finishCreateInBackground(newProject);
        return;
      }

      updateStep(1, "completed");
      updateStep(2, "loading");
      setProgress(60);

      await loadProjects();
      if (newProject?.id) selectProject(newProject.id);

      if (!mountedRef.current) return;

      updateStep(2, "completed");
      updateStep(3, "completed");
      setProgress(100);

      toast.success("Project created", {
        description: `${data.name} is indexing in the background. You'll see progress on your dashboard.`,
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating project:", error);

      if (mountedRef.current) {
        setLoadingSteps((prev) =>
          prev.map((step) => ({ ...step, status: "pending" }))
        );
        setProgress(0);
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Please try again or check your connection.";

      if (errorMessage.includes("PROJECT_LIMIT_REACHED")) {
        const limitStatus = await checkProjectLimit();
        if (mountedRef.current) setProjectLimit(limitStatus);

        const upgradeMessage =
          limitStatus.plan === "professional"
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

  const isFormDisabled =
    form.formState.isSubmitting ||
    isLoading ||
    (projectLimit !== null && !projectLimit.canCreate);

  return (
    <div className="min-h-screen bg-black relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#333] to-transparent" />

      <div className="relative max-w-3xl mx-auto px-6 sm:px-8 py-10 lg:py-14">
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-[#888] text-[10.5px] font-mono tracking-[0.22em] uppercase mb-4 block">
            New project
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-4 tracking-[-0.025em] leading-[1.1]">
            Create a project
          </h1>
          <p className="text-[#a0a0a0] text-[15px] max-w-xl mx-auto leading-[1.6]">
            Connect a GitHub repository. RepoDoc indexes every file, traces
            module relationships, and turns the codebase into something you
            can interrogate.
          </p>
        </motion.div>

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
                  <AlertTriangle
                    className="w-5 h-5"
                    style={{ color: colors.orange }}
                  />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    Project Limit Reached
                  </h3>
                  <p className="text-[#888] text-xs mt-0.5">
                    {projectLimit.currentCount} of {projectLimit.maxProjects}{" "}
                    projects used on{" "}
                    {projectLimit.plan === "professional"
                      ? "Professional"
                      : projectLimit.plan === "enterprise"
                        ? "Enterprise"
                        : "Starter"}{" "}
                    plan
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

        {!isCheckingLimit &&
          projectLimit &&
          projectLimit.canCreate &&
          (projectLimit.plan === "starter" ||
            projectLimit.plan === "professional") && (
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
                    <span className="text-white font-medium">
                      {projectLimit.currentCount}
                    </span>
                    <span className="text-[#666]">
                      {" "}
                      / {projectLimit.maxProjects} projects
                    </span>
                  </span>
                </div>
                {projectLimit.currentCount !== undefined &&
                  projectLimit.maxProjects !== undefined &&
                  ((projectLimit.plan === "starter" &&
                    projectLimit.currentCount >= 2) ||
                    (projectLimit.plan === "professional" &&
                      projectLimit.currentCount >= 8)) && (
                    <Link
                      href="/pricing"
                      className="text-xs text-[#bd93f9] hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Crown className="w-3 h-3" />
                      Upgrade
                    </Link>
                  )}
              </div>

              <div className="mt-3 h-1 bg-[#252525] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${((projectLimit.currentCount || 0) / (projectLimit.maxProjects || 1)) * 100}%`,
                    backgroundColor: colors.cyan,
                  }}
                />
              </div>
            </motion.div>
          )}

        <motion.div
          className="bg-[#101012] border border-[#2a2a2e] rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 px-5 py-3.5 bg-[#1a1a1d] border-b border-[#2a2a2e]">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-[#888] text-[13px] font-mono">
              new-project
            </span>
          </div>

          <div className="p-7 lg:p-9">
            <div className="flex items-center gap-3.5 mb-8">
              <div className="w-11 h-11 rounded-lg bg-[#1a1a1d] border border-[#2a2a2e] flex items-center justify-center shrink-0">
                <Terminal className="w-5 h-5" style={{ color: colors.green }} />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">
                  Project details
                </h2>
                <p className="text-[#888] text-sm">
                  Enter repository information
                </p>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
              <div className="space-y-2.5">
                <label className="text-[13px] text-white/80 font-medium block">
                  Project name
                </label>
                <input
                  type="text"
                  placeholder="my-awesome-project"
                  className="w-full px-4 py-3.5 bg-[#0a0a0a] border border-[#2a2a2e] rounded-lg text-white placeholder:text-[#555] focus:border-[#50fa7b] focus:outline-none transition-colors font-mono text-[15px]"
                  {...form.register("name")}
                  disabled={isFormDisabled}
                />
                {form.formState.errors.name && (
                  <p className="text-xs" style={{ color: colors.red }}>
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <label className="text-[13px] text-white/80 font-medium flex items-center gap-2">
                  <Github className="w-3.5 h-3.5" />
                  GitHub repository URL
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username/repository"
                  className="w-full px-4 py-3.5 bg-[#0a0a0a] border border-[#2a2a2e] rounded-lg text-white placeholder:text-[#555] focus:border-[#50fa7b] focus:outline-none transition-colors font-mono text-[15px]"
                  {...form.register("githubUrl")}
                  disabled={isFormDisabled}
                />
                {form.formState.errors.githubUrl && (
                  <p className="text-xs" style={{ color: colors.red }}>
                    {form.formState.errors.githubUrl.message}
                  </p>
                )}
              </div>

              {(form.formState.isSubmitting || isLoading) && (
                <motion.div
                  className="p-5 bg-[#0a0a0a] border border-[#333] rounded-lg relative overflow-hidden"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[#888] text-sm font-mono">
                        Processing...
                      </span>
                      <span
                        className="text-sm font-mono"
                        style={{ color: colors.cyan }}
                      >
                        {progress}%
                      </span>
                    </div>

                    <div className="h-1 bg-[#252525] rounded-full overflow-hidden mb-5">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: colors.green }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    <div className="space-y-3">
                      {loadingSteps.map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-3 text-sm"
                        >
                          {step.status === "completed" ? (
                            <CheckCircle2
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: colors.green }}
                            />
                          ) : step.status === "loading" ? (
                            <Loader2
                              className="w-4 h-4 flex-shrink-0 animate-spin"
                              style={{ color: colors.cyan }}
                            />
                          ) : (
                            <Circle className="w-4 h-4 flex-shrink-0 text-[#444]" />
                          )}
                          {React.createElement(step.icon, {
                            className: "w-4 h-4 flex-shrink-0",
                            style: {
                              color:
                                step.status === "completed"
                                  ? colors.green
                                  : step.status === "loading"
                                    ? colors.cyan
                                    : "#444",
                            },
                          } as React.ComponentProps<typeof step.icon> & {
                            style?: React.CSSProperties;
                          })}
                          <span
                            className="font-mono"
                            style={{
                              color:
                                step.status === "completed"
                                  ? colors.green
                                  : step.status === "loading"
                                    ? colors.cyan
                                    : "#555",
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

              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <LoadingButton
                  type="submit"
                  disabled={isFormDisabled}
                  loading={form.formState.isSubmitting || isLoading}
                  className="flex-1 h-12 px-6 bg-white text-black font-medium text-[14px] rounded-lg hover:bg-[#eee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {projectLimit !== null && !projectLimit.canCreate ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Upgrade required
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create project
                    </>
                  )}
                </LoadingButton>
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={form.formState.isSubmitting || isLoading}
                  className="h-12 px-6 text-[#888] font-medium text-[14px] rounded-lg flex items-center justify-center gap-2 hover:text-white transition-colors border border-[#2a2a2e] hover:border-[#444] disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </motion.div>
        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <span className="text-[#888] text-[10.5px] font-mono tracking-[0.22em] uppercase mb-5 block text-center">
            What happens next
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                step: "01",
                title: "Clone & parse",
                body: "We pull the file tree, scoped to the default branch.",
              },
              {
                step: "02",
                title: "Summarize & embed",
                body: "Each file is summarized with Gemini and stored in pgvector.",
              },
              {
                step: "03",
                title: "Chat goes live",
                body: "Once indexing finishes, every answer cites its source files.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-[#2a2a2e] bg-[#101012] p-5"
              >
                <span
                  className="font-mono text-[10.5px] tracking-[0.22em] block mb-2.5"
                  style={{ color: colors.cyan }}
                >
                  {item.step}
                </span>
                <div className="text-white font-medium text-[14px] tracking-[-0.005em]">
                  {item.title}
                </div>
                <p className="mt-2 text-[#888] text-[13px] leading-[1.6]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-[#2a2a2e] border border-[#2a2a2e]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[
            { value: "30s", label: "Avg indexing" },
            { value: "RAG", label: "Retrieval" },
            { value: "∞", label: "Questions" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#101012] px-5 py-5 text-center"
            >
              <div className="text-2xl font-semibold text-white font-mono tracking-[-0.02em]">
                {stat.value}
              </div>
              <div className="text-[10.5px] text-[#888] mt-1.5 font-mono uppercase tracking-[0.22em]">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <div className="p-4 bg-[#101012] border border-[#2a2a2e] rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Github className="w-3.5 h-3.5" style={{ color: colors.purple }} />
              <span className="text-white text-[13.5px] font-medium">
                Public repos
              </span>
            </div>
            <p className="text-[#888] text-[12.5px] leading-[1.55]">
              Works best with public repositories. Private repos need a
              personal access token.
            </p>
          </div>
          <div className="p-4 bg-[#101012] border border-[#2a2a2e] rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles
                className="w-3.5 h-3.5"
                style={{ color: colors.yellow }}
              />
              <span className="text-white text-[13.5px] font-medium">
                AI-grounded
              </span>
            </div>
            <p className="text-[#888] text-[12.5px] leading-[1.55]">
              Embeddings are produced from real source code. Answers cite the
              files they came from.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default CreatePage;
