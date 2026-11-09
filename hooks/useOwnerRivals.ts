"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { isPermissionDenied } from "@/lib/firestoreErrors";
import { parseRivalJournal, userRivalsRef } from "@/lib/rivals";
import type { RivalJournal } from "@/types/rival";

export type OwnerRivals = {
  rivalsByLeaderId: Record<string, RivalJournal>;
  rivals: RivalJournal[];
  loading: boolean;
  failed: boolean;
  denied: boolean;
};

/** Live users/{ownerUid}/rivals. `enabled: false` subscribes to nothing. */
export function useOwnerRivals(
  ownerUid: string | null,
  { enabled = true }: { enabled?: boolean } = {},
): OwnerRivals {
  const uid = enabled ? ownerUid : null;
  const [rivalsByLeaderId, setRivalsByLeaderId] = useState<
    Record<string, RivalJournal>
  >({});
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
      setRivalsByLeaderId({});
      setFailed(false);
      setDenied(false);
      setLoading(true);
    });

    const unsub = onSnapshot(
      userRivalsRef(uid),
      (snap) => {
        if (cancelled) return;
        const next: Record<string, RivalJournal> = {};
        for (const docSnap of snap.docs) {
          next[docSnap.id] = parseRivalJournal(
            docSnap.id,
            docSnap.data() as Record<string, unknown>,
          );
        }
        setRivalsByLeaderId(next);
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
        setRivalsByLeaderId({});
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

  const rivals = useMemo(() => {
    if (!hasCurrentUserData) return [];
    return Object.values(rivalsByLeaderId).sort((a, b) =>
      a.leaderId.localeCompare(b.leaderId),
    );
  }, [hasCurrentUserData, rivalsByLeaderId]);

  return useMemo(
    () => ({
      rivalsByLeaderId: hasCurrentUserData ? rivalsByLeaderId : {},
      rivals,
      loading: Boolean(uid) && !hasCurrentUserData ? true : loading,
      failed: hasCurrentUserData ? failed : false,
      denied: hasCurrentUserData ? denied : false,
    }),
    [
      uid,
      hasCurrentUserData,
      rivalsByLeaderId,
      rivals,
      loading,
      failed,
      denied,
    ],
  );
}
