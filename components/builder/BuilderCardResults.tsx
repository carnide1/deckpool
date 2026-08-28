"use client";

import { CardImage } from "@/components/CardImage";
import { WantedStamp } from "@/components/wanted/WantedStamp";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { imageCandidates } from "@/lib/cardPrefs";
import type { DeckPoolCard } from "@/types/catalog";
import { Plus } from "lucide-react";

const COLOR_CLASS: Record<string, string> = {
  Red: "border-[var(--color-red)]",
  Green: "border-[var(--color-green)]",
  Blue: "border-[var(--color-blue)]",
  Purple: "border-[var(--color-purple)]",
  Black: "border-[var(--color-black)]",
  Yellow: "border-[var(--color-yellow)]",
};

function borderClass(card: DeckPoolCard): string {
  if (card.colors.length === 0) return "border-[var(--bg-inset)]";
  if (card.colors.length === 1) {
    return COLOR_CLASS[card.colors[0]] ?? "border-[var(--bg-inset)]";
  }
  return "border-[var(--accent-gold)]";
}

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

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
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
              "poster-panel overflow-hidden border-2 p-1.5 text-left sm:p-2",
              borderClass(card),
            ].join(" ")}
          >
            <div className="relative mx-auto w-full max-w-[120px]">
              <button
                type="button"
                onClick={() => onInspect(card)}
                className="block w-full cursor-zoom-in text-left transition-transform hover:-translate-y-0.5"
                aria-label={`Inspect ${card.name}`}
              >
                {image ? (
                  <CardImage
                    src={image}
                    fallbackSrcs={fallbacks}
                    alt={card.name}
                    width={120}
                    height={168}
                    className="h-auto w-full"
                  />
                ) : null}
              </button>
              <div className="absolute right-1 bottom-1 z-10">
                <WantedStamp
                  posted={wantedQty > 0}
                  count={wantedQty}
                  disabled={wantedSaving}
                  onClick={() => onToggleWanted(card)}
                />
              </div>
            </div>
            <div className={addable ? "" : "opacity-40 grayscale"}>
              <button
                type="button"
                onClick={() => onInspect(card)}
                className="mt-2 block w-full truncate text-left text-xs font-semibold text-[var(--ink-primary)]"
              >
                {card.name}
              </button>
              <p className="truncate text-[0.625rem] text-[var(--ink-muted)]">
                {card.id}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[0.625rem] font-semibold">
                <span className="tabular-nums text-[var(--ink-primary)]">
                  In deck: {inDeck}
                </span>
                <span
                  className={
                    ownedQty > 0
                      ? "tabular-nums text-[var(--badge-owned)]"
                      : "tabular-nums text-[var(--badge-unowned)]"
                  }
                >
                  Owned: {ownedQty}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onAdd(card)}
                disabled={!addable}
                className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg bg-[var(--accent-pirate-red)] px-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={
                  addable ? `Add ${card.name} to deck` : `${card.name} cannot be added`
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
