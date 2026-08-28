"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { CardImage } from "@/components/CardImage";
import type { DeckPoolCard } from "@/types/catalog";

export function CardLightbox({
  card,
  imageUrl,
  fallbackImageUrls,
  open,
  onClose,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}: {
  card: DeckPoolCard | null;
  imageUrl: string | null;
  fallbackImageUrls?: string[];
  open: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canPrevious?: boolean;
  canNext?: boolean;
}) {
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowLeft" && canPrevious) {
        event.preventDefault();
        onPrevious?.();
      } else if (event.key === "ArrowRight" && canNext) {
        event.preventDefault();
        onNext?.();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canNext, canPrevious, onClose, onNext, onPrevious, open]);

  if (!open || !card || !imageUrl || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-3 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-full max-w-full flex-col items-center gap-3"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${card.name} card art`}
      >
        <div className="flex w-full items-center justify-between gap-3 text-white">
          <p className="min-w-0 truncate text-sm font-semibold">
            {card.name}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-white hover:bg-white/15"
            aria-label="Close enlarged card art"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex min-h-0 max-w-full items-center gap-2">
          {onPrevious ? (
            <button
              type="button"
              onClick={onPrevious}
              disabled={!canPrevious}
              className="shrink-0 rounded-full p-2 text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous card"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          ) : null}

          <CardImage
            src={imageUrl}
            fallbackSrcs={fallbackImageUrls}
            alt={card.name}
            width={900}
            height={1260}
            priority
            className="max-h-[calc(100dvh-7rem)] w-auto max-w-[calc(100vw-6rem)] object-contain"
          />

          {onNext ? (
            <button
              type="button"
              onClick={onNext}
              disabled={!canNext}
              className="shrink-0 rounded-full p-2 text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next card"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
