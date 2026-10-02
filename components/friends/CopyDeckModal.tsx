"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { useAuth } from "@/contexts/AuthContext";
import { createDeckWithVariations } from "@/lib/decks";
import type { Deck, Variation } from "@/types/deck";

type CopyScope = "this" | "all";

/**
 * Copies a friend's deck into your own decks. Mount only while open so the
 * form starts fresh each time.
 */
export function CopyDeckModal({
  deck,
  variations,
  activeVariation,
  onClose,
}: {
  deck: Deck;
  /** Favorite first (the order the deck view shows). */
  variations: Variation[];
  activeVariation: Variation | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(deck.name);
  const [scope, setScope] = useState<CopyScope>("this");
  const [submitting, setSubmitting] = useState(false);

  const canCopyThis = activeVariation !== null;
  const effectiveScope: CopyScope = canCopyThis ? scope : "all";

  const handleConfirm = async () => {
    if (!user) return;
    const rows =
      effectiveScope === "this" && activeVariation
        ? [{ name: "Main", cards: activeVariation.cards }]
        : variations.map((row) => ({ name: row.name, cards: row.cards }));
    setSubmitting(true);
    try {
      const deckId = await createDeckWithVariations(
        user.uid,
        name,
        deck.leaderId,
        rows,
      );
      toast.success("Deck copied to your decks");
      onClose();
      router.push(`/decks/${deckId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not copy deck",
      );
      setSubmitting(false);
    }
  };

  const option = (value: CopyScope, label: string, hint: string) => (
    <label
      className={[
        "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2",
        effectiveScope === value
          ? "border-[var(--accent-ocean)] bg-[var(--bg-inset)]"
          : "border-[var(--bg-inset)]",
        value === "this" && !canCopyThis ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
    >
      <input
        type="radio"
        name="copy-scope"
        value={value}
        checked={effectiveScope === value}
        disabled={value === "this" && !canCopyThis}
        onChange={() => setScope(value)}
        className="mt-1"
      />
      <span>
        <span className="block text-sm font-semibold text-[var(--ink-primary)]">
          {label}
        </span>
        <span className="block text-xs text-[var(--ink-muted)]">{hint}</span>
      </span>
    </label>
  );

  return (
    <Modal
      title="Copy to my decks"
      open
      onClose={onClose}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void handleConfirm()}
          confirmLabel="Copy deck"
          confirming={submitting}
          disabled={!name.trim() || variations.length === 0}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <TextInput
          label="Deck name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-[var(--ink-primary)]">
            What to copy
          </legend>
          {option(
            "this",
            "This variation",
            activeVariation
              ? `Only “${activeVariation.name}”, saved as Main.`
              : "No variation selected.",
          )}
          {option(
            "all",
            "All variations",
            `${variations.length} ${
              variations.length === 1 ? "variation" : "variations"
            }, names kept, their favorite first.`,
          )}
        </fieldset>
        <p className="text-xs text-[var(--ink-muted)]">
          The copy is yours to edit. You don&apos;t need to own the Leader.
        </p>
      </div>
    </Modal>
  );
}
