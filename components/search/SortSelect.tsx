"use client";

import { SORT_LABELS, type SortKey } from "@/lib/search/sortCards";

function optionLabel<T extends string>(
  key: T,
  labels?: Record<T, string>,
): string {
  if (labels) return labels[key];
  if (Object.prototype.hasOwnProperty.call(SORT_LABELS, key)) {
    return SORT_LABELS[key as SortKey];
  }
  return key;
}

export function SortSelect<T extends string>({
  value,
  onChange,
  options,
  labels,
  compact = false,
}: {
  value: T;
  onChange: (next: T) => void;
  options: readonly T[];
  /** Deck lists pass their own labels. Card lists keep `SORT_LABELS`. */
  labels?: Record<T, string>;
  compact?: boolean;
}) {
  return (
    <label
      className={[
        "inline-flex shrink-0 items-center gap-2 text-[var(--ink-muted)]",
        compact ? "text-xs" : "text-sm",
      ].join(" ")}
    >
      {compact ? (
        <span className="sr-only">Sort</span>
      ) : (
        <span className="shrink-0">Sort</span>
      )}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        aria-label="Sort"
        className={[
          "rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] font-medium text-[var(--ink-primary)] focus:border-[var(--accent-ocean)] focus:outline-none",
          compact ? "h-9 max-w-[8.5rem] px-1.5 text-xs" : "h-9 px-2 text-sm",
        ].join(" ")}
      >
        {options.map((key) => (
          <option key={key} value={key}>
            {optionLabel(key, labels)}
          </option>
        ))}
      </select>
    </label>
  );
}
