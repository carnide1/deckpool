"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPostLoginPath } from "@/lib/auth-routing";

/** Landing / auth pages: guests OK; signed-in users are sent into the app. */
const AUTH_LANDING_ROUTES = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
]);

function isAuthLanding(pathname: string): boolean {
  return AUTH_LANDING_ROUTES.has(pathname);
}

/** Guests may open these without logging in; signed-in users stay on the page. */
function isPublicRoute(pathname: string): boolean {
  if (isAuthLanding(pathname)) return true;
  if (pathname === "/s" || pathname.startsWith("/s/")) return true;
  return false;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicRoute = isPublicRoute(pathname);
  const authLanding = isAuthLanding(pathname);

  useEffect(() => {
    if (loading) return;

    if (!user && !publicRoute) {
      router.replace("/login");
      return;
    }

    if (user && authLanding) {
      void getPostLoginPath(user.uid).then((path) => router.replace(path));
    }
  }, [user, loading, publicRoute, authLanding, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--ink-muted)]">
        Loading…
      </div>
    );
  }

  if (!user && !publicRoute) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--ink-muted)]">
        Redirecting…
      </div>
    );
  }

  if (user && authLanding) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--ink-muted)]">
        Redirecting…
      </div>
    );
  }

  return children;
}
