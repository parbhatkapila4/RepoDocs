"use client";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { useProjectsContext } from "@/context/ProjectsContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Github, Plus, Loader2, CheckCircle2, Circle, Code2, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

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
      if (!token) return true; // Optional field
      return token.length >= 20; // Basic validation for GitHub token length
    }, "GitHub token must be at least 20 characters long"),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

type LoadingStep = {
  id: number;
  label: string;
  status: 'pending' | 'loading' | 'completed';
  icon: React.ComponentType<{ className?: string }>;
};

function CreatePage() {
  const router = useRouter();
  const { createNewProject, isLoading } = useProjects();
  const { loadProjects, selectProject } = useProjectsContext();
  const isSubmittingRef = useRef(false);
  const initialSteps: LoadingStep[] = [
    { id: 1, label: 'Creating project...', status: 'pending', icon: Plus },
    { id: 2, label: 'Loading repository files...', status: 'pending', icon: Github },
    { id: 3, label: 'Analyzing code...', status: 'pending', icon: Code2 },
    { id: 4, label: 'Generating embeddings...', status: 'pending', icon: Sparkles },
    { id: 5, label: 'Creating documentation...', status: 'pending', icon: FileText },
  ];
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>(initialSteps);
  const [progress, setProgress] = useState(0);

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

  useEffect(() => {
    const completedSteps = loadingSteps.filter(step => step.status === 'completed').length;
    const totalSteps = loadingSteps.length || 1;
    const calculatedProgress = Math.round((completedSteps / totalSteps) * 100);
    setProgress(calculatedProgress);
  }, [loadingSteps]);

  const onSubmit = async (data: CreateProjectForm) => {
    if (isLoading || isSubmittingRef.current) {
      return;
    }
    
    isSubmittingRef.current = true;
    
    try {
      setLoadingSteps(initialSteps);
      setProgress(0);

      // Step 1: Creating project
      updateStep(1, 'loading');
      
      const newProject = await createNewProject(data.name, data.githubUrl, data.githubToken || undefined);
      
      updateStep(1, 'completed');
      
      // Step 2: Loading repository (simulate progress)
      updateStep(2, 'loading');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStep(2, 'completed');
      
      // Step 3: Analyzing code
      updateStep(3, 'loading');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStep(3, 'completed');
      
      // Step 4: Generating embeddings
      updateStep(4, 'loading');
      await new Promise(resolve => setTimeout(resolve, 1200));
      updateStep(4, 'completed');
      
      // Step 5: Creating documentation
      updateStep(5, 'loading');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStep(5, 'completed');
      
      // Refetch projects to get the updated list
      await loadProjects();
      
      // Set the newly created project as selected
      if (newProject?.id) {
        selectProject(newProject.id);
      }
      
      toast.success("Project created successfully!", {
        description: `${data.name} has been indexed and is ready to use!`,
      });
      
      // Small delay to show completion before redirecting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating project:", error);
      
      // Reset all steps to pending
      setLoadingSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
      setProgress(0);
      
      toast.error("Failed to create project", {
        description: error instanceof Error ? error.message : "Please try again or check your connection.",
      });
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="flex items-center justify-center h-full w-full p-4">
      <div className="max-w-2xl mx-auto w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Create New Project
          </h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">
            Add a new project by providing its name and GitHub repository URL
          </p>
        </div>

        <Card className=" ">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Plus className="h-5 w-5" />
              Project Details
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter the project name and GitHub repository URL to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Project Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter project name"
                          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="githubUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-white">
                        <Github className="h-4 w-4" />
                        GitHub Repository URL
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://github.com/username/repository"
                          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="githubToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-white">
                        <Sparkles className="h-4 w-4" />
                        GitHub Access Token
                        <span className="text-xs font-normal text-gray-400">(optional but recommended)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="ghp_XXXXXXXXXXXXXXXXXXXX"
                          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                          autoComplete="off"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-400">
                        Provide a GitHub personal access token with <code className="font-mono">repo</code> scope to
                        avoid rate limits, especially for large repositories.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Loading Progress */}
                {(form.formState.isSubmitting || isLoading) && (
                  <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Processing...</span>
                        <span className="text-blue-400 font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <div className="space-y-3">
                      {loadingSteps.map((step) => (
                        <div
                          key={step.id}
                          className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                            step.status === 'completed'
                              ? 'text-green-400'
                              : step.status === 'loading'
                              ? 'text-blue-400'
                              : 'text-gray-500'
                          }`}
                        >
                          {step.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                          ) : step.status === 'loading' ? (
                            <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
                          ) : (
                            <Circle className="h-5 w-5 flex-shrink-0" />
                          )}
                          <step.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="font-medium">{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={form.formState.isSubmitting || isLoading}
                  >
                    {form.formState.isSubmitting || isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Project
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 sm:flex-none border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => router.back()}
                    disabled={form.formState.isSubmitting || isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CreatePage;
