"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerRivals } from "@/hooks/useOwnerRivals";
import type { RivalJournal } from "@/types/rival";

type RivalsContextValue = {
  rivalsByLeaderId: Record<string, RivalJournal>;
  rivals: RivalJournal[];
  loading: boolean;
  error: string | null;
};

const RivalsContext = createContext<RivalsContextValue | null>(null);

export function RivalsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { rivalsByLeaderId, rivals, loading, failed } = useOwnerRivals(
    user?.uid ?? null,
  );

  const value = useMemo(
    () => ({
      rivalsByLeaderId,
      rivals,
      loading,
      error: failed ? "Could not load your Rivals journal." : null,
    }),
    [rivalsByLeaderId, rivals, loading, failed],
  );

  return (
    <RivalsContext.Provider value={value}>{children}</RivalsContext.Provider>
  );
}

export function useRivals(): RivalsContextValue {
  const ctx = useContext(RivalsContext);
  if (!ctx) {
    throw new Error("useRivals must be used within RivalsProvider");
  }
  return ctx;
}
