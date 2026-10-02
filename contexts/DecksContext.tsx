"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerDecks } from "@/hooks/useOwnerDecks";
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
  const { decks, variationsByDeckId, loading, failed } = useOwnerDecks(
    user?.uid ?? null,
  );

  const value = useMemo(
    () => ({
      decks,
      variationsByDeckId,
      loading,
      error:
        failed === "decks"
          ? "Could not load your decks."
          : failed === "variations"
            ? "Could not load deck variations."
            : null,
    }),
    [decks, variationsByDeckId, loading, failed],
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
