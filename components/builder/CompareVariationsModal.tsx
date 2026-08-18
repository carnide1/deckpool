"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { diffVariations } from "@/lib/variationDiff";
import type { DeckPoolCard } from "@/types/catalog";
import type { Variation } from "@/types/deck";

export function CompareVariationsModal({
  open,
  onClose,
  variations,
  activeId,
  cardsById,
}: {
  open: boolean;
  onClose: () => void;
  variations: Variation[];
  activeId: string;
  cardsById: Map<string, DeckPoolCard>;
}) {
  const activeIndex = variations.findIndex((row) => row.id === activeId);
  const defaultBaseId =
    activeIndex >= 0 ? variations[activeIndex]?.id ?? "" : variations[0]?.id ?? "";
  const defaultCompareId =
    activeIndex > 0
      ? variations[activeIndex - 1]?.id ?? ""
      : variations[1]?.id ?? "";

  const [baseId, setBaseId] = useState(defaultBaseId);
  const [compareId, setCompareId] = useState(defaultCompareId);

  useEffect(() => {
    if (!open) return;
    setBaseId(defaultBaseId);
    setCompareId(defaultCompareId);
  }, [open, defaultBaseId, defaultCompareId]);

  const base = variations.find((row) => row.id === baseId) ?? null;
  const compare = variations.find((row) => row.id === compareId) ?? null;

  const diffs = useMemo(() => {
    if (!base || !compare) return [];
    return diffVariations(base.cards, compare.cards);
  }, [base, compare]);

  return (
    <Modal title="Compare variations" open={open} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--ink-primary)]">Base</span>
            <select
              value={baseId}
              onChange={(event) => setBaseId(event.target.value)}
              className="h-10 rounded-lg border border-[var(--bg-inset)] bg-white px-3"
            >
              {variations.map((variation) => (
                <option key={variation.id} value={variation.id}>
                  {variation.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--ink-primary)]">Compare</span>
            <select
              value={compareId}
              onChange={(event) => setCompareId(event.target.value)}
              className="h-10 rounded-lg border border-[var(--bg-inset)] bg-white px-3"
            >
              {variations.map((variation) => (
                <option key={variation.id} value={variation.id}>
                  {variation.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {diffs.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">
            No count differences between these variations.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--bg-inset)] rounded-xl border border-[var(--bg-inset)]">
            {diffs.map((entry) => {
              const card = cardsById.get(entry.cardId);
              const label = card?.name ?? entry.cardId;
              const sign = entry.delta > 0 ? "+" : "";
              return (
                <li
                  key={entry.cardId}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--ink-primary)]">
                      {label}
                    </p>
                    <p className="truncate text-xs text-[var(--ink-muted)]">
                      {entry.cardId}
                    </p>
                  </div>
                  <p className="shrink-0 tabular-nums text-[var(--ink-primary)]">
                    {entry.baseQty} → {entry.compareQty}{" "}
                    <span
                      className={
                        entry.delta > 0
                          ? "text-[var(--badge-legal)]"
                          : "text-[var(--badge-illegal)]"
                      }
                    >
                      ({sign}
                      {entry.delta})
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
