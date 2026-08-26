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
import { parseCollectionItem, userCollectionRef } from "@/lib/collection";
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
  const uid = user?.uid ?? null;
  const [ownedMap, setOwnedMap] = useState<Record<string, CollectionItem>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setOwnedMap({});
      setError(null);
      setLoading(true);
    });

    const unsub = onSnapshot(
      userCollectionRef(uid),
      (snap) => {
        if (cancelled) return;
        const next: Record<string, CollectionItem> = {};
        for (const docSnap of snap.docs) {
          next[docSnap.id] = parseCollectionItem(
            docSnap.id,
            docSnap.data() as Record<string, unknown>,
          );
        }
        setOwnedMap(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        if (cancelled) return;
        setError("Could not load your collection.");
        setOwnedMap({});
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [uid]);

  const allLabels = useMemo(() => {
    const labels = new Set<string>();
    for (const item of Object.values(ownedMap)) {
      for (const label of item.labels) {
        const trimmed = label.trim();
        if (trimmed) labels.add(trimmed);
      }
    }
    return [...labels].sort((a, b) => a.localeCompare(b));
  }, [ownedMap]);

  const ownedCardCount = useMemo(
    () =>
      Object.values(ownedMap).filter((item) => item.quantity > 0).length,
    [ownedMap],
  );

  const value = useMemo(
    () => ({
      ownedMap: uid ? ownedMap : {},
      allLabels: uid ? allLabels : [],
      ownedCardCount: uid ? ownedCardCount : 0,
      loading: Boolean(uid) && loading,
      error: uid ? error : null,
    }),
    [uid, ownedMap, allLabels, ownedCardCount, loading, error],
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
