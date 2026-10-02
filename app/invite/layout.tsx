import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { FriendsProvider } from "@/contexts/FriendsContext";

export const metadata: Metadata = {
  title: "DeckPool invite",
  robots: { index: false, follow: false },
};

export default function InviteLayout({ children }: { children: ReactNode }) {
  return (
    <FriendsProvider>
      <div className="min-h-dvh bg-[var(--bg-page)]">
        <header className="flex items-center justify-between border-b border-[var(--bg-inset)] px-4 py-3">
          <Link
            href="/"
            className="font-display text-xl font-bold text-[var(--accent-pirate-red)]"
          >
            DeckPool
          </Link>
        </header>
        <main className="flex justify-center px-4 py-10">{children}</main>
      </div>
    </FriendsProvider>
  );
}
