import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { setUser, clearUser, setLoading, setError } from '@/lib/slices/userSlice';
import { getCurrentUser } from '@/lib/actions';

export const useUser = () => {
  const dispatch = useDispatch();
  const { currentUser, isLoading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.user
  );
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const loadUser = useCallback(async () => {
    if (retryCountRef.current >= maxRetries) {
      console.error('Max retries reached for loading user');
      dispatch(setError('Failed to load user after multiple attempts'));
      dispatch(setLoading(false));
      return;
    }

    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      const user = await getCurrentUser();
      
      if (user) {
        dispatch(setUser(user));
        retryCountRef.current = 0;
      } else {
        dispatch(clearUser());
        retryCountRef.current++;
      }
    } catch (error) {
      console.error('Error loading user:', error);
      retryCountRef.current++;
      dispatch(setError('Failed to load user'));
      dispatch(clearUser());
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    dispatch(clearUser());
    retryCountRef.current = 0;
  }, [dispatch]);

  const resetRetryCount = useCallback(() => {
    retryCountRef.current = 0;
  }, []);

  useEffect(() => {
    if (!currentUser && !isLoading && !error && retryCountRef.current < maxRetries) {
      loadUser();
    }
  }, [currentUser, isLoading, error, loadUser]);

  return {
    user: currentUser,
    isLoading,
    error,
    isAuthenticated,
    loadUser,
    logout,
    resetRetryCount,
  };
};
