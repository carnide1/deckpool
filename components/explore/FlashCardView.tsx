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

  // Create stable key from card IDs to prevent unnecessary reshuffles
  // when parent passes new array reference with same cards
  const cardsKey = useMemo(
    () => cards.map((c) => c.id).join(","),
    [cards],
  );

  // Shuffle when cards content OR shuffleKey changes.
  // shuffleKey is intentionally included to force reshuffle on loop.
  const shuffled = useMemo(
    () => shuffleArray(cards),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cardsKey, shuffleKey],
  );

  // Clamp current index to valid range and reset if out of bounds
  // This prevents issues when filters reduce the card count
  const safeIndex = useMemo(() => {
    const maxIndex = Math.max(0, shuffled.length - 1);
    return Math.min(currentIndex, maxIndex);
  }, [currentIndex, shuffled.length]);

  // Preload next 3 cards for instant transitions
  const preloadCards = useMemo(
    () => [
      shuffled[safeIndex + 1],
      shuffled[safeIndex + 2],
      shuffled[safeIndex + 3],
    ].filter(Boolean),
    [shuffled, safeIndex],
  );

  // Precompute image URLs for preloading (avoid re-computation in render)
  const preloadImages = useMemo(
    () => preloadCards.map((card) => imageCandidates(card, preferredImages)[0]).filter(Boolean),
    [preloadCards, preferredImages],
  );

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

    // Use functional update to avoid stale closure issues with rapid clicks
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= shuffled.length) {
        // Loop back AND reshuffle
        setShuffleKey((prev) => prev + 1);
        return 0;
      }
      return nextIndex;
    });
  };

  const currentCard = shuffled[safeIndex];

  if (!currentCard) {
    // Defensive check
    return (
      <p className="text-center text-[var(--ink-muted)]">Loading...</p>
    );
  }

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
        {preloadImages.map((img, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`preload-${safeIndex}-${index}`}
            src={img}
            alt=""
            loading="eager"
            decoding="async"
          />
        ))}
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
