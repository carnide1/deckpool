"use client";

import { DeckStatusBadges } from "@/components/decks/DeckStatusBadges";

export function BuilderStatusPanel({
  legal,
  owned,
  reasons,
}: {
  legal: boolean;
  owned: boolean;
  reasons: string[];
}) {
  return (
    <div className="poster-panel p-4">
          <DeckStatusBadges legal={legal} owned={owned} />
      {reasons.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-[var(--ink-muted)]">
          {reasons.slice(0, 8).map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
          {reasons.length > 8 ? (
            <li>• +{reasons.length - 8} more</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
