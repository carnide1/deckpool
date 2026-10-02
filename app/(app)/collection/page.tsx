"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CardBrowserFrame,
  FiltersToggleButton,
} from "@/components/cards/CardBrowserFrame";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { CardGrid } from "@/components/cards/CardGrid";
import {
  CollectionModeToggle,
  parseCollectionView,
} from "@/components/collection/CollectionModeToggle";
import { CollectionSummary } from "@/components/collection/CollectionSummary";
import { useCardListBrowser } from "@/hooks/useCardListBrowser";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCollection } from "@/contexts/CollectionContext";
import { useDecks } from "@/contexts/DecksContext";
import { useCollectionWrite } from "@/hooks/useCollectionWrite";
import { useWanted } from "@/contexts/WantedContext";
import { useWantedWrite } from "@/hooks/useWantedWrite";
import { computeCollectionBreakdown } from "@/lib/collectionBreakdown";
import { imageForCard } from "@/lib/cardPrefs";
import {
  deckLabelsByCardIdFromIndex,
  deckIdsByCardIdFromIndex,
  indexDeckMembership,
} from "@/lib/deckMembership";
import type { DeckPoolCard } from "@/types/catalog";

/** Belt-and-suspenders if next.config redirect is skipped (e.g. client nav). */
function WantedLegacyRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/wanted");
  }, [router]);
  return (
    <p className="text-sm text-[var(--ink-muted)]">Opening Wanted…</p>
  );
}

function CollectionPageContent() {
  const searchParams = useSearchParams();
  if (searchParams.get("view") === "wanted") {
    return <WantedLegacyRedirect />;
  }
  return <CollectionPageMain />;
}

function CollectionPageMain() {
  const searchParams = useSearchParams();
  const view = parseCollectionView(searchParams.get("view"));
  const { cards, cardsById, loading: catalogLoading } = useCatalog();
  const { ownedMap, allLabels, ownedCardCount, loading: collectionLoading } =
    useCollection();
  const { decks, variationsByDeckId } = useDecks();
  const { preferredByCardId } = useCardPrefs();
  const { saving, adjustQuantity, setLabels } = useCollectionWrite(false);
  const { wantedMap } = useWanted();
  const { saving: wantedSaving, togglePosted, adjustQuantity: adjustWanted } =
    useWantedWrite();

  const [selectedCard, setSelectedCard] = useState<DeckPoolCard | null>(null);

  const ownedCards = useMemo(() => {
    return cards.filter((card) => (ownedMap[card.id]?.quantity ?? 0) > 0);
  }, [cards, ownedMap]);

  const ownedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const card of ownedCards) ids.add(card.id);
    return ids;
  }, [ownedCards]);

  const quantityById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [cardId, item] of Object.entries(ownedMap)) {
      map[cardId] = item.quantity;
    }
    return map;
  }, [ownedMap]);

  const wantedQtyById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [cardId, item] of Object.entries(wantedMap)) {
      map[cardId] = item.quantity;
    }
    return map;
  }, [wantedMap]);

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
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
            Collection
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Your binder — browse art, change copies, and pick scans. Add new
            card numbers from{" "}
            <Link
              href="/explore"
              className="text-[var(--accent-ocean)] hover:underline"
            >
              Explore
            </Link>
            .
          </p>
          {!collectionLoading ? (
            <p className="mt-2 text-sm tabular-nums text-[var(--ink-muted)]">
              <span className="font-semibold text-[var(--ink-primary)]">
                {ownedCardCount}
              </span>{" "}
              {ownedCardCount === 1 ? "card" : "cards"} in your binder
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CollectionModeToggle mode={view} />
          {view === "binder" ? (
            <FiltersToggleButton
              browser={browser}
              controlsId="collection-filters"
            />
          ) : null}
        </div>
      </div>

      {view === "summary" ? (
        catalogLoading || collectionLoading ? (
          <p className="text-sm text-[var(--ink-muted)]">Loading binder…</p>
        ) : (
          <CollectionSummary breakdown={breakdown} />
        )
      ) : (
        <CardBrowserFrame
          browser={browser}
          gridTopRef={gridTopRef}
          filtersId="collection-filters"
          statusText={
            catalogLoading || collectionLoading
              ? "Loading binder…"
              : `${results.length.toLocaleString()} shown`
          }
          showPagination={
            !catalogLoading && !collectionLoading && ownedCards.length > 0
          }
          searchPlaceholder="Search your binder"
          filterCards={ownedCards}
          labelOptions={allLabels}
          deckOptions={deckOptions}
        >
            {catalogLoading || collectionLoading ? (
              <p className="text-sm text-[var(--ink-muted)]">Loading binder…</p>
            ) : ownedCards.length === 0 ? (
              <div className="poster-panel p-6 text-center">
                <p className="poster-stamp mb-3">Empty binder</p>
                <p className="text-sm text-[var(--ink-muted)]">
                  Search the catalog on Explore to add what you own, or add a
                  starter deck from there.
                </p>
                <Link
                  href="/explore"
                  className="mt-4 inline-block text-sm font-semibold text-[var(--accent-ocean)] hover:underline"
                >
                  Go to Explore
                </Link>
              </div>
            ) : (
              <CardGrid
                cards={pagedResults}
                quantityById={quantityById}
                preferredImages={preferredByCardId}
                onSelect={setSelectedCard}
                onQuantityDelta={(card, delta) => {
                  void adjustQuantity(card.id, delta);
                  const next = (quantityById[card.id] ?? 0) + delta;
                  if (next <= 0 && selectedCard?.id === card.id) {
                    setSelectedCard(null);
                  }
                }}
                showStepper
                quantitySaving={saving}
                wantedQtyById={wantedQtyById}
                onToggleWanted={(card) => void togglePosted(card.id)}
                wantedSaving={wantedSaving}
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
          labels={selectedOwned?.labels ?? []}
          labelSuggestions={allLabels}
          inDecks={selectedDecks}
          preferredImageUrl={
            selectedCard ? imageForCard(selectedCard, preferredByCardId) : null
          }
          showCollectionEditor
          onQuantityDelta={(delta) => {
            if (!selectedCard) return;
            const next = (selectedOwned?.quantity ?? 0) + delta;
            void adjustQuantity(selectedCard.id, delta);
            if (next <= 0) setSelectedCard(null);
          }}
          wantedQty={
            selectedCard ? wantedMap[selectedCard.id]?.quantity ?? 0 : 0
          }
          onWantedDelta={(delta) => {
            if (selectedCard) void adjustWanted(selectedCard.id, delta);
          }}
          onLabelsChange={(nextLabels) => {
            if (selectedCard) void setLabels(selectedCard.id, nextLabels);
          }}
        />
      ) : null}
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[var(--ink-muted)]">Loading binder…</p>
      }
    >
      <CollectionPageContent />
    </Suspense>
  );
}
