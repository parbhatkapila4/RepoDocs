import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { setUser, clearUser, setLoading, setError } from '@/lib/slices/userSlice';
import { getCurrentUser } from '@/lib/actions';

export const useUser = () => {
  const dispatch = useDispatch();
  const { currentUser, isLoading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.user
  );

  const loadUser = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      const user = await getCurrentUser();
      
      if (user) {
        dispatch(setUser(user));
      } else {
        dispatch(clearUser());
      }
    } catch (error) {
      console.error('Error loading user:', error);
      dispatch(setError('Failed to load user'));
      dispatch(clearUser());
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    dispatch(clearUser());
  }, [dispatch]);

  useEffect(() => {
    if (!currentUser && !isLoading) {
      loadUser();
    }
  }, [currentUser, isLoading, loadUser]);

  return {
    user: currentUser,
    isLoading,
    error,
    isAuthenticated,
    loadUser,
    logout,
  };
};
