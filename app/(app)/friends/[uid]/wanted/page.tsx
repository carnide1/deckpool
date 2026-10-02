"use client";

import { useMemo, useState } from "react";
import { CardBrowserFrame } from "@/components/cards/CardBrowserFrame";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { CardGrid } from "@/components/cards/CardGrid";
import { FriendAreaGate } from "@/components/friends/FriendAreaGate";
import { useCatalog } from "@/contexts/CatalogContext";
import { useFriendData } from "@/contexts/FriendDataContext";
import { useCardListBrowser } from "@/hooks/useCardListBrowser";
import { imageForCard } from "@/lib/cardPrefs";
import type { DeckPoolCard } from "@/types/catalog";

function FriendWantedBoard() {
  const { name, wanted, collection, cardPrefs } = useFriendData();
  const { cards, loading: catalogLoading } = useCatalog();
  const { wantedMap, wantedCardCount } = wanted;
  const preferredImages = cardPrefs.preferredByCardId;
  const [selectedCard, setSelectedCard] = useState<DeckPoolCard | null>(null);

  const wantedCards = useMemo(
    () => cards.filter((card) => (wantedMap[card.id]?.quantity ?? 0) > 0),
    [cards, wantedMap],
  );

  const wantedIds = useMemo(
    () => new Set(wantedCards.map((card) => card.id)),
    [wantedCards],
  );

  const wantedQtyById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [cardId, item] of Object.entries(wantedMap)) {
      map[cardId] = item.quantity;
    }
    return map;
  }, [wantedMap]);

  // Empty when the friend hides their collection (that hook never subscribes).
  const ownedQtyById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [cardId, item] of Object.entries(collection.ownedMap)) {
      map[cardId] = item.quantity;
    }
    return map;
  }, [collection.ownedMap]);

  const updatedAtById = useMemo(() => {
    const map: Record<string, unknown> = {};
    for (const [cardId, item] of Object.entries(wantedMap)) {
      map[cardId] = item.updatedAtMs;
    }
    return map;
  }, [wantedMap]);

  const filterContext = useMemo(
    () => ({ wantedOnly: true, wantedIds }),
    [wantedIds],
  );
  const { browser, gridTopRef } = useCardListBrowser({
    cards: wantedCards,
    filterContext,
    updatedAtById,
  });
  const { results, pagedResults } = browser;

  return (
    <>
      <CardBrowserFrame
        browser={browser}
        gridTopRef={gridTopRef}
        filtersId="friend-wanted-filters"
        showFiltersToggle
        statusText={
          catalogLoading
            ? "Loading posters…"
            : `${results.length.toLocaleString()} shown · ${wantedCardCount} ${
                wantedCardCount === 1 ? "poster" : "posters"
              }`
        }
        showPagination={!catalogLoading && wantedCards.length > 0}
        searchPlaceholder="Search Wanted"
        filterCards={wantedCards}
      >
        {catalogLoading ? (
          <p className="text-sm text-[var(--ink-muted)]">Loading posters…</p>
        ) : wantedCards.length === 0 ? (
          <div className="poster-panel p-6 text-center">
            <p className="poster-stamp mb-3">No posters</p>
            <p className="text-sm text-[var(--ink-muted)]">
              {name} isn&apos;t hunting any cards right now.
            </p>
          </div>
        ) : (
          <CardGrid
            cards={pagedResults}
            quantityById={ownedQtyById}
            preferredImages={preferredImages}
            onSelect={setSelectedCard}
            wantedQtyById={wantedQtyById}
            showWantedCount
          />
        )}
      </CardBrowserFrame>

      <CardDetailModal
        card={selectedCard}
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        selectionCards={pagedResults}
        onSelectCard={setSelectedCard}
        wantedQty={selectedCard ? wantedQtyById[selectedCard.id] ?? 0 : 0}
        preferredImageUrl={
          selectedCard ? imageForCard(selectedCard, preferredImages) : null
        }
        allowArtPicker={false}
        ownedLabel={null}
        showReadOnlyWanted
      />
    </>
  );
}

export default function FriendWantedPage() {
  return (
    <FriendAreaGate area="wanted">
      <FriendWantedBoard />
    </FriendAreaGate>
  );
}
