"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CardImage } from "@/components/CardImage";
import { ColorPills } from "@/components/decks/ColorPills";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { useAuth } from "@/contexts/AuthContext";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { imageCandidates } from "@/lib/cardPrefs";
import { changeDeckLeader } from "@/lib/decks";
import { searchCatalog } from "@/lib/search/simpleCatalogSearch";
import type { DeckPoolCard } from "@/types/catalog";

const LEADER_CHANGE_WARNING =
  "Cards that do not match the new Leader's colors or construction rules will be removed from every variation.";

export function ChangeLeaderModal({
  open,
  onClose,
  deckId,
  currentLeaderId,
  ownedLeaders,
  cardsById,
}: {
  open: boolean;
  onClose: () => void;
  deckId: string;
  currentLeaderId: string;
  ownedLeaders: DeckPoolCard[];
  cardsById: Map<string, DeckPoolCard>;
}) {
  const { user } = useAuth();
  const { preferredByCardId } = useCardPrefs();
  const [query, setQuery] = useState("");
  const [selectedLeaderId, setSelectedLeaderId] = useState(currentLeaderId);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setSelectedLeaderId(currentLeaderId);
  }, [open, currentLeaderId]);

  const filteredLeaders = useMemo(() => {
    const candidates = ownedLeaders.filter((leader) => leader.id !== currentLeaderId);
    if (!query.trim()) return candidates;
    const ids = new Set(
      searchCatalog(candidates, query).map((card) => card.id),
    );
    return candidates.filter((leader) => ids.has(leader.id));
  }, [ownedLeaders, currentLeaderId, query]);

  const handleConfirm = async () => {
    if (!user || !selectedLeaderId || selectedLeaderId === currentLeaderId) return;
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
          disabled={
            !selectedLeaderId || selectedLeaderId === currentLeaderId
          }
        />
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--ink-muted)]">{LEADER_CHANGE_WARNING}</p>

        {ownedLeaders.filter((leader) => leader.id !== currentLeaderId).length ===
        0 ? (
          <p className="text-sm text-[var(--ink-muted)]">
            You do not own another Leader to switch to.
          </p>
        ) : (
          <>
            <TextInput
              label="Search owned Leaders"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or id"
            />
            <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
              {filteredLeaders.map((leader) => {
                const selected = leader.id === selectedLeaderId;
                const [image, ...fallbacks] = imageCandidates(
                  leader,
                  preferredByCardId,
                );
                return (
                  <div
                    key={leader.id}
                    onClick={() => setSelectedLeaderId(leader.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedLeaderId(leader.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={[
                      "rounded-xl border-2 p-2 text-left",
                      selected
                        ? "border-[var(--accent-pirate-red)] bg-[var(--bg-inset)]"
                        : "border-[var(--bg-inset)] hover:border-[var(--accent-ocean)]",
                    ].join(" ")}
                  >
                    {image ? (
                      <CardImage
                        src={image}
                        fallbackSrcs={fallbacks}
                        alt={leader.name}
                        width={88}
                        height={122}
                        className="mx-auto"
                      />
                    ) : null}
                    <p className="mt-2 truncate text-xs font-semibold">
                      {leader.name}
                    </p>
                    <div className="mt-1">
                      <ColorPills colors={leader.colors} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
