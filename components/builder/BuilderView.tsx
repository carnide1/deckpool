"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Info, Pencil, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { CardImage } from "@/components/CardImage";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { BuilderCardResults } from "@/components/builder/BuilderCardResults";
import { BuilderDeckBoard } from "@/components/builder/BuilderDeckBoard";
import { BuilderStatusPanel } from "@/components/builder/BuilderStatusPanel";
import { ChangeLeaderModal } from "@/components/builder/ChangeLeaderModal";
import { CompareVariationsModal } from "@/components/builder/CompareVariationsModal";
import {
  CloneVariationModal,
  DeleteVariationModal,
  RenameVariationModal,
} from "@/components/builder/VariationModals";
import { VariationStatsPanel } from "@/components/builder/VariationStatsPanel";
import { VariationTabs } from "@/components/builder/VariationTabs";
import { DeckModeToggle } from "@/components/builder/DeckModeToggle";
import { FilterPanel } from "@/components/search/FilterPanel";
import { NameSearchBar } from "@/components/search/NameSearchBar";
import { SortSelect } from "@/components/search/SortSelect";
import { ColorPills } from "@/components/decks/ColorPills";
import { RenameDeckModal } from "@/components/decks/RenameDeckModal";
import { useAuth } from "@/contexts/AuthContext";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCollection } from "@/contexts/CollectionContext";
import { useWanted } from "@/contexts/WantedContext";
import { useWantedWrite } from "@/hooks/useWantedWrite";
import { useDecks } from "@/contexts/DecksContext";
import {
  canAddToDeck,
  filterBuilderUniverse,
  mainDeckCount,
} from "@/lib/builder";
import {
  buildDeckStacks,
  DEFAULT_DECK_STACK_SORT,
} from "@/lib/builderDeckStacks";
import { getConstructionRules } from "@/lib/construction";
import { setFavoriteVariation, setVariationCards } from "@/lib/decks";
import { imageCandidates, imageForCard } from "@/lib/cardPrefs";
import { validateVariation } from "@/lib/legality";
import {
  applySearchFilters,
  EMPTY_FILTERS,
  type SearchFilters,
} from "@/lib/search/filters";
import { sortCards, type SortKey } from "@/lib/search/sortCards";
import { computeVariationStats } from "@/lib/variationStats";
import { resolveFavoriteVariationId } from "@/lib/variations";
import { gapsFromVariation } from "@/lib/wanted";
import type { DeckPoolCard } from "@/types/catalog";
import type { Deck } from "@/types/deck";

const MAX_RESULTS = 80;
const BUILDER_SORTS: SortKey[] = ["newest", "serial", "name", "cost", "category"];

export function BuilderView({ deck }: { deck: Deck }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const variationFromUrl = searchParams.get("variation");
  const { cards, cardsById } = useCatalog();
  const { preferredByCardId } = useCardPrefs();
  const { ownedMap, allLabels } = useCollection();
  const { wantedMap } = useWanted();
  const {
    togglePosted,
    postGaps,
    adjustQuantity: adjustWanted,
    saving: wantedSaving,
  } = useWantedWrite();
  const { variationsByDeckId } = useDecks();

  const variations = useMemo(
    () => variationsByDeckId[deck.id] ?? [],
    [deck.id, variationsByDeckId],
  );
  const favoriteId = resolveFavoriteVariationId(
    deck.favoriteVariationId,
    variations,
  );
  const leader = cardsById.get(deck.leaderId) ?? null;
  const [leaderImage, ...leaderFallbacks] = leader
    ? imageCandidates(leader, preferredByCardId)
    : [];
  const constructionRules = useMemo(() => getConstructionRules(), []);

  const [activeVariationId, setActiveVariationId] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("newest");
  const [deckSort, setDeckSort] = useState<SortKey>(DEFAULT_DECK_STACK_SORT);
  const [ownedOnly, setOwnedOnly] = useState(true);
  const [renameDeckOpen, setRenameDeckOpen] = useState(false);
  const [changeLeaderOpen, setChangeLeaderOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [renameVariationOpen, setRenameVariationOpen] = useState(false);
  const [deleteVariationOpen, setDeleteVariationOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<DeckPoolCard | null>(null);
  const [inspectSource, setInspectSource] = useState<"results" | "deck">(
    "results",
  );
  const [saving, setSaving] = useState(false);
  const [localCards, setLocalCards] = useState<Record<string, number> | null>(
    null,
  );
  const cardsRef = useRef<Record<string, number>>({});
  const writeChain = useRef(Promise.resolve());
  const pendingWrites = useRef(0);
  const activeVariationIdRef = useRef(activeVariationId);
  activeVariationIdRef.current = activeVariationId;

  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    if (variations.length === 0) {
      setActiveVariationId("");
      return;
    }
    if (
      activeVariationId &&
      variations.some((row) => row.id === activeVariationId)
    ) {
      return;
    }
    if (
      variationFromUrl &&
      variations.some((row) => row.id === variationFromUrl)
    ) {
      setActiveVariationId(variationFromUrl);
      return;
    }
    setActiveVariationId(variations[0].id);
  }, [variations, activeVariationId, variationFromUrl]);

  const activeVariation =
    variations.find((row) => row.id === activeVariationId) ?? null;
  const variationCards = useMemo(
    () => localCards ?? activeVariation?.cards ?? {},
    [activeVariation, localCards],
  );

  useEffect(() => {
    const variation = variations.find((row) => row.id === activeVariationId);
    if (variation) cardsRef.current = variation.cards;
    setLocalCards(null);
    // Reset the in-memory list only when switching tabs, not on snapshot echoes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVariationId]);

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

  const legalPool = useMemo(() => {
    if (!leader) return [];
    return filterBuilderUniverse(cards, leader, constructionRules);
  }, [cards, leader, constructionRules]);

  const searchResults = useMemo(() => {
    if (!leader) return [];
    const filtered = applySearchFilters(legalPool, deferredFilters, {
      ownedOnly,
      ownedIds,
      labelsByCardId,
    });
    return sortCards(filtered, sort).slice(0, MAX_RESULTS);
  }, [
    legalPool,
    leader,
    deferredFilters,
    ownedOnly,
    ownedIds,
    labelsByCardId,
    sort,
  ]);

  const deckCount = mainDeckCount(variationCards);

  const deckStacks = useMemo(
    () => buildDeckStacks(variationCards, cardsById, deckSort),
    [variationCards, cardsById, deckSort],
  );

  const deckInspectCards = useMemo(() => {
    const list = deckStacks.map((row) => row.card);
    if (leader && !list.some((card) => card.id === leader.id)) {
      return [leader, ...list];
    }
    return list;
  }, [deckStacks, leader]);

  const variationStats = useMemo(
    () =>
      computeVariationStats(variationCards, cardsById, {
        leaderColors: leader?.colors,
      }),
    [variationCards, cardsById, leader?.colors],
  );

  const status = useMemo(() => {
    if (!activeVariation) {
      return { legal: false, owned: false, reasons: ["No variation selected."] };
    }
    return validateVariation(
      deck.leaderId,
      variationCards,
      cardsById,
      ownedQtyById,
      constructionRules,
    );
  }, [
    activeVariation,
    variationCards,
    deck.leaderId,
    cardsById,
    ownedQtyById,
    constructionRules,
  ]);

  const unownedGaps = useMemo(
    () => gapsFromVariation(variationCards, ownedQtyById),
    [variationCards, ownedQtyById],
  );
  const unownedGapCount = Object.keys(unownedGaps).length;

  const persistCards = (nextCards: Record<string, number>) => {
    if (!user || !activeVariation) return;
    const variationId = activeVariation.id;
    // Capture the payload now — cardsRef may point at another tab before the write runs.
    const payload = nextCards;
    cardsRef.current = payload;
    setLocalCards(payload);
    pendingWrites.current += 1;
    setSaving(true);
    writeChain.current = writeChain.current
      .then(() => setVariationCards(user.uid, deck.id, variationId, payload))
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Could not save deck list",
        );
        // Only roll back when no newer write is still pending for this tab.
        if (
          activeVariationIdRef.current === variationId &&
          pendingWrites.current <= 1
        ) {
          setLocalCards(null);
        }
      })
      .finally(() => {
        pendingWrites.current = Math.max(0, pendingWrites.current - 1);
        if (pendingWrites.current === 0) setSaving(false);
      });
  };

  const handleAdd = (card: DeckPoolCard) => {
    if (!activeVariation) return;
    const current = cardsRef.current[card.id] ?? 0;
    if (
      !canAddToDeck(
        card.id,
        current,
        ownedQtyById[card.id] ?? 0,
        ownedOnly,
        constructionRules,
        mainDeckCount(cardsRef.current),
      )
    ) {
      return;
    }
    persistCards({
      ...cardsRef.current,
      [card.id]: current + 1,
    });
  };

  const handleRemove = (cardId: string) => {
    if (!activeVariation) return;
    const current = cardsRef.current[cardId] ?? 0;
    if (current <= 0) return;
    const next = { ...cardsRef.current };
    if (current === 1) delete next[cardId];
    else next[cardId] = current - 1;
    persistCards(next);
  };

  const handleInspectResults = (card: DeckPoolCard) => {
    setInspectSource("results");
    setSelectedCard(card);
  };

  const handleInspectDeck = (card: DeckPoolCard) => {
    setInspectSource("deck");
    setSelectedCard(card);
  };

  const handleVariationDeleted = () => {
    const remaining = variations.filter((row) => row.id !== activeVariationId);
    setActiveVariationId(remaining[0]?.id ?? "");
  };

  const handleSetFavorite = (variationId: string) => {
    if (!user || variationId === deck.favoriteVariationId) return;
    void setFavoriteVariation(user.uid, deck.id, variationId).catch((error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not set the main variation",
      );
    });
  };

  const nextFavoriteId =
    activeVariation && favoriteId === activeVariation.id
      ? resolveFavoriteVariationId(
          undefined,
          variations.filter((row) => row.id !== activeVariation.id),
        )
      : null;

  if (!leader) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        Leader card not found in catalog.
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/decks"
          className="inline-flex items-center gap-2 text-sm text-[var(--accent-ocean)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to decks
        </Link>
        <div className="flex items-center gap-3">
          {saving ? (
            <span className="text-xs text-[var(--ink-muted)]">Saving…</span>
          ) : null}
          <DeckModeToggle
            deckId={deck.id}
            mode="edit"
            variationId={activeVariationId || undefined}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="poster-panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="relative shrink-0">
                  {leaderImage ? (
                    <CardImage
                      src={leaderImage}
                      fallbackSrcs={leaderFallbacks}
                      alt={leader.name}
                      width={96}
                      height={134}
                      className="h-auto w-[96px]"
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleInspectDeck(leader)}
                    className="absolute bottom-1 left-1 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-panel)]/95 text-[var(--ink-muted)] shadow hover:text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ocean)]"
                    aria-label={`Details for ${leader.name}`}
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>
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

          <div className="sticky top-0 z-20 -mx-1 bg-[var(--bg-page)] px-1 py-1 md:static md:z-auto md:mx-0 md:bg-transparent md:px-0 md:py-0">
            <BuilderDeckBoard
              stacks={deckStacks}
              deckCount={deckCount}
              deckSort={deckSort}
              onDeckSort={setDeckSort}
              legal={status.legal}
              owned={status.owned}
              onRemove={handleRemove}
              onInspect={handleInspectDeck}
            />
          </div>

          <div className="flex flex-col gap-2">
            <NameSearchBar
              value={filters.text}
              onChange={(text) => setFilters((prev) => ({ ...prev, text }))}
              inputClassName="h-9 rounded-lg text-sm shadow-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                cards={legalPool}
                labelOptions={allLabels}
                allowedColors={leader.colors}
                allowedCategories={["Character", "Event", "Stage"]}
                showHeading={false}
              />
              <button
                type="button"
                role="switch"
                aria-checked={ownedOnly}
                onClick={() => setOwnedOnly((prev) => !prev)}
                className="ml-auto inline-flex shrink-0 items-center gap-2 text-xs font-medium text-[var(--ink-primary)]"
              >
                <span
                  className={[
                    "relative h-5 w-9 rounded-full transition-colors",
                    ownedOnly
                      ? "bg-[var(--accent-ocean)]"
                      : "bg-[var(--bg-inset)]",
                  ].join(" ")}
                  aria-hidden
                >
                  <span
                    className={[
                      "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                      ownedOnly ? "translate-x-4" : "translate-x-0",
                    ].join(" ")}
                  />
                </span>
                Owned
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[var(--ink-muted)]">
                {searchResults.length.toLocaleString()} shown
                {searchResults.length >= MAX_RESULTS ? "+" : ""}. Tap a card to
                add.
              </p>
              <SortSelect
                value={sort}
                onChange={setSort}
                options={BUILDER_SORTS}
                compact
              />
            </div>
          </div>

          <BuilderCardResults
            cards={searchResults}
            ownedQtyById={ownedQtyById}
            inDeckById={variationCards}
            wantedQtyById={wantedQtyById}
            canAdd={(cardId) =>
              canAddToDeck(
                cardId,
                variationCards[cardId] ?? 0,
                ownedQtyById[cardId] ?? 0,
                ownedOnly,
                constructionRules,
                deckCount,
              )
            }
            onAdd={handleAdd}
            onInspect={handleInspectResults}
            onToggleWanted={(card) => void togglePosted(card.id)}
            wantedSaving={wantedSaving}
          />
          <div className="poster-panel flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--ink-muted)]">
              Add every gap in this variation to Wanted.
            </p>
            <button
              type="button"
              onClick={() => void postGaps(unownedGaps)}
              disabled={wantedSaving || unownedGapCount === 0}
              className="inline-flex items-center justify-center rounded-lg bg-[var(--accent-pirate-red)] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Post all unowned
            </button>
          </div>
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
          <VariationTabs
            variations={variations}
            activeId={activeVariationId}
            favoriteId={favoriteId}
            onSelect={setActiveVariationId}
            onSetFavorite={handleSetFavorite}
            onClone={() => setCloneOpen(true)}
            onRename={() => setRenameVariationOpen(true)}
            onDelete={() => setDeleteVariationOpen(true)}
            onCompare={() => setCompareOpen(true)}
          />
          <VariationStatsPanel stats={variationStats} />
          <BuilderStatusPanel
            legal={status.legal}
            owned={status.owned}
            reasons={status.reasons}
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
        nextFavoriteId={nextFavoriteId}
      />

      <CardDetailModal
        card={selectedCard}
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        selectionCards={
          inspectSource === "deck" ? deckInspectCards : searchResults
        }
        onSelectCard={setSelectedCard}
        ownedQty={selectedCard ? ownedQtyById[selectedCard.id] ?? 0 : 0}
        wantedQty={selectedCard ? wantedQtyById[selectedCard.id] ?? 0 : 0}
        onWantedDelta={(delta) => {
          if (selectedCard) void adjustWanted(selectedCard.id, delta);
        }}
        preferredImageUrl={
          selectedCard ? imageForCard(selectedCard, preferredByCardId) : null
        }
      />
    </div>
  );
}
