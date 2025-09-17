'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getUserProjects, deleteUserProject } from '@/lib/actions';

export interface SidebarProject {
  id: string;
  name: string;
  repoUrl: string;
  createdAt: Date;
}

interface ProjectsContextType {
  projects: SidebarProject[];
  selectedProjectId: string | null;
  isLoading: boolean;
  loadProjects: () => Promise<void>;
  selectProject: (projectId: string) => void;
  deleteProject: (projectId: string) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const useProjectsContext = () => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjectsContext must be used within a ProjectsProvider');
  }
  return context;
};

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<SidebarProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const userProjects = await getUserProjects();
      setProjects(userProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    localStorage.setItem('selectedProjectId', projectId);
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await deleteUserProject(projectId);
      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
        localStorage.removeItem('selectedProjectId');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadProjects();
    
    // Load selected project from localStorage
    const savedProjectId = localStorage.getItem('selectedProjectId');
    if (savedProjectId) {
      setSelectedProjectId(savedProjectId);
    }
  }, [loadProjects]);

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        selectedProjectId,
        isLoading,
        loadProjects,
        selectProject,
        deleteProject,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};
