"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerCardPrefs } from "@/hooks/useOwnerCardPrefs";

type CardPrefsContextValue = {
  preferredByCardId: Record<string, string>;
  loading: boolean;
};

const CardPrefsContext = createContext<CardPrefsContextValue | null>(null);

export function CardPrefsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const value = useOwnerCardPrefs(user?.uid ?? null);

  return (
    <CardPrefsContext.Provider value={value}>
      {children}
    </CardPrefsContext.Provider>
  );
}

export function useCardPrefs(): CardPrefsContextValue {
  const ctx = useContext(CardPrefsContext);
  if (!ctx) {
    throw new Error("useCardPrefs must be used within CardPrefsProvider");
  }
  return ctx;
}
