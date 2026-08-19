"use client";

import { Copy, GitCompare, Pencil, Star, Trash2 } from "lucide-react";
import type { Variation } from "@/types/deck";

export function VariationTabs({
  variations,
  activeId,
  favoriteId,
  onSelect,
  onSetFavorite,
  onClone,
  onRename,
  onDelete,
  onCompare,
  readOnly = false,
}: {
  variations: Variation[];
  activeId: string;
  favoriteId?: string | null;
  onSelect: (variationId: string) => void;
  onSetFavorite?: (variationId: string) => void;
  onClone?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onCompare?: () => void;
  readOnly?: boolean;
}) {
  const activeIndex = variations.findIndex((row) => row.id === activeId);
  const activeIsFavorite = Boolean(favoriteId && activeId === favoriteId);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {variations.map((variation) => {
          const active = variation.id === activeId;
          const favorite = variation.id === favoriteId;
          return (
            <div
              key={variation.id}
              className={[
                "inline-flex items-center overflow-hidden rounded-full border text-xs font-semibold",
                active
                  ? "border-[var(--accent-pirate-red)] bg-[var(--bg-inset)] text-[var(--ink-primary)]"
                  : "border-[var(--bg-inset)] bg-[var(--bg-panel)] text-[var(--ink-muted)]",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => onSelect(variation.id)}
                className="px-3 py-1 hover:text-[var(--ink-primary)]"
              >
                {variation.name}
              </button>
              {onSetFavorite ? (
                <button
                  type="button"
                  onClick={() => onSetFavorite(variation.id)}
                  className={[
                    "border-l border-[var(--bg-inset)] px-2 py-1",
                    favorite
                      ? "text-[var(--accent-gold)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--accent-gold)]",
                  ].join(" ")}
                  aria-label={
                    favorite
                      ? `${variation.name} is the main variation`
                      : `Set ${variation.name} as main`
                  }
                  aria-pressed={favorite}
                >
                  <Star
                    className="h-3.5 w-3.5"
                    fill={favorite ? "currentColor" : "none"}
                  />
                </button>
              ) : favorite ? (
                <span
                  className="border-l border-[var(--bg-inset)] px-2 py-1 text-[var(--accent-gold)]"
                  aria-label={`${variation.name} is the main variation`}
                >
                  <Star className="h-3.5 w-3.5" fill="currentColor" />
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      {readOnly ? null : (
        <div className="flex flex-wrap gap-2">
          {onSetFavorite && !activeIsFavorite && activeId ? (
            <button
              type="button"
              onClick={() => onSetFavorite(activeId)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--bg-inset)] px-2 py-1 text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--bg-inset)]"
            >
              <Star className="h-3.5 w-3.5" />
              Set as main
            </button>
          ) : null}
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
