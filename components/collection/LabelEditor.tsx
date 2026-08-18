"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

export function LabelEditor({
  labels,
  suggestions,
  onChange,
  disabled,
}: {
  labels: string[];
  suggestions: string[];
  onChange: (labels: string[]) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const listId = useMemo(
    () => `label-suggestions-${Math.random().toString(36).slice(2)}`,
    [],
  );

  const addLabel = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (labels.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...labels, trimmed].sort((a, b) => a.localeCompare(b)));
    setDraft("");
  };

  const removeLabel = (label: string) => {
    onChange(labels.filter((l) => l !== label));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addLabel(draft);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {labels.map((label) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-inset)] px-2 py-0.5 text-xs font-medium text-[var(--ink-primary)]"
        >
          {label}
          {!disabled ? (
            <button
              type="button"
              onClick={() => removeLabel(label)}
              className="rounded-full p-0.5 hover:bg-[var(--bg-page)]"
              aria-label={`Remove label ${label}`}
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </span>
      ))}
      {!disabled ? (
        <>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => addLabel(draft)}
            list={listId}
            placeholder={labels.length ? "Add label" : "Labels (optional)"}
            className="min-w-[7rem] flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-xs text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-ocean)] focus:outline-none"
          />
          <datalist id={listId}>
            {suggestions
              .filter((s) => !labels.some((l) => l.toLowerCase() === s.toLowerCase()))
              .map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
          </datalist>
        </>
      ) : null}
    </div>
  );
}
