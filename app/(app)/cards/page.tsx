"use client";

import {
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { CardGrid } from "@/components/cards/CardGrid";
import { CardsSearchBar } from "@/components/cards/CardsSearchBar";
import { FacetChips } from "@/components/cards/FacetChips";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCollection } from "@/contexts/CollectionContext";
import { filterCards } from "@/lib/search/filterCards";
import { parseQuery } from "@/lib/search/parseQuery";
import type { DeckPoolCard } from "@/types/catalog";

const MAX_RESULTS = 120;
const URL_SYNC_DELAY_MS = 350;

function CardsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cards, loading: catalogLoading, error: catalogError } = useCatalog();
  const { ownedMap, allLabels } = useCollection();

  const urlQ = searchParams.get("q") ?? "";
  const ownedOnly = searchParams.get("owned") === "1";

  const [query, setQuery] = useState(urlQ);
  const [selectedCard, setSelectedCard] = useState<DeckPoolCard | null>(null);
  const [preferredImages, setPreferredImages] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    setQuery(urlQ);
  }, [urlQ]);

  const deferredQ = useDeferredValue(query);

  const ownedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [cardId, item] of Object.entries(ownedMap)) {
      if (item.quantity > 0) ids.add(cardId);
    }
    return ids;
  }, [ownedMap]);

  const labelsByCardId = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const [cardId, item] of Object.entries(ownedMap)) {
      if (item.labels.length) map[cardId] = item.labels;
    }
    return map;
  }, [ownedMap]);

  const results = useMemo(() => {
    const expr = parseQuery(deferredQ);
    const filtered = filterCards(cards, expr, {
      ownedOnly,
      ownedIds,
      labelsByCardId,
    });
    return filtered.slice(0, MAX_RESULTS);
  }, [cards, deferredQ, ownedOnly, ownedIds, labelsByCardId]);

  const updateParams = useCallback(
    (nextQ: string, nextOwnedOnly = ownedOnly) => {
      const params = new URLSearchParams();
      if (nextQ.trim()) params.set("q", nextQ);
      if (nextOwnedOnly) params.set("owned", "1");
      const search = params.toString();
      router.replace(search ? `/cards?${search}` : "/cards", { scroll: false });
    },
    [ownedOnly, router],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query !== urlQ) {
        updateParams(query, ownedOnly);
      }
    }, URL_SYNC_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [query, urlQ, ownedOnly, updateParams]);

  const setQueryAndUrl = (nextQ: string) => {
    setQuery(nextQ);
    updateParams(nextQ, ownedOnly);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
            Cards
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Browse the full catalog. Edit quantities on Collection, not here.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-primary)]">
          <input
            type="checkbox"
            checked={ownedOnly}
            onChange={(event) => updateParams(query, event.target.checked)}
            className="rounded border-[var(--bg-inset)]"
          />
          Owned only
        </label>
      </div>

      <CardsSearchBar
        value={query}
        onChange={setQuery}
        onCommit={(next) => updateParams(next, ownedOnly)}
        cards={cards}
        userLabels={allLabels}
      />

      <FacetChips query={query} onChange={setQueryAndUrl} />

      <p className="text-sm text-[var(--ink-muted)]">
        {catalogLoading
          ? "Loading catalog…"
          : `${results.length.toLocaleString()} shown${results.length >= MAX_RESULTS ? "+" : ""}`}
        {catalogError ? (
          <span className="ml-2 text-[var(--accent-pirate-red)]">
            {catalogError}
          </span>
        ) : null}
      </p>

      <CardGrid
        cards={results}
        ownedIds={ownedIds}
        preferredImages={preferredImages}
        onSelect={setSelectedCard}
      />

      <CardDetailModal
        card={selectedCard}
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        onPreferredChange={(cardId, url) =>
          setPreferredImages((prev) => ({ ...prev, [cardId]: url }))
        }
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
