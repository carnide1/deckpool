"use client";

import { Minus } from "lucide-react";
import type { DeckPoolCard } from "@/types/catalog";

export type ManifestLine = {
  card: DeckPoolCard;
  inDeck: number;
  ownedQty: number;
};

export function BuilderManifest({
  lines,
  deckCount,
  onRemove,
}: {
  lines: ManifestLine[];
  deckCount: number;
  onRemove: (cardId: string) => void;
}) {
  return (
    <div className="poster-panel flex flex-col">
      <div className="border-b border-[var(--bg-inset)] px-4 py-3">
        <h3 className="font-display text-sm font-bold text-[var(--ink-primary)]">
          Manifest
        </h3>
        <p className="mt-0.5 text-xs tabular-nums text-[var(--ink-muted)]">
          {deckCount}/50 cards
        </p>
      </div>
      <ul className="max-h-[min(50dvh,420px)] overflow-y-auto divide-y divide-[var(--bg-inset)]">
        {lines.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-[var(--ink-muted)]">
            Click cards in search results to build your list.
          </li>
        ) : (
          lines.map(({ card, inDeck, ownedQty }) => {
            const unownedGap = inDeck > ownedQty;
            return (
              <li
                key={card.id}
                className={[
                  "flex items-center gap-2 px-3 py-2",
                  unownedGap ? "bg-[var(--badge-unowned)]/10" : "",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--ink-primary)]">
                    {card.name}
                  </p>
                  <p className="truncate text-xs text-[var(--ink-muted)]">
                    {card.id}
                  </p>
                </div>
                <p
                  className={[
                    "shrink-0 text-sm font-bold tabular-nums",
                    unownedGap
                      ? "text-[var(--badge-unowned)]"
                      : "text-[var(--ink-primary)]",
                  ].join(" ")}
                >
                  {inDeck} / {ownedQty}
                </p>
                <button
                  type="button"
                  onClick={() => onRemove(card.id)}
                  className="rounded-lg p-2 text-[var(--ink-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--ink-primary)]"
                  aria-label={`Remove one ${card.name}`}
                >
                  <Minus className="h-4 w-4" />
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
