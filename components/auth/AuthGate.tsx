"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPostLoginPath,
  isAuthLandingPath,
  isSafeNextPath,
} from "@/lib/auth-routing";
import { Button } from "@/components/ui/Button";

/** Guests may open these without logging in; signed-in users stay on the page. */
function isPublicRoute(pathname: string): boolean {
  if (isAuthLandingPath(pathname)) return true;
  if (pathname === "/s" || pathname.startsWith("/s/")) return true;
  return false;
}

function currentReturnPath(pathname: string): string {
  if (typeof window === "undefined") return pathname;
  return `${pathname}${window.location.search}`;
}

function readNextParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("next");
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, authTimedOut, retryAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicRoute = isPublicRoute(pathname);
  const authLanding = isAuthLandingPath(pathname);

  useEffect(() => {
    if (loading) return;

    // Do not auto-redirect while Auth timed out — Retry must stay usable.
    if (!user && !publicRoute && !authTimedOut) {
      const returnTo = currentReturnPath(pathname);
      const loginUrl = isSafeNextPath(returnTo)
        ? `/login?next=${encodeURIComponent(returnTo)}`
        : "/login";
      router.replace(loginUrl);
      return;
    }

    if (!user || !authLanding) return;

    let cancelled = false;
    const next = readNextParam();
    if (isSafeNextPath(next)) {
      router.replace(next);
      return;
    }

    void getPostLoginPath(user.uid).then((path) => {
      if (cancelled) return;
      router.replace(path);
    });

    return () => {
      cancelled = true;
    };
  }, [
    user,
    loading,
    authTimedOut,
    publicRoute,
    authLanding,
    pathname,
    router,
  ]);

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
      const returnTo = currentReturnPath(pathname);
      const loginHref = isSafeNextPath(returnTo)
        ? `/login?next=${encodeURIComponent(returnTo)}`
        : "/login";
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
              href={loginHref}
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
