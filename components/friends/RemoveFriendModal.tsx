"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useFriends } from "@/contexts/FriendsContext";
import type { PublicProfile } from "@/types/friends";

export function RemoveFriendModal({
  friend,
  open,
  onClose,
}: {
  friend: PublicProfile | null;
  open: boolean;
  onClose: () => void;
}) {
  const { remove } = useFriends();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!friend) return;
    setSubmitting(true);
    try {
      await remove(friend.uid);
      toast.success(`Removed @${friend.username}`);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not remove friend",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Remove friend"
      open={open}
      onClose={onClose}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void handleConfirm()}
          confirmLabel="Remove"
          confirming={submitting}
        />
      }
    >
      <p className="text-sm text-[var(--ink-primary)]">
        Remove <span className="font-semibold">@{friend?.username}</span>? You
        will stop seeing each other&apos;s decks, collection, and Wanted. Decks
        you already copied stay yours.
      </p>
    </Modal>
  );
}
