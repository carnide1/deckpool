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
import type { Deck } from "@/types/deck";

type LeaderGroup = {
  leaderId: string;
  leaderName: string;
  decks: Deck[];
};

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

  const groups = useMemo(() => {
    const map = new Map<string, Deck[]>();
    for (const deck of decks) {
      const bucket = map.get(deck.leaderId) ?? [];
      bucket.push(deck);
      map.set(deck.leaderId, bucket);
    }

    const next: LeaderGroup[] = [...map.entries()].map(([leaderId, rows]) => {
      const leader = cardsById.get(leaderId);
      return {
        leaderId,
        leaderName: leader?.name ?? leaderId,
        decks: rows.sort((a, b) => a.name.localeCompare(b.name)),
      };
    });

    next.sort((a, b) => a.leaderName.localeCompare(b.leaderName));
    return next;
  }, [decks, cardsById]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
            Decks
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Wanted-poster rows grouped by Leader. Multiple brews per Leader are
            fine.
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
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.leaderId} className="flex flex-col gap-3">
              <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
                {group.leaderName}
              </h2>
              <div className="flex flex-col gap-3">
                {group.decks.map((deck) => {
                  const leader = cardsById.get(deck.leaderId) ?? null;
                  const variations = variationsByDeckId[deck.id] ?? [];
                  const summary = summarizeDeck(
                    deck.leaderId,
                    variations,
                    cardsById,
                    ownedQtyById,
                    constructionRules,
                  );

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
            </section>
          ))}
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
