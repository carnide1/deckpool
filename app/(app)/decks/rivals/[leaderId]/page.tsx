"use client";

import { Suspense, useMemo } from "react";
import { useParams } from "next/navigation";
import { RivalJournalView } from "@/components/rivals/RivalJournalView";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useDecks } from "@/contexts/DecksContext";
import { useRivals } from "@/contexts/RivalsContext";
import {
  adjustRivalVsDeckRecord,
  deleteRivalJournal,
  emptyRivalJournal,
  removeRivalVsDeck,
  setRivalCardBuckets,
  setRivalGeneralNotes,
  upsertRivalVsDeck,
} from "@/lib/rivals";

function safeDecode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function RivalJournalPageContent() {
  const params = useParams<{ leaderId: string }>();
  const leaderId = safeDecode(params.leaderId);
  const { user } = useAuth();
  const { cardsById, loading: catalogLoading } = useCatalog();
  const { decks } = useDecks();
  const { rivalsByLeaderId, loading, error } = useRivals();

  const journal = rivalsByLeaderId[leaderId] ?? null;
  const leader = cardsById.get(leaderId) ?? null;

  const displayJournal = useMemo(
    () => journal ?? emptyRivalJournal(leaderId),
    [journal, leaderId],
  );

  if (loading || catalogLoading) {
    return <p className="text-sm text-[var(--ink-muted)]">Loading rival…</p>;
  }

  if (error) {
    return <p className="text-sm text-[var(--accent-pirate-red)]">{error}</p>;
  }

  if (!journal) {
    return (
      <div className="mx-auto max-w-xl">
        <p className="text-sm text-[var(--ink-muted)]">
          No journal for {leader?.name ?? leaderId}. Add them from Rivals.
        </p>
      </div>
    );
  }

  if (leader && leader.category !== "Leader") {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        That id is not a Leader in the catalog.
      </p>
    );
  }

  const uid = user?.uid;
  if (!uid) return null;

  const base = `/decks/rivals/${encodeURIComponent(leaderId)}`;

  return (
    <RivalJournalView
      journal={displayJournal}
      leader={leader}
      decks={decks}
      backHref="/decks/rivals"
      tabBaseHref={base}
      deckHrefFor={(deckId) =>
        decks.some((deck) => deck.id === deckId) ? `/decks/${deckId}` : null
      }
      onSaveBuckets={async (keyPieceIds, techOptionIds) => {
        await setRivalCardBuckets(uid, leaderId, keyPieceIds, techOptionIds);
      }}
      onGeneralNotes={async (notes) => {
        await setRivalGeneralNotes(uid, leaderId, notes);
      }}
      onUpsertVsDeck={async ({ deckId, deckName, notes }) => {
        await upsertRivalVsDeck(uid, leaderId, deckId, { deckName, notes });
      }}
      onAdjustRecord={async (deckId, field, delta) => {
        await adjustRivalVsDeckRecord(uid, leaderId, deckId, field, delta);
      }}
      onRemoveVsDeck={async (deckId) => {
        await removeRivalVsDeck(uid, leaderId, deckId);
      }}
      onDeleteJournal={async () => {
        await deleteRivalJournal(uid, leaderId);
      }}
    />
  );
}

export default function RivalJournalPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[var(--ink-muted)]">Loading rival…</p>
      }
    >
      <RivalJournalPageContent />
    </Suspense>
  );
}
