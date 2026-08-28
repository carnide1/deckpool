"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onSnapshot } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  deckVariationsRef,
  parseDeck,
  parseVariation,
  userDecksRef,
} from "@/lib/decks";
import { orderVariations } from "@/lib/variations";
import type { Deck, Variation } from "@/types/deck";

type DecksContextValue = {
  decks: Deck[];
  variationsByDeckId: Record<string, Variation[]>;
  loading: boolean;
  error: string | null;
};

const DecksContext = createContext<DecksContextValue | null>(null);

export function DecksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [decks, setDecks] = useState<Deck[]>([]);
  const [variationsByDeckId, setVariationsByDeckId] = useState<
    Record<string, Variation[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  const favoritesRef = useRef<Record<string, string | undefined>>({});
  useEffect(() => {
    favoritesRef.current = Object.fromEntries(
      decks.map((deck) => [deck.id, deck.favoriteVariationId]),
    );
  }, [decks]);

  const deckIdsKey = useMemo(
    () =>
      [...decks.map((deck) => deck.id)]
        .sort((a, b) => a.localeCompare(b))
        .join("\0"),
    [decks],
  );

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setDecks([]);
      setVariationsByDeckId({});
      setError(null);
      setLoading(true);
    });

    const unsub = onSnapshot(
      userDecksRef(uid),
      (snap) => {
        if (cancelled) return;
        const next = snap.docs.map((docSnap) =>
          parseDeck(docSnap.id, docSnap.data() as Record<string, unknown>),
        );
        next.sort((a, b) => a.name.localeCompare(b.name));
        setDecks(next);
        setLoadedUid(uid);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        if (cancelled) return;
        setError("Could not load your decks.");
        setDecks([]);
        setVariationsByDeckId({});
        setLoadedUid(uid);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [uid]);

  useEffect(() => {
    if (!uid || !deckIdsKey) {
      queueMicrotask(() => setVariationsByDeckId({}));
      return;
    }

    const deckIds = deckIdsKey.split("\0");
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setVariationsByDeckId((prev) => {
        const next: Record<string, Variation[]> = {};
        for (const deckId of deckIds) {
          next[deckId] = orderVariations(
            prev[deckId] ?? [],
            favoritesRef.current[deckId],
          );
        }
        return next;
      });
    });

    const unsubs = deckIds.map((deckId) =>
      onSnapshot(
        deckVariationsRef(uid, deckId),
        (snap) => {
          if (cancelled) return;
          const variations = snap.docs.map((docSnap) =>
            parseVariation(
              docSnap.id,
              docSnap.data() as Record<string, unknown>,
            ),
          );
          setVariationsByDeckId((prev) => ({
            ...prev,
            [deckId]: orderVariations(
              variations,
              favoritesRef.current[deckId],
            ),
          }));
        },
        (err) => {
          console.error(err);
          if (cancelled) return;
          setError("Could not load deck variations.");
        },
      ),
    );

    return () => {
      cancelled = true;
      for (const unsub of unsubs) unsub();
    };
  }, [uid, deckIdsKey]);

  // Re-order tabs when the favorite pin changes without tearing down listeners.
  useEffect(() => {
    if (!uid || decks.length === 0) return;
    queueMicrotask(() => {
      setVariationsByDeckId((prev) => {
        let changed = false;
        const next: Record<string, Variation[]> = { ...prev };
        for (const deck of decks) {
          const rows = prev[deck.id];
          if (!rows) continue;
          const ordered = orderVariations(rows, deck.favoriteVariationId);
          const same =
            ordered.length === rows.length &&
            ordered.every((row, index) => row.id === rows[index]?.id);
          if (!same) {
            next[deck.id] = ordered;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    });
  }, [uid, decks]);

  const hasCurrentUserData = Boolean(uid && loadedUid === uid);
  const value = useMemo(
    () => ({
      decks: hasCurrentUserData ? decks : [],
      variationsByDeckId: hasCurrentUserData ? variationsByDeckId : {},
      loading: Boolean(uid) && !hasCurrentUserData ? true : loading,
      error: hasCurrentUserData ? error : null,
    }),
    [
      uid,
      hasCurrentUserData,
      decks,
      variationsByDeckId,
      loading,
      error,
    ],
  );

  return (
    <DecksContext.Provider value={value}>{children}</DecksContext.Provider>
  );
}

export function useDecks(): DecksContextValue {
  const ctx = useContext(DecksContext);
  if (!ctx) {
    throw new Error("useDecks must be used within DecksProvider");
  }
  return ctx;
}
