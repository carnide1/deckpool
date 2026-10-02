"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CardBrowserFrame } from "@/components/cards/CardBrowserFrame";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { CardGrid } from "@/components/cards/CardGrid";
import {
  CollectionModeToggle,
  parseCollectionView,
} from "@/components/collection/CollectionModeToggle";
import { CollectionSummary } from "@/components/collection/CollectionSummary";
import { FriendAreaGate } from "@/components/friends/FriendAreaGate";
import { useCatalog } from "@/contexts/CatalogContext";
import { useFriendData } from "@/contexts/FriendDataContext";
import { useCardListBrowser } from "@/hooks/useCardListBrowser";
import { imageForCard } from "@/lib/cardPrefs";
import { computeCollectionBreakdown } from "@/lib/collectionBreakdown";
import {
  deckIdsByCardIdFromIndex,
  deckLabelsByCardIdFromIndex,
  indexDeckMembership,
} from "@/lib/deckMembership";
import type { DeckPoolCard } from "@/types/catalog";

function FriendCollectionBinder() {
  const searchParams = useSearchParams();
  const view = parseCollectionView(searchParams.get("view"));
  const {
    uid,
    name,
    collection,
    decks: friendDecks,
    cardPrefs,
  } = useFriendData();
  const { cards, cardsById, loading: catalogLoading } = useCatalog();
  const { ownedMap, allLabels, ownedCardCount } = collection;
  const { decks, variationsByDeckId } = friendDecks;
  const preferredImages = cardPrefs.preferredByCardId;
  const base = `/friends/${uid}`;
  const [selectedCard, setSelectedCard] = useState<DeckPoolCard | null>(null);

  const ownedCards = useMemo(
    () => cards.filter((card) => (ownedMap[card.id]?.quantity ?? 0) > 0),
    [cards, ownedMap],
  );

  const ownedIds = useMemo(
    () => new Set(ownedCards.map((card) => card.id)),
    [ownedCards],
  );

  const quantityById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [cardId, item] of Object.entries(ownedMap)) {
      map[cardId] = item.quantity;
    }
    return map;
  }, [ownedMap]);

  const labelsByCardId = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const [cardId, item] of Object.entries(ownedMap)) {
      if (item.labels.length) map[cardId] = item.labels;
    }
    return map;
  }, [ownedMap]);

  const updatedAtById = useMemo(() => {
    const map: Record<string, unknown> = {};
    for (const [cardId, item] of Object.entries(ownedMap)) {
      map[cardId] = item.updatedAtMs;
    }
    return map;
  }, [ownedMap]);

  // Empty when the friend hides decks (that hook never subscribes).
  const membership = useMemo(
    () => indexDeckMembership(decks, variationsByDeckId),
    [decks, variationsByDeckId],
  );
  const deckIdsByCardId = useMemo(
    () => deckIdsByCardIdFromIndex(membership),
    [membership],
  );
  const deckLabelsByCardId = useMemo(
    () => deckLabelsByCardIdFromIndex(membership),
    [membership],
  );

  const cardLabelsById = useMemo(() => {
    const next: Record<string, string[]> = {};
    for (const card of ownedCards) {
      next[card.id] = [
        ...(labelsByCardId[card.id] ?? []),
        ...(deckLabelsByCardId[card.id] ?? []),
      ];
    }
    return next;
  }, [ownedCards, labelsByCardId, deckLabelsByCardId]);

  const deckOptions = useMemo(
    () =>
      [...decks]
        .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
        .map((deck) => ({ id: deck.id, name: deck.name })),
    [decks],
  );

  const filterContext = useMemo(
    () => ({ ownedOnly: true, ownedIds, labelsByCardId, deckIdsByCardId }),
    [ownedIds, labelsByCardId, deckIdsByCardId],
  );
  const { browser, gridTopRef } = useCardListBrowser({
    cards: ownedCards,
    filterContext,
    updatedAtById,
  });
  const { results, pagedResults } = browser;

  const breakdown = useMemo(
    () => computeCollectionBreakdown(quantityById, cardsById),
    [quantityById, cardsById],
  );

  const selectedOwned = selectedCard ? ownedMap[selectedCard.id] : undefined;
  const selectedDecks = selectedCard
    ? membership.decksByCardId[selectedCard.id] ?? []
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm tabular-nums text-[var(--ink-muted)]">
          <span className="font-semibold text-[var(--ink-primary)]">
            {ownedCardCount}
          </span>{" "}
          {ownedCardCount === 1 ? "card" : "cards"} in {name}&apos;s binder
        </p>
        <CollectionModeToggle mode={view} baseHref={`${base}/collection`} />
      </div>

      {view === "summary" ? (
        catalogLoading ? (
          <p className="text-sm text-[var(--ink-muted)]">Loading binder…</p>
        ) : (
          <CollectionSummary breakdown={breakdown} />
        )
      ) : (
        <CardBrowserFrame
          browser={browser}
          gridTopRef={gridTopRef}
          filtersId="friend-collection-filters"
          showFiltersToggle
          statusText={
            catalogLoading
              ? "Loading binder…"
              : `${results.length.toLocaleString()} shown`
          }
          showPagination={!catalogLoading && ownedCards.length > 0}
          searchPlaceholder={`Search ${name}'s binder`}
          filterCards={ownedCards}
          labelOptions={allLabels}
          deckOptions={deckOptions}
        >
          {catalogLoading ? (
            <p className="text-sm text-[var(--ink-muted)]">Loading binder…</p>
          ) : ownedCards.length === 0 ? (
            <div className="poster-panel p-6 text-center">
              <p className="poster-stamp mb-3">Empty binder</p>
              <p className="text-sm text-[var(--ink-muted)]">
                {name} hasn&apos;t added any cards yet.
              </p>
            </div>
          ) : (
            <CardGrid
              cards={pagedResults}
              quantityById={quantityById}
              preferredImages={preferredImages}
              onSelect={setSelectedCard}
              labelsByCardId={cardLabelsById}
            />
          )}
        </CardBrowserFrame>
      )}

      {view === "binder" ? (
        <CardDetailModal
          card={selectedCard}
          open={selectedCard !== null}
          onClose={() => setSelectedCard(null)}
          selectionCards={pagedResults}
          onSelectCard={setSelectedCard}
          ownedQty={selectedOwned?.quantity ?? 0}
          ownedLabel="Copies"
          labels={selectedOwned?.labels ?? []}
          showReadOnlyLabels
          inDecks={selectedDecks}
          deckHref={(deckId) => `${base}/decks/${deckId}`}
          preferredImageUrl={
            selectedCard ? imageForCard(selectedCard, preferredImages) : null
          }
          allowArtPicker={false}
        />
      ) : null}
    </div>
  );
}

export default function FriendCollectionPage() {
  return (
    <FriendAreaGate area="collection">
      <Suspense
        fallback={
          <p className="text-sm text-[var(--ink-muted)]">Loading binder…</p>
        }
      >
        <FriendCollectionBinder />
      </Suspense>
    </FriendAreaGate>
  );
}
