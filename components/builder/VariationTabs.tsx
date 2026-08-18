"use client";

import { Copy, GitCompare, Pencil, Trash2 } from "lucide-react";
import type { Variation } from "@/types/deck";

export function VariationTabs({
  variations,
  activeId,
  onSelect,
  onClone,
  onRename,
  onDelete,
  onCompare,
  readOnly = false,
}: {
  variations: Variation[];
  activeId: string;
  onSelect: (variationId: string) => void;
  onClone?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onCompare?: () => void;
  readOnly?: boolean;
}) {
  const activeIndex = variations.findIndex((row) => row.id === activeId);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {variations.map((variation) => {
          const active = variation.id === activeId;
          return (
            <button
              key={variation.id}
              type="button"
              onClick={() => onSelect(variation.id)}
              className={[
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                active
                  ? "border-[var(--accent-pirate-red)] bg-[var(--bg-inset)] text-[var(--ink-primary)]"
                  : "border-[var(--bg-inset)] bg-[var(--bg-panel)] text-[var(--ink-muted)] hover:border-[var(--accent-ocean)]",
              ].join(" ")}
            >
              {variation.name}
            </button>
          );
        })}
      </div>
      {readOnly ? null : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onClone?.()}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--bg-inset)] px-2 py-1 text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--bg-inset)]"
          >
            <Copy className="h-3.5 w-3.5" />
            Clone
          </button>
          <button
            type="button"
            onClick={() => onRename?.()}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--bg-inset)] px-2 py-1 text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--bg-inset)]"
          >
            <Pencil className="h-3.5 w-3.5" />
            Rename
          </button>
          <button
            type="button"
            onClick={() => onDelete?.()}
            disabled={variations.length <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--bg-inset)] px-2 py-1 text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--bg-inset)] disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
          <button
            type="button"
            onClick={() => onCompare?.()}
            disabled={variations.length < 2}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--bg-inset)] px-2 py-1 text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--bg-inset)] disabled:opacity-40"
          >
            <GitCompare className="h-3.5 w-3.5" />
            Compare
          </button>
          {activeIndex > 0 ? (
            <span className="self-center text-[0.625rem] text-[var(--ink-muted)]">
              Compare defaults to current vs previous tab
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
