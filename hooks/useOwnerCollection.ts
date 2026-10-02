"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { parseCollectionItem, userCollectionRef } from "@/lib/collection";
import { isPermissionDenied } from "@/lib/firestoreErrors";
import type { CollectionItem } from "@/types/collection";

export type OwnerCollection = {
  ownedMap: Record<string, CollectionItem>;
  allLabels: string[];
  ownedCardCount: number;
  loading: boolean;
  /** Listener failed (any reason). */
  failed: boolean;
  /** Listener failed because rules refused (privacy off / not friends). */
  denied: boolean;
};

/** Live users/{ownerUid}/collection. `enabled: false` subscribes to nothing. */
export function useOwnerCollection(
  ownerUid: string | null,
  { enabled = true }: { enabled?: boolean } = {},
): OwnerCollection {
  const uid = enabled ? ownerUid : null;
  const [ownedMap, setOwnedMap] = useState<Record<string, CollectionItem>>({});
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [denied, setDenied] = useState(false);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      queueMicrotask(() => setLoadedUid(null));
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setOwnedMap({});
      setFailed(false);
      setDenied(false);
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
        setLoadedUid(uid);
        setLoading(false);
        setFailed(false);
        setDenied(false);
      },
      (err) => {
        console.error(err);
        if (cancelled) return;
        setFailed(true);
        setDenied(isPermissionDenied(err));
        setOwnedMap({});
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
  const allLabels = useMemo(() => {
    if (!hasCurrentUserData) return [];
    const labels = new Set<string>();
    for (const item of Object.values(ownedMap)) {
      for (const label of item.labels) {
        const trimmed = label.trim();
        if (trimmed) labels.add(trimmed);
      }
    }
    return [...labels].sort((a, b) => a.localeCompare(b));
  }, [hasCurrentUserData, ownedMap]);

  const ownedCardCount = useMemo(
    () =>
      hasCurrentUserData
        ? Object.values(ownedMap).filter((item) => item.quantity > 0).length
        : 0,
    [hasCurrentUserData, ownedMap],
  );

  return useMemo(
    () => ({
      ownedMap: hasCurrentUserData ? ownedMap : {},
      allLabels: hasCurrentUserData ? allLabels : [],
      ownedCardCount: hasCurrentUserData ? ownedCardCount : 0,
      loading: Boolean(uid) && !hasCurrentUserData ? true : loading,
      failed: hasCurrentUserData ? failed : false,
      denied: hasCurrentUserData ? denied : false,
    }),
    [
      uid,
      hasCurrentUserData,
      ownedMap,
      allLabels,
      ownedCardCount,
      loading,
      failed,
      denied,
    ],
  );
}
