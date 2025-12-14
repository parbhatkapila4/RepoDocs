import { useEffect, useState, useCallback } from "react";
import { getUserProjects } from "@/lib/actions";

export interface SidebarProject {
  id: string;
  name: string;
  repoUrl: string;
  createdAt: Date;
}

export const useSidebarProjects = () => {
  const [projects, setProjects] = useState<SidebarProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const userProjects = await getUserProjects();
      setProjects(userProjects);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    localStorage.setItem("selectedProjectId", projectId);
  }, []);

  const getSelectedProjectId = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedProjectId");
    }
    return null;
  }, []);

  useEffect(() => {
    loadProjects();

    const savedProjectId = getSelectedProjectId();
    if (savedProjectId) {
      setSelectedProjectId(savedProjectId);
    }
  }, [loadProjects, getSelectedProjectId]);

  return {
    projects,
    selectedProjectId,
    isLoading,
    loadProjects,
    selectProject,
  };
};
