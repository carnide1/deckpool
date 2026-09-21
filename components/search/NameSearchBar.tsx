"use client";

import { Search } from "lucide-react";
import type { SearchTextField } from "@/lib/search/filters";

const MODE_OPTIONS: { id: SearchTextField; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "description", label: "Text" },
];

export function NameSearchBar({
  value,
  onChange,
  placeholder = "Search by name or number",
  className = "",
  inputClassName = "",
  textField,
  onTextFieldChange,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  textField?: SearchTextField;
  onTextFieldChange?: (next: SearchTextField) => void;
}) {
  const showMode = textField != null && onTextFieldChange != null;
  const resolvedPlaceholder =
    showMode && textField === "description" ? "Search card text" : placeholder;
  const ariaLabel =
    textField === "description" ? "Search card text" : placeholder;

  return (
    <div className={["relative block min-w-0", className].join(" ")}>
      <Search className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={resolvedPlaceholder}
        aria-label={ariaLabel}
        className={[
          "h-11 w-full rounded-xl border border-[var(--bg-inset)] bg-[var(--bg-panel)] pl-10 text-[var(--ink-primary)] shadow-[var(--shadow-paper)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-ocean)] focus:outline-none",
          showMode ? "pr-[7.25rem]" : "pr-4",
          inputClassName,
        ].join(" ")}
      />
      {showMode ? (
        <div
          role="radiogroup"
          aria-label="Search in"
          className="absolute top-1/2 right-1.5 flex -translate-y-1/2 rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-inset)] p-0.5"
        >
          {MODE_OPTIONS.map((option) => {
            const checked = textField === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => onTextFieldChange(option.id)}
                className={[
                  "rounded-md px-2 py-0.5 text-[11px] font-semibold leading-5 transition-colors",
                  checked
                    ? "bg-[var(--bg-panel)] text-[var(--ink-primary)] shadow-[var(--shadow-paper)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
