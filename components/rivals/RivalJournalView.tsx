"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { CardImage } from "@/components/CardImage";
import { ColorPills } from "@/components/decks/ColorPills";
import { RivalCardSetSection } from "@/components/rivals/RivalCardSetSection";
import { RivalNotesPanel } from "@/components/rivals/RivalNotesPanel";
import { Button } from "@/components/ui/Button";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { imageCandidates } from "@/lib/cardPrefs";
import type { DeckPoolCard } from "@/types/catalog";
import type { Deck } from "@/types/deck";
import type { RivalJournal } from "@/types/rival";

type Tab = "deck" | "notes";

function parseTab(raw: string | null): Tab {
  return raw === "notes" ? "notes" : "deck";
}

export function RivalJournalView({
  journal,
  leader,
  decks,
  backHref,
  tabBaseHref,
  deckHrefFor,
  readOnly = false,
  onSaveBuckets,
  onGeneralNotes,
  onUpsertVsDeck,
  onAdjustRecord,
  onRemoveVsDeck,
  onDeleteJournal,
}: {
  journal: RivalJournal;
  leader: DeckPoolCard | null;
  decks: Deck[];
  backHref: string;
  tabBaseHref: string;
  deckHrefFor: (deckId: string) => string | null;
  readOnly?: boolean;
  onSaveBuckets?: (
    keyPieceIds: string[],
    techOptionIds: string[],
  ) => Promise<void>;
  onGeneralNotes?: (notes: string) => Promise<void>;
  onUpsertVsDeck?: (args: {
    deckId: string;
    deckName: string;
    notes?: string;
  }) => Promise<void>;
  onAdjustRecord?: (
    deckId: string,
    field: "wins" | "losses",
    delta: number,
  ) => Promise<void>;
  onRemoveVsDeck?: (deckId: string) => Promise<void>;
  onDeleteJournal?: () => Promise<void>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const { preferredByCardId } = useCardPrefs();
  const [deleting, setDeleting] = useState(false);

  const [leaderImage, ...leaderFallbacks] = leader
    ? imageCandidates(leader, preferredByCardId)
    : [];

  const tabHref = (next: Tab) => {
    const params = new URLSearchParams();
    if (next === "notes") params.set("tab", "notes");
    const q = params.toString();
    return q ? `${tabBaseHref}?${q}` : tabBaseHref;
  };

  const title = leader?.name ?? journal.leaderId;

  const handleDelete = async () => {
    if (!onDeleteJournal) return;
    if (!confirm(`Delete the journal for ${title}? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await onDeleteJournal();
      toast.success("Rival journal deleted");
      router.push(backHref);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete journal",
      );
    } finally {
      setDeleting(false);
    }
  };

  const saveKeyFromPicker = async (nextIds: string[]) => {
    if (!onSaveBuckets) return;
    const keySet = new Set(nextIds);
    const tech = journal.techOptionIds.filter((id) => !keySet.has(id));
    try {
      await onSaveBuckets(nextIds, tech);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save key pieces",
      );
      throw error;
    }
  };

  const saveTech = async (nextIds: string[]) => {
    if (!onSaveBuckets) return;
    const keySet = new Set(journal.keyPieceIds);
    const tech = nextIds.filter((id) => !keySet.has(id));
    try {
      await onSaveBuckets([...journal.keyPieceIds], tech);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save tech options",
      );
      throw error;
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-[var(--accent-ocean)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Rivals
          </Link>
          <div className="mt-3 flex gap-4">
            <div className="shrink-0 overflow-hidden rounded-md border border-[var(--bg-inset)] bg-[var(--bg-inset)]">
              {leaderImage ? (
                <CardImage
                  src={leaderImage}
                  fallbackSrcs={leaderFallbacks}
                  alt={title}
                  width={96}
                  height={134}
                  className="h-[134px] w-[96px] object-cover"
                />
              ) : (
                <div className="flex h-[134px] w-[96px] items-center justify-center text-xs text-[var(--ink-muted)]">
                  No art
                </div>
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                {title}
              </h1>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {journal.leaderId}
              </p>
              {leader ? (
                <div className="mt-2">
                  <ColorPills colors={leader.colors} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {readOnly || !onDeleteJournal ? null : (
          <Button
            variant="secondary"
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4" />
            Delete journal
          </Button>
        )}
      </div>

      <div className="inline-flex rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-0.5 text-sm font-semibold">
        <Link
          href={tabHref("deck")}
          className={[
            "rounded-md px-3 py-1.5",
            tab === "deck"
              ? "bg-[var(--bg-inset)] text-[var(--ink-primary)]"
              : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
          ].join(" ")}
        >
          Deck
        </Link>
        <Link
          href={tabHref("notes")}
          className={[
            "rounded-md px-3 py-1.5",
            tab === "notes"
              ? "bg-[var(--bg-inset)] text-[var(--ink-primary)]"
              : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
          ].join(" ")}
        >
          Notes
        </Link>
      </div>

      {tab === "deck" ? (
        <div className="space-y-10">
          <RivalCardSetSection
            title="Key pieces"
            description="Engine staples for this matchup."
            ids={journal.keyPieceIds}
            otherBucketIds={journal.techOptionIds}
            readOnly={readOnly}
            onChange={readOnly ? undefined : saveKeyFromPicker}
          />
          <RivalCardSetSection
            title="Tech options"
            description="Flex cards that give an edge but aren’t core to the plan."
            ids={journal.techOptionIds}
            otherBucketIds={journal.keyPieceIds}
            readOnly={readOnly}
            onChange={readOnly ? undefined : saveTech}
          />
        </div>
      ) : (
        <RivalNotesPanel
          journal={journal}
          decks={decks}
          deckHrefFor={deckHrefFor}
          readOnly={readOnly}
          onGeneralNotes={onGeneralNotes}
          onUpsertVsDeck={onUpsertVsDeck}
          onAdjustRecord={onAdjustRecord}
          onRemoveVsDeck={onRemoveVsDeck}
        />
      )}
    </div>
  );
}
