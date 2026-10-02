"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import {
  deckVariationsRef,
  parseDeck,
  parseVariation,
  userDecksRef,
} from "@/lib/decks";
import { isPermissionDenied } from "@/lib/firestoreErrors";
import { orderVariations } from "@/lib/variations";
import type { Deck, Variation } from "@/types/deck";

export type OwnerDecks = {
  decks: Deck[];
  variationsByDeckId: Record<string, Variation[]>;
  loading: boolean;
  /** "decks" when the deck list failed, "variations" when a variation listener failed. */
  failed: "decks" | "variations" | null;
  denied: boolean;
};

/** Live users/{ownerUid}/decks + each deck's variations. `enabled: false` subscribes to nothing. */
export function useOwnerDecks(
  ownerUid: string | null,
  { enabled = true }: { enabled?: boolean } = {},
): OwnerDecks {
  const uid = enabled ? ownerUid : null;
  const [decks, setDecks] = useState<Deck[]>([]);
  const [variationsByDeckId, setVariationsByDeckId] = useState<
    Record<string, Variation[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState<"decks" | "variations" | null>(null);
  const [denied, setDenied] = useState(false);
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
    if (!uid) {
      queueMicrotask(() => setLoadedUid(null));
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setDecks([]);
      setVariationsByDeckId({});
      setFailed(null);
      setDenied(false);
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
        setFailed(null);
        setDenied(false);
      },
      (err) => {
        console.error(err);
        if (cancelled) return;
        setFailed("decks");
        setDenied(isPermissionDenied(err));
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
          setFailed("variations");
          if (isPermissionDenied(err)) setDenied(true);
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
  return useMemo(
    () => ({
      decks: hasCurrentUserData ? decks : [],
      variationsByDeckId: hasCurrentUserData ? variationsByDeckId : {},
      loading: Boolean(uid) && !hasCurrentUserData ? true : loading,
      failed: hasCurrentUserData ? failed : null,
      denied: hasCurrentUserData ? denied : false,
    }),
    [
      uid,
      hasCurrentUserData,
      decks,
      variationsByDeckId,
      loading,
      failed,
      denied,
    ],
  );
}
