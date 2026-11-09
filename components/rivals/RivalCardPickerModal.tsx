"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CardImage } from "@/components/CardImage";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { imageCandidates } from "@/lib/cardPrefs";
import { assignCardBucket } from "@/lib/rivals";
import { searchCatalog } from "@/lib/search/simpleCatalogSearch";
import type { DeckPoolCard } from "@/types/catalog";

const PICKABLE = new Set(["Character", "Event", "Stage"]);

export function RivalCardPickerModal({
  open,
  onClose,
  title,
  selectedIds,
  otherBucketIds,
  onSave,
  readOnly = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  selectedIds: readonly string[];
  otherBucketIds: readonly string[];
  onSave: (nextIds: string[]) => Promise<void> | void;
  readOnly?: boolean;
}) {
  const { cards } = useCatalog();
  const { preferredByCardId } = useCardPrefs();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<string[]>(() => [...selectedIds]);
  const [saving, setSaving] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft([...selectedIds]);
      setQuery("");
    }
  }

  const pool = useMemo(
    () => cards.filter((card) => PICKABLE.has(card.category)),
    [cards],
  );

  const visible = useMemo(() => {
    const q = query.trim();
    return q ? searchCatalog(pool, q, 80) : pool.slice(0, 80);
  }, [pool, query]);

  const draftSet = useMemo(() => new Set(draft), [draft]);
  const otherSet = useMemo(() => new Set(otherBucketIds), [otherBucketIds]);

  const toggle = (card: DeckPoolCard) => {
    if (readOnly) return;
    setDraft((prev) => {
      if (prev.includes(card.id)) return prev.filter((id) => id !== card.id);
      return [...prev, card.id];
    });
  };

  const handleSave = async () => {
    if (readOnly) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const { target } = assignCardBucket(selectedIds, otherBucketIds, draft);
      await onSave(target);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save cards",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="wide"
      footer={
        readOnly ? undefined : (
          <ModalActions
            onCancel={onClose}
            onConfirm={() => void handleSave()}
            confirmLabel="Save cards"
            confirming={saving}
          />
        )
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--ink-muted)]">
          Reference only — presence matters, not counts. A card cannot sit in
          both Key pieces and Tech.
        </p>
        <TextInput
          label="Search cards"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or id"
        />
        {draft.length > 0 ? (
          <p className="text-xs text-[var(--ink-muted)]">
            Selected: {draft.length}
          </p>
        ) : null}
        <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
          {visible.map((card) => {
            const selected = draftSet.has(card.id);
            const inOther = !selected && otherSet.has(card.id);
            const [src, ...fallbacks] = imageCandidates(
              card,
              preferredByCardId,
            );
            return (
              <button
                key={card.id}
                type="button"
                disabled={readOnly || inOther}
                aria-pressed={selected}
                onClick={() => toggle(card)}
                className={[
                  "overflow-hidden rounded-md border-2 text-left",
                  selected
                    ? "border-[var(--accent-ocean)]"
                    : inOther
                      ? "border-[var(--bg-inset)] opacity-40"
                      : "border-transparent hover:border-[var(--bg-inset)]",
                ].join(" ")}
              >
                <CardImage
                  src={src}
                  fallbackSrcs={fallbacks}
                  alt={card.name}
                  width={100}
                  height={140}
                  className="h-auto w-full object-cover"
                />
                <span className="block truncate px-1 py-0.5 text-[10px] text-[var(--ink-muted)]">
                  {card.id}
                  {inOther ? " · other" : ""}
                </span>
              </button>
            );
          })}
        </div>
        {visible.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">No cards match.</p>
        ) : null}
      </div>
    </Modal>
  );
}
