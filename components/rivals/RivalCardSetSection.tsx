"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { CardImage } from "@/components/CardImage";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { RivalCardPickerModal } from "@/components/rivals/RivalCardPickerModal";
import { Button } from "@/components/ui/Button";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCollection } from "@/contexts/CollectionContext";
import { imageCandidates, imageForCard } from "@/lib/cardPrefs";
import type { DeckPoolCard } from "@/types/catalog";

export function RivalCardSetSection({
  title,
  description,
  leader,
  ids,
  otherBucketIds,
  onChange,
  readOnly = false,
}: {
  title: string;
  description?: string;
  leader: DeckPoolCard | null;
  ids: readonly string[];
  otherBucketIds: readonly string[];
  onChange?: (nextIds: string[]) => Promise<void>;
  readOnly?: boolean;
}) {
  const { cardsById } = useCatalog();
  const { preferredByCardId } = useCardPrefs();
  const { ownedMap } = useCollection();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCard, setSelectedCard] = useState<DeckPoolCard | null>(null);

  const sectionCards = useMemo(() => {
    const list: DeckPoolCard[] = [];
    for (const id of ids) {
      const card = cardsById.get(id);
      if (card) list.push(card);
    }
    return list;
  }, [ids, cardsById]);

  const removeOne = async (cardId: string) => {
    if (readOnly || !onChange) return;
    setSaving(true);
    try {
      await onChange(ids.filter((id) => id !== cardId));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-[var(--ink-muted)]">{description}</p>
          ) : null}
        </div>
        {readOnly || !leader ? null : (
          <Button
            variant="secondary"
            onClick={() => setPickerOpen(true)}
            disabled={saving}
          >
            <Plus className="h-4 w-4" />
            Add cards
          </Button>
        )}
      </div>

      {ids.length === 0 ? (
        <p className="text-sm text-[var(--ink-muted)]">None yet.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {ids.map((cardId) => {
            const card = cardsById.get(cardId) ?? null;
            const [src, ...fallbacks] = card
              ? imageCandidates(card, preferredByCardId)
              : [];
            return (
              <li
                key={cardId}
                className="relative overflow-hidden rounded-md border border-[var(--bg-inset)] bg-[var(--bg-panel)]"
              >
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => {
                    if (card) setSelectedCard(card);
                  }}
                  aria-label={
                    card ? `Open details for ${card.name}` : `Unknown ${cardId}`
                  }
                >
                  {src ? (
                    <CardImage
                      src={src}
                      fallbackSrcs={fallbacks}
                      alt={card?.name ?? cardId}
                      width={120}
                      height={168}
                      className="h-auto w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[5/7] items-center justify-center p-2 text-center text-xs text-[var(--ink-muted)]">
                      {cardId}
                    </div>
                  )}
                  <p className="truncate px-1 py-0.5 text-[10px] text-[var(--ink-muted)]">
                    {card?.name ?? cardId}
                  </p>
                </button>
                {readOnly ? null : (
                  <button
                    type="button"
                    aria-label={`Remove ${card?.name ?? cardId}`}
                    disabled={saving}
                    onClick={(event) => {
                      event.stopPropagation();
                      void removeOne(cardId);
                    }}
                    className="absolute top-1 right-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70 disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!readOnly && leader && onChange ? (
        <RivalCardPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          title={`Edit ${title.toLowerCase()}`}
          leader={leader}
          selectedIds={ids}
          otherBucketIds={otherBucketIds}
          onSave={onChange}
        />
      ) : null}

      <CardDetailModal
        card={selectedCard}
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        selectionCards={sectionCards}
        onSelectCard={setSelectedCard}
        ownedQty={
          selectedCard ? (ownedMap[selectedCard.id]?.quantity ?? 0) : 0
        }
        preferredImageUrl={
          selectedCard
            ? imageForCard(selectedCard, preferredByCardId)
            : null
        }
        allowArtPicker={!readOnly}
        ownedLabel={readOnly ? null : "Owned"}
      />
    </section>
  );
}
