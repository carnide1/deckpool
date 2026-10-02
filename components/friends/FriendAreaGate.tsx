"use client";

import type { ReactNode } from "react";
import { EyeOff } from "lucide-react";
import { useFriendData } from "@/contexts/FriendDataContext";
import type { PrivacyArea } from "@/types/friends";

const AREA_LABEL: Record<PrivacyArea, string> = {
  decks: "Decks",
  collection: "Collection",
  wanted: "Wanted board",
};

/**
 * Shows "Hidden by {name}" when the friend doesn't share `area` (or rules
 * refused), an error when the listener failed, loading while it starts, and
 * `children` once data is in.
 */
export function FriendAreaGate({
  area,
  children,
}: {
  area: PrivacyArea;
  children: ReactNode;
}) {
  const data = useFriendData();
  const source = data[area];
  const hidden = !data.shares(area) || source.denied;

  if (hidden) {
    return (
      <div className="poster-panel flex flex-col items-center gap-2 p-8 text-center">
        <EyeOff className="h-6 w-6 text-[var(--ink-muted)]" aria-hidden />
        <p className="text-sm font-semibold text-[var(--ink-primary)]">
          Hidden by {data.name}
        </p>
        <p className="text-sm text-[var(--ink-muted)]">
          {AREA_LABEL[area]} {area === "decks" ? "are" : "is"} not shared with
          friends.
        </p>
      </div>
    );
  }

  if (source.failed) {
    return (
      <p className="text-sm text-[var(--accent-pirate-red)]">
        Could not load {data.name}&apos;s {AREA_LABEL[area].toLowerCase()}.
      </p>
    );
  }

  if (source.loading) {
    return <p className="text-sm text-[var(--ink-muted)]">Loading…</p>;
  }

  return <>{children}</>;
}
