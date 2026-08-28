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
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

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
        setLoadedUid(uid);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        if (cancelled) return;
        setError("Could not load your Wanted board.");
        setWantedMap({});
        setLoadedUid(uid);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [uid]);

  const hasCurrentUserData = Boolean(uid && loadedUid === uid);
  const wantedCardCount = useMemo(
    () =>
      hasCurrentUserData
        ? Object.values(wantedMap).filter((item) => item.quantity > 0).length
        : 0,
    [hasCurrentUserData, wantedMap],
  );

  const value = useMemo(
    () => ({
      wantedMap: hasCurrentUserData ? wantedMap : {},
      wantedCardCount: hasCurrentUserData ? wantedCardCount : 0,
      loading: Boolean(uid) && !hasCurrentUserData ? true : loading,
      error: hasCurrentUserData ? error : null,
    }),
    [
      uid,
      hasCurrentUserData,
      wantedMap,
      wantedCardCount,
      loading,
      error,
    ],
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
