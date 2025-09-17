'use client';

import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function UserProvider({ children }: { children: React.ReactNode }) {
  const { loadUser, user, isLoading, error } = useUser();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadUser();
    }
  }, [isLoaded, isSignedIn, loadUser]);

  useEffect(() => {
    if (isLoaded && isSignedIn && !isLoading && !user && !error) {
      router.push('/sync-user');
    }
  }, [isLoaded, isSignedIn, isLoading, user, error, router]);

  return <>{children}</>;
}
