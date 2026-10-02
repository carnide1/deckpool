"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isSafeNextPath } from "@/lib/auth-routing";

/** Link between /login and /signup that keeps a safe `?next=` (e.g. an invite). */
export function AuthSwitchLink({
  href,
  children,
}: {
  href: "/login" | "/signup";
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(event) => {
        const next = new URLSearchParams(window.location.search).get("next");
        if (!isSafeNextPath(next)) return;
        event.preventDefault();
        router.push(`${href}?next=${encodeURIComponent(next)}`);
      }}
      className="font-medium text-[var(--accent-ocean)] hover:underline"
    >
      {children}
    </Link>
  );
}
