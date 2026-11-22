"use client";

import { useMemo, useState } from "react";
import { FlashCard } from "./FlashCard";
import { Button } from "@/components/ui/Button";
import {
  displayImageCandidates,
  imageCandidates,
} from "@/lib/cardImageUrl";
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

  const cardsKey = useMemo(
    () => cards.map((c) => c.id).join(","),
    [cards],
  );

  // New filter set → start over with blur restored (cardsKey already reshuffles).
  const [sessionKey, setSessionKey] = useState(cardsKey);
  if (sessionKey !== cardsKey) {
    setSessionKey(cardsKey);
    setCurrentIndex(0);
    setRevealed(false);
  }

  const shuffled = useMemo(
    () => shuffleArray(cards),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cardsKey, shuffleKey],
  );

  const safeIndex = useMemo(() => {
    const maxIndex = Math.max(0, shuffled.length - 1);
    return Math.min(currentIndex, maxIndex);
  }, [currentIndex, shuffled.length]);

  const preloadCards = useMemo(
    () =>
      [
        shuffled[safeIndex + 1],
        shuffled[safeIndex + 2],
        shuffled[safeIndex + 3],
      ].filter(Boolean),
    [shuffled, safeIndex],
  );

  // Same proxy/mirror URLs CardImage uses, so preload warms the real cache.
  const preloadImages = useMemo(
    () =>
      preloadCards
        .map(
          (card) =>
            displayImageCandidates(imageCandidates(card, preferredImages))[0],
        )
        .filter(Boolean),
    [preloadCards, preferredImages],
  );

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
    setRevealed(false);
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= shuffled.length) {
        setShuffleKey((prev) => prev + 1);
        return 0;
      }
      return nextIndex;
    });
  };

  const currentCard = shuffled[safeIndex];

  if (!currentCard) {
    return (
      <p className="text-center text-[var(--ink-muted)]">Loading...</p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 pb-8">
      <div className="w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] min-h-[420px] sm:min-h-[560px] md:min-h-[700px]">
        <FlashCard
          key={currentCard.id}
          card={currentCard}
          preferredImages={preferredImages}
          revealed={revealed}
        />
      </div>

      <div className="hidden">
        {preloadImages.map((img, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`preload-${currentCard.id}-${index}-${img}`}
            src={img}
            alt=""
            loading="eager"
            decoding="async"
          />
        ))}
      </div>

      <div className="flex min-h-[44px] gap-3 px-4">
        <Button
          onClick={() => setRevealed(true)}
          className="min-h-[44px] px-6"
          disabled={revealed}
          aria-hidden={revealed}
          tabIndex={revealed ? -1 : undefined}
          style={revealed ? { visibility: "hidden" } : undefined}
        >
          Unblur
        </Button>
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
