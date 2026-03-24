"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";

export default function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loadUser, user, isLoading, error } = useUser();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const retryCountRef = useRef(0);
  const maxRetries = 4;

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      retryCountRef.current = 0;
      loadUser();
    }
  }, [isLoaded, isSignedIn, loadUser]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || isLoading || user || error) return;
    if (pathname === "/sync-user") return;

    const retry = retryCountRef.current;
    if (retry < maxRetries) {
      const t = setTimeout(() => {
        retryCountRef.current = retry + 1;
        loadUser();
      }, 1200);
      return () => clearTimeout(t);
    }

    router.push("/sync-user");
  }, [isLoaded, isSignedIn, isLoading, user, error, pathname, loadUser, router]);

  return <>{children}</>;
}
