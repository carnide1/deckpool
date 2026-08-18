"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { deleteDeck } from "@/lib/decks";
import type { Deck } from "@/types/deck";

export function DeleteDeckModal({
  deck,
  open,
  onClose,
}: {
  deck: Deck | null;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!user || !deck) return;
    setSubmitting(true);
    try {
      await deleteDeck(user.uid, deck.id);
      toast.success("Deck deleted");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete deck",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Delete deck"
      open={open}
      onClose={onClose}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void handleConfirm()}
          confirmLabel="Delete deck"
          confirming={submitting}
        />
      }
    >
      <p className="text-sm text-[var(--ink-primary)]">
        Delete <span className="font-semibold">{deck?.name}</span>? This removes
        the deck and all of its variations. This cannot be undone.
      </p>
    </Modal>
  );
}
