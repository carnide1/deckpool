"use client";

import { useMemo, useState } from "react";
import { CardBrowserFrame } from "@/components/cards/CardBrowserFrame";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { CardGrid } from "@/components/cards/CardGrid";
import { WantedCatchControls } from "@/components/wanted/WantedCatchControls";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCollection } from "@/contexts/CollectionContext";
import { useDecks } from "@/contexts/DecksContext";
import { useWanted } from "@/contexts/WantedContext";
import { useCardListBrowser } from "@/hooks/useCardListBrowser";
import { useCollectionWrite } from "@/hooks/useCollectionWrite";
import { useWantedWrite } from "@/hooks/useWantedWrite";
import { imageForCard } from "@/lib/cardPrefs";
import {
  deckLabelsByCardIdFromIndex,
  deckIdsByCardIdFromIndex,
  indexDeckMembership,
} from "@/lib/deckMembership";
import type { DeckPoolCard } from "@/types/catalog";

export function WantedBoard() {
  const { cards, loading: catalogLoading } = useCatalog();
  const { ownedMap, allLabels } = useCollection();
  const { wantedMap, wantedCardCount, loading: wantedLoading, error: wantedError } =
    useWanted();
  const { decks, variationsByDeckId } = useDecks();
  const { preferredByCardId } = useCardPrefs();
  const { saving: collectionSaving, adjustQuantity, setLabels } =
    useCollectionWrite(false);
  const {
    saving: wantedSaving,
    adjustQuantity: adjustWanted,
    togglePosted,
    catchCopies,
  } = useWantedWrite();

  const [selectedCard, setSelectedCard] = useState<DeckPoolCard | null>(null);
  const saving = collectionSaving || wantedSaving;

  const wantedCards = useMemo(() => {
    return cards.filter((card) => (wantedMap[card.id]?.quantity ?? 0) > 0);
  }, [cards, wantedMap]);

  const wantedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const card of wantedCards) ids.add(card.id);
    return ids;
  }, [wantedCards]);

  const wantedQtyById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [cardId, item] of Object.entries(wantedMap)) {
      map[cardId] = item.quantity;
    }
    return map;
  }, [wantedMap]);

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
    for (const [cardId, item] of Object.entries(wantedMap)) {
      map[cardId] = item.updatedAtMs;
    }
    return map;
  }, [wantedMap]);

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
    for (const card of wantedCards) {
      const userLabels = labelsByCardId[card.id] ?? [];
      const deckLabels = deckLabelsByCardId[card.id] ?? [];
      if (userLabels.length > 0 || deckLabels.length > 0) {
        next[card.id] = [...userLabels, ...deckLabels];
      }
    }
    return next;
  }, [wantedCards, labelsByCardId, deckLabelsByCardId]);

  const deckOptions = useMemo(
    () =>
      [...decks]
        .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
        .map((deck) => ({ id: deck.id, name: deck.name })),
    [decks],
  );

  const filterContext = useMemo(
    () => ({ wantedOnly: true, wantedIds, labelsByCardId, deckIdsByCardId }),
    [wantedIds, labelsByCardId, deckIdsByCardId],
  );
  const { browser, gridTopRef } = useCardListBrowser({
    cards: wantedCards,
    filterContext,
    updatedAtById,
  });
  const { results, pagedResults } = browser;

  const selectedOwned = selectedCard ? ownedMap[selectedCard.id] : undefined;
  const selectedWanted = selectedCard ? wantedMap[selectedCard.id] : undefined;
  const selectedDecks = selectedCard
    ? membership.decksByCardId[selectedCard.id] ?? []
    : [];

  const loading = catalogLoading || wantedLoading;

  return (
    <>
      <CardBrowserFrame
        browser={browser}
        gridTopRef={gridTopRef}
        filtersId="wanted-filters"
        showFiltersToggle
        statusText={
          wantedError
            ? wantedError
            : loading
              ? "Loading posters…"
              : `${results.length.toLocaleString()} shown · ${wantedCardCount} ${
                  wantedCardCount === 1 ? "poster" : "posters"
                }`
        }
        showPagination={!wantedError && !loading && wantedCards.length > 0}
        searchPlaceholder="Search Wanted"
        filterCards={wantedCards}
        labelOptions={allLabels}
        deckOptions={deckOptions}
      >
        {wantedError ? (
          <p className="text-sm text-[var(--accent-pirate-red)]">{wantedError}</p>
        ) : loading ? (
          <p className="text-sm text-[var(--ink-muted)]">Loading posters…</p>
        ) : wantedCards.length === 0 ? (
          <div className="poster-panel p-6 text-center">
            <p className="poster-stamp mb-3">No posters</p>
            <p className="text-sm text-[var(--ink-muted)]">
              Mark a card WANTED while you brew. Next time you shop, this is the
              board.
            </p>
          </div>
        ) : (
          <CardGrid
            cards={pagedResults}
            quantityById={quantityById}
            preferredImages={preferredByCardId}
            onSelect={setSelectedCard}
            wantedQtyById={wantedQtyById}
            onToggleWanted={(card) => void togglePosted(card.id)}
            showWantedCount
            wantedSaving={saving}
            labelsByCardId={cardLabelsById}
            tileFooter={(card) => (
              <WantedCatchControls
                remaining={wantedQtyById[card.id] ?? 0}
                disabled={saving}
                onCatchOne={() => void catchCopies(card.id, 1)}
                onCatchAll={() => void catchCopies(card.id, "all")}
              />
            )}
          />
        )}
      </CardBrowserFrame>

      <CardDetailModal
        card={selectedCard}
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        selectionCards={pagedResults}
        onSelectCard={setSelectedCard}
        ownedQty={selectedOwned?.quantity ?? 0}
        wantedQty={selectedWanted?.quantity ?? 0}
        labels={selectedOwned?.labels ?? []}
        labelSuggestions={allLabels}
        inDecks={selectedDecks}
        preferredImageUrl={
          selectedCard ? imageForCard(selectedCard, preferredByCardId) : null
        }
        showCollectionEditor={Boolean(selectedOwned)}
        onQuantityDelta={(delta) => {
          if (!selectedCard) return;
          void adjustQuantity(selectedCard.id, delta);
        }}
        onWantedDelta={(delta) => {
          if (!selectedCard) return;
          void adjustWanted(selectedCard.id, delta);
          const next = (selectedWanted?.quantity ?? 0) + delta;
          if (next <= 0) setSelectedCard(null);
        }}
        onLabelsChange={(nextLabels) => {
          if (selectedCard) void setLabels(selectedCard.id, nextLabels);
        }}
      />
    </>
  );
}
