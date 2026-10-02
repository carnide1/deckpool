"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { userCardPrefsRef } from "@/lib/cardPrefs";

export type OwnerCardPrefs = {
  preferredByCardId: Record<string, string>;
  loading: boolean;
};

/** Live users/{ownerUid}/cardPrefs. Errors fall back to catalog art (empty map). */
export function useOwnerCardPrefs(
  ownerUid: string | null,
  { enabled = true }: { enabled?: boolean } = {},
): OwnerCardPrefs {
  const uid = enabled ? ownerUid : null;
  const [preferredByCardId, setPreferredByCardId] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(false);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      queueMicrotask(() => setLoadedUid(null));
      return;
    }

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
        setLoadedUid(uid);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        if (cancelled) return;
        setPreferredByCardId({});
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
  return useMemo(
    () => ({
      preferredByCardId: hasCurrentUserData ? preferredByCardId : {},
      loading: Boolean(uid) && !hasCurrentUserData ? true : loading,
    }),
    [uid, hasCurrentUserData, preferredByCardId, loading],
  );
}
