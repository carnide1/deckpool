"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { useAuth } from "@/contexts/AuthContext";
import { cloneVariation, renameVariation, deleteVariation } from "@/lib/decks";
import type { Variation } from "@/types/deck";

export function CloneVariationModal({
  variation,
  deckId,
  open,
  onClose,
  onCreated,
}: {
  variation: Variation | null;
  deckId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (variationId: string) => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && variation) setName(`${variation.name} copy`);
  }, [open, variation]);

  const handleConfirm = async () => {
    if (!user || !variation) return;
    setSubmitting(true);
    try {
      const id = await cloneVariation(user.uid, deckId, variation, name);
      toast.success("Variation cloned");
      onCreated(id);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not clone variation",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Clone variation"
      open={open}
      onClose={onClose}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void handleConfirm()}
          confirmLabel="Clone"
          confirming={submitting}
          disabled={!name.trim()}
        />
      }
    >
      <TextInput
        label="New variation name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
      />
    </Modal>
  );
}

export function RenameVariationModal({
  variation,
  deckId,
  open,
  onClose,
}: {
  variation: Variation | null;
  deckId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && variation) setName(variation.name);
  }, [open, variation]);

  const handleConfirm = async () => {
    if (!user || !variation) return;
    setSubmitting(true);
    try {
      await renameVariation(user.uid, deckId, variation.id, name);
      toast.success("Variation renamed");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not rename variation",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Rename variation"
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
        label="Variation name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
      />
    </Modal>
  );
}

export function DeleteVariationModal({
  variation,
  deckId,
  open,
  onClose,
  onDeleted,
  nextFavoriteId,
}: {
  variation: Variation | null;
  deckId: string;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
  nextFavoriteId?: string | null;
}) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!user || !variation) return;
    setSubmitting(true);
    try {
      await deleteVariation(
        user.uid,
        deckId,
        variation.id,
        nextFavoriteId ?? undefined,
      );
      toast.success("Variation deleted");
      onDeleted();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete variation",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Delete variation"
      open={open}
      onClose={onClose}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void handleConfirm()}
          confirmLabel="Delete variation"
          confirming={submitting}
        />
      }
    >
      <p className="text-sm text-[var(--ink-primary)]">
        Delete <span className="font-semibold">{variation?.name}</span>? This
        cannot be undone.
      </p>
    </Modal>
  );
}
