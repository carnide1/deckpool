"use client";

import { CardImage } from "@/components/CardImage";
import { imageCandidates } from "@/lib/cardImageUrl";
import type { DeckPoolCard } from "@/types/catalog";

export function FlashCard({
  card,
  preferredImages,
  revealed,
}: {
  card: DeckPoolCard;
  preferredImages: Record<string, string>;
  revealed: boolean;
}) {
  const [image, ...fallbacks] = imageCandidates(card, preferredImages);

  return (
    <div className="flex flex-col items-center px-4">
      {/* Card image with bottom half blurred when not revealed */}
      <div className="relative w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px]">
        {image ? (
          <CardImage
            src={image}
            fallbackSrcs={fallbacks}
            alt={card.name}
            width={500}
            height={700}
            className="w-full rounded-lg"
          />
        ) : (
          <div className="flex aspect-[5/7] w-full items-center justify-center rounded-lg bg-[var(--bg-inset)] text-sm text-[var(--ink-muted)]">
            No image
          </div>
        )}
        
        {/* Blur overlay on bottom half only */}
        {!revealed && (
          <div className="absolute bottom-0 left-0 right-0 h-1/2 rounded-b-lg backdrop-blur-md bg-white/20 transition-opacity duration-300" />
        )}
      </div>
    </div>
  );
}
