"use client";

import Link from "next/link";

export type ExploreView = "browse" | "flash";

export function parseExploreView(raw: string | null): ExploreView {
  if (raw === "flash") return "flash";
  return "browse";
}

function exploreHref(mode: ExploreView, currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);
  if (mode === "flash") params.set("view", "flash");
  else params.delete("view");
  const q = params.toString();
  return q ? `/explore?${q}` : "/explore";
}

export function ExploreModeToggle({
  mode,
  search = "",
}: {
  mode: ExploreView;
  /** Current Explore query string (without `?`) so mode switches keep filters. */
  search?: string;
}) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-0.5 text-sm font-semibold">
      <Link
        href={exploreHref("browse", search)}
        aria-current={mode === "browse" ? "page" : undefined}
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
        href={exploreHref("flash", search)}
        aria-current={mode === "flash" ? "page" : undefined}
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
