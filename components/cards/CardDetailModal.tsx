"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CardImage } from "@/components/CardImage";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { getPreferredImage, setPreferredImage } from "@/lib/cardPrefs";
import type { DeckPoolCard } from "@/types/catalog";

export function CardDetailModal({
  card,
  open,
  onClose,
  onPreferredChange,
}: {
  card: DeckPoolCard | null;
  open: boolean;
  onClose: () => void;
  onPreferredChange: (cardId: string, url: string) => void;
}) {
  const { user } = useAuth();
  const [preferred, setPreferred] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !card || !user) {
      setPreferred(null);
      return;
    }
    setLoading(true);
    void getPreferredImage(user.uid, card.id)
      .then((url) => setPreferred(url ?? card.images[0] ?? null))
      .finally(() => setLoading(false));
  }, [open, card, user]);

  if (!card) return null;

  const selectArt = async (url: string) => {
    if (!user) return;
    try {
      await setPreferredImage(user.uid, card.id, url);
      setPreferred(url);
      onPreferredChange(card.id, url);
      toast.success("Preferred art saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save art preference",
      );
    }
  };

  return (
    <Modal title={card.name} open={open} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--ink-muted)]">{card.id}</p>
        {preferred ? (
          <CardImage
            src={preferred}
            alt={card.name}
            width={240}
            height={336}
            className="mx-auto"
            priority
          />
        ) : null}

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[var(--ink-muted)]">Category</dt>
            <dd className="font-medium">{card.category}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Rarity</dt>
            <dd className="font-medium">{card.rarity}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Cost</dt>
            <dd className="font-medium tabular-nums">{card.cost ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Power</dt>
            <dd className="font-medium tabular-nums">{card.power ?? "—"}</dd>
          </div>
        </dl>

        {card.types.length > 0 ? (
          <div>
            <p className="mb-1 text-sm text-[var(--ink-muted)]">Types</p>
            <p className="text-sm">{card.types.join(" · ")}</p>
          </div>
        ) : null}

        {card.effect ? (
          <div>
            <p className="mb-1 text-sm text-[var(--ink-muted)]">Effect</p>
            <p className="text-sm leading-relaxed">{card.effect}</p>
          </div>
        ) : null}

        {card.images.length > 1 ? (
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--ink-primary)]">
              Art picker
            </p>
            <div className="flex flex-wrap gap-2">
              {card.images.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => void selectArt(url)}
                  disabled={loading}
                  className={[
                    "rounded-md border-2 p-1 transition-colors",
                    preferred === url
                      ? "border-[var(--accent-pirate-red)]"
                      : "border-transparent hover:border-[var(--accent-ocean)]",
                  ].join(" ")}
                >
                  <CardImage src={url} alt="" width={72} height={100} />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <p className="text-xs text-[var(--ink-muted)]">
          To change owned quantity, use Collection. To add to a deck, use the
          Builder.
        </p>
      </div>
    </Modal>
  );
}
