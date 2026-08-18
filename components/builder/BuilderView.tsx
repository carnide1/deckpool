"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ArrowLeft, Pencil, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { CardImage } from "@/components/CardImage";
import { BuilderCardResults } from "@/components/builder/BuilderCardResults";
import { BuilderManifest } from "@/components/builder/BuilderManifest";
import { BuilderStatusPanel } from "@/components/builder/BuilderStatusPanel";
import { ChangeLeaderModal } from "@/components/builder/ChangeLeaderModal";
import { CompareVariationsModal } from "@/components/builder/CompareVariationsModal";
import {
  CloneVariationModal,
  DeleteVariationModal,
  RenameVariationModal,
} from "@/components/builder/VariationModals";
import { VariationTabs } from "@/components/builder/VariationTabs";
import { CardsSearchBar } from "@/components/cards/CardsSearchBar";
import { ColorPills } from "@/components/decks/ColorPills";
import { RenameDeckModal } from "@/components/decks/RenameDeckModal";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCollection } from "@/contexts/CollectionContext";
import { useDecks } from "@/contexts/DecksContext";
import {
  canIncrementCopy,
  filterBuilderCatalog,
  mainDeckCount,
} from "@/lib/builder";
import { getConstructionRules } from "@/lib/construction";
import { setVariationCards } from "@/lib/decks";
import { validateVariation } from "@/lib/legality";
import type { DeckPoolCard } from "@/types/catalog";
import type { Deck, Variation } from "@/types/deck";

const MAX_RESULTS = 80;

export function BuilderView({ deck }: { deck: Deck }) {
  const { user } = useAuth();
  const { cards, cardsById } = useCatalog();
  const { ownedMap, allLabels } = useCollection();
  const { variationsByDeckId } = useDecks();

  const variations = variationsByDeckId[deck.id] ?? [];
  const leader = cardsById.get(deck.leaderId) ?? null;
  const constructionRules = useMemo(() => getConstructionRules(), []);

  const [activeVariationId, setActiveVariationId] = useState("");
  const [query, setQuery] = useState("");
  const [ownedOnly, setOwnedOnly] = useState(true);
  const [renameDeckOpen, setRenameDeckOpen] = useState(false);
  const [changeLeaderOpen, setChangeLeaderOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [renameVariationOpen, setRenameVariationOpen] = useState(false);
  const [deleteVariationOpen, setDeleteVariationOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (variations.length === 0) {
      setActiveVariationId("");
      return;
    }
    if (!activeVariationId || !variations.some((row) => row.id === activeVariationId)) {
      setActiveVariationId(variations[0].id);
    }
  }, [variations, activeVariationId]);

  const activeVariation =
    variations.find((row) => row.id === activeVariationId) ?? null;

  const ownedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [cardId, item] of Object.entries(ownedMap)) {
      if (item.quantity > 0) ids.add(cardId);
    }
    return ids;
  }, [ownedMap]);

  const ownedQtyById = useMemo(() => {
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

  const ownedLeaders = useMemo(
    () =>
      cards
        .filter(
          (card) =>
            card.category === "Leader" &&
            (ownedMap[card.id]?.quantity ?? 0) > 0,
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [cards, ownedMap],
  );

  const searchResults = useMemo(() => {
    if (!leader) return [];
    const filtered = filterBuilderCatalog(cards, leader, deferredQuery, {
      ownedOnly,
      ownedIds,
      labelsByCardId,
      rules: constructionRules,
    });
    return filtered.slice(0, MAX_RESULTS);
  }, [
    cards,
    leader,
    deferredQuery,
    ownedOnly,
    ownedIds,
    labelsByCardId,
    constructionRules,
  ]);

  const deckCount = activeVariation ? mainDeckCount(activeVariation.cards) : 0;

  const status = useMemo(() => {
    if (!activeVariation) {
      return { legal: false, owned: false, reasons: ["No variation selected."] };
    }
    return validateVariation(
      deck.leaderId,
      activeVariation.cards,
      cardsById,
      ownedQtyById,
      constructionRules,
    );
  }, [
    activeVariation,
    deck.leaderId,
    cardsById,
    ownedQtyById,
    constructionRules,
  ]);

  const manifestLines = useMemo(() => {
    if (!activeVariation) return [];
    return Object.entries(activeVariation.cards)
      .filter(([, qty]) => qty > 0)
      .map(([cardId, inDeck]) => {
        const card = cardsById.get(cardId);
        if (!card) return null;
        return {
          card,
          inDeck,
          ownedQty: ownedQtyById[cardId] ?? 0,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => a.card.name.localeCompare(b.card.name));
  }, [activeVariation, cardsById, ownedQtyById]);

  const persistCards = async (nextCards: Record<string, number>) => {
    if (!user || !activeVariation) return;
    setSaving(true);
    try {
      await setVariationCards(user.uid, deck.id, activeVariation.id, nextCards);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save deck list",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = (card: DeckPoolCard) => {
    if (!activeVariation) return;
    const current = activeVariation.cards[card.id] ?? 0;
    if (!canIncrementCopy(card.id, current, constructionRules)) return;
    void persistCards({
      ...activeVariation.cards,
      [card.id]: current + 1,
    });
  };

  const handleRemove = (cardId: string) => {
    if (!activeVariation) return;
    const current = activeVariation.cards[cardId] ?? 0;
    if (current <= 0) return;
    const next = { ...activeVariation.cards };
    if (current === 1) delete next[cardId];
    else next[cardId] = current - 1;
    void persistCards(next);
  };

  const handleVariationDeleted = () => {
    const remaining = variations.filter((row) => row.id !== activeVariationId);
    setActiveVariationId(remaining[0]?.id ?? "");
  };

  if (!leader) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        Leader card not found in catalog.
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/decks"
          className="inline-flex items-center gap-2 text-sm text-[var(--accent-ocean)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to decks
        </Link>
        {saving ? (
          <span className="text-xs text-[var(--ink-muted)]">Saving…</span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="poster-panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {leader.images[0] ? (
                  <CardImage
                    src={leader.images[0]}
                    alt={leader.name}
                    width={72}
                    height={100}
                  />
                ) : null}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate font-display text-xl font-bold text-[var(--ink-primary)]">
                      {deck.name}
                    </h1>
                    <button
                      type="button"
                      onClick={() => setRenameDeckOpen(true)}
                      className="rounded-lg p-1 text-[var(--ink-muted)] hover:bg-[var(--bg-inset)]"
                      aria-label="Rename deck"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-[var(--ink-muted)]">{leader.name}</p>
                  <div className="mt-2">
                    <ColorPills colors={leader.colors} />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChangeLeaderOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--bg-inset)] px-3 py-2 text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--bg-inset)]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Change Leader
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-primary)]">
              <input
                type="checkbox"
                checked={ownedOnly}
                onChange={(event) => setOwnedOnly(event.target.checked)}
                className="rounded border-[var(--bg-inset)]"
              />
              Owned only
            </label>
            <CardsSearchBar
              value={query}
              onChange={setQuery}
              cards={cards}
              userLabels={allLabels}
            />
            <p className="text-xs text-[var(--ink-muted)]">
              {searchResults.length.toLocaleString()} shown
              {searchResults.length >= MAX_RESULTS ? "+" : ""}. Hard filters:
              Leader colors, construction rules, no Don.
            </p>
          </div>

          <BuilderCardResults
            cards={searchResults}
            ownedIds={ownedIds}
            inDeckById={activeVariation?.cards ?? {}}
            canAdd={(cardId) =>
              canIncrementCopy(
                cardId,
                activeVariation?.cards[cardId] ?? 0,
                constructionRules,
              )
            }
            onAdd={handleAdd}
          />
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
          <VariationTabs
            variations={variations}
            activeId={activeVariationId}
            onSelect={setActiveVariationId}
            onClone={() => setCloneOpen(true)}
            onRename={() => setRenameVariationOpen(true)}
            onDelete={() => setDeleteVariationOpen(true)}
            onCompare={() => setCompareOpen(true)}
          />
          <BuilderStatusPanel
            legal={status.legal}
            owned={status.owned}
            reasons={status.reasons}
          />
          <BuilderManifest
            lines={manifestLines}
            deckCount={deckCount}
            onRemove={handleRemove}
          />
        </aside>
      </div>

      <RenameDeckModal
        deck={deck}
        open={renameDeckOpen}
        onClose={() => setRenameDeckOpen(false)}
      />

      <ChangeLeaderModal
        open={changeLeaderOpen}
        onClose={() => setChangeLeaderOpen(false)}
        deckId={deck.id}
        currentLeaderId={deck.leaderId}
        ownedLeaders={ownedLeaders}
        cardsById={cardsById}
      />

      <CompareVariationsModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        variations={variations}
        activeId={activeVariationId}
        cardsById={cardsById}
      />

      <CloneVariationModal
        variation={activeVariation}
        deckId={deck.id}
        open={cloneOpen}
        onClose={() => setCloneOpen(false)}
        onCreated={setActiveVariationId}
      />

      <RenameVariationModal
        variation={activeVariation}
        deckId={deck.id}
        open={renameVariationOpen}
        onClose={() => setRenameVariationOpen(false)}
      />

      <DeleteVariationModal
        variation={activeVariation}
        deckId={deck.id}
        open={deleteVariationOpen}
        onClose={() => setDeleteVariationOpen(false)}
        onDeleted={handleVariationDeleted}
      />
    </div>
  );
}
