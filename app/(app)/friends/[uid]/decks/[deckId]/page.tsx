"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Copy } from "lucide-react";
import { DeckViewBody } from "@/components/builder/DeckViewBody";
import { CopyDeckModal } from "@/components/friends/CopyDeckModal";
import { FriendAreaGate } from "@/components/friends/FriendAreaGate";
import { Button } from "@/components/ui/Button";
import { useCatalog } from "@/contexts/CatalogContext";
import { useFriendData } from "@/contexts/FriendDataContext";
import type { Variation } from "@/types/deck";

function FriendDeckContent() {
  const params = useParams<{ deckId: string }>();
  const { uid, name, decks: friendDecks, cardPrefs } = useFriendData();
  const { loading: catalogLoading } = useCatalog();
  const [activeVariation, setActiveVariation] = useState<Variation | null>(
    null,
  );
  const [copyOpen, setCopyOpen] = useState(false);
  const base = `/friends/${uid}`;

  const deck =
    friendDecks.decks.find((row) => row.id === params.deckId) ?? null;
  const variations = useMemo(
    () => (deck ? friendDecks.variationsByDeckId[deck.id] ?? [] : []),
    [deck, friendDecks.variationsByDeckId],
  );

  if (catalogLoading) {
    return <p className="text-sm text-[var(--ink-muted)]">Loading deck…</p>;
  }

  if (!deck) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href={base}
          className="inline-flex items-center gap-2 text-sm text-[var(--accent-ocean)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {name}&apos;s decks
        </Link>
        <p className="mt-4 text-sm text-[var(--ink-muted)]">Deck not found.</p>
      </div>
    );
  }

  return (
    <>
      <DeckViewBody
        deck={deck}
        variations={variations}
        preferredImages={cardPrefs.preferredByCardId}
        backHref={base}
        backLabel={`Back to ${name}'s decks`}
        showOwned={false}
        onActiveVariationChange={setActiveVariation}
        emptyMessage="This variation is empty."
        headerActions={
          <Button
            onClick={() => setCopyOpen(true)}
            disabled={variations.length === 0}
          >
            <Copy className="h-4 w-4" />
            Copy to my decks
          </Button>
        }
        cardDetailProps={{
          allowArtPicker: false,
          ownedLabel: null,
        }}
      />
      {copyOpen ? (
        <CopyDeckModal
          deck={deck}
          variations={variations}
          activeVariation={activeVariation}
          onClose={() => setCopyOpen(false)}
        />
      ) : null}
    </>
  );
}

export default function FriendDeckPage() {
  return (
    <FriendAreaGate area="decks">
      <Suspense
        fallback={
          <p className="text-sm text-[var(--ink-muted)]">Loading deck…</p>
        }
      >
        <FriendDeckContent />
      </Suspense>
    </FriendAreaGate>
  );
}
