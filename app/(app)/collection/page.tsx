"use client";

import {
  Suspense,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { CardGrid } from "@/components/cards/CardGrid";
import { CollectionModeToggle, type CollectionView } from "@/components/collection/CollectionModeToggle";
import { CollectionSummary } from "@/components/collection/CollectionSummary";
import { WantedBoard } from "@/components/wanted/WantedBoard";
import { FilterPanel } from "@/components/search/FilterPanel";
import { NameSearchBar } from "@/components/search/NameSearchBar";
import { SortSelect } from "@/components/search/SortSelect";
import { Pagination } from "@/components/ui/Pagination";
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
import { clampPage, pageCountFor } from "@/lib/pagination";
import {
  EMPTY_FILTERS,
  applySearchFilters,
  type SearchFilters,
} from "@/lib/search/filters";
import { sortCards, type SortKey } from "@/lib/search/sortCards";
import type { DeckPoolCard } from "@/types/catalog";

const COLLECTION_SORTS: SortKey[] = [
  "recent",
  "newest",
  "oldest",
  "serial",
  "name",
  "category",
  "cost",
];
const PAGE_SIZE = 60;

function parseCollectionView(raw: string | null): CollectionView {
  if (raw === "summary") return "summary";
  if (raw === "wanted") return "wanted";
  return "binder";
}

function CollectionPageContent() {
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

  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<DeckPoolCard | null>(null);
  const gridTopRef = useRef<HTMLDivElement>(null);

  const deferredFilters = useDeferredValue(filters);

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

  const results = useMemo(() => {
    const filtered = applySearchFilters(ownedCards, deferredFilters, {
      ownedOnly: true,
      ownedIds,
      labelsByCardId,
      deckIdsByCardId,
    });
    return sortCards(filtered, sort, { updatedAtById });
  }, [
    ownedCards,
    deferredFilters,
    ownedIds,
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

  const breakdown = useMemo(
    () => computeCollectionBreakdown(quantityById, cardsById),
    [quantityById, cardsById],
  );

  const selectedOwned = selectedCard ? ownedMap[selectedCard.id] : undefined;
  const selectedDecks = selectedCard
    ? membership.decksByCardId[selectedCard.id] ?? []
    : [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div
            className={
              view === "wanted"
                ? "relative overflow-hidden rounded-xl"
                : undefined
            }
          >
            {view === "wanted" ? (
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-[var(--accent-pirate-red)]" />
            ) : null}
            <div className={view === "wanted" ? "pt-3" : undefined}>
              <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                {view === "wanted" ? "Wanted" : "Collection"}
              </h1>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {view === "wanted" ? (
                  "Copies to hunt — extra cards to buy, not a deck list."
                ) : (
                  <>
                    Your binder — browse art, change copies, and pick scans. Add
                    new card numbers from{" "}
                    <Link
                      href="/cards"
                      className="text-[var(--accent-ocean)] hover:underline"
                    >
                      Cards
                    </Link>
                    .
                  </>
                )}
              </p>
            </div>
          </div>
          {view !== "wanted" && !collectionLoading ? (
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
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="collection-filters"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] px-3 py-2 text-sm font-semibold lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          ) : null}
        </div>
      </div>

      {view === "summary" ? (
        catalogLoading || collectionLoading ? (
          <p className="text-sm text-[var(--ink-muted)]">Loading binder…</p>
        ) : (
          <CollectionSummary breakdown={breakdown} />
        )
      ) : view === "wanted" ? (
        <WantedBoard />
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="order-2 min-w-0 flex-1 lg:order-1">
            <div
              ref={gridTopRef}
              className="mb-3 flex flex-wrap items-center justify-between gap-2"
            >
              <p className="text-sm text-[var(--ink-muted)]">
                {catalogLoading || collectionLoading
                  ? "Loading binder…"
                  : `${results.length.toLocaleString()} shown`}
              </p>
              <SortSelect
                value={sort}
                onChange={setSort}
                options={COLLECTION_SORTS}
              />
            </div>

            {catalogLoading || collectionLoading ? (
              <p className="text-sm text-[var(--ink-muted)]">Loading binder…</p>
            ) : ownedCards.length === 0 ? (
              <div className="poster-panel p-6 text-center">
                <p className="poster-stamp mb-3">Empty binder</p>
                <p className="text-sm text-[var(--ink-muted)]">
                  Search the catalog on Cards to add what you own, or add a
                  starter deck from there.
                </p>
                <Link
                  href="/cards"
                  className="mt-4 inline-block text-sm font-semibold text-[var(--accent-ocean)] hover:underline"
                >
                  Go to Cards
                </Link>
              </div>
            ) : (
              <>
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
            id="collection-filters"
            className={[
              "order-1 shrink-0 lg:sticky lg:top-4 lg:order-2 lg:w-64",
              filtersOpen ? "block" : "hidden lg:block",
            ].join(" ")}
          >
            <div className="poster-panel flex flex-col gap-4 p-4">
              <NameSearchBar
                value={filters.text}
                onChange={(text) => setFilters((prev) => ({ ...prev, text }))}
                placeholder="Search your binder"
              />
              <FilterPanel
                layout="sidebar"
                filters={filters}
                onChange={setFilters}
                cards={ownedCards}
                labelOptions={allLabels}
                deckOptions={deckOptions}
              />
            </div>
          </aside>
        </div>
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
