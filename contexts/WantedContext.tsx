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
  const uid = user?.uid ?? null;
  const [wantedMap, setWantedMap] = useState<Record<string, WantedItem>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setWantedMap({});
      setError(null);
      setLoading(true);
    });

    const unsub = onSnapshot(
      userWantedRef(uid),
      (snap) => {
        if (cancelled) return;
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
        if (cancelled) return;
        setError("Could not load your Wanted board.");
        setWantedMap({});
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [uid]);

  const wantedCardCount = useMemo(
    () => Object.values(wantedMap).filter((item) => item.quantity > 0).length,
    [wantedMap],
  );

  const value = useMemo(
    () => ({
      wantedMap: uid ? wantedMap : {},
      wantedCardCount: uid ? wantedCardCount : 0,
      loading: Boolean(uid) && loading,
      error: uid ? error : null,
    }),
    [uid, wantedMap, wantedCardCount, loading, error],
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
