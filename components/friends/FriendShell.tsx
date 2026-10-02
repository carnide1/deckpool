"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ArrowLeft, EyeOff } from "lucide-react";
import {
  FriendDataProvider,
  useFriendData,
} from "@/contexts/FriendDataContext";
import type { PrivacyArea } from "@/types/friends";

const TABS: { area: PrivacyArea; label: string; suffix: string }[] = [
  { area: "decks", label: "Decks", suffix: "" },
  { area: "collection", label: "Collection", suffix: "/collection" },
  { area: "wanted", label: "Wanted", suffix: "/wanted" },
];

function safeDecode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function FriendShell({ children }: { children: ReactNode }) {
  const params = useParams<{ uid: string }>();
  const uid = safeDecode(params.uid);
  return (
    <FriendDataProvider uid={uid}>
      <FriendShellBody>{children}</FriendShellBody>
    </FriendDataProvider>
  );
}

function FriendShellBody({ children }: { children: ReactNode }) {
  const { uid, access, profile, name, shares } = useFriendData();
  const pathname = usePathname();
  const base = `/friends/${uid}`;

  const backLink = (
    <Link
      href="/friends"
      className="inline-flex items-center gap-2 text-sm text-[var(--accent-ocean)] hover:underline"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to friends
    </Link>
  );

  if (access === "loading") {
    return <p className="text-sm text-[var(--ink-muted)]">Loading friend…</p>;
  }

  if (access === "unavailable" || !profile) {
    return (
      <div className="mx-auto max-w-2xl">
        {backLink}
        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          This page is not available. You can only view friends&apos; pages.
        </p>
      </div>
    );
  }

  const activeArea: PrivacyArea = pathname.startsWith(`${base}/collection`)
    ? "collection"
    : pathname.startsWith(`${base}/wanted`)
      ? "wanted"
      : "decks";
  // Deck detail pages carry their own header and back link (when decks are shared).
  const onDeckDetail = pathname.startsWith(`${base}/decks/`);

  if (onDeckDetail && shares("decks")) return <>{children}</>;

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4">
      {backLink}
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
          {name}
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          @{profile.username}
        </p>
      </div>

      <nav
        aria-label={`${name}'s pages`}
        className="flex flex-wrap gap-1 border-b border-[var(--bg-inset)]"
      >
        {TABS.map((tab) => {
          const active = tab.area === activeArea;
          return (
            <Link
              key={tab.area}
              href={`${base}${tab.suffix}`}
              aria-current={active ? "page" : undefined}
              className={[
                "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold",
                active
                  ? "border-[var(--accent-ocean)] text-[var(--ink-primary)]"
                  : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
              ].join(" ")}
            >
              {tab.label}
              {shares(tab.area) ? null : (
                <EyeOff className="h-3.5 w-3.5" aria-label="hidden" />
              )}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
