"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CardImage } from "@/components/CardImage";
import { ColorPills } from "@/components/decks/ColorPills";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { useAuth } from "@/contexts/AuthContext";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { imageForCard } from "@/lib/cardPrefs";
import { createDeck } from "@/lib/decks";
import { searchCatalog } from "@/lib/search/simpleCatalogSearch";
import type { DeckPoolCard } from "@/types/catalog";

export function CreateDeckModal({
  open,
  onClose,
  ownedLeaders,
}: {
  open: boolean;
  onClose: () => void;
  ownedLeaders: DeckPoolCard[];
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { preferredByCardId } = useCardPrefs();
  const [query, setQuery] = useState("");
  const [selectedLeaderId, setSelectedLeaderId] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredLeaders = useMemo(() => {
    if (!query.trim()) return ownedLeaders;
    const ids = new Set(
      searchCatalog(ownedLeaders, query).map((card) => card.id),
    );
    return ownedLeaders.filter((leader) => ids.has(leader.id));
  }, [ownedLeaders, query]);

  const selectedLeader =
    ownedLeaders.find((leader) => leader.id === selectedLeaderId) ?? null;

  const reset = () => {
    setQuery("");
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
          Pick a Leader you own. You can add unowned cards to the 50 later in
          Edit.
        </p>

        {ownedLeaders.length === 0 ? (
          <div className="poster-panel p-4 text-sm text-[var(--ink-muted)]">
            You do not own any Leaders yet. Add Leaders on Cards or add a
            starter deck there first.
          </div>
        ) : (
          <>
            <TextInput
              label="Search owned Leaders"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or id — e.g. Luffy"
            />

            <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
              {filteredLeaders.map((leader) => {
                const selected = leader.id === selectedLeaderId;
                const image = imageForCard(leader, preferredByCardId);
                return (
                  <button
                    key={leader.id}
                    type="button"
                    onClick={() => {
                      setSelectedLeaderId(leader.id);
                      if (!name.trim()) setName(leader.name);
                    }}
                    className={[
                      "rounded-xl border-2 p-2 text-left transition-colors",
                      selected
                        ? "border-[var(--accent-pirate-red)] bg-[var(--bg-inset)]"
                        : "border-[var(--bg-inset)] hover:border-[var(--accent-ocean)]",
                    ].join(" ")}
                  >
                    {image ? (
                      <CardImage
                        src={image}
                        alt={leader.name}
                        width={96}
                        height={134}
                        className="mx-auto"
                      />
                    ) : null}
                    <p className="mt-2 truncate text-xs font-semibold text-[var(--ink-primary)]">
                      {leader.name}
                    </p>
                    <p className="truncate text-[0.625rem] text-[var(--ink-muted)]">
                      {leader.id}
                    </p>
                    <div className="mt-1">
                      <ColorPills colors={leader.colors} />
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredLeaders.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)]">
                No owned Leaders match that search.
              </p>
            ) : null}

            <TextInput
              label="Deck name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={selectedLeader?.name ?? "My deck"}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
