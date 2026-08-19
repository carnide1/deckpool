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
import { parseWantedItem, userWantedRef } from "@/lib/wanted";
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
  const [wantedMap, setWantedMap] = useState<Record<string, WantedItem>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setWantedMap({});
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = onSnapshot(
      userWantedRef(user.uid),
      (snap) => {
        const next: Record<string, WantedItem> = {};
        for (const docSnap of snap.docs) {
          const item = parseWantedItem(
            docSnap.id,
            docSnap.data() as Record<string, unknown>,
          );
          if (item.quantity > 0) next[docSnap.id] = item;
        }
        setWantedMap(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        setError("Could not load your Wanted board.");
        setWantedMap({});
        setLoading(false);
      },
    );

    return () => unsub();
  }, [user]);

  const wantedCardCount = useMemo(
    () => Object.values(wantedMap).filter((item) => item.quantity > 0).length,
    [wantedMap],
  );

  const value = useMemo(
    () => ({ wantedMap, wantedCardCount, loading, error }),
    [wantedMap, wantedCardCount, loading, error],
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
