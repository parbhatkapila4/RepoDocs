import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { 
  setLoading, 
  setError, 
  setRepository, 
  clearRepository,
  updateRepositoryStats 
} from '@/lib/slices/repositorySlice';
import { fetchRepositoryInfo } from '@/lib/actions';

export const useRepository = () => {
  const dispatch = useDispatch();
  const { currentRepository, isLoading, error, lastFetched } = useSelector(
    (state: RootState) => state.repository
  );

  const fetchRepository = useCallback(async (repoUrl: string) => {
    if (!repoUrl) {
      dispatch(setError('No repository URL provided'));
      return;
    }

    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const repoInfo = await fetchRepositoryInfo(repoUrl);
      
      if (repoInfo) {
        dispatch(setRepository(repoInfo));
        return repoInfo;
      } else {
        dispatch(setError('Failed to fetch repository information'));
        return null;
      }
    } catch (err) {
      console.error('Error fetching repository:', err);
      dispatch(setError('Error fetching repository information'));
      return null;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const clearCurrentRepository = useCallback(() => {
    dispatch(clearRepository());
  }, [dispatch]);

  const updateStats = useCallback((stats: Partial<{
    stars: number;
    forks: number;
    watchers: number;
    openIssues: number;
  }>) => {
    dispatch(updateRepositoryStats(stats));
  }, [dispatch]);

  const refreshRepository = useCallback(async (repoUrl: string) => {
    return await fetchRepository(repoUrl);
  }, [fetchRepository]);

  return {
    currentRepository,
    isLoading,
    error,
    lastFetched,
    fetchRepository,
    clearCurrentRepository,
    updateStats,
    refreshRepository,
  };
};
