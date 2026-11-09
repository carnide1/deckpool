"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { CardImage } from "@/components/CardImage";
import { RivalCardPickerModal } from "@/components/rivals/RivalCardPickerModal";
import { Button } from "@/components/ui/Button";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { imageCandidates } from "@/lib/cardPrefs";

export function RivalCardSetSection({
  title,
  description,
  ids,
  otherBucketIds,
  onChange,
  readOnly = false,
}: {
  title: string;
  description: string;
  ids: readonly string[];
  otherBucketIds: readonly string[];
  onChange?: (nextIds: string[]) => Promise<void>;
  readOnly?: boolean;
}) {
  const { cardsById } = useCatalog();
  const { preferredByCardId } = useCardPrefs();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{description}</p>
        </div>
        {readOnly ? null : (
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
                {readOnly ? null : (
                  <button
                    type="button"
                    aria-label={`Remove ${card?.name ?? cardId}`}
                    disabled={saving}
                    onClick={() => void removeOne(cardId)}
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

      {readOnly || !onChange ? null : (
        <RivalCardPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          title={`Edit ${title.toLowerCase()}`}
          selectedIds={ids}
          otherBucketIds={otherBucketIds}
          onSave={onChange}
        />
      )}
    </section>
  );
}
