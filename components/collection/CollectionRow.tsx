"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Minus, Plus } from "lucide-react";
import { CardImage } from "@/components/CardImage";
import { LabelEditor } from "@/components/collection/LabelEditor";
import { useAuth } from "@/contexts/AuthContext";
import { setCollectionQuantity } from "@/lib/collection";
import type { DeckPoolCard } from "@/types/catalog";
import type { CollectionItem } from "@/types/collection";

const COLOR_CLASS: Record<string, string> = {
  Red: "bg-[var(--color-red)]",
  Green: "bg-[var(--color-green)]",
  Blue: "bg-[var(--color-blue)]",
  Purple: "bg-[var(--color-purple)]",
  Black: "bg-[var(--color-black)]",
  Yellow: "bg-[var(--color-yellow)]",
};

export function CollectionRow({
  card,
  owned,
  labelSuggestions,
}: {
  card: DeckPoolCard;
  owned?: CollectionItem;
  labelSuggestions: string[];
}) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const quantity = owned?.quantity ?? 0;
  const labels = owned?.labels ?? [];
  const image = card.images[0];

  const persist = async (nextQty: number, nextLabels: string[]) => {
    if (!user) return;
    setSaving(true);
    try {
      await setCollectionQuantity(user.uid, card.id, nextQty, nextLabels);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update collection",
      );
    } finally {
      setSaving(false);
    }
  };

  const setQuantity = (nextQty: number) => {
    void persist(Math.max(0, nextQty), labels);
  };

  const setLabels = (nextLabels: string[]) => {
    if (quantity <= 0 && nextLabels.length > 0) {
      void persist(1, nextLabels);
      return;
    }
    void persist(quantity, nextLabels);
  };

  return (
    <article className="poster-panel flex gap-3 p-3">
      {image ? (
        <CardImage
          src={image}
          alt={card.name}
          width={72}
          height={100}
          className="shrink-0"
        />
      ) : (
        <div className="flex h-[100px] w-[72px] shrink-0 items-center justify-center rounded-md bg-[var(--bg-inset)] text-xs text-[var(--ink-muted)]">
          No art
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-[var(--ink-primary)]">
              {card.name}
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">{card.id}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {card.colors.map((color) => (
                <span
                  key={color}
                  className={`h-2.5 w-2.5 rounded-full ${COLOR_CLASS[color] ?? "bg-[var(--bg-inset)]"}`}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuantity(quantity - 1)}
              disabled={saving || quantity <= 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] text-[var(--ink-primary)] disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(event) => {
                const parsed = Number.parseInt(event.target.value, 10);
                if (Number.isNaN(parsed)) return;
                setQuantity(parsed);
              }}
              className="h-8 w-12 rounded-lg border border-[var(--bg-inset)] bg-white text-center text-sm tabular-nums focus:border-[var(--accent-ocean)] focus:outline-none"
              aria-label="Owned quantity"
            />
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              disabled={saving}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] text-[var(--ink-primary)] disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-2">
          <LabelEditor
            labels={labels}
            suggestions={labelSuggestions}
            onChange={setLabels}
            disabled={saving}
          />
        </div>
      </div>
    </article>
  );
}
