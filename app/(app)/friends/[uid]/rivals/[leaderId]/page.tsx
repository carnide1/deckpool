"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FriendAreaGate } from "@/components/friends/FriendAreaGate";
import { RivalJournalView } from "@/components/rivals/RivalJournalView";
import { useCatalog } from "@/contexts/CatalogContext";
import { useFriendData } from "@/contexts/FriendDataContext";
import { emptyRivalJournal } from "@/lib/rivals";

function safeDecode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function FriendRivalJournalContent() {
  const params = useParams<{ uid: string; leaderId: string }>();
  const uid = safeDecode(params.uid);
  const leaderId = safeDecode(params.leaderId);
  const { name, rivals: friendRivals, decks: friendDecks, shares } =
    useFriendData();
  const { cardsById, loading: catalogLoading } = useCatalog();

  const journal = friendRivals.rivalsByLeaderId[leaderId] ?? null;
  const leader = cardsById.get(leaderId) ?? null;
  const decks = shares("decks") ? friendDecks.decks : [];

  const displayJournal = useMemo(
    () => journal ?? emptyRivalJournal(leaderId),
    [journal, leaderId],
  );

  if (catalogLoading || friendRivals.loading) {
    return <p className="text-sm text-[var(--ink-muted)]">Loading rival…</p>;
  }

  if (!journal) {
    return (
      <div className="mx-auto max-w-xl">
        <Link
          href={`/friends/${uid}/rivals`}
          className="inline-flex items-center gap-2 text-sm text-[var(--accent-ocean)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {name}&apos;s Rivals
        </Link>
        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          Journal not found.
        </p>
      </div>
    );
  }

  const base = `/friends/${uid}/rivals/${encodeURIComponent(leaderId)}`;

  return (
    <RivalJournalView
      journal={displayJournal}
      leader={leader}
      decks={decks}
      backHref={`/friends/${uid}/rivals`}
      tabBaseHref={base}
      deckHrefFor={(deckId) =>
        shares("decks") && decks.some((deck) => deck.id === deckId)
          ? `/friends/${uid}/decks/${deckId}`
          : null
      }
      readOnly
    />
  );
}

export default function FriendRivalJournalPage() {
  return (
    <FriendAreaGate area="rivals">
      <Suspense
        fallback={
          <p className="text-sm text-[var(--ink-muted)]">Loading rival…</p>
        }
      >
        <FriendRivalJournalContent />
      </Suspense>
    </FriendAreaGate>
  );
}
