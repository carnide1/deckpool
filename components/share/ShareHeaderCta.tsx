"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function ShareHeaderCta() {
  const { user, loading } = useAuth();
  const href = !loading && user ? "/decks" : "/signup";
  const label = !loading && user ? "Open Decks" : "Make your own";

  return (
    <Link
      href={href}
      className="text-sm font-semibold text-[var(--accent-ocean)] hover:underline"
    >
      {label}
    </Link>
  );
}
