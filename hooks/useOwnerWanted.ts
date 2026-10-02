"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { isPermissionDenied } from "@/lib/firestoreErrors";
import { parseWantedItem, userWantedRef } from "@/lib/wanted";
import type { WantedItem } from "@/types/wanted";

export type OwnerWanted = {
  wantedMap: Record<string, WantedItem>;
  wantedCardCount: number;
  loading: boolean;
  failed: boolean;
  denied: boolean;
};

/** Live users/{ownerUid}/wanted. `enabled: false` subscribes to nothing. */
export function useOwnerWanted(
  ownerUid: string | null,
  { enabled = true }: { enabled?: boolean } = {},
): OwnerWanted {
  const uid = enabled ? ownerUid : null;
  const [wantedMap, setWantedMap] = useState<Record<string, WantedItem>>({});
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
      setWantedMap({});
      setFailed(false);
      setDenied(false);
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
        setFailed(false);
        setDenied(false);
      },
      (err) => {
        console.error(err);
        if (cancelled) return;
        setFailed(true);
        setDenied(isPermissionDenied(err));
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

  return useMemo(
    () => ({
      wantedMap: hasCurrentUserData ? wantedMap : {},
      wantedCardCount: hasCurrentUserData ? wantedCardCount : 0,
      loading: Boolean(uid) && !hasCurrentUserData ? true : loading,
      failed: hasCurrentUserData ? failed : false,
      denied: hasCurrentUserData ? denied : false,
    }),
    [
      uid,
      hasCurrentUserData,
      wantedMap,
      wantedCardCount,
      loading,
      failed,
      denied,
    ],
  );
}
