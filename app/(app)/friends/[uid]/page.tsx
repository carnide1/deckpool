"use client";

import { useMemo } from "react";
import { DeckRow } from "@/components/decks/DeckRow";
import { FriendAreaGate } from "@/components/friends/FriendAreaGate";
import { useCatalog } from "@/contexts/CatalogContext";
import { useFriendData } from "@/contexts/FriendDataContext";
import { getConstructionRules } from "@/lib/construction";
import { summarizeDeck } from "@/lib/legality";
import { timestampToMillis } from "@/lib/timestamps";

const NO_OWNERSHIP: Record<string, number> = {};

function FriendDecksList() {
  const { uid, name, decks: friendDecks, cardPrefs } = useFriendData();
  const { cardsById, loading: catalogLoading } = useCatalog();
  const { decks, variationsByDeckId } = friendDecks;
  const constructionRules = useMemo(() => getConstructionRules(), []);

  const sortedDecks = useMemo(() => {
    return [...decks].sort((a, b) => {
      const bm = timestampToMillis(b.updatedAt ?? b.createdAt);
      const am = timestampToMillis(a.updatedAt ?? a.createdAt);
      if (bm !== am) return bm - am;
      return a.name.localeCompare(b.name);
    });
  }, [decks]);

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
  );
}

export default function FriendDecksPage() {
  return (
    <FriendAreaGate area="decks">
      <FriendDecksList />
    </FriendAreaGate>
  );
}
