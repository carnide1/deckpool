"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";

export function FacetMultiSelect({
  label,
  options,
  selected,
  onChange,
  emptyMessage = "No matches",
  renderOption,
  fullWidth = false,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  emptyMessage?: string;
  renderOption?: (option: string) => ReactNode;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const showSearch = options.length > 12;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [open]);

  const filtered = options.filter((option) =>
    option.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    );
  };

  const listEmpty = options.length === 0 || filtered.length === 0;
  const emptyText = options.length === 0 ? emptyMessage : "No matches";

  return (
    <div ref={rootRef} className={["relative", fullWidth ? "w-full" : ""].join(" ")}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
          fullWidth ? "w-full justify-between" : "",
          selected.length > 0
            ? "border-[var(--accent-pirate-red)] bg-[var(--bg-inset)] text-[var(--ink-primary)]"
            : "border-[var(--bg-inset)] bg-[var(--bg-panel)] text-[var(--ink-muted)] hover:border-[var(--accent-ocean)]",
        ].join(" ")}
      >
        <span>
          {label}
          {selected.length > 0 ? ` (${selected.length})` : ""}
        </span>
        <ChevronDown className="h-3 w-3 shrink-0" />
      </button>
      {open ? (
        <div
          className={[
            "absolute z-30 mt-1 rounded-xl border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-2 shadow-[var(--shadow-poster)]",
            fullWidth ? "left-0 right-0 w-full" : "w-64",
          ].join(" ")}
        >
          {showSearch ? (
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              className="mb-2 h-8 w-full rounded-md border border-[var(--bg-inset)] px-2 text-sm focus:border-[var(--accent-ocean)] focus:outline-none"
            />
          ) : null}
          <ul className="max-h-48 overflow-y-auto">
            {listEmpty ? (
              <li className="px-2 py-2 text-xs text-[var(--ink-muted)]">
                {emptyText}
              </li>
            ) : (
              filtered.map((option) => {
                const checked = selected.includes(option);
                return (
                  <li key={option}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--bg-inset)]">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(option)}
                      />
                      <span className="min-w-0 truncate">
                        {renderOption ? renderOption(option) : option}
                      </span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
          {selected.length > 0 ? (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            >
              <X className="h-3 w-3" />
              Clear {label.toLowerCase()}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
