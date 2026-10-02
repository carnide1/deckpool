"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerWanted } from "@/hooks/useOwnerWanted";
import type { WantedItem } from "@/types/wanted";

type WantedContextValue = {
  wantedMap: Record<string, WantedItem>;
  wantedCardCount: number;
  loading: boolean;
  error: string | null;
};

const WantedContext = createContext<WantedContextValue | null>(null);

export function WantedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { wantedMap, wantedCardCount, loading, failed } = useOwnerWanted(
    user?.uid ?? null,
  );

  const value = useMemo(
    () => ({
      wantedMap,
      wantedCardCount,
      loading,
      error: failed ? "Could not load your Wanted board." : null,
    }),
    [wantedMap, wantedCardCount, loading, failed],
  );

  return (
    <WantedContext.Provider value={value}>{children}</WantedContext.Provider>
  );
}

export function useWanted(): WantedContextValue {
  const ctx = useContext(WantedContext);
  if (!ctx) {
    throw new Error("useWanted must be used within WantedProvider");
  }
  return ctx;
}
