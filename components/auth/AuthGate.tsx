"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPostLoginPath } from "@/lib/auth-routing";
import { Button } from "@/components/ui/Button";

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
  const { user, loading, authTimedOut, retryAuth } = useAuth();
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

    if (!user || !authLanding) return;

    let cancelled = false;
    void getPostLoginPath(user.uid).then((path) => {
      if (cancelled) return;
      router.replace(path);
    });

    return () => {
      cancelled = true;
    };
  }, [user, loading, publicRoute, authLanding, pathname, router]);

  // Public pages (landing, login, share links) must not wait on Firebase Auth.
  // Mobile Safari can hang on IndexedDB and would otherwise freeze the whole site.
  if (loading && publicRoute) {
    return children;
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center text-sm text-[var(--ink-muted)]">
        <p>Loading…</p>
      </div>
    );
  }

  if (!user && !publicRoute) {
    if (authTimedOut) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-[var(--ink-muted)]">
            Sign-in is taking too long. Check your connection, then try again.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" size="sm" onClick={retryAuth}>
              Retry
            </Button>
            <Link
              href="/login"
              className="text-sm font-semibold text-[var(--accent-ocean)] hover:underline"
            >
              Go to log in
            </Link>
          </div>
        </div>
      );
    }
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
