"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { CardImage } from "@/components/CardImage";
import { CardLightbox } from "@/components/cards/CardLightbox";
import { LabelEditor } from "@/components/collection/LabelEditor";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { setPreferredImage } from "@/lib/cardPrefs";
import { adjacentCard, cardSelectionIndex } from "@/lib/cardSelection";
import type { DeckPoolCard } from "@/types/catalog";

export function CardDetailModal({
  card,
  open,
  onClose,
  ownedQty = 0,
  labels = [],
  labelSuggestions = [],
  inDecks = [],
  preferredImageUrl,
  showCollectionEditor = false,
  onQuantityDelta,
  onLabelsChange,
  onPreferredChange,
  wantedQty = 0,
  onWantedDelta,
  selectionCards,
  onSelectCard,
}: {
  card: DeckPoolCard | null;
  open: boolean;
  onClose: () => void;
  ownedQty?: number;
  labels?: string[];
  labelSuggestions?: string[];
  inDecks?: { id: string; name: string }[];
  preferredImageUrl?: string | null;
  showCollectionEditor?: boolean;
  onQuantityDelta?: (delta: number) => void;
  onLabelsChange?: (labels: string[]) => void;
  onPreferredChange?: (cardId: string, url: string) => void;
  wantedQty?: number;
  onWantedDelta?: (delta: number) => void;
  selectionCards?: DeckPoolCard[];
  onSelectCard?: (card: DeckPoolCard) => void;
}) {
  const { user } = useAuth();
  const [preferredSelection, setPreferredSelection] = useState<{
    cardId: string;
    url: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!card) return null;

  const preferred =
    preferredSelection?.cardId === card.id
      ? preferredSelection.url
      : preferredImageUrl ?? card.images[0] ?? null;
  const selection = selectionCards ?? [];
  const selectedIndex = cardSelectionIndex(selection, card.id);
  const hasSelectionNavigation =
    Boolean(onSelectCard) && selectedIndex >= 0 && selection.length > 1;
  const previousCard = adjacentCard(selection, card.id, -1);
  const nextCard = adjacentCard(selection, card.id, 1);
  const navigate = (direction: -1 | 1) => {
    const next = adjacentCard(selection, card.id, direction);
    if (next) onSelectCard?.(next);
  };

  const selectArt = async (url: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await setPreferredImage(user.uid, card.id, url);
      setPreferredSelection({ cardId: card.id, url });
      onPreferredChange?.(card.id, url);
      toast.success("Preferred art saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save art preference",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        title={card.name}
        open={open}
        onClose={onClose}
        size="wide"
        overlayContent={
          hasSelectionNavigation ? (
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-1 sm:px-3"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={!previousCard}
                className="pointer-events-auto rounded-full border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-2 text-[var(--ink-primary)] shadow-[var(--shadow-poster)] hover:bg-[var(--bg-inset)] disabled:cursor-not-allowed disabled:opacity-40 sm:p-3"
                aria-label={
                  previousCard
                    ? `Previous card: ${previousCard.name}`
                    : "Previous card"
                }
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <button
                type="button"
                onClick={() => navigate(1)}
                disabled={!nextCard}
                className="pointer-events-auto rounded-full border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-2 text-[var(--ink-primary)] shadow-[var(--shadow-poster)] hover:bg-[var(--bg-inset)] disabled:cursor-not-allowed disabled:opacity-40 sm:p-3"
                aria-label={
                  nextCard ? `Next card: ${nextCard.name}` : "Next card"
                }
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          ) : null}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <p className="text-sm text-[var(--ink-muted)]">{card.id}</p>
          {preferred ? (
            <CardImage
              src={preferred}
              fallbackSrcs={card.images.filter((url) => url !== preferred)}
              alt={card.name}
              width={320}
              height={448}
              className="mx-auto focus:outline-none focus:ring-2 focus:ring-[var(--accent-ocean)]"
              priority
              onClick={() => setLightboxOpen(true)}
              ariaLabel={`Zoom ${card.name} card art`}
            />
          ) : null}
          </div>

          <div className="space-y-4">
          {showCollectionEditor && onQuantityDelta ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-inset)] px-3 py-2">
              <span className="text-sm font-medium text-[var(--ink-primary)]">
                In collection
              </span>
              <QuantityStepper value={ownedQty} onDelta={onQuantityDelta} />
            </div>
          ) : (
            <p className="text-sm text-[var(--ink-muted)]">
              Owned:{" "}
              <span className="font-semibold tabular-nums text-[var(--ink-primary)]">
                {ownedQty}
              </span>
            </p>
          )}

          {onWantedDelta ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-inset)] px-3 py-2">
              <div>
                <p className="text-sm font-medium text-[var(--ink-primary)]">
                  Bounty
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  Extra copies to buy
                </p>
              </div>
              <QuantityStepper value={wantedQty} onDelta={onWantedDelta} />
            </div>
          ) : null}

          {showCollectionEditor && onLabelsChange ? (
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--ink-primary)]">
                Labels
              </p>
              <LabelEditor
                labels={labels}
                suggestions={labelSuggestions}
                onChange={onLabelsChange}
              />
            </div>
          ) : null}

          {inDecks.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--ink-primary)]">
                In decks
              </p>
              <div className="flex flex-wrap gap-1.5">
                {inDecks.map((deck) => (
                  <Link
                    key={deck.id}
                    href={`/decks/${deck.id}`}
                    className="rounded-full bg-[var(--bg-inset)] px-2 py-0.5 text-xs font-medium text-[var(--ink-primary)] hover:text-[var(--accent-ocean)]"
                  >
                    {deck.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[var(--ink-muted)]">Category</dt>
              <dd className="font-medium">{card.category}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Rarity</dt>
              <dd className="font-medium">{card.rarity}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Cost</dt>
              <dd className="font-medium tabular-nums">{card.cost ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Power</dt>
              <dd className="font-medium tabular-nums">{card.power ?? "—"}</dd>
            </div>
          </dl>

          {card.types.length > 0 ? (
            <div>
              <p className="mb-1 text-sm text-[var(--ink-muted)]">Types</p>
              <p className="text-sm">{card.types.join(" · ")}</p>
            </div>
          ) : null}

          {card.effect ? (
            <div>
              <p className="mb-1 text-sm text-[var(--ink-muted)]">Effect</p>
              <p className="text-sm leading-relaxed">{card.effect}</p>
            </div>
          ) : null}

          {card.trigger ? (
            <div>
              <p className="mb-1 text-sm text-[var(--ink-muted)]">Trigger</p>
              <p className="text-sm leading-relaxed">{card.trigger}</p>
            </div>
          ) : null}

          {card.images.length > 1 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--ink-primary)]">
                Art picker
              </p>
              <div className="flex flex-wrap gap-2">
                {card.images.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => void selectArt(url)}
                    disabled={loading}
                    aria-label={
                      preferred === url
                        ? `Preferred art ${index + 1}`
                        : `Use art ${index + 1}`
                    }
                    className={[
                      "rounded-md border-2 p-1 transition-colors",
                      preferred === url
                        ? "border-[var(--accent-pirate-red)]"
                        : "border-transparent hover:border-[var(--accent-ocean)]",
                    ].join(" ")}
                  >
                    <CardImage
                      src={url}
                      fallbackSrcs={card.images.filter((other) => other !== url)}
                      alt=""
                      width={72}
                      height={100}
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          </div>
        </div>
      </Modal>
      <CardLightbox
        card={card}
        imageUrl={preferred}
        fallbackImageUrls={card.images.filter((url) => url !== preferred)}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onPrevious={hasSelectionNavigation ? () => navigate(-1) : undefined}
        onNext={hasSelectionNavigation ? () => navigate(1) : undefined}
        canPrevious={Boolean(previousCard)}
        canNext={Boolean(nextCard)}
      />
    </>
  );
}
