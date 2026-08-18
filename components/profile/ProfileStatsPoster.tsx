"use client";

import type { ProfileStats } from "@/lib/profileStats";

function StatFigure({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: "legal" | "illegal" | "owned" | "unowned";
}) {
  const accentClass =
    accent === "legal"
      ? "text-[var(--badge-legal)]"
      : accent === "illegal"
        ? "text-[var(--badge-illegal)]"
        : accent === "owned"
          ? "text-[var(--badge-owned)]"
          : accent === "unowned"
            ? "text-[var(--badge-unowned)]"
            : "text-[var(--ink-primary)]";

  return (
    <div className="text-center">
      <p
        className={[
          "font-display text-3xl font-bold tabular-nums sm:text-4xl",
          accentClass,
        ].join(" ")}
      >
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
        {label}
      </p>
    </div>
  );
}

export function ProfileStatsPoster({
  displayName,
  stats,
  loading,
}: {
  displayName: string;
  stats: ProfileStats;
  loading?: boolean;
}) {
  return (
    <div className="poster-panel relative overflow-hidden">
      <div className="absolute top-0 right-0 left-0 h-1.5 bg-[var(--accent-pirate-red)]" />
      <div className="px-6 pt-8 pb-6 text-center">
        <p className="poster-stamp mb-4">Wanted brewer</p>
        <h2 className="font-display text-3xl font-bold text-[var(--ink-primary)] sm:text-4xl">
          {displayName || "Anonymous pirate"}
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Collection stats — not Berries, just your binder and decks.
        </p>
      </div>

      <div className="border-t border-[var(--bg-inset)] px-4 py-6">
        {loading ? (
          <p className="text-center text-sm text-[var(--ink-muted)]">
            Loading stats…
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <StatFigure
              value={stats.uniqueOwnedIds}
              label="Unique cards owned"
            />
            <StatFigure value={stats.totalCopies} label="Total copies" />
            <StatFigure value={stats.deckCount} label="Decks built" />
            <StatFigure value={stats.variationCount} label="Variations" />
            <StatFigure
              value={stats.legalVariations}
              label="Legal lists"
              accent="legal"
            />
            <StatFigure
              value={stats.illegalVariations}
              label="Illegal lists"
              accent="illegal"
            />
            <StatFigure
              value={stats.ownedVariations}
              label="Owned lists"
              accent="owned"
            />
            <StatFigure
              value={stats.unownedVariations}
              label="Unowned lists"
              accent="unowned"
            />
          </div>
        )}
      </div>
    </div>
  );
}
