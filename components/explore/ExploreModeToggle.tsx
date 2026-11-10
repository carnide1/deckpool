"use client";

import Link from "next/link";

export type ExploreView = "browse" | "flash";

export function parseExploreView(raw: string | null): ExploreView {
  if (raw === "flash") return "flash";
  return "browse";
}

export function ExploreModeToggle({ mode }: { mode: ExploreView }) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-0.5 text-sm font-semibold">
      <Link
        href="/explore"
        className={[
          "rounded-md px-3 py-1.5",
          mode === "browse"
            ? "bg-[var(--bg-inset)] text-[var(--ink-primary)]"
            : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
        ].join(" ")}
      >
        Browse
      </Link>
      <Link
        href="/explore?view=flash"
        className={[
          "rounded-md px-3 py-1.5",
          mode === "flash"
            ? "bg-[var(--bg-inset)] text-[var(--ink-primary)]"
            : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
        ].join(" ")}
      >
        Flash
      </Link>
    </div>
  );
}
