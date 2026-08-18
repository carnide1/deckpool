"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { CardGrid } from "@/components/cards/CardGrid";
import { FilterPanel } from "@/components/search/FilterPanel";
import { NameSearchBar } from "@/components/search/NameSearchBar";
import { SortSelect } from "@/components/search/SortSelect";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCollection } from "@/contexts/CollectionContext";
import { useCollectionWrite } from "@/hooks/useCollectionWrite";
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

export default function CollectionPage() {
  const { cards, loading: catalogLoading } = useCatalog();
  const { ownedMap, allLabels, ownedCardCount, loading: collectionLoading } =
    useCollection();
  const { preferredByCardId } = useCardPrefs();
  const { saving, adjustQuantity, setLabels } = useCollectionWrite(false);

  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("recent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<DeckPoolCard | null>(null);

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

  const results = useMemo(() => {
    const filtered = applySearchFilters(ownedCards, deferredFilters, {
      ownedOnly: true,
      ownedIds,
      labelsByCardId,
    });
    return sortCards(filtered, sort, { updatedAtById });
  }, [ownedCards, deferredFilters, ownedIds, labelsByCardId, sort, updatedAtById]);

  const selectedOwned = selectedCard ? ownedMap[selectedCard.id] : undefined;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
            Collection
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Your binder — browse art, change copies, and pick scans. Add new
            card numbers from{" "}
            <Link href="/cards" className="text-[var(--accent-ocean)] hover:underline">
              Cards
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
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] px-3 py-2 text-sm font-semibold lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="order-2 min-w-0 flex-1 lg:order-1">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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
            <CardGrid
              cards={results}
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
            />
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
              placeholder="Search your binder"
            />
            <FilterPanel
              layout="sidebar"
              filters={filters}
              onChange={setFilters}
              cards={ownedCards}
              labelOptions={allLabels}
            />
          </div>
        </aside>
      </div>

      <CardDetailModal
        card={selectedCard}
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        ownedQty={selectedOwned?.quantity ?? 0}
        labels={selectedOwned?.labels ?? []}
        labelSuggestions={allLabels}
        preferredImageUrl={
          selectedCard
            ? preferredByCardId[selectedCard.id] ?? selectedCard.images[0]
            : null
        }
        showCollectionEditor
        onQuantityDelta={(delta) => {
          if (!selectedCard) return;
          const next = (selectedOwned?.quantity ?? 0) + delta;
          void adjustQuantity(selectedCard.id, delta);
          if (next <= 0) setSelectedCard(null);
        }}
        onLabelsChange={(nextLabels) => {
          if (selectedCard) void setLabels(selectedCard.id, nextLabels);
        }}
      />
    </div>
  );
}
