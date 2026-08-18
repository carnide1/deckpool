"use client";

import { SORT_LABELS, type SortKey } from "@/lib/search/sortCards";

export function SortSelect({
  value,
  onChange,
  options,
}: {
  value: SortKey;
  onChange: (next: SortKey) => void;
  options: SortKey[];
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-[var(--ink-muted)]">
      <span className="shrink-0">Sort</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortKey)}
        className="h-9 rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] px-2 text-sm font-medium text-[var(--ink-primary)] focus:border-[var(--accent-ocean)] focus:outline-none"
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
