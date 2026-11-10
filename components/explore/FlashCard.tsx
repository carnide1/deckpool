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
      {/* Card image - always visible */}
      <div className="w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px]">
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
      </div>

      {/* Card details - blurred when not revealed */}
      <div
        className={[
          "mt-6 w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px]",
          "rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-4 sm:p-6",
          "transition-all duration-300",
          !revealed && "pointer-events-none select-none blur-md",
        ].join(" ")}
      >
        {/* Cost / Power / Counter row */}
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {card.cost !== null && (
            <div>
              <span className="text-[var(--ink-muted)]">
                {card.category === "Leader" ? "Life:" : "Cost:"}
              </span>{" "}
              <span className="font-semibold">{card.cost}</span>
            </div>
          )}
          {card.power !== null && (
            <div>
              <span className="text-[var(--ink-muted)]">Power:</span>{" "}
              <span className="font-semibold">{card.power}</span>
            </div>
          )}
          {card.counter !== null && (
            <div>
              <span className="text-[var(--ink-muted)]">Counter:</span>{" "}
              <span className="font-semibold">+{card.counter}</span>
            </div>
          )}
        </div>

        {/* Effect text */}
        {card.effect && (
          <div className="mb-3">
            <p className="mb-1 text-sm font-medium text-[var(--ink-muted)]">
              Effect:
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {card.effect}
            </p>
          </div>
        )}

        {/* Trigger text */}
        {card.trigger && (
          <div className="mb-3">
            <p className="mb-1 text-sm font-medium text-[var(--ink-muted)]">
              Trigger:
            </p>
            <p className="text-sm leading-relaxed">{card.trigger}</p>
          </div>
        )}

        {/* Attributes */}
        {card.attributes.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-sm font-medium text-[var(--ink-muted)]">
              Attributes:
            </p>
            <div className="flex flex-wrap gap-2">
              {card.attributes.map((attr) => (
                <span
                  key={attr}
                  className="rounded-full bg-[var(--bg-inset)] px-2 py-1 text-xs"
                >
                  {attr}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Types */}
        {card.types.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-medium text-[var(--ink-muted)]">
              Types:
            </p>
            <div className="flex flex-wrap gap-2">
              {card.types.map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-[var(--bg-inset)] px-2 py-1 text-xs"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
