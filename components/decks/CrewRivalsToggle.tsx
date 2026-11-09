"use client";

import Link from "next/link";

export type DecksAreaMode = "crew" | "rivals";

export function CrewRivalsToggle({
  mode,
  crewHref = "/decks",
  rivalsHref = "/decks/rivals",
}: {
  mode: DecksAreaMode;
  crewHref?: string;
  rivalsHref?: string;
}) {
  return (
    <div className="inline-flex w-fit self-start rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-0.5 text-sm font-semibold">
      <Link
        href={crewHref}
        className={[
          "rounded-md px-3 py-1.5",
          mode === "crew"
            ? "bg-[var(--bg-inset)] text-[var(--ink-primary)]"
            : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
        ].join(" ")}
      >
        Crew
      </Link>
      <Link
        href={rivalsHref}
        className={[
          "rounded-md px-3 py-1.5",
          mode === "rivals"
            ? "bg-[var(--bg-inset)] text-[var(--ink-primary)]"
            : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
        ].join(" ")}
      >
        Rivals
      </Link>
    </div>
  );
}
