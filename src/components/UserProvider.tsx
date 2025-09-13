'use client';

import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';

export default function UserProvider({ children }: { children: React.ReactNode }) {
  const { loadUser } = useUser();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return <>{children}</>;
}
