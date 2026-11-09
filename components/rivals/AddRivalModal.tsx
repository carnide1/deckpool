"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LeaderPicker } from "@/components/decks/LeaderPicker";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCollection } from "@/contexts/CollectionContext";
import { ensureRivalJournal } from "@/lib/rivals";

export function AddRivalModal({
  open,
  onClose,
  existingLeaderIds,
}: {
  open: boolean;
  onClose: () => void;
  existingLeaderIds: ReadonlySet<string>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { cards } = useCatalog();
  const { ownedMap } = useCollection();
  const [query, setQuery] = useState("");
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [selectedLeaderId, setSelectedLeaderId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const leaders = useMemo(
    () =>
      cards
        .filter((card) => card.category === "Leader")
        .filter((card) => !existingLeaderIds.has(card.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [cards, existingLeaderIds],
  );

  const ownedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const leader of leaders) {
      if ((ownedMap[leader.id]?.quantity ?? 0) > 0) ids.add(leader.id);
    }
    return ids;
  }, [leaders, ownedMap]);

  const reset = () => {
    setQuery("");
    setOwnedOnly(false);
    setSelectedLeaderId("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = async () => {
    if (!user || !selectedLeaderId) return;
    setSubmitting(true);
    try {
      await ensureRivalJournal(user.uid, selectedLeaderId);
      handleClose();
      router.push(`/decks/rivals/${encodeURIComponent(selectedLeaderId)}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not open rival",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add rival"
      size="wide"
      footer={
        <ModalActions
          onCancel={handleClose}
          onConfirm={() => void handleConfirm()}
          confirmLabel="Open journal"
          confirming={submitting}
          disabled={!selectedLeaderId}
        />
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--ink-muted)]">
          Pick an opponent Leader to start a matchup journal.
        </p>
        <LeaderPicker
          leaders={leaders}
          ownedIds={ownedIds}
          selectedId={selectedLeaderId}
          onSelect={(leader) => setSelectedLeaderId(leader.id)}
          query={query}
          onQueryChange={setQuery}
          ownedOnly={ownedOnly}
          onOwnedOnlyChange={setOwnedOnly}
          emptyOwnedMessage="No owned Leaders left to add. Turn Owned off to pick any Leader."
        />
      </div>
    </Modal>
  );
}
