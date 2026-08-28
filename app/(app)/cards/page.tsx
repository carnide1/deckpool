"use client";

import {
  Suspense,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PackagePlus } from "lucide-react";
import { AddStarterDeckModal } from "@/components/collection/AddStarterDeckModal";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { CardGrid } from "@/components/cards/CardGrid";
import { FilterPanel } from "@/components/search/FilterPanel";
import { NameSearchBar } from "@/components/search/NameSearchBar";
import { SortSelect } from "@/components/search/SortSelect";
import { Button } from "@/components/ui/Button";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCollection } from "@/contexts/CollectionContext";
import { useDecks } from "@/contexts/DecksContext";
import { useWanted } from "@/contexts/WantedContext";
import { useCollectionWrite } from "@/hooks/useCollectionWrite";
import { useWantedWrite } from "@/hooks/useWantedWrite";
import { imageForCard } from "@/lib/cardPrefs";
import { deckLabelsByCardIdFromIndex, indexDeckMembership } from "@/lib/deckMembership";
import {
  applySearchFilters,
  cardsSearchString,
  filtersEqual,
  filtersFromSearchParams,
  type SearchFilters,
} from "@/lib/search/filters";
import { sortCards, type SortKey } from "@/lib/search/sortCards";
import type { DeckPoolCard } from "@/types/catalog";

const CARDS_SORTS: SortKey[] = [
  "newest",
  "oldest",
  "serial",
  "name",
  "category",
  "cost",
];
const PAGE_SIZE = 48;

function parseSort(raw: string | null): SortKey {
  if (raw && CARDS_SORTS.includes(raw as SortKey)) return raw as SortKey;
  return "newest";
}

function CardsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cards, loading: catalogLoading, error: catalogError } = useCatalog();
  const { ownedMap, allLabels } = useCollection();
  const { decks, variationsByDeckId } = useDecks();
  const { wantedMap } = useWanted();
  const { preferredByCardId } = useCardPrefs();
  const { saving, adjustQuantity, setLabels } = useCollectionWrite(true);
  const { saving: wantedSaving, togglePosted, adjustQuantity: adjustWanted } =
    useWantedWrite();

  const urlKey = searchParams.toString();
  const urlFilters = useMemo(
    () => filtersFromSearchParams(searchParams),
    [searchParams],
  );
  const ownedOnly = searchParams.get("owned") === "1";
  const wantedOnly = searchParams.get("wanted") === "1";
  const urlSort = parseSort(searchParams.get("sort"));

  const [filters, setFilters] = useState<SearchFilters>(urlFilters);
  const [sort, setSort] = useState<SortKey>(urlSort);
  const [selectedCard, setSelectedCard] = useState<DeckPoolCard | null>(null);
  const [starterOpen, setStarterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setFilters((prev) => (filtersEqual(prev, urlFilters) ? prev : urlFilters));
  }, [urlFilters]);

  useEffect(() => {
    setSort(urlSort);
  }, [urlSort]);

  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [deferredFilters, ownedOnly, wantedOnly, sort]);

  const ownedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [cardId, item] of Object.entries(ownedMap)) {
      if (item.quantity > 0) ids.add(cardId);
    }
    return ids;
  }, [ownedMap]);

  const wantedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [cardId, item] of Object.entries(wantedMap)) {
      if (item.quantity > 0) ids.add(cardId);
    }
    return ids;
  }, [wantedMap]);

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

  const membership = useMemo(
    () => indexDeckMembership(decks, variationsByDeckId),
    [decks, variationsByDeckId],
  );

  const deckLabelsByCardId = useMemo(
    () => deckLabelsByCardIdFromIndex(membership),
    [membership],
  );

  const cardLabelsById = useMemo(() => {
    const next: Record<string, string[]> = {};
    for (const card of cards) {
      const userLabels = labelsByCardId[card.id] ?? [];
      const deckLabels = deckLabelsByCardId[card.id] ?? [];
      if (userLabels.length > 0 || deckLabels.length > 0) {
        next[card.id] = [...userLabels, ...deckLabels];
      }
    }
    return next;
  }, [cards, labelsByCardId, deckLabelsByCardId]);

  const filtered = useMemo(() => {
    const next = applySearchFilters(cards, deferredFilters, {
      ownedOnly,
      ownedIds,
      wantedOnly,
      wantedIds,
      labelsByCardId,
    });
    return sortCards(next, sort);
  }, [
    cards,
    deferredFilters,
    ownedOnly,
    ownedIds,
    wantedOnly,
    wantedIds,
    labelsByCardId,
    sort,
  ]);

  const results = filtered.slice(0, visibleCount);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const search = cardsSearchString(filters, ownedOnly, sort, wantedOnly);
      if (search === urlKey) return;
      router.replace(search ? `/cards?${search}` : "/cards", { scroll: false });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [filters, ownedOnly, wantedOnly, sort, urlKey, router]);

  const selectedOwned = selectedCard ? ownedMap[selectedCard.id] : undefined;
  const selectedDecks = selectedCard
    ? membership.decksByCardId[selectedCard.id] ?? []
    : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
            Cards
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Search the full catalog and add copies to your binder.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-primary)]">
            <input
              type="checkbox"
              checked={ownedOnly}
              onChange={(event) => {
                const search = cardsSearchString(
                  filters,
                  event.target.checked,
                  sort,
                  wantedOnly,
                );
                router.replace(search ? `/cards?${search}` : "/cards", {
                  scroll: false,
                });
              }}
              className="rounded border-[var(--bg-inset)]"
            />
            Owned only
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-primary)]">
            <input
              type="checkbox"
              checked={wantedOnly}
              onChange={(event) => {
                const search = cardsSearchString(
                  filters,
                  ownedOnly,
                  sort,
                  event.target.checked,
                );
                router.replace(search ? `/cards?${search}` : "/cards", {
                  scroll: false,
                });
              }}
              className="rounded border-[var(--bg-inset)]"
            />
            Wanted
          </label>
          <Button onClick={() => setStarterOpen(true)} className="shrink-0">
            <PackagePlus className="h-4 w-4" />
            Add starter deck
          </Button>
        </div>
      </div>

      <NameSearchBar
        value={filters.text}
        onChange={(text) => setFilters((prev) => ({ ...prev, text }))}
      />

      <FilterPanel
        filters={filters}
        onChange={setFilters}
        cards={cards}
        labelOptions={allLabels}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--ink-muted)]">
          {catalogLoading
            ? "Loading catalog…"
            : `${results.length.toLocaleString()} of ${filtered.length.toLocaleString()}`}
          {catalogError ? (
            <span className="ml-2 text-[var(--accent-pirate-red)]">
              {catalogError}
            </span>
          ) : null}
        </p>
        <SortSelect value={sort} onChange={setSort} options={CARDS_SORTS} />
      </div>

      <CardGrid
        cards={results}
        quantityById={quantityById}
        preferredImages={preferredByCardId}
        onSelect={setSelectedCard}
        onQuantityDelta={(card, delta) => void adjustQuantity(card.id, delta)}
        showStepper
        quantitySaving={saving}
        wantedQtyById={wantedQtyById}
        onToggleWanted={(card) => void togglePosted(card.id)}
        wantedSaving={wantedSaving}
        labelsByCardId={cardLabelsById}
      />

      {visibleCount < filtered.length ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            Show more
          </Button>
        </div>
      ) : null}

      <CardDetailModal
        card={selectedCard}
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        selectionCards={results}
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
          if (selectedCard) void adjustQuantity(selectedCard.id, delta);
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

      <AddStarterDeckModal
        open={starterOpen}
        onClose={() => setStarterOpen(false)}
      />
    </div>
  );
}

export default function CardsPage() {
  return (
    <Suspense
      fallback={
        <div className="text-sm text-[var(--ink-muted)]">Loading cards…</div>
      }
    >
      <CardsPageContent />
    </Suspense>
  );
}
