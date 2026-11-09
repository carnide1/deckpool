"use client";

import { useMemo } from "react";
import { CrewRivalsToggle } from "@/components/decks/CrewRivalsToggle";
import { FriendAreaGate } from "@/components/friends/FriendAreaGate";
import { RivalRow } from "@/components/rivals/RivalRow";
import { useCatalog } from "@/contexts/CatalogContext";
import { useFriendData } from "@/contexts/FriendDataContext";

function FriendRivalsList() {
  const { uid, name, rivals: friendRivals, cardPrefs } = useFriendData();
  const { cardsById, loading: catalogLoading } = useCatalog();
  const { rivals } = friendRivals;

  const sorted = useMemo(() => {
    return [...rivals].sort((a, b) => {
      const nameA = cardsById.get(a.leaderId)?.name ?? a.leaderId;
      const nameB = cardsById.get(b.leaderId)?.name ?? b.leaderId;
      return nameA.localeCompare(nameB);
    });
  }, [rivals, cardsById]);

  if (catalogLoading) {
    return <p className="text-sm text-[var(--ink-muted)]">Loading rivals…</p>;
  }

  if (sorted.length === 0) {
    return (
      <div className="poster-panel p-8 text-center">
        <p className="poster-stamp mb-3">No rivals yet</p>
        <p className="text-sm text-[var(--ink-muted)]">
          {name} hasn&apos;t journaled any opponents.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {sorted.map((journal) => (
        <RivalRow
          key={journal.leaderId}
          journal={journal}
          leader={cardsById.get(journal.leaderId) ?? null}
          href={`/friends/${uid}/rivals/${encodeURIComponent(journal.leaderId)}`}
          preferredImages={cardPrefs.preferredByCardId}
        />
      ))}
    </div>
  );
}

export default function FriendRivalsPage() {
  const { uid } = useFriendData();

  return (
    <div className="flex flex-col gap-4">
      <CrewRivalsToggle
        mode="rivals"
        crewHref={`/friends/${uid}`}
        rivalsHref={`/friends/${uid}/rivals`}
      />
      <FriendAreaGate area="rivals">
        <FriendRivalsList />
      </FriendAreaGate>
    </div>
  );
}
