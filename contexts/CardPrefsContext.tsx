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
  const [preferredByCardId, setPreferredByCardId] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setPreferredByCardId({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(
      userCardPrefsRef(user.uid),
      (snap) => {
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
        setPreferredByCardId({});
        setLoading(false);
      },
    );

    return () => unsub();
  }, [user]);

  const value = useMemo(
    () => ({ preferredByCardId, loading }),
    [preferredByCardId, loading],
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
