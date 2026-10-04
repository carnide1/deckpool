"use client";

import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { CardImage } from "@/components/CardImage";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { CardGrid } from "@/components/cards/CardGrid";
import { VariationStatsPanel } from "@/components/builder/VariationStatsPanel";
import { VariationTabs } from "@/components/builder/VariationTabs";
import { ColorPills } from "@/components/decks/ColorPills";
import { DeckStatusBadges } from "@/components/decks/DeckStatusBadges";
import { useCatalog } from "@/contexts/CatalogContext";
import { getConstructionRules } from "@/lib/construction";
import { mainDeckCount } from "@/lib/builder";
import { deckNotes, validateVariation } from "@/lib/legality";
import { sortCards } from "@/lib/search/sortCards";
import { computeVariationStats } from "@/lib/variationStats";
import { resolveFavoriteVariationId } from "@/lib/variations";
import { imageCandidates, imageForCard } from "@/lib/cardPrefs";
import type { CardCategory, DeckPoolCard } from "@/types/catalog";
import type { Deck, Variation } from "@/types/deck";

const VIEW_GROUPS: CardCategory[] = ["Character", "Event", "Stage"];

const EMPTY_QTY: Record<string, number> = {};

export type DeckViewWanted = {
  wantedQtyById: Record<string, number>;
  onToggle: (card: DeckPoolCard) => void;
  onDelta: (card: DeckPoolCard, delta: number) => void;
  saving: boolean;
};

export type DeckViewCardDetailOptions = Pick<
  ComponentProps<typeof CardDetailModal>,
  "allowArtPicker" | "deckHref" | "ownedLabel" | "showReadOnlyWanted"
>;

/**
 * Read-only deck presentation shared by your own Deck View and a friend's deck.
 * Callers pass the data and decide which actions exist.
 */
export function DeckViewBody({
  deck,
  variations,
  preferredImages,
  backHref,
  backLabel,
  headerActions,
  ownedQtyById = EMPTY_QTY,
  showOwned = true,
  onSetFavorite,
  onActiveVariationChange,
  focusVariationId,
  wanted,
  emptyMessage = "This variation is empty. Switch to Edit to add cards.",
  cardDetailProps,
}: {
  deck: Deck;
  variations: Variation[];
  preferredImages: Record<string, string>;
  backHref: string;
  backLabel: string;
  headerActions?: ReactNode;
  /** Ownership for Owned/Unowned. Legal does not depend on it. */
  ownedQtyById?: Record<string, number>;
  showOwned?: boolean;
  onSetFavorite?: (variationId: string) => void;
  onActiveVariationChange?: (variation: Variation | null) => void;
  /** Select this variation once it is in `variations` (after an import). */
  focusVariationId?: string | null;
  wanted?: DeckViewWanted;
  emptyMessage?: string;
  cardDetailProps?: DeckViewCardDetailOptions;
}) {
  const searchParams = useSearchParams();
  const variationFromUrl = searchParams.get("variation");
  const { cardsById } = useCatalog();

  const favoriteId = resolveFavoriteVariationId(
    deck.favoriteVariationId,
    variations,
  );
  const leader = cardsById.get(deck.leaderId) ?? null;
  const [leaderImage, ...leaderFallbacks] = leader
    ? imageCandidates(leader, preferredImages)
    : [];
  const constructionRules = useMemo(() => getConstructionRules(), []);

  const notesId = useId();
  const [notesOpen, setNotesOpen] = useState(false);
  const [pickedVariationId, setActiveVariationId] = useState("");
  const [appliedFocusId, setAppliedFocusId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<DeckPoolCard | null>(null);
  const [seenDeckId, setSeenDeckId] = useState(deck.id);
  if (deck.id !== seenDeckId) {
    setSeenDeckId(deck.id);
    setActiveVariationId("");
    setAppliedFocusId(null);
    setSelectedCard(null);
  }

  const focusHit =
    focusVariationId && variations.some((row) => row.id === focusVariationId)
      ? focusVariationId
      : null;
  const pendingFocus = focusHit && focusHit !== appliedFocusId ? focusHit : null;
  if (pendingFocus) {
    setAppliedFocusId(pendingFocus);
    setActiveVariationId(pendingFocus);
  }

  const activeVariationId = pendingFocus
    ? pendingFocus
    : variations.some(
    (row) => row.id === pickedVariationId,
  )
    ? pickedVariationId
    : variationFromUrl && variations.some((row) => row.id === variationFromUrl)
      ? variationFromUrl
      : (variations[0]?.id ?? "");

  const activeVariation =
    variations.find((row) => row.id === activeVariationId) ?? null;

  useEffect(() => {
    onActiveVariationChange?.(activeVariation);
  }, [activeVariation, onActiveVariationChange]);

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

  const notes = deckNotes(status.reasons, showOwned);

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

  const selectionCards = useMemo(
    () => grouped.flatMap((group) => group.cards),
    [grouped],
  );

  const deckCount = activeVariation ? mainDeckCount(activeVariation.cards) : 0;

  const variationStats = useMemo(
    () =>
      computeVariationStats(activeVariation?.cards ?? {}, cardsById, {
        leaderColors: leader?.colors,
      }),
    [activeVariation, cardsById, leader?.colors],
  );

  if (!leader) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        Leader card not found in catalog.
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-[var(--accent-ocean)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        {headerActions ? (
          <div className="flex flex-wrap items-center gap-2">
            {headerActions}
          </div>
        ) : null}
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
                owned={showOwned ? status.owned : undefined}
              />
              <span className="text-sm tabular-nums text-[var(--ink-muted)]">
                {deckCount}/50 cards
              </span>
              {notes.length > 0 ? (
                <button
                  type="button"
                  aria-expanded={notesOpen}
                  aria-controls={notesId}
                  onClick={() => setNotesOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                >
                  {notes.length} note
                  {notes.length === 1 ? "" : "s"}
                  <ChevronDown
                    className={[
                      "h-3.5 w-3.5 transition-transform",
                      notesOpen ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </button>
              ) : null}
            </div>
            {notes.length > 0 && notesOpen ? (
              <ul
                id={notesId}
                className="mt-2 max-h-36 space-y-1 overflow-y-auto text-xs text-[var(--ink-muted)]"
              >
                {notes.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      <VariationTabs
        variations={variations}
        activeId={activeVariationId}
        favoriteId={favoriteId}
        onSelect={setActiveVariationId}
        onSetFavorite={onSetFavorite}
        readOnly
      />

      <VariationStatsPanel stats={variationStats} />

      {grouped.length === 0 ? (
        <div className="poster-panel p-8 text-center text-sm text-[var(--ink-muted)]">
          {emptyMessage}
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
              preferredImages={preferredImages}
              onSelect={setSelectedCard}
              wantedQtyById={wanted?.wantedQtyById}
              onToggleWanted={wanted?.onToggle}
              wantedSaving={wanted?.saving}
            />
          </section>
        ))
      )}

      <CardDetailModal
        card={selectedCard}
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        selectionCards={selectionCards}
        onSelectCard={setSelectedCard}
        ownedQty={selectedCard ? ownedQtyById[selectedCard.id] ?? 0 : 0}
        wantedQty={
          selectedCard ? wanted?.wantedQtyById[selectedCard.id] ?? 0 : 0
        }
        onWantedDelta={
          wanted
            ? (delta) => {
                if (selectedCard) wanted.onDelta(selectedCard, delta);
              }
            : undefined
        }
        preferredImageUrl={
          selectedCard ? imageForCard(selectedCard, preferredImages) : null
        }
        {...cardDetailProps}
      />
    </div>
  );
}
