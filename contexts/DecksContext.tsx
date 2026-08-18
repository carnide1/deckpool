"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onSnapshot } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  deckVariationsRef,
  parseDeck,
  parseVariation,
  userDecksRef,
} from "@/lib/decks";
import type { Deck, Variation } from "@/types/deck";

type DecksContextValue = {
  decks: Deck[];
  variationsByDeckId: Record<string, Variation[]>;
  loading: boolean;
  error: string | null;
};

const DecksContext = createContext<DecksContextValue | null>(null);

export function DecksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [variationsByDeckId, setVariationsByDeckId] = useState<
    Record<string, Variation[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setDecks([]);
      setVariationsByDeckId({});
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = onSnapshot(
      userDecksRef(user.uid),
      (snap) => {
        const next = snap.docs.map((docSnap) =>
          parseDeck(docSnap.id, docSnap.data() as Record<string, unknown>),
        );
        next.sort((a, b) => a.name.localeCompare(b.name));
        setDecks(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        setError("Could not load your decks.");
        setDecks([]);
        setVariationsByDeckId({});
        setLoading(false);
      },
    );

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || decks.length === 0) {
      setVariationsByDeckId({});
      return;
    }

    setVariationsByDeckId((prev) => {
      const next: Record<string, Variation[]> = {};
      for (const deck of decks) {
        next[deck.id] = prev[deck.id] ?? [];
      }
      return next;
    });

    const unsubs = decks.map((deck) =>
      onSnapshot(
        deckVariationsRef(user.uid, deck.id),
        (snap) => {
          const variations = snap.docs.map((docSnap) =>
            parseVariation(
              docSnap.id,
              docSnap.data() as Record<string, unknown>,
            ),
          );
          variations.sort((a, b) => a.name.localeCompare(b.name));
          setVariationsByDeckId((prev) => ({
            ...prev,
            [deck.id]: variations,
          }));
        },
        (err) => console.error(err),
      ),
    );

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [user, decks]);

  const value = useMemo(
    () => ({ decks, variationsByDeckId, loading, error }),
    [decks, variationsByDeckId, loading, error],
  );

  return (
    <DecksContext.Provider value={value}>{children}</DecksContext.Provider>
  );
}

export function useDecks(): DecksContextValue {
  const ctx = useContext(DecksContext);
  if (!ctx) {
    throw new Error("useDecks must be used within DecksProvider");
  }
  return ctx;
}
