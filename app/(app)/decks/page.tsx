"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { CreateDeckModal } from "@/components/decks/CreateDeckModal";
import { DeleteDeckModal } from "@/components/decks/DeleteDeckModal";
import { DeckRow } from "@/components/decks/DeckRow";
import { RenameDeckModal } from "@/components/decks/RenameDeckModal";
import { Button } from "@/components/ui/Button";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCollection } from "@/contexts/CollectionContext";
import { useDecks } from "@/contexts/DecksContext";
import { getConstructionRules } from "@/lib/construction";
import { summarizeDeck } from "@/lib/legality";
import { timestampToMillis } from "@/lib/timestamps";
import type { Deck } from "@/types/deck";

export default function DecksPage() {
  const { cards, cardsById, loading: catalogLoading } = useCatalog();
  const { ownedMap } = useCollection();
  const { decks, variationsByDeckId, loading, error } = useDecks();

  const [createOpen, setCreateOpen] = useState(false);
  const [renameDeck, setRenameDeck] = useState<Deck | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Deck | null>(null);

  const constructionRules = useMemo(() => getConstructionRules(), []);

  const ownedQtyById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [cardId, item] of Object.entries(ownedMap)) {
      map[cardId] = item.quantity;
    }
    return map;
  }, [ownedMap]);

  const ownedLeaders = useMemo(() => {
    return cards
      .filter(
        (card) =>
          card.category === "Leader" && (ownedMap[card.id]?.quantity ?? 0) > 0,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [cards, ownedMap]);

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
        ownedQtyById,
        constructionRules,
        deck.favoriteVariationId,
      );
    }
    return map;
  }, [
    decks,
    variationsByDeckId,
    cardsById,
    ownedQtyById,
    constructionRules,
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
            Decks
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Wanted-poster rows for every brew. Newest edits first.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4" />
          New deck
        </Button>
      </div>

      {loading || catalogLoading ? (
        <p className="text-sm text-[var(--ink-muted)]">Loading decks…</p>
      ) : error ? (
        <p className="text-sm text-[var(--accent-pirate-red)]">{error}</p>
      ) : decks.length === 0 ? (
        <div className="poster-panel p-8 text-center">
          <p className="poster-stamp mb-3">No decks yet</p>
          <p className="text-sm text-[var(--ink-muted)]">
            Set sail — pick an owned Leader and start your first list.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-4">
            <Plus className="h-4 w-4" />
            Create your first deck
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedDecks.map((deck) => {
            const leader = cardsById.get(deck.leaderId) ?? null;
            const summary = summariesByDeckId[deck.id] ?? {
              variationCount: 0,
              legal: false,
              owned: false,
            };

            return (
              <DeckRow
                key={deck.id}
                deck={deck}
                leader={leader}
                summary={summary}
                onRename={() => setRenameDeck(deck)}
                onDelete={() => setDeleteTarget(deck)}
              />
            );
          })}
        </div>
      )}

      <CreateDeckModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        ownedLeaders={ownedLeaders}
      />

      <RenameDeckModal
        deck={renameDeck}
        open={renameDeck !== null}
        onClose={() => setRenameDeck(null)}
      />

      <DeleteDeckModal
        deck={deleteTarget}
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
