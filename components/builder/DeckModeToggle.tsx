"use client";

import Link from "next/link";

export function DeckModeToggle({
  deckId,
  mode,
}: {
  deckId: string;
  mode: "view" | "edit";
}) {
  const viewHref = `/decks/${deckId}`;
  const editHref = `/decks/${deckId}?mode=edit`;

  return (
    <div className="inline-flex rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-0.5 text-sm font-semibold">
      <Link
        href={viewHref}
        className={[
          "rounded-md px-3 py-1.5",
          mode === "view"
            ? "bg-[var(--bg-inset)] text-[var(--ink-primary)]"
            : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
        ].join(" ")}
      >
        View
      </Link>
      <Link
        href={editHref}
        className={[
          "rounded-md px-3 py-1.5",
          mode === "edit"
            ? "bg-[var(--bg-inset)] text-[var(--ink-primary)]"
            : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
        ].join(" ")}
      >
        Edit
      </Link>
    </div>
  );
}
