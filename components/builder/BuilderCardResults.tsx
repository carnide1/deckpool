"use client";

import type { MouseEvent } from "react";
import { Info } from "lucide-react";
import { CardImage } from "@/components/CardImage";
import { WantedStamp } from "@/components/wanted/WantedStamp";
import { CardQtyChip } from "@/components/ui/CardQtyChip";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { imageCandidates } from "@/lib/cardPrefs";
import type { DeckPoolCard } from "@/types/catalog";

export function BuilderCardResults({
  cards,
  ownedQtyById,
  inDeckById,
  wantedQtyById,
  canAdd,
  onAdd,
  onInspect,
  onToggleWanted,
  wantedSaving = false,
}: {
  cards: DeckPoolCard[];
  ownedQtyById: Record<string, number>;
  inDeckById: Record<string, number>;
  wantedQtyById: Record<string, number>;
  canAdd: (cardId: string) => boolean;
  onAdd: (card: DeckPoolCard) => void;
  onInspect: (card: DeckPoolCard) => void;
  onToggleWanted: (card: DeckPoolCard) => void;
  wantedSaving?: boolean;
}) {
  const { preferredByCardId } = useCardPrefs();
  if (cards.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        No cards match this search in your Leader&apos;s legal pool.
      </p>
    );
  }

  const stop = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {cards.map((card) => {
        const ownedQty = ownedQtyById[card.id] ?? 0;
        const inDeck = inDeckById[card.id] ?? 0;
        const wantedQty = wantedQtyById[card.id] ?? 0;
        const addable = canAdd(card.id);
        const [image, ...fallbacks] = imageCandidates(card, preferredByCardId);

        return (
          <article
            key={card.id}
            className={[
              "relative overflow-hidden rounded-md",
              addable ? "" : "opacity-40 grayscale",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={() => {
                if (addable) onAdd(card);
              }}
              disabled={!addable}
              className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ocean)] disabled:cursor-not-allowed"
              aria-label={
                addable
                  ? `Add ${card.name} to deck`
                  : `${card.name} cannot be added`
              }
            >
              {image ? (
                <CardImage
                  src={image}
                  fallbackSrcs={fallbacks}
                  alt={card.name}
                  width={120}
                  height={168}
                  className="pointer-events-none h-auto w-full max-w-none transition-transform hover:-translate-y-0.5"
                />
              ) : (
                <div className="flex aspect-[5/7] items-center justify-center bg-[var(--bg-inset)] text-xs text-[var(--ink-muted)]">
                  No art
                </div>
              )}
            </button>

            <div className="pointer-events-none absolute right-1 bottom-1 z-10 flex flex-col items-end gap-0.5">
              <CardQtyChip
                label="Own"
                value={ownedQty}
                accentClassName="bg-[var(--badge-owned)]"
                visible={ownedQty > 0}
              />
              <CardQtyChip
                label="Listed"
                value={inDeck}
                accentClassName="bg-[var(--accent-pirate-red)]"
                visible={inDeck > 0}
              />
              <div className="pointer-events-auto">
                <WantedStamp
                  posted={wantedQty > 0}
                  count={wantedQty}
                  disabled={wantedSaving}
                  onClick={() => onToggleWanted(card)}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={(event) => {
                stop(event);
                onInspect(card);
              }}
              onPointerDown={(event) => event.stopPropagation()}
              className="absolute bottom-1 left-1 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-panel)]/95 text-[var(--ink-muted)] shadow hover:text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ocean)]"
              aria-label={`Details for ${card.name}`}
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </article>
        );
      })}
    </div>
  );
}
