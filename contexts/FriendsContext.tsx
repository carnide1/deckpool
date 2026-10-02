"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onSnapshot } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  friendshipsQuery,
  incomingRequestsQuery,
  outgoingRequestsQuery,
  parseFriendRequest,
  parseFriendship,
  removeFriend,
  sendFriendRequest,
} from "@/lib/friends";
import { parsePublicProfile, profileRef } from "@/lib/profiles";
import type { FriendRequest, Friendship, PublicProfile } from "@/types/friends";

type FriendsContextValue = {
  /** Friends with a loaded profile, sorted by display name. */
  friends: PublicProfile[];
  friendUids: ReadonlySet<string>;
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  pendingIncomingCount: number;
  /** True until friendships + both request lists have loaded once. */
  loading: boolean;
  error: string | null;
  sendRequest: (toUid: string, toUsername: string) => Promise<void>;
  cancelRequest: (toUid: string) => Promise<void>;
  acceptRequest: (fromUid: string) => Promise<void>;
  declineRequest: (fromUid: string) => Promise<void>;
  remove: (friendUid: string) => Promise<void>;
};

const FriendsContext = createContext<FriendsContextValue | null>(null);

type Loaded<T> = { uid: string; rows: T[] } | null;

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { publicProfile } = useUserProfile();
  const authUid = user?.uid ?? null;
  // Requests need a username; stay idle until the account has one.
  const uid = publicProfile?.username ? authUid : null;

  const [friendships, setFriendships] = useState<Loaded<Friendship>>(null);
  const [incoming, setIncoming] = useState<Loaded<FriendRequest>>(null);
  const [outgoing, setOutgoing] = useState<Loaded<FriendRequest>>(null);
  const [profilesByUid, setProfilesByUid] = useState<
    Record<string, PublicProfile>
  >({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setError(null);
    });

    const fail = (err: unknown) => {
      console.error(err);
      if (!cancelled) setError("Could not load friends.");
    };

    const unsubFriendships = onSnapshot(
      friendshipsQuery(uid),
      (snap) => {
        if (cancelled) return;
        const rows = snap.docs
          .map((d) =>
            parseFriendship(d.id, d.data() as Record<string, unknown>),
          )
          .filter((row): row is Friendship => row !== null);
        setFriendships({ uid, rows });
      },
      fail,
    );
    const unsubIncoming = onSnapshot(
      incomingRequestsQuery(uid),
      (snap) => {
        if (cancelled) return;
        const rows = snap.docs
          .map((d) =>
            parseFriendRequest(d.id, d.data() as Record<string, unknown>),
          )
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        setIncoming({ uid, rows });
      },
      fail,
    );
    const unsubOutgoing = onSnapshot(
      outgoingRequestsQuery(uid),
      (snap) => {
        if (cancelled) return;
        const rows = snap.docs
          .map((d) =>
            parseFriendRequest(d.id, d.data() as Record<string, unknown>),
          )
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        setOutgoing({ uid, rows });
      },
      fail,
    );

    return () => {
      cancelled = true;
      unsubFriendships();
      unsubIncoming();
      unsubOutgoing();
    };
  }, [uid]);

  const currentFriendships = useMemo(
    () => (uid && friendships?.uid === uid ? friendships.rows : []),
    [uid, friendships],
  );

  const friendUidList = useMemo(() => {
    if (!uid) return [];
    return currentFriendships
      .map((row) => (row.members[0] === uid ? row.members[1] : row.members[0]))
      .sort();
  }, [uid, currentFriendships]);

  const friendUidsKey = friendUidList.join("\0");

  // One profile listener per friend (same add/remove pattern as deck variations).
  useEffect(() => {
    if (!friendUidsKey) {
      queueMicrotask(() => setProfilesByUid({}));
      return;
    }
    const ids = friendUidsKey.split("\0");
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setProfilesByUid((prev) => {
        const next: Record<string, PublicProfile> = {};
        for (const id of ids) if (prev[id]) next[id] = prev[id];
        return next;
      });
    });
    const unsubs = ids.map((friendUid) =>
      onSnapshot(
        profileRef(friendUid),
        (snap) => {
          if (cancelled || !snap.exists()) return;
          const profile = parsePublicProfile(
            friendUid,
            snap.data() as Record<string, unknown>,
          );
          setProfilesByUid((prev) => ({ ...prev, [friendUid]: profile }));
        },
        (err) => {
          // Expected briefly after a removal, before the friendship listener catches up.
          console.error(err);
        },
      ),
    );
    return () => {
      cancelled = true;
      for (const unsub of unsubs) unsub();
    };
  }, [friendUidsKey]);

  const friendUids = useMemo(() => new Set(friendUidList), [friendUidList]);

  const friends = useMemo(
    () =>
      friendUidList
        .map((id) => profilesByUid[id])
        .filter((row): row is PublicProfile => Boolean(row))
        .sort(
          (a, b) =>
            (a.displayName || a.username).localeCompare(
              b.displayName || b.username,
            ) || a.username.localeCompare(b.username),
        ),
    [friendUidList, profilesByUid],
  );

  const currentIncoming = useMemo(
    () => (uid && incoming?.uid === uid ? incoming.rows : []),
    [uid, incoming],
  );
  const currentOutgoing = useMemo(
    () => (uid && outgoing?.uid === uid ? outgoing.rows : []),
    [uid, outgoing],
  );

  const loaded =
    Boolean(uid) &&
    friendships?.uid === uid &&
    incoming?.uid === uid &&
    outgoing?.uid === uid;

  const sendRequest = useCallback(
    async (toUid: string, toUsername: string) => {
      if (!publicProfile || !authUid) throw new Error("Pick a username first.");
      await sendFriendRequest(publicProfile, toUid, toUsername);
    },
    [publicProfile, authUid],
  );

  const cancelRequest = useCallback(
    async (toUid: string) => {
      if (!authUid) throw new Error("You must be signed in.");
      await cancelFriendRequest(authUid, toUid);
    },
    [authUid],
  );

  const acceptRequest = useCallback(
    async (fromUid: string) => {
      if (!authUid) throw new Error("You must be signed in.");
      const iAlsoAsked = currentOutgoing.some((row) => row.toUid === fromUid);
      await acceptFriendRequest(authUid, fromUid, iAlsoAsked);
    },
    [authUid, currentOutgoing],
  );

  const declineRequest = useCallback(
    async (fromUid: string) => {
      if (!authUid) throw new Error("You must be signed in.");
      await declineFriendRequest(authUid, fromUid);
    },
    [authUid],
  );

  const remove = useCallback(
    async (friendUid: string) => {
      if (!authUid) throw new Error("You must be signed in.");
      await removeFriend(authUid, friendUid);
    },
    [authUid],
  );

  const value = useMemo(
    () => ({
      friends,
      friendUids,
      incoming: currentIncoming,
      outgoing: currentOutgoing,
      pendingIncomingCount: currentIncoming.length,
      loading: Boolean(uid) && !loaded,
      error: uid ? error : null,
      sendRequest,
      cancelRequest,
      acceptRequest,
      declineRequest,
      remove,
    }),
    [
      friends,
      friendUids,
      currentIncoming,
      currentOutgoing,
      uid,
      loaded,
      error,
      sendRequest,
      cancelRequest,
      acceptRequest,
      declineRequest,
      remove,
    ],
  );

  return (
    <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>
  );
}

export function useFriends(): FriendsContextValue {
  const ctx = useContext(FriendsContext);
  if (!ctx) {
    throw new Error("useFriends must be used within FriendsProvider");
  }
  return ctx;
}
