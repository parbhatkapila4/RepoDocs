import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { addProject, setLoading, setError } from '@/lib/slices/projectSlice';
import { createProject } from '@/lib/actions';

export const useProjects = () => {
  const dispatch = useDispatch();
  const { projects, currentProject, isLoading, error } = useSelector(
    (state: RootState) => state.project
  );
  const { currentUser } = useSelector((state: RootState) => state.user);

  const createNewProject = useCallback(async (name: string, githubUrl: string, githubToken?: string) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const project = await createProject(name, githubUrl, githubToken);

      dispatch(
        addProject({
          name: project.name,
          githubUrl: project.repoUrl,
          status: 'completed',
        })
      );

      return project;
    } catch (error) {
      console.error('Error creating project:', error);
      dispatch(setError('Failed to create project'));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [currentUser, dispatch]);

  return {
    projects,
    currentProject,
    isLoading,
    error,
    createNewProject,
  };
};
