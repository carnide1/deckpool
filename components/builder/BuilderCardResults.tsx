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

export function BuilderCardResults({
  cards,
  ownedIds,
  inDeckById,
  canAdd,
  onAdd,
}: {
  cards: DeckPoolCard[];
  ownedIds: Set<string>;
  inDeckById: Record<string, number>;
  canAdd: (cardId: string) => boolean;
  onAdd: (card: DeckPoolCard) => void;
}) {
  if (cards.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        No cards match this search in your Leader&apos;s legal pool.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => {
        const owned = ownedIds.has(card.id);
        const inDeck = inDeckById[card.id] ?? 0;
        const addable = canAdd(card.id);

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onAdd(card)}
            disabled={!addable}
            className={[
              "poster-panel overflow-hidden border-2 p-2 text-left transition-transform",
              addable
                ? "hover:-translate-y-0.5 cursor-pointer"
                : "cursor-not-allowed opacity-60",
              borderClass(card),
            ].join(" ")}
          >
            {card.images[0] ? (
              <CardImage
                src={card.images[0]}
                alt={card.name}
                width={140}
                height={196}
                className="mx-auto w-full"
              />
            ) : null}
            <p className="mt-2 truncate text-xs font-semibold text-[var(--ink-primary)]">
              {card.name}
            </p>
            <p className="truncate text-[0.625rem] text-[var(--ink-muted)]">
              {card.id}
            </p>
            <div className="mt-1 flex flex-wrap gap-1 text-[0.625rem] font-semibold">
              <span className="tabular-nums text-[var(--ink-primary)]">
                In deck: {inDeck}
              </span>
              {owned ? (
                <span className="text-[var(--badge-owned)]">Owned</span>
              ) : (
                <span className="text-[var(--badge-unowned)]">Unowned</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
