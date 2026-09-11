"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ChevronDown,
  Copy,
  GitCompare,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import type { Variation } from "@/types/deck";

const actionBtnClass =
  "inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-md border border-[var(--bg-inset)] bg-[var(--bg-panel)] px-1.5 py-1.5 text-[0.625rem] font-semibold text-[var(--ink-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--ink-primary)] disabled:cursor-not-allowed disabled:opacity-40";

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
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const activeIsFavorite = Boolean(favoriteId && activeId === favoriteId);
  const active = variations.find((row) => row.id === activeId) ?? null;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="poster-panel flex flex-col gap-2 p-3">
      <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[var(--accent-ocean)]">
        Variation
      </p>

      <div className="flex items-center gap-1.5">
        <div ref={rootRef} className="relative min-w-0 flex-1">
          <button
            type="button"
            id={`${listboxId}-trigger`}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listboxId}
            onClick={() => setOpen((prev) => !prev)}
            className={[
              "inline-flex h-8 w-full items-center justify-between gap-2 rounded-lg border bg-[var(--bg-panel)] py-1 pr-2.5 pl-2.5 text-left text-sm font-medium text-[var(--ink-primary)] transition-colors",
              open
                ? "border-[var(--accent-ocean)]"
                : "border-[var(--bg-inset)] hover:border-[var(--accent-ocean)]",
            ].join(" ")}
          >
            <span className="min-w-0 truncate">
              {active?.name ?? "Select variation"}
            </span>
            <ChevronDown
              className={[
                "h-3.5 w-3.5 shrink-0 text-[var(--ink-muted)] transition-transform duration-300 ease-out",
                open ? "rotate-180" : "",
              ].join(" ")}
              aria-hidden
            />
          </button>
          {open ? (
            <ul
              id={listboxId}
              role="listbox"
              aria-labelledby={`${listboxId}-trigger`}
              className="absolute top-full right-0 left-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] py-1 shadow-[var(--shadow-poster)]"
            >
              {variations.map((variation) => {
                const selected = variation.id === activeId;
                return (
                  <li key={variation.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onSelect(variation.id);
                        setOpen(false);
                      }}
                      className={[
                        "flex w-full items-center px-2.5 py-1.5 text-left text-sm transition-colors",
                        selected
                          ? "bg-[var(--accent-ocean)]/12 font-semibold text-[var(--accent-ocean)]"
                          : "text-[var(--ink-primary)] hover:bg-[var(--bg-inset)]",
                      ].join(" ")}
                    >
                      <span className="min-w-0 truncate">{variation.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
        {onSetFavorite && activeId ? (
          <button
            type="button"
            onClick={() => onSetFavorite(activeId)}
            disabled={activeIsFavorite}
            className={[
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--bg-inset)]",
              activeIsFavorite
                ? "border-[var(--accent-gold)]/40 text-[var(--accent-gold)]"
                : "text-[var(--ink-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--accent-gold)]",
              "disabled:cursor-default",
            ].join(" ")}
            aria-label={
              activeIsFavorite
                ? `${active?.name ?? "Variation"} is the favorite`
                : `Set ${active?.name ?? "variation"} as favorite`
            }
            aria-pressed={activeIsFavorite}
            title={
              activeIsFavorite ? "Favorite variation" : "Set as favorite"
            }
          >
            <Star
              className="h-3.5 w-3.5"
              fill={activeIsFavorite ? "currentColor" : "none"}
            />
          </button>
        ) : null}
      </div>

      {readOnly ? null : (
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => onClone?.()}
            className={actionBtnClass}
          >
            <Copy className="h-3 w-3 shrink-0" />
            Clone
          </button>
          <button
            type="button"
            onClick={() => onRename?.()}
            className={actionBtnClass}
          >
            <Pencil className="h-3 w-3 shrink-0" />
            Rename
          </button>
          <button
            type="button"
            onClick={() => onDelete?.()}
            disabled={variations.length <= 1}
            className={actionBtnClass}
          >
            <Trash2 className="h-3 w-3 shrink-0" />
            Delete
          </button>
          <button
            type="button"
            onClick={() => onCompare?.()}
            disabled={variations.length < 2}
            className={actionBtnClass}
          >
            <GitCompare className="h-3 w-3 shrink-0" />
            Compare
          </button>
        </div>
      )}
    </div>
  );
}
