"use client";

import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DeckModeToggle } from "@/components/builder/DeckModeToggle";
import { DeckViewBody } from "@/components/builder/DeckViewBody";
import { ShareLinkButton } from "@/components/share/ShareLinkButton";
import { useAuth } from "@/contexts/AuthContext";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { useCollection } from "@/contexts/CollectionContext";
import { useWanted } from "@/contexts/WantedContext";
import { useWantedWrite } from "@/hooks/useWantedWrite";
import { useDecks } from "@/contexts/DecksContext";
import { setFavoriteVariation } from "@/lib/decks";
import type { Deck, Variation } from "@/types/deck";

export function DeckView({ deck }: { deck: Deck }) {
  const { user } = useAuth();
  const { ownedMap } = useCollection();
  const { wantedMap } = useWanted();
  const { preferredByCardId } = useCardPrefs();
  const { variationsByDeckId } = useDecks();
  const { saving: wantedSaving, togglePosted, adjustQuantity: adjustWanted } =
    useWantedWrite();
  const [activeVariation, setActiveVariation] = useState<Variation | null>(
    null,
  );

  const variations = useMemo(
    () => variationsByDeckId[deck.id] ?? [],
    [deck.id, variationsByDeckId],
  );

  const ownedQtyById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [cardId, item] of Object.entries(ownedMap)) {
      map[cardId] = item.quantity;
    }
    return map;
  }, [ownedMap]);

  const wantedQtyById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [cardId, item] of Object.entries(wantedMap)) {
      map[cardId] = item.quantity;
    }
    return map;
  }, [wantedMap]);

  const handleSetFavorite = useCallback(
    (variationId: string) => {
      if (!user || variationId === deck.favoriteVariationId) return;
      void setFavoriteVariation(user.uid, deck.id, variationId).catch(
        (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not set the main variation",
          );
        },
      );
    },
    [user, deck.id, deck.favoriteVariationId],
  );

  return (
    <DeckViewBody
      deck={deck}
      variations={variations}
      preferredImages={preferredByCardId}
      backHref="/decks"
      backLabel="Back to decks"
      onActiveVariationChange={setActiveVariation}
      headerActions={
        <>
          {user ? (
            <ShareLinkButton
              uid={user.uid}
              deck={deck}
              variation={activeVariation}
              preferredImages={preferredByCardId}
            />
          ) : null}
          <DeckModeToggle
            deckId={deck.id}
            mode="view"
            variationId={activeVariation?.id}
          />
        </>
      }
      ownedQtyById={ownedQtyById}
      onSetFavorite={handleSetFavorite}
      wanted={{
        wantedQtyById,
        onToggle: (card) => void togglePosted(card.id),
        onDelta: (card, delta) => void adjustWanted(card.id, delta),
        saving: wantedSaving,
      }}
    />
  );
}
