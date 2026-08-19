"use client";

import Link from "next/link";

export type CollectionView = "binder" | "summary" | "wanted";

export function CollectionModeToggle({
  mode,
}: {
  mode: CollectionView;
}) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-0.5 text-sm font-semibold">
      <Link
        href="/collection"
        className={[
          "rounded-md px-3 py-1.5",
          mode === "binder"
            ? "bg-[var(--bg-inset)] text-[var(--ink-primary)]"
            : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
        ].join(" ")}
      >
        Binder
      </Link>
      <Link
        href="/collection?view=summary"
        className={[
          "rounded-md px-3 py-1.5",
          mode === "summary"
            ? "bg-[var(--bg-inset)] text-[var(--ink-primary)]"
            : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
        ].join(" ")}
      >
        Summary
      </Link>
      <Link
        href="/collection?view=wanted"
        className={[
          "rounded-md px-3 py-1.5",
          mode === "wanted"
            ? "bg-[var(--bg-inset)] text-[var(--ink-primary)]"
            : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
        ].join(" ")}
      >
        Wanted
      </Link>
    </div>
  );
}
