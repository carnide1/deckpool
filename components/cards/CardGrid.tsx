"use client";

import { CardImage } from "@/components/CardImage";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { WantedStamp } from "@/components/wanted/WantedStamp";
import { imageCandidates } from "@/lib/cardPrefs";
import type { DeckPoolCard } from "@/types/catalog";
import type { ReactNode } from "react";

const COLOR_CLASS: Record<string, string> = {
  Red: "border-[var(--color-red)]",
  Green: "border-[var(--color-green)]",
  Blue: "border-[var(--color-blue)]",
  Purple: "border-[var(--color-purple)]",
  Black: "border-[var(--color-black)]",
  Yellow: "border-[var(--color-yellow)]",
};

function borderClass(card: DeckPoolCard): string {
  if (card.colors.length === 0) return "border-[var(--bg-inset)]";
  if (card.colors.length === 1) {
    return COLOR_CLASS[card.colors[0]] ?? "border-[var(--bg-inset)]";
  }
  return "border-[var(--accent-gold)]";
}

export function CardGrid({
  cards,
  quantityById,
  preferredImages,
  onSelect,
  onQuantityDelta,
  showStepper = false,
  quantitySaving = false,
  wantedQtyById,
  onToggleWanted,
  showWantedCount = false,
  wantedSaving = false,
  labelsByCardId,
  tileFooter,
}: {
  cards: DeckPoolCard[];
  quantityById: Record<string, number>;
  preferredImages: Record<string, string>;
  onSelect: (card: DeckPoolCard) => void;
  onQuantityDelta?: (card: DeckPoolCard, delta: number) => void;
  showStepper?: boolean;
  quantitySaving?: boolean;
  wantedQtyById?: Record<string, number>;
  onToggleWanted?: (card: DeckPoolCard) => void;
  showWantedCount?: boolean;
  wantedSaving?: boolean;
  labelsByCardId?: Record<string, string[]>;
  tileFooter?: (card: DeckPoolCard) => ReactNode;
}) {
  if (cards.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        No cards match this search.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {cards.map((card) => {
        const qty = quantityById[card.id] ?? 0;
        const wantedQty = wantedQtyById?.[card.id] ?? 0;
        const [image, ...fallbacks] = imageCandidates(card, preferredImages);
        return (
          <article
            key={card.id}
            className={[
              "poster-panel overflow-hidden border-2 p-2",
              borderClass(card),
            ].join(" ")}
          >
            <div className="relative mx-auto w-full max-w-[160px]">
              {image ? (
                <CardImage
                  src={image}
                  fallbackSrcs={fallbacks}
                  alt={card.name}
                  width={160}
                  height={224}
                  className="w-full transition-transform hover:-translate-y-0.5"
                  onClick={() => onSelect(card)}
                  ariaLabel={`Inspect ${card.name}`}
                />
              ) : (
                <div className="flex h-[224px] items-center justify-center rounded-md bg-[var(--bg-inset)] text-xs text-[var(--ink-muted)]">
                  No art
                </div>
              )}
              {qty > 0 ? (
                <span className="absolute top-1 right-1 rounded-md bg-[var(--bg-panel)]/95 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[var(--ink-primary)]">
                  ×{qty}
                </span>
              ) : null}
              {onToggleWanted ? (
                <div className="absolute right-1 bottom-1 z-10">
                  <WantedStamp
                    posted={wantedQty > 0}
                    count={wantedQty}
                    showCount={showWantedCount}
                    disabled={wantedSaving}
                    onClick={() => onToggleWanted(card)}
                  />
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onSelect(card)}
              className="mt-2 block w-full text-left"
            >
              <p className="truncate text-sm font-semibold">{card.name}</p>
              <p className="truncate text-xs text-[var(--ink-muted)]">
                {card.id}
              </p>
            </button>
            {labelsByCardId?.[card.id]?.length ? (
              <div
                className="mt-1 flex max-w-full snap-x snap-mandatory flex-nowrap gap-1.5 overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="list"
                aria-label="Card labels"
              >
                {labelsByCardId[card.id].map((label) => (
                  <span
                    key={label}
                    role="listitem"
                    className="max-w-[9rem] shrink-0 snap-start truncate rounded-full bg-[var(--bg-inset)] px-1.5 py-0.5 text-[0.625rem] font-medium text-[var(--ink-muted)]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
                {card.rarity}
              </span>
              {showStepper && onQuantityDelta ? (
                <QuantityStepper
                  value={qty}
                  disabled={quantitySaving}
                  onDelta={(delta) => onQuantityDelta(card, delta)}
                />
              ) : null}
            </div>
            {tileFooter ? tileFooter(card) : null}
          </article>
        );
      })}
    </div>
  );
}
