"use client";

import { SORT_LABELS, type SortKey } from "@/lib/search/sortCards";

export function SortSelect({
  value,
  onChange,
  options,
  compact = false,
}: {
  value: SortKey;
  onChange: (next: SortKey) => void;
  options: SortKey[];
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
        onChange={(event) => onChange(event.target.value as SortKey)}
        aria-label="Sort"
        className={[
          "rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] font-medium text-[var(--ink-primary)] focus:border-[var(--accent-ocean)] focus:outline-none",
          compact ? "h-9 max-w-[8.5rem] px-1.5 text-xs" : "h-9 px-2 text-sm",
        ].join(" ")}
      >
        {options.map((key) => (
          <option key={key} value={key}>
            {SORT_LABELS[key]}
          </option>
        ))}
      </select>
    </label>
  );
}
