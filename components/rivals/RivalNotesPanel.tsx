"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  NotesDisplay,
  NotesEditor,
} from "@/components/rivals/NotesEditor";
import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import type { Deck } from "@/types/deck";
import type { RivalJournal, RivalVsDeckNotes } from "@/types/rival";
import { RIVAL_NOTES_MAX } from "@/types/rival";

export function RivalNotesPanel({
  journal,
  decks,
  deckHrefFor,
  readOnly = false,
  onGeneralNotes,
  onUpsertVsDeck,
  onAdjustRecord,
  onRemoveVsDeck,
}: {
  journal: RivalJournal;
  decks: Deck[];
  /** Build a link for a live deck id; return null for deleted. */
  deckHrefFor: (deckId: string) => string | null;
  readOnly?: boolean;
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
}) {
  const [general, setGeneral] = useState(journal.notes);
  const [notesLeaderId, setNotesLeaderId] = useState(journal.leaderId);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  if (journal.leaderId !== notesLeaderId) {
    setNotesLeaderId(journal.leaderId);
    setGeneral(journal.notes);
  }

  const decksById = useMemo(() => {
    const map = new Map<string, Deck>();
    for (const deck of decks) map.set(deck.id, deck);
    return map;
  }, [decks]);

  const blocks = useMemo(
    () =>
      Object.values(journal.vsDecks).sort((a, b) =>
        a.deckName.localeCompare(b.deckName),
      ),
    [journal.vsDecks],
  );

  const availableDecks = useMemo(
    () => decks.filter((deck) => !journal.vsDecks[deck.id]),
    [decks, journal.vsDecks],
  );

  const flushGeneral = async () => {
    if (readOnly || !onGeneralNotes) return;
    if (general === journal.notes) return;
    setSavingGeneral(true);
    try {
      await onGeneralNotes(general);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save notes",
      );
      setGeneral(journal.notes);
    } finally {
      setSavingGeneral(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
          Matchup notes
        </h2>
        <p className="text-sm text-[var(--ink-muted)]">
          How to play, what to watch for, general ideas vs this Leader.
        </p>
        {readOnly ? (
          <div className="rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-3">
            <NotesDisplay text={journal.notes} />
          </div>
        ) : (
          <NotesEditor
            label="Notes"
            value={general}
            maxLength={RIVAL_NOTES_MAX}
            onChange={setGeneral}
            onBlur={() => void flushGeneral()}
            disabled={savingGeneral}
            placeholder="e.g. Keep blocker up into their on-play turns…"
          />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
              Your decks
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Notes and a win/loss counter for each of your lists vs this Leader.
            </p>
          </div>
          {readOnly ? null : (
            <Button
              variant="secondary"
              onClick={() => setAddOpen(true)}
              disabled={availableDecks.length === 0}
            >
              <Plus className="h-4 w-4" />
              Add deck notes
            </Button>
          )}
        </div>

        {blocks.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">
            No deck-specific notes yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {blocks.map((block) => (
              <VsDeckBlock
                key={block.deckId}
                block={block}
                liveDeck={decksById.get(block.deckId) ?? null}
                href={deckHrefFor(block.deckId)}
                readOnly={readOnly}
                onNotes={
                  onUpsertVsDeck
                    ? async (notes) => {
                        await onUpsertVsDeck({
                          deckId: block.deckId,
                          deckName:
                            decksById.get(block.deckId)?.name ?? block.deckName,
                          notes,
                        });
                      }
                    : undefined
                }
                onAdjustRecord={onAdjustRecord}
                onRemove={onRemoveVsDeck}
              />
            ))}
          </ul>
        )}
      </section>

      {readOnly || !onUpsertVsDeck ? null : (
        <AddVsDeckModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          decks={availableDecks}
          onPick={async (deck) => {
            await onUpsertVsDeck({ deckId: deck.id, deckName: deck.name });
            setAddOpen(false);
          }}
        />
      )}
    </div>
  );
}

function VsDeckBlock({
  block,
  liveDeck,
  href,
  readOnly,
  onNotes,
  onAdjustRecord,
  onRemove,
}: {
  block: RivalVsDeckNotes;
  liveDeck: Deck | null;
  href: string | null;
  readOnly: boolean;
  onNotes?: (notes: string) => Promise<void>;
  onAdjustRecord?: (
    deckId: string,
    field: "wins" | "losses",
    delta: number,
  ) => Promise<void>;
  onRemove?: (deckId: string) => Promise<void>;
}) {
  const deleted = !liveDeck;
  const title = liveDeck?.name ?? block.deckName;
  const [notes, setNotes] = useState(block.notes);
  const [busy, setBusy] = useState(false);

  const flushNotes = async () => {
    if (readOnly || !onNotes) return;
    if (notes === block.notes) return;
    setBusy(true);
    try {
      await onNotes(notes);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save notes",
      );
      setNotes(block.notes);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="poster-panel space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {href ? (
            <Link
              href={href}
              className="font-display text-base font-bold text-[var(--accent-ocean)] hover:underline"
            >
              {title}
            </Link>
          ) : (
            <h3 className="font-display text-base font-bold text-[var(--ink-primary)]">
              {title}
            </h3>
          )}
          {deleted ? (
            <span className="mt-1 inline-block rounded bg-[var(--bg-inset)] px-2 py-0.5 text-xs font-semibold text-[var(--ink-muted)]">
              Deleted deck
            </span>
          ) : null}
        </div>
        {readOnly || !onRemove ? null : (
          <button
            type="button"
            aria-label={`Remove notes for ${title}`}
            disabled={busy}
            onClick={() => {
              if (!confirm(`Remove notes for ${title}?`)) return;
              setBusy(true);
              void onRemove(block.deckId)
                .catch((error) => {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Could not remove notes",
                  );
                })
                .finally(() => setBusy(false));
            }}
            className="rounded-lg p-1.5 text-[var(--ink-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--accent-pirate-red)]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium text-[var(--ink-primary)]">Wins</span>
          {readOnly || !onAdjustRecord ? (
            <span className="tabular-nums font-semibold">{block.wins}</span>
          ) : (
            <QuantityStepper
              value={block.wins}
              min={0}
              disabled={busy}
              onDelta={(delta) => {
                setBusy(true);
                void onAdjustRecord(block.deckId, "wins", delta)
                  .catch((error) => {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Could not update wins",
                    );
                  })
                  .finally(() => setBusy(false));
              }}
            />
          )}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium text-[var(--ink-primary)]">Losses</span>
          {readOnly || !onAdjustRecord ? (
            <span className="tabular-nums font-semibold">{block.losses}</span>
          ) : (
            <QuantityStepper
              value={block.losses}
              min={0}
              disabled={busy}
              onDelta={(delta) => {
                setBusy(true);
                void onAdjustRecord(block.deckId, "losses", delta)
                  .catch((error) => {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Could not update losses",
                    );
                  })
                  .finally(() => setBusy(false));
              }}
            />
          )}
        </label>
      </div>

      {readOnly ? (
        <NotesDisplay text={block.notes} />
      ) : (
        <NotesEditor
          label="Deck notes"
          value={notes}
          maxLength={RIVAL_NOTES_MAX}
          onChange={setNotes}
          onBlur={() => void flushNotes()}
          disabled={busy}
          placeholder="What works with this list into them…"
        />
      )}
    </li>
  );
}

function AddVsDeckModal({
  open,
  onClose,
  decks,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  decks: Deck[];
  onPick: (deck: Deck) => Promise<void>;
}) {
  const initialId = decks[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(initialId);
  const [wasOpen, setWasOpen] = useState(open);
  const [saving, setSaving] = useState(false);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSelectedId(decks[0]?.id ?? "");
  }

  const selected = decks.find((deck) => deck.id === selectedId) ?? null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add deck notes"
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => {
            if (!selected) return;
            setSaving(true);
            void onPick(selected)
              .catch((error) => {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Could not add deck notes",
                );
              })
              .finally(() => setSaving(false));
          }}
          confirmLabel="Add"
          confirming={saving}
          disabled={!selected}
        />
      }
    >
      {decks.length === 0 ? (
        <p className="text-sm text-[var(--ink-muted)]">
          Every deck already has notes here, or you have no decks yet.
        </p>
      ) : (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-[var(--ink-primary)]">Deck</span>
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="h-10 rounded-lg border border-[var(--bg-inset)] bg-white px-3 text-[var(--ink-primary)]"
          >
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </Modal>
  );
}
