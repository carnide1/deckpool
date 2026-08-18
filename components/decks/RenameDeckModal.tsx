"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { useAuth } from "@/contexts/AuthContext";
import { renameDeck } from "@/lib/decks";
import type { Deck } from "@/types/deck";

export function RenameDeckModal({
  deck,
  open,
  onClose,
}: {
  deck: Deck | null;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && deck) setName(deck.name);
  }, [open, deck]);

  const handleConfirm = async () => {
    if (!user || !deck) return;
    setSubmitting(true);
    try {
      await renameDeck(user.uid, deck.id, name);
      toast.success("Deck renamed");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not rename deck",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Rename deck"
      open={open}
      onClose={onClose}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void handleConfirm()}
          confirmLabel="Save name"
          confirming={submitting}
          disabled={!name.trim()}
        />
      }
    >
      <TextInput
        label="Deck name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
      />
    </Modal>
  );
}
