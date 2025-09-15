"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useProjectsContext } from '@/context/ProjectsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FolderOpen, Github } from 'lucide-react';

function DashboardPage() {
  const router = useRouter();
  const { projects, isLoading } = useProjectsContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your projects...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              No Projects Yet
            </h1>
            <p className="text-gray-400 mb-8">
              Get started by creating your first project. Connect a GitHub repository to begin analyzing your code.
            </p>
          </div>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Github className="h-5 w-5" />
                Create Your First Project
              </CardTitle>
              <CardDescription className="text-gray-400">
                Connect a GitHub repository to start analyzing your codebase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push('/create')}
                className="w-full"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If projects exist, show the projects list
  return (
    <div className="p-6">
     

     
    </div>
  );
}

export default DashboardPage;
