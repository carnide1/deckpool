"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { PackagePlus, Search } from "lucide-react";
import { AddStarterDeckModal } from "@/components/collection/AddStarterDeckModal";
import { CollectionRow } from "@/components/collection/CollectionRow";
import { Button } from "@/components/ui/Button";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCollection } from "@/contexts/CollectionContext";
import { searchCatalog } from "@/lib/search/simpleCatalogSearch";

export default function CollectionPage() {
  const { cards, loading: catalogLoading } = useCatalog();
  const { ownedMap, allLabels, ownedCardCount, loading: collectionLoading } =
    useCollection();
  const [query, setQuery] = useState("");
  const [starterOpen, setStarterOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(
    () => searchCatalog(cards, deferredQuery),
    [cards, deferredQuery],
  );

  const ownedRows = useMemo(() => {
    return Object.values(ownedMap)
      .filter((item) => item.quantity > 0)
      .map((item) => {
        const card = cards.find((row) => row.id === item.cardId);
        return card ? { card, item } : null;
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => a.card.name.localeCompare(b.card.name));
  }, [ownedMap, cards]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
            Collection
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Search the full catalog and log what you own. Labels are overlapping
            views — not separate binders.
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
        <Button onClick={() => setStarterOpen(true)} className="shrink-0">
          <PackagePlus className="h-4 w-4" />
          Add starter deck
        </Button>
      </div>

      <label className="relative block">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or id — e.g. OP08-072"
          className="h-11 w-full rounded-xl border border-[var(--bg-inset)] bg-[var(--bg-panel)] pr-4 pl-10 text-[var(--ink-primary)] shadow-[var(--shadow-paper)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-ocean)] focus:outline-none"
        />
      </label>

      {deferredQuery.trim() ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--ink-muted)]">
            {catalogLoading
              ? "Searching…"
              : `${results.length} result${results.length === 1 ? "" : "s"}`}
          </h2>
          {results.length === 0 && !catalogLoading ? (
            <p className="text-sm text-[var(--ink-muted)]">
              No cards match that search.
            </p>
          ) : null}
          {results.map((card) => (
            <CollectionRow
              key={card.id}
              card={card}
              owned={ownedMap[card.id]}
              labelSuggestions={allLabels}
            />
          ))}
        </section>
      ) : ownedRows.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--ink-muted)]">
            Your binder
          </h2>
          {ownedRows.map(({ card, item }) => (
            <CollectionRow
              key={card.id}
              card={card}
              owned={item}
              labelSuggestions={allLabels}
            />
          ))}
        </section>
      ) : (
        <div className="poster-panel p-6 text-center">
          <p className="poster-stamp mb-3">Empty binder</p>
          <p className="text-sm text-[var(--ink-muted)]">
            Search for a card above or add a starter deck to begin. The Builder
            will default to cards you mark here.
          </p>
        </div>
      )}

      <AddStarterDeckModal
        open={starterOpen}
        onClose={() => setStarterOpen(false)}
      />
    </div>
  );
}
