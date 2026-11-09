"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { CrewRivalsToggle } from "@/components/decks/CrewRivalsToggle";
import { AddRivalModal } from "@/components/rivals/AddRivalModal";
import { RivalRow } from "@/components/rivals/RivalRow";
import { Button } from "@/components/ui/Button";
import { useCatalog } from "@/contexts/CatalogContext";
import { useRivals } from "@/contexts/RivalsContext";

export default function RivalsPage() {
  const { cardsById, loading: catalogLoading } = useCatalog();
  const { rivals, loading, error } = useRivals();
  const [addOpen, setAddOpen] = useState(false);

  const existingLeaderIds = useMemo(
    () => new Set(rivals.map((row) => row.leaderId)),
    [rivals],
  );

  const sorted = useMemo(() => {
    return [...rivals].sort((a, b) => {
      const nameA = cardsById.get(a.leaderId)?.name ?? a.leaderId;
      const nameB = cardsById.get(b.leaderId)?.name ?? b.leaderId;
      return nameA.localeCompare(nameB);
    });
  }, [rivals, cardsById]);

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
            Decks
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Matchup journals keyed by opponent Leader.
          </p>
          <div className="mt-3">
            <CrewRivalsToggle mode="rivals" />
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4" />
          Add rival
        </Button>
      </div>

      {loading || catalogLoading ? (
        <p className="text-sm text-[var(--ink-muted)]">Loading rivals…</p>
      ) : error ? (
        <p className="text-sm text-[var(--accent-pirate-red)]">{error}</p>
      ) : sorted.length === 0 ? (
        <div className="poster-panel p-8 text-center">
          <p className="poster-stamp mb-3">No rivals yet</p>
          <p className="text-sm text-[var(--ink-muted)]">
            Pick an opponent Leader and log key pieces, tech, and notes.
          </p>
          <Button onClick={() => setAddOpen(true)} className="mt-4">
            <Plus className="h-4 w-4" />
            Add your first rival
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((journal) => (
            <RivalRow
              key={journal.leaderId}
              journal={journal}
              leader={cardsById.get(journal.leaderId) ?? null}
              href={`/decks/rivals/${encodeURIComponent(journal.leaderId)}`}
            />
          ))}
        </div>
      )}

      <AddRivalModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        existingLeaderIds={existingLeaderIds}
      />
    </div>
  );
}
