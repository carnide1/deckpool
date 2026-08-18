"use client";

import { CardImage } from "@/components/CardImage";
import type { DeckPoolCard } from "@/types/catalog";

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

export function CardGrid({
  cards,
  ownedIds,
  preferredImages,
  onSelect,
}: {
  cards: DeckPoolCard[];
  ownedIds: Set<string>;
  preferredImages: Record<string, string>;
  onSelect: (card: DeckPoolCard) => void;
}) {
  if (cards.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        No cards match this search.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {cards.map((card) => {
        const owned = ownedIds.has(card.id);
        const image =
          preferredImages[card.id] ?? card.images[0] ?? null;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card)}
            className={[
              "poster-panel overflow-hidden border-2 p-2 text-left transition-transform hover:-translate-y-0.5",
              borderClass(card),
            ].join(" ")}
          >
            {image ? (
              <CardImage
                src={image}
                alt={card.name}
                width={160}
                height={224}
                className="mx-auto w-full max-w-[160px]"
              />
            ) : (
              <div className="mx-auto flex h-[224px] max-w-[160px] items-center justify-center rounded-md bg-[var(--bg-inset)] text-xs text-[var(--ink-muted)]">
                No art
              </div>
            )}
            <p className="mt-2 truncate text-sm font-semibold">{card.name}</p>
            <p className="truncate text-xs text-[var(--ink-muted)]">{card.id}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
                {card.rarity}
              </span>
              {owned ? (
                <span className="text-[10px] font-semibold text-[var(--badge-owned)]">
                  Owned
                </span>
              ) : (
                <span className="text-[10px] text-[var(--badge-unowned)]">
                  Unowned
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
