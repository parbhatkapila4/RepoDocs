"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { addProject } from "@/lib/slices/projectSlice";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Github, Plus } from "lucide-react";

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
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

function CreatePage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      githubUrl: "",
    },
  });

  const onSubmit = (data: CreateProjectForm) => {
    try {
      // Dispatch the project creation action
      dispatch(
        addProject({
          name: data.name,
          githubUrl: data.githubUrl,
          status: "pending",
        })
      );

      // Redirect to dashboard after successful creation
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create New Project
          </h1>
          <p className="text-gray-400 mt-2">
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

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? "Creating..."
                      : "Create Project"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => router.back()}
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
