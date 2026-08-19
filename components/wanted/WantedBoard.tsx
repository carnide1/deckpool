"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SlidersHorizontal } from "lucide-react";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { CardGrid } from "@/components/cards/CardGrid";
import { FilterPanel } from "@/components/search/FilterPanel";
import { NameSearchBar } from "@/components/search/NameSearchBar";
import { SortSelect } from "@/components/search/SortSelect";
import { Pagination } from "@/components/ui/Pagination";
import { WantedCatchControls } from "@/components/wanted/WantedCatchControls";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCollection } from "@/contexts/CollectionContext";
import { useDecks } from "@/contexts/DecksContext";
import { useWanted } from "@/contexts/WantedContext";
import { useCollectionWrite } from "@/hooks/useCollectionWrite";
import { useWantedWrite } from "@/hooks/useWantedWrite";
import {
  deckIdsByCardIdFromIndex,
  indexDeckMembership,
} from "@/lib/deckMembership";
import { clampPage, pageCountFor } from "@/lib/pagination";
import {
  EMPTY_FILTERS,
  applySearchFilters,
  type SearchFilters,
} from "@/lib/search/filters";
import { sortCards, type SortKey } from "@/lib/search/sortCards";
import type { DeckPoolCard } from "@/types/catalog";

const WANTED_SORTS: SortKey[] = [
  "recent",
  "newest",
  "oldest",
  "serial",
  "name",
  "category",
  "cost",
];
const PAGE_SIZE = 60;

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

  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<DeckPoolCard | null>(null);
  const gridTopRef = useRef<HTMLDivElement>(null);
  const deferredFilters = useDeferredValue(filters);
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

  const deckOptions = useMemo(
    () =>
      [...decks]
        .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
        .map((deck) => ({ id: deck.id, name: deck.name })),
    [decks],
  );

  const results = useMemo(() => {
    const filtered = applySearchFilters(wantedCards, deferredFilters, {
      wantedOnly: true,
      wantedIds,
      labelsByCardId,
      deckIdsByCardId,
    });
    return sortCards(filtered, sort, { updatedAtById });
  }, [
    wantedCards,
    deferredFilters,
    wantedIds,
    labelsByCardId,
    deckIdsByCardId,
    sort,
    updatedAtById,
  ]);

  const totalPages = pageCountFor(results.length, PAGE_SIZE);
  const currentPage = clampPage(page, totalPages);
  const pagedResults = results.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [deferredFilters, sort]);

  useEffect(() => {
    setPage((current) => clampPage(current, totalPages));
  }, [totalPages]);

  const goToPage = (next: number) => {
    setPage(next);
    const main = gridTopRef.current?.closest("main");
    if (!main || !gridTopRef.current) return;
    const offset =
      main.scrollTop +
      gridTopRef.current.getBoundingClientRect().top -
      main.getBoundingClientRect().top -
      8;
    main.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
  };

  const selectedOwned = selectedCard ? ownedMap[selectedCard.id] : undefined;
  const selectedWanted = selectedCard ? wantedMap[selectedCard.id] : undefined;
  const selectedDecks = selectedCard
    ? membership.decksByCardId[selectedCard.id] ?? []
    : [];

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="order-2 min-w-0 flex-1 lg:order-1">
        <div
          ref={gridTopRef}
          className="mb-3 flex flex-wrap items-center justify-between gap-2"
        >
          <p className="text-sm text-[var(--ink-muted)]">
            {wantedError
              ? wantedError
              : catalogLoading || wantedLoading
                ? "Loading posters…"
                : `${results.length.toLocaleString()} shown · ${wantedCardCount} ${
                    wantedCardCount === 1 ? "poster" : "posters"
                  }`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] px-3 py-2 text-sm font-semibold lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
            <SortSelect
              value={sort}
              onChange={setSort}
              options={WANTED_SORTS}
            />
          </div>
        </div>

        {wantedError ? (
          <p className="text-sm text-[var(--accent-pirate-red)]">{wantedError}</p>
        ) : catalogLoading || wantedLoading ? (
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
          <>
            <CardGrid
              cards={pagedResults}
              quantityById={quantityById}
              preferredImages={preferredByCardId}
              onSelect={setSelectedCard}
              wantedQtyById={wantedQtyById}
              onToggleWanted={(card) => void togglePosted(card.id)}
              showWantedCount
              wantedSaving={saving}
              tileFooter={(card) => (
                <WantedCatchControls
                  remaining={wantedQtyById[card.id] ?? 0}
                  disabled={saving}
                  onCatchOne={() => void catchCopies(card.id, 1)}
                  onCatchAll={() => void catchCopies(card.id, "all")}
                />
              )}
            />
            <Pagination
              page={currentPage}
              total={results.length}
              pageSize={PAGE_SIZE}
              onPageChange={goToPage}
            />
          </>
        )}
      </div>

      <aside
        className={[
          "order-1 shrink-0 lg:sticky lg:top-4 lg:order-2 lg:w-64",
          filtersOpen ? "block" : "hidden lg:block",
        ].join(" ")}
      >
        <div className="poster-panel flex flex-col gap-4 p-4">
          <NameSearchBar
            value={filters.text}
            onChange={(text) => setFilters((prev) => ({ ...prev, text }))}
            placeholder="Search Wanted"
          />
          <FilterPanel
            layout="sidebar"
            filters={filters}
            onChange={setFilters}
            cards={wantedCards}
            labelOptions={allLabels}
            deckOptions={deckOptions}
          />
        </div>
      </aside>
      </div>

      <CardDetailModal
        card={selectedCard}
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        ownedQty={selectedOwned?.quantity ?? 0}
        wantedQty={selectedWanted?.quantity ?? 0}
        labels={selectedOwned?.labels ?? []}
        labelSuggestions={allLabels}
        inDecks={selectedDecks}
        preferredImageUrl={
          selectedCard
            ? preferredByCardId[selectedCard.id] ?? selectedCard.images[0]
            : null
        }
        showCollectionEditor
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
