"use client";

import { Search } from "lucide-react";

export function NameSearchBar({
  value,
  onChange,
  placeholder = "Search by name or number",
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-xl border border-[var(--bg-inset)] bg-[var(--bg-panel)] pr-4 pl-10 text-[var(--ink-primary)] shadow-[var(--shadow-paper)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-ocean)] focus:outline-none"
      />
    </label>
  );
}
