"use client";

import type { MouseEvent } from "react";
import { Info } from "lucide-react";
import { CardImage } from "@/components/CardImage";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { visibleStackCount } from "@/lib/builderDeckStacks";
import { imageCandidates } from "@/lib/cardPrefs";
import type { DeckPoolCard } from "@/types/catalog";

const FACE_WIDTH = 100;
const FACE_HEIGHT = 140;
const OFFSET_Y = 8;

export function BuilderCardStack({
  card,
  qty,
  onRemove,
  onInspect,
}: {
  card: DeckPoolCard;
  qty: number;
  onRemove: (cardId: string) => void;
  onInspect: (card: DeckPoolCard) => void;
}) {
  const { preferredByCardId } = useCardPrefs();
  const [image, ...fallbacks] = imageCandidates(card, preferredByCardId);
  const faces = visibleStackCount(qty);
  const stackHeight = FACE_HEIGHT + Math.max(0, faces - 1) * OFFSET_Y;

  const stop = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className="relative shrink-0"
      style={{ width: FACE_WIDTH, height: stackHeight }}
    >
      {Array.from({ length: faces }, (_, index) => {
        const isTop = index === faces - 1;
        return (
          <div
            key={`${card.id}-face-${index}`}
            className="absolute left-0"
            style={{ top: index * OFFSET_Y, zIndex: index + 1 }}
          >
            {image ? (
              isTop ? (
                <button
                  type="button"
                  onClick={() => onRemove(card.id)}
                  className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ocean)]"
                  aria-label={`Remove one ${card.name}, ${qty} in deck`}
                >
                  <CardImage
                    src={image}
                    fallbackSrcs={fallbacks}
                    alt={card.name}
                    width={FACE_WIDTH}
                    height={FACE_HEIGHT}
                    className="pointer-events-none h-auto w-full"
                  />
                </button>
              ) : (
                <CardImage
                  src={image}
                  fallbackSrcs={fallbacks}
                  alt=""
                  width={FACE_WIDTH}
                  height={FACE_HEIGHT}
                  className="h-auto w-full opacity-95"
                />
              )
            ) : null}
          </div>
        );
      })}

      <button
        type="button"
        onClick={(event) => {
          stop(event);
          onInspect(card);
        }}
        onPointerDown={(event) => event.stopPropagation()}
        className="absolute bottom-1 left-1 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-panel)]/95 text-[var(--ink-muted)] shadow hover:text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ocean)]"
        aria-label={`Details for ${card.name}`}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
