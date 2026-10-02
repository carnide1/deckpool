"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerCollection } from "@/hooks/useOwnerCollection";
import type { CollectionItem } from "@/types/collection";

type CollectionContextValue = {
  ownedMap: Record<string, CollectionItem>;
  allLabels: string[];
  ownedCardCount: number;
  loading: boolean;
  error: string | null;
};

const CollectionContext = createContext<CollectionContextValue | null>(null);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { ownedMap, allLabels, ownedCardCount, loading, failed } =
    useOwnerCollection(user?.uid ?? null);

  const value = useMemo(
    () => ({
      ownedMap,
      allLabels,
      ownedCardCount,
      loading,
      error: failed ? "Could not load your collection." : null,
    }),
    [ownedMap, allLabels, ownedCardCount, loading, failed],
  );

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection(): CollectionContextValue {
  const ctx = useContext(CollectionContext);
  if (!ctx) {
    throw new Error("useCollection must be used within CollectionProvider");
  }
  return ctx;
}
