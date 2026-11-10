"use client";

import { useState, useMemo } from "react";
import { FlashCard } from "./FlashCard";
import { Button } from "@/components/ui/Button";
import { imageCandidates } from "@/lib/cardImageUrl";
import type { DeckPoolCard } from "@/types/catalog";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function FlashCardView({
  cards,
  preferredImages,
}: {
  cards: DeckPoolCard[];
  preferredImages: Record<string, string>;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);

  // Shuffle when cards OR shuffleKey changes.
  // shuffleKey is intentionally included to force reshuffle on loop.
  const shuffled = useMemo(
    () => shuffleArray(cards),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cards, shuffleKey],
  );

  // Clamp current index to valid range
  const safeIndex = Math.min(currentIndex, Math.max(0, shuffled.length - 1));

  // Handle empty state
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-lg text-[var(--ink-muted)]">
          No cards match your filters.
        </p>
        <p className="text-sm text-[var(--ink-muted)]">
          Try removing some filters or adjusting your search.
        </p>
      </div>
    );
  }

  const handleNext = () => {
    setRevealed(false); // Reset blur for next card

    if (safeIndex >= shuffled.length - 1) {
      // Loop back AND reshuffle
      setCurrentIndex(0);
      setShuffleKey((prev) => prev + 1);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const currentCard = shuffled[safeIndex];

  if (!currentCard) {
    // Defensive check
    return (
      <p className="text-center text-[var(--ink-muted)]">Loading...</p>
    );
  }

  // Preload next 3 cards for instant transitions
  const preloadCards = [
    shuffled[safeIndex + 1],
    shuffled[safeIndex + 2],
    shuffled[safeIndex + 3],
  ].filter(Boolean);

  return (
    <div className="flex flex-col items-center gap-6 pb-8">
      {/* Fixed-size container prevents layout shift during card transitions */}
      <div className="w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] min-h-[420px] sm:min-h-[560px] md:min-h-[700px]">
        <FlashCard
          key={currentCard.id}
          card={currentCard}
          preferredImages={preferredImages}
          revealed={revealed}
        />
      </div>

      {/* Hidden preload for next cards - loads images in advance */}
      <div className="hidden">
        {preloadCards.map((card) => {
          const [img] = imageCandidates(card, preferredImages);
          return img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={card.id}
              src={img}
              alt=""
              loading="eager"
              decoding="async"
            />
          ) : null;
        })}
      </div>

      <div className="flex gap-3 px-4">
        {!revealed && (
          <Button
            onClick={() => setRevealed(true)}
            className="min-h-[44px] px-6"
          >
            Unblur
          </Button>
        )}
        <Button
          onClick={handleNext}
          variant="secondary"
          className="min-h-[44px] px-6"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
