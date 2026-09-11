"use client";

import { DeckStatusBadges } from "@/components/decks/DeckStatusBadges";
import { SORT_LABELS, type SortKey } from "@/lib/search/sortCards";
import {
  DECK_STACK_SORTS,
  type DeckStack,
} from "@/lib/builderDeckStacks";
import { BuilderCardStack } from "@/components/builder/BuilderCardStack";

export function BuilderDeckBoard({
  stacks,
  deckCount,
  deckSort,
  onDeckSort,
  legal,
  owned,
  onRemove,
  onInspect,
}: {
  stacks: DeckStack[];
  deckCount: number;
  deckSort: SortKey;
  onDeckSort: (next: SortKey) => void;
  legal: boolean;
  owned: boolean;
  onRemove: (cardId: string) => void;
  onInspect: (card: DeckStack["card"]) => void;
}) {
  return (
    <section className="poster-panel flex flex-col gap-1.5 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="font-display text-sm font-bold text-[var(--ink-primary)]">
            Main deck
          </h2>
          <p className="text-xs tabular-nums text-[var(--ink-muted)]">
            {deckCount}/50
          </p>
          <div className="lg:hidden">
            <DeckStatusBadges legal={legal} owned={owned} />
          </div>
        </div>
        <label className="inline-flex shrink-0 items-center gap-1.5 text-[0.6875rem] text-[var(--ink-muted)]">
          <span className="hidden sm:inline">Sort</span>
          <select
            value={deckSort}
            onChange={(event) => onDeckSort(event.target.value as SortKey)}
            aria-label="Sort main deck"
            className="h-7 rounded-md border border-[var(--bg-inset)] bg-[var(--bg-panel)] px-1.5 text-[0.6875rem] font-medium text-[var(--ink-primary)] focus:border-[var(--accent-ocean)] focus:outline-none"
          >
            {DECK_STACK_SORTS.map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {stacks.length === 0 ? (
        <p className="py-3 text-center text-sm text-[var(--ink-muted)]">
          Tap a card below to add it to this list.
        </p>
      ) : (
        <div className="flex items-start gap-3 overflow-x-auto pb-1 md:flex-wrap md:gap-3 md:overflow-visible md:pb-0">
          {stacks.map(({ card, qty }) => (
            <BuilderCardStack
              key={card.id}
              card={card}
              qty={qty}
              onRemove={onRemove}
              onInspect={onInspect}
            />
          ))}
        </div>
      )}
    </section>
  );
}
