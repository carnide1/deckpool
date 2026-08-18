"use client";

import { hasQueryToken, toggleQueryToken } from "@/lib/search/queryString";

const COLOR_FACETS = [
  { token: "color:red", label: "Red", className: "bg-[var(--color-red)]" },
  { token: "color:green", label: "Green", className: "bg-[var(--color-green)]" },
  { token: "color:blue", label: "Blue", className: "bg-[var(--color-blue)]" },
  {
    token: "color:purple",
    label: "Purple",
    className: "bg-[var(--color-purple)]",
  },
  {
    token: "color:black",
    label: "Black",
    className: "bg-[var(--color-black)]",
  },
  {
    token: "color:yellow",
    label: "Yellow",
    className: "bg-[var(--color-yellow)]",
  },
] as const;

const CATEGORY_FACETS = [
  { token: "category:Leader", label: "Leader" },
  { token: "category:Character", label: "Character" },
  { token: "category:Event", label: "Event" },
  { token: "category:Stage", label: "Stage" },
] as const;

export function FacetChips({
  query,
  onChange,
}: {
  query: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_FACETS.map((facet) => {
        const active = hasQueryToken(query, facet.token);
        return (
          <button
            key={facet.token}
            type="button"
            onClick={() => onChange(toggleQueryToken(query, facet.token))}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              active
                ? "border-[var(--accent-pirate-red)] bg-[var(--bg-inset)] text-[var(--ink-primary)]"
                : "border-[var(--bg-inset)] bg-[var(--bg-panel)] text-[var(--ink-muted)] hover:border-[var(--accent-ocean)]",
            ].join(" ")}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${facet.className}`}
              aria-hidden
            />
            {facet.label}
          </button>
        );
      })}
      {CATEGORY_FACETS.map((facet) => {
        const active = hasQueryToken(query, facet.token);
        return (
          <button
            key={facet.token}
            type="button"
            onClick={() => onChange(toggleQueryToken(query, facet.token))}
            className={[
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              active
                ? "border-[var(--accent-pirate-red)] bg-[var(--bg-inset)] text-[var(--ink-primary)]"
                : "border-[var(--bg-inset)] bg-[var(--bg-panel)] text-[var(--ink-muted)] hover:border-[var(--accent-ocean)]",
            ].join(" ")}
          >
            {facet.label}
          </button>
        );
      })}
    </div>
  );
}
