"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { CardImage } from "@/components/CardImage";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { CardGrid } from "@/components/cards/CardGrid";
import { DeckModeToggle } from "@/components/builder/DeckModeToggle";
import { VariationStatsPanel } from "@/components/builder/VariationStatsPanel";
import { VariationTabs } from "@/components/builder/VariationTabs";
import { ColorPills } from "@/components/decks/ColorPills";
import { DeckStatusBadges } from "@/components/decks/DeckStatusBadges";
import { useAuth } from "@/contexts/AuthContext";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCollection } from "@/contexts/CollectionContext";
import { useWanted } from "@/contexts/WantedContext";
import { useWantedWrite } from "@/hooks/useWantedWrite";
import { useDecks } from "@/contexts/DecksContext";
import { getConstructionRules } from "@/lib/construction";
import { mainDeckCount } from "@/lib/builder";
import { setFavoriteVariation } from "@/lib/decks";
import { validateVariation } from "@/lib/legality";
import { sortCards } from "@/lib/search/sortCards";
import { computeVariationStats } from "@/lib/variationStats";
import { resolveFavoriteVariationId } from "@/lib/variations";
import { imageCandidates, imageForCard } from "@/lib/cardPrefs";
import type { CardCategory, DeckPoolCard } from "@/types/catalog";
import type { Deck } from "@/types/deck";

const VIEW_GROUPS: CardCategory[] = ["Character", "Event", "Stage"];

export function DeckView({ deck }: { deck: Deck }) {
  const { user } = useAuth();
  const { cardsById } = useCatalog();
  const { ownedMap } = useCollection();
  const { wantedMap } = useWanted();
  const { preferredByCardId } = useCardPrefs();
  const { variationsByDeckId } = useDecks();
  const { saving: wantedSaving, togglePosted, adjustQuantity: adjustWanted } =
    useWantedWrite();

  const variations = variationsByDeckId[deck.id] ?? [];
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
  const [selectedCard, setSelectedCard] = useState<DeckPoolCard | null>(null);

  useEffect(() => {
    if (variations.length === 0) {
      setActiveVariationId("");
      return;
    }
    if (
      !activeVariationId ||
      !variations.some((row) => row.id === activeVariationId)
    ) {
      setActiveVariationId(variations[0].id);
    }
  }, [variations, activeVariationId]);

  const activeVariation =
    variations.find((row) => row.id === activeVariationId) ?? null;

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

  const grouped = useMemo(() => {
    if (!activeVariation) return [];
    return VIEW_GROUPS.map((category) => {
      const cards = Object.entries(activeVariation.cards)
        .filter(([, qty]) => qty > 0)
        .map(([cardId, qty]) => {
          const card = cardsById.get(cardId);
          return card && card.category === category ? { card, qty } : null;
        })
        .filter((row): row is { card: DeckPoolCard; qty: number } => row !== null);

      const sorted = sortCards(
        cards.map((row) => row.card),
        "cost",
      );
      const qtyById: Record<string, number> = {};
      for (const row of cards) qtyById[row.card.id] = row.qty;

      return {
        category,
        cards: sorted,
        quantityById: qtyById,
      };
    }).filter((group) => group.cards.length > 0);
  }, [activeVariation, cardsById]);

  const deckCount = activeVariation ? mainDeckCount(activeVariation.cards) : 0;

  const variationStats = useMemo(
    () => computeVariationStats(activeVariation?.cards ?? {}, cardsById),
    [activeVariation, cardsById],
  );

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
        <DeckModeToggle deckId={deck.id} mode="view" />
      </div>

      <div className="poster-panel p-4">
        <div className="flex flex-wrap items-start gap-4">
          {leaderImage ? (
            <CardImage
              src={leaderImage}
              fallbackSrcs={leaderFallbacks}
              alt={leader.name}
              width={96}
              height={134}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
              {deck.name}
            </h1>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">{leader.name}</p>
            <div className="mt-2">
              <ColorPills colors={leader.colors} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <DeckStatusBadges
                legal={status.legal}
                owned={status.owned}
              />
              <span className="text-sm tabular-nums text-[var(--ink-muted)]">
                {deckCount}/50 cards
              </span>
            </div>
          </div>
        </div>
      </div>

      <VariationTabs
        variations={variations}
        activeId={activeVariationId}
        favoriteId={favoriteId}
        onSelect={setActiveVariationId}
        onSetFavorite={handleSetFavorite}
        readOnly
      />

      <VariationStatsPanel stats={variationStats} />

      {grouped.length === 0 ? (
        <div className="poster-panel p-8 text-center text-sm text-[var(--ink-muted)]">
          This variation is empty. Switch to Edit to add cards.
        </div>
      ) : (
        grouped.map((group) => (
          <section key={group.category} className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
              {group.category}s
            </h2>
            <CardGrid
              cards={group.cards}
              quantityById={group.quantityById}
              preferredImages={preferredByCardId}
              onSelect={setSelectedCard}
              wantedQtyById={wantedQtyById}
              onToggleWanted={(card) => void togglePosted(card.id)}
              wantedSaving={wantedSaving}
            />
          </section>
        ))
      )}

      <CardDetailModal
        card={selectedCard}
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
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
