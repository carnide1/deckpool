"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getPostLoginPath } from "@/lib/auth-routing";

const AUTH_ROUTES = new Set(["/", "/login", "/signup", "/forgot-password"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthRoute = AUTH_ROUTES.has(pathname);

  useEffect(() => {
    if (loading) return;

    if (!user && !isAuthRoute) {
      router.replace("/login");
      return;
    }

    if (user && isAuthRoute) {
      void getPostLoginPath(user.uid).then((path) => router.replace(path));
    }
  }, [user, loading, isAuthRoute, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--ink-muted)]">
        Loading…
      </div>
    );
  }

  if (!user && !isAuthRoute) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--ink-muted)]">
        Redirecting…
      </div>
    );
  }

  if (user && isAuthRoute) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--ink-muted)]">
        Redirecting…
      </div>
    );
  }

  return children;
}
