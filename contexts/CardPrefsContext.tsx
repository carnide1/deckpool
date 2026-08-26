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
import { userCardPrefsRef } from "@/lib/cardPrefs";

type CardPrefsContextValue = {
  preferredByCardId: Record<string, string>;
  loading: boolean;
};

const CardPrefsContext = createContext<CardPrefsContextValue | null>(null);

export function CardPrefsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [preferredByCardId, setPreferredByCardId] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setPreferredByCardId({});
      setLoading(true);
    });

    const unsub = onSnapshot(
      userCardPrefsRef(uid),
      (snap) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const docSnap of snap.docs) {
          const url = docSnap.data().preferredImageUrl;
          if (typeof url === "string" && url) next[docSnap.id] = url;
        }
        setPreferredByCardId(next);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        if (cancelled) return;
        setPreferredByCardId({});
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [uid]);

  const value = useMemo(
    () => ({
      preferredByCardId: uid ? preferredByCardId : {},
      loading: Boolean(uid) && loading,
    }),
    [uid, preferredByCardId, loading],
  );

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
