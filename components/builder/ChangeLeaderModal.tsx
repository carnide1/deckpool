"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { LeaderPicker } from "@/components/decks/LeaderPicker";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { changeDeckLeader } from "@/lib/decks";
import type { DeckPoolCard } from "@/types/catalog";

const LEADER_CHANGE_WARNING =
  "Cards that do not match the new Leader's colors or construction rules will be removed from every variation.";

export function ChangeLeaderModal({
  open,
  onClose,
  deckId,
  currentLeaderId,
  leaders,
  ownedIds,
  cardsById,
}: {
  open: boolean;
  onClose: () => void;
  deckId: string;
  currentLeaderId: string;
  leaders: DeckPoolCard[];
  ownedIds: ReadonlySet<string>;
  cardsById: Map<string, DeckPoolCard>;
}) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [ownedOnly, setOwnedOnly] = useState(true);
  const [selectedLeaderId, setSelectedLeaderId] = useState(currentLeaderId);
  const [submitting, setSubmitting] = useState(false);
  const [seen, setSeen] = useState({ open, leaderId: currentLeaderId });

  if (seen.open !== open || seen.leaderId !== currentLeaderId) {
    setSeen({ open, leaderId: currentLeaderId });
    if (open) {
      setQuery("");
      setOwnedOnly(true);
      setSelectedLeaderId(currentLeaderId);
    }
  }

  const handleConfirm = async () => {
    if (!user || !selectedLeaderId || selectedLeaderId === currentLeaderId) {
      return;
    }
    setSubmitting(true);
    try {
      await changeDeckLeader(user.uid, deckId, selectedLeaderId, cardsById);
      toast.success("Leader changed");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not change Leader",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Change Leader"
      open={open}
      onClose={onClose}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void handleConfirm()}
          confirmLabel="Change Leader"
          confirming={submitting}
          disabled={!selectedLeaderId || selectedLeaderId === currentLeaderId}
        />
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--ink-muted)]">{LEADER_CHANGE_WARNING}</p>

        <LeaderPicker
          leaders={leaders}
          ownedIds={ownedIds}
          excludeId={currentLeaderId}
          selectedId={selectedLeaderId}
          onSelect={(leader) => setSelectedLeaderId(leader.id)}
          query={query}
          onQueryChange={setQuery}
          ownedOnly={ownedOnly}
          onOwnedOnlyChange={setOwnedOnly}
          emptyOwnedMessage="You do not own another Leader. Turn Owned off to pick any Leader."
        />
      </div>
    </Modal>
  );
}
