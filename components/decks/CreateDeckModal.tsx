"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LeaderPicker } from "@/components/decks/LeaderPicker";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { useAuth } from "@/contexts/AuthContext";
import { createDeck } from "@/lib/decks";
import type { DeckPoolCard } from "@/types/catalog";

export function CreateDeckModal({
  open,
  onClose,
  leaders,
  ownedIds,
}: {
  open: boolean;
  onClose: () => void;
  leaders: DeckPoolCard[];
  ownedIds: ReadonlySet<string>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [ownedOnly, setOwnedOnly] = useState(true);
  const [selectedLeaderId, setSelectedLeaderId] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedLeader =
    leaders.find((leader) => leader.id === selectedLeaderId) ?? null;

  const reset = () => {
    setQuery("");
    setOwnedOnly(true);
    setSelectedLeaderId("");
    setName("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = async () => {
    if (!user || !selectedLeaderId) return;
    setSubmitting(true);
    try {
      const deckId = await createDeck(
        user.uid,
        name.trim() || selectedLeader?.name || "New deck",
        selectedLeaderId,
      );
      toast.success("Deck created");
      handleClose();
      router.push(`/decks/${deckId}?mode=edit`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create deck",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="New deck"
      open={open}
      onClose={handleClose}
      footer={
        <ModalActions
          onCancel={handleClose}
          onConfirm={() => void handleConfirm()}
          confirmLabel="Create deck"
          confirming={submitting}
          disabled={!selectedLeaderId}
        />
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--ink-muted)]">
          Pick a Leader. Owned starts on. You can add unowned cards to the 50
          later in Edit.
        </p>

        <LeaderPicker
          leaders={leaders}
          ownedIds={ownedIds}
          selectedId={selectedLeaderId}
          onSelect={(leader) => {
            setSelectedLeaderId(leader.id);
            if (!name.trim()) setName(leader.name);
          }}
          query={query}
          onQueryChange={setQuery}
          ownedOnly={ownedOnly}
          onOwnedOnlyChange={setOwnedOnly}
          emptyOwnedMessage="You do not own any Leaders yet. Add Leaders on Explore, or turn Owned off."
        />

        <TextInput
          label="Deck name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={selectedLeader?.name ?? "My deck"}
        />
      </div>
    </Modal>
  );
}
