"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import {
  buildTypeaheadIndex,
  getTypeaheadSuggestions,
} from "@/lib/search/typeahead";
import type { DeckPoolCard } from "@/types/catalog";

export function CardsSearchBar({
  value,
  onChange,
  onCommit,
  cards,
  userLabels,
}: {
  value: string;
  onChange: (next: string) => void;
  onCommit?: (next: string) => void;
  cards: DeckPoolCard[];
  userLabels: string[];
}) {
  const [caret, setCaret] = useState(0);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const index = useMemo(
    () => buildTypeaheadIndex(cards, userLabels),
    [cards, userLabels],
  );

  const suggestions = useMemo(
    () => (open ? getTypeaheadSuggestions(value, caret, index) : []),
    [open, value, caret, index],
  );

  useEffect(() => {
    setOpen(suggestions.length > 0);
  }, [suggestions.length]);

  const applySuggestion = (insert: string) => {
    const before = value.slice(0, caret);
    const after = value.slice(caret);
    const tokenMatch = before.match(/(?:^|\s)([^\s"]*)$/);
    const tokenStart = tokenMatch
      ? before.length - (tokenMatch[1]?.length ?? 0)
      : before.length;
    const next = `${value.slice(0, tokenStart)}${insert}${after}`;
    onChange(next);
    onCommit?.(next);
    setOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setCaret(event.target.selectionStart ?? event.target.value.length);
        }}
        onClick={(event) =>
          setCaret((event.target as HTMLInputElement).selectionStart ?? 0)
        }
        onKeyUp={(event) =>
          setCaret((event.target as HTMLInputElement).selectionStart ?? 0)
        }
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onCommit?.(value);
          }
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          onCommit?.(value);
          setTimeout(() => setOpen(false), 120);
        }}
        placeholder='Search — e.g. color:purple type:"Big Mom Pirates"'
        className="h-11 w-full rounded-xl border border-[var(--bg-inset)] bg-[var(--bg-panel)] pr-4 pl-10 text-[var(--ink-primary)] shadow-[var(--shadow-paper)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-ocean)] focus:outline-none"
      />
      {open && suggestions.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[var(--bg-inset)] bg-[var(--bg-panel)] py-1 shadow-[var(--shadow-poster)]">
          {suggestions.map((suggestion) => (
            <li key={suggestion.insert}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-inset)]"
                onMouseDown={(event) => {
                  event.preventDefault();
                  applySuggestion(suggestion.insert);
                }}
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
