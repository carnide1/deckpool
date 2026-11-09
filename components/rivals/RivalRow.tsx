"use client";

import Link from "next/link";
import { CardImage } from "@/components/CardImage";
import { ColorPills } from "@/components/decks/ColorPills";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { imageCandidates } from "@/lib/cardPrefs";
import { totalRecord } from "@/lib/rivals";
import type { DeckPoolCard } from "@/types/catalog";
import type { RivalJournal } from "@/types/rival";

const COLOR_BORDER: Record<string, string> = {
  Red: "border-[var(--color-red)]",
  Green: "border-[var(--color-green)]",
  Blue: "border-[var(--color-blue)]",
  Purple: "border-[var(--color-purple)]",
  Black: "border-[var(--color-black)]",
  Yellow: "border-[var(--color-yellow)]",
};

export function RivalRow({
  journal,
  leader,
  href,
  preferredImages,
}: {
  journal: RivalJournal;
  leader: DeckPoolCard | null;
  href: string;
  preferredImages?: Record<string, string>;
}) {
  const { preferredByCardId } = useCardPrefs();
  const [leaderImage, ...leaderFallbacks] = leader
    ? imageCandidates(leader, preferredImages ?? preferredByCardId)
    : [];
  const borderClass =
    leader?.colors[0] && COLOR_BORDER[leader.colors[0]]
      ? COLOR_BORDER[leader.colors[0]]
      : "border-[var(--bg-inset)]";
  const { wins, losses } = totalRecord(journal);
  const cardCount = journal.keyPieceIds.length + journal.techOptionIds.length;

  return (
    <article className="poster-panel relative overflow-hidden">
      <div className="absolute top-0 right-0 left-0 h-1 bg-[var(--accent-pirate-red)]" />
      <div className="flex gap-4 p-4 pt-5">
        <Link
          href={href}
          className={[
            "shrink-0 overflow-hidden rounded-md border-2 bg-[var(--bg-inset)]",
            borderClass,
          ].join(" ")}
        >
          {leaderImage ? (
            <CardImage
              src={leaderImage}
              fallbackSrcs={leaderFallbacks}
              alt={leader?.name ?? journal.leaderId}
              width={72}
              height={100}
              className="h-[100px] w-[72px] object-cover"
            />
          ) : (
            <div className="flex h-[100px] w-[72px] items-center justify-center text-xs text-[var(--ink-muted)]">
              No art
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={href} className="block">
            <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
              {leader?.name ?? journal.leaderId}
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">{journal.leaderId}</p>
          </Link>
          {leader ? (
            <div className="mt-2">
              <ColorPills colors={leader.colors} />
            </div>
          ) : null}
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            {cardCount} reference card{cardCount === 1 ? "" : "s"}
            {wins + losses > 0 ? (
              <>
                {" "}
                · {wins}W–{losses}L
              </>
            ) : null}
          </p>
        </div>
      </div>
    </article>
  );
}
