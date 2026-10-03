"use client";

import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { mainDeckCount } from "@/lib/builder";
import { getConstructionRules } from "@/lib/construction";
import { VARIATION_NAME_MAX, createVariation } from "@/lib/decks";
import {
  DECK_LIST_PASTE_MAX,
  parseDeckList,
  type DeckListSkip,
} from "@/lib/deckList";
import { validateVariation } from "@/lib/legality";
import type { Deck } from "@/types/deck";

const SKIP_PREVIEW_CAP = 20;

function skipLabel(skip: DeckListSkip): string {
  const text = skip.text.length > 80 ? `${skip.text.slice(0, 80)}…` : skip.text;
  switch (skip.kind) {
    case "don":
      return `Don skipped: ${text}`;
    case "no-number":
      return `No card number: ${text}`;
    case "no-count":
      return `No count: ${text}`;
    case "unknown":
      return `Unknown card: ${text}`;
  }
}

/**
 * Paste a list onto this deck as a new variation. Mount only while open.
 */
export function ImportVariationModal({
  deck,
  ownedQtyById,
  onClose,
  onImported,
}: {
  deck: Deck;
  ownedQtyById: Record<string, number>;
  onClose: () => void;
  onImported: (variationId: string) => void;
}) {
  const { user } = useAuth();
  const { cardsById } = useCatalog();
  const [name, setName] = useState("");
  const [paste, setPaste] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);
  const rules = useMemo(() => getConstructionRules(), []);

  const parsed = useMemo(
    () => parseDeckList(paste, cardsById, deck.leaderId),
    [paste, cardsById, deck.leaderId],
  );

  const notes = useMemo(() => {
    if (parsed.blocked || !paste.trim()) return [];
    return validateVariation(
      deck.leaderId,
      parsed.cards,
      cardsById,
      ownedQtyById,
      rules,
    ).reasons;
  }, [parsed, paste, deck.leaderId, cardsById, ownedQtyById, rules]);

  const cardCount = mainDeckCount(parsed.cards);
  const uniqueCount = Object.keys(parsed.cards).length;
  const skippedPreview = parsed.skipped.slice(0, SKIP_PREVIEW_CAP);
  const skippedRest = parsed.skipped.length - skippedPreview.length;

  const requestClose = () => {
    if (busy.current) return;
    onClose();
  };

  const handleConfirm = async () => {
    if (!user || busy.current || !name.trim() || parsed.blocked) return;
    busy.current = true;
    setSubmitting(true);
    try {
      const id = await createVariation(user.uid, deck.id, name, parsed.cards);
      toast.success("Variation imported");
      onImported(id);
      onClose();
    } catch (error) {
      busy.current = false;
      setSubmitting(false);
      toast.error(
        error instanceof Error ? error.message : "Could not import variation",
      );
    }
  };

  return (
    <Modal
      title="Import List"
      open
      onClose={requestClose}
      size="wide"
      closeOnOverlayClick={false}
      footer={
        <ModalActions
          onCancel={requestClose}
          onConfirm={() => void handleConfirm()}
          confirmLabel="Import"
          confirming={submitting}
          disabled={!name.trim() || Boolean(parsed.blocked)}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <TextInput
          label="Variation name"
          value={name}
          maxLength={VARIATION_NAME_MAX}
          placeholder="Imported"
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
        <label className="flex min-w-0 flex-col gap-1.5 text-sm">
          <span className="font-medium text-[var(--ink-primary)]">
            Paste a deck list
          </span>
          <textarea
            value={paste}
            maxLength={DECK_LIST_PASTE_MAX}
            onChange={(event) => setPaste(event.target.value)}
            rows={8}
            spellCheck={false}
            placeholder={"1xOP12-001\n4xOP01-016"}
            className="w-full min-w-0 rounded-lg border border-[var(--bg-inset)] bg-white px-3 py-2 font-mono text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-ocean)] focus:outline-none"
          />
        </label>

        {paste.trim() && parsed.blocked ? (
          <p className="text-sm text-[var(--accent-pirate-red)]" role="alert">
            {parsed.blocked}
          </p>
        ) : null}

        {paste.trim() && !parsed.blocked ? (
          <div className="flex flex-col gap-2 text-sm text-[var(--ink-primary)]">
            <p>
              {cardCount} cards, {uniqueCount} different. This adds a new
              variation. It does not replace a list you already have.
            </p>
            {notes.length > 0 ? (
              <ul className="list-disc pl-5 text-[var(--ink-muted)]">
                {notes.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[var(--ink-muted)]">Legal and owned.</p>
            )}
          </div>
        ) : null}

        {skippedPreview.length > 0 ? (
          <div className="flex flex-col gap-1 text-sm text-[var(--ink-muted)]">
            <p className="font-medium text-[var(--ink-primary)]">Left out</p>
            <ul className="list-disc pl-5">
              {skippedPreview.map((skip, index) => (
                <li key={`${skip.kind}-${skip.text}-${index}`}>{skipLabel(skip)}</li>
              ))}
            </ul>
            {skippedRest > 0 ? <p>and {skippedRest} more</p> : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
