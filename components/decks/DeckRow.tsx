"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { CardImage } from "@/components/CardImage";
import { ColorPills } from "@/components/decks/ColorPills";
import { DeckStatusBadges } from "@/components/decks/DeckStatusBadges";
import type { DeckPoolCard } from "@/types/catalog";
import type { Deck } from "@/types/deck";

const COLOR_BORDER: Record<string, string> = {
  Red: "border-[var(--color-red)]",
  Green: "border-[var(--color-green)]",
  Blue: "border-[var(--color-blue)]",
  Purple: "border-[var(--color-purple)]",
  Black: "border-[var(--color-black)]",
  Yellow: "border-[var(--color-yellow)]",
};

export function DeckRow({
  deck,
  leader,
  summary,
  onRename,
  onDelete,
}: {
  deck: Deck;
  leader: DeckPoolCard | null;
  summary: { anyLegal: boolean; anyOwned: boolean; variationCount: number };
  onRename: () => void;
  onDelete: () => void;
}) {
  const borderClass =
    leader?.colors[0] && COLOR_BORDER[leader.colors[0]]
      ? COLOR_BORDER[leader.colors[0]]
      : "border-[var(--bg-inset)]";

  return (
    <article className="poster-panel relative overflow-hidden">
      <div className="absolute top-0 right-0 left-0 h-1 bg-[var(--accent-pirate-red)]" />
      <div className="flex gap-3 p-3">
        <Link
          href={`/decks/${deck.id}`}
          className={[
            "shrink-0 overflow-hidden rounded-md border-2 bg-[var(--bg-inset)]",
            borderClass,
          ].join(" ")}
        >
          {leader?.images[0] ? (
            <CardImage
              src={leader.images[0]}
              alt={leader.name}
              width={72}
              height={100}
            />
          ) : (
            <div className="flex h-[100px] w-[72px] items-center justify-center text-xs text-[var(--ink-muted)]">
              ?
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link href={`/decks/${deck.id}`} className="group block">
            <h3 className="truncate font-display text-lg font-bold text-[var(--ink-primary)] group-hover:text-[var(--accent-ocean)]">
              {deck.name}
            </h3>
            <p className="mt-0.5 truncate text-sm text-[var(--ink-muted)]">
              {leader?.name ?? deck.leaderId}
            </p>
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {leader ? <ColorPills colors={leader.colors} /> : null}
            <span className="text-xs tabular-nums text-[var(--ink-muted)]">
              {summary.variationCount}{" "}
              {summary.variationCount === 1 ? "variation" : "variations"}
            </span>
          </div>

          <div className="mt-2">
            <DeckStatusBadges
              anyLegal={summary.anyLegal}
              anyOwned={summary.anyOwned}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={onRename}
            className="rounded-lg p-2 text-[var(--ink-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--ink-primary)]"
            aria-label={`Rename ${deck.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-2 text-[var(--ink-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--accent-pirate-red)]"
            aria-label={`Delete ${deck.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
