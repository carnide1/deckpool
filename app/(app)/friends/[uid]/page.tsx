"use client";

import { useMemo } from "react";
import { DeckRow } from "@/components/decks/DeckRow";
import { FriendAreaGate } from "@/components/friends/FriendAreaGate";
import { SortSelect } from "@/components/search/SortSelect";
import { useCatalog } from "@/contexts/CatalogContext";
import { useFriendData } from "@/contexts/FriendDataContext";
import { useDeckSort } from "@/hooks/useDeckSort";
import { getConstructionRules } from "@/lib/construction";
import { summarizeDeck } from "@/lib/legality";
import { DECK_SORT_LABELS, DECK_SORTS, sortDecks } from "@/lib/sortDecks";

const NO_OWNERSHIP: Record<string, number> = {};

function FriendDecksList() {
  const { uid, name, decks: friendDecks, cardPrefs } = useFriendData();
  const { cardsById, loading: catalogLoading } = useCatalog();
  const { decks, variationsByDeckId } = friendDecks;
  const constructionRules = useMemo(() => getConstructionRules(), []);
  const [sort, setSort] = useDeckSort();

  const sortedDecks = useMemo(
    () => sortDecks(decks, sort, cardsById),
    [decks, sort, cardsById],
  );

  const summariesByDeckId = useMemo(() => {
    const map: Record<string, ReturnType<typeof summarizeDeck>> = {};
    for (const deck of decks) {
      map[deck.id] = summarizeDeck(
        deck.leaderId,
        variationsByDeckId[deck.id] ?? [],
        cardsById,
        NO_OWNERSHIP,
        constructionRules,
        deck.favoriteVariationId,
      );
    }
    return map;
  }, [decks, variationsByDeckId, cardsById, constructionRules]);

  if (catalogLoading) {
    return <p className="text-sm text-[var(--ink-muted)]">Loading decks…</p>;
  }

  if (decks.length === 0) {
    return (
      <div className="poster-panel p-8 text-center">
        <p className="poster-stamp mb-3">No decks yet</p>
        <p className="text-sm text-[var(--ink-muted)]">
          {name} hasn&apos;t built any decks.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--ink-muted)]">
          {sortedDecks.length.toLocaleString()}{" "}
          {sortedDecks.length === 1 ? "deck" : "decks"}
        </p>
        <SortSelect
          value={sort}
          onChange={setSort}
          options={DECK_SORTS}
          labels={DECK_SORT_LABELS}
        />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sortedDecks.map((deck) => (
          <DeckRow
            key={deck.id}
            deck={deck}
            leader={cardsById.get(deck.leaderId) ?? null}
            summary={
              summariesByDeckId[deck.id] ?? {
                variationCount: 0,
                legal: false,
                owned: false,
              }
            }
            href={`/friends/${uid}/decks/${deck.id}`}
            preferredImages={cardPrefs.preferredByCardId}
            showOwned={false}
          />
        ))}
      </div>
    </div>
  );
}

export default function FriendDecksPage() {
  return (
    <FriendAreaGate area="decks">
      <FriendDecksList />
    </FriendAreaGate>
  );
}
