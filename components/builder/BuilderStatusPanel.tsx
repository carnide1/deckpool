"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { DeckStatusBadges } from "@/components/decks/DeckStatusBadges";

export function BuilderStatusPanel({
  legal,
  owned,
  reasons,
}: {
  legal: boolean;
  owned: boolean;
  reasons: string[];
}) {
  const detailsId = useId();
  const [open, setOpen] = useState(false);
  const hasReasons = reasons.length > 0;

  return (
    <div className="poster-panel p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DeckStatusBadges legal={legal} owned={owned} />
        {hasReasons ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
          >
            {reasons.length} note{reasons.length === 1 ? "" : "s"}
            <ChevronDown
              className={[
                "h-3.5 w-3.5 transition-transform",
                open ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>
        ) : null}
      </div>

      {hasReasons && open ? (
        <ul
          id={detailsId}
          className="mt-2 max-h-36 space-y-1 overflow-y-auto border-t border-[var(--bg-inset)] pt-2 text-xs text-[var(--ink-muted)]"
        >
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
