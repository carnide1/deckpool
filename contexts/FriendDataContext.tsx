"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useFriends } from "@/contexts/FriendsContext";
import { useOwnerCardPrefs, type OwnerCardPrefs } from "@/hooks/useOwnerCardPrefs";
import {
  useOwnerCollection,
  type OwnerCollection,
} from "@/hooks/useOwnerCollection";
import { useOwnerDecks, type OwnerDecks } from "@/hooks/useOwnerDecks";
import { useOwnerWanted, type OwnerWanted } from "@/hooks/useOwnerWanted";
import type { PrivacyArea, PublicProfile } from "@/types/friends";

export type FriendAccess = "loading" | "unavailable" | "ready";

type FriendDataValue = {
  uid: string;
  access: FriendAccess;
  /** Set when access is "ready". */
  profile: PublicProfile | null;
  /** Display name, falling back to @username. */
  name: string;
  collection: OwnerCollection;
  wanted: OwnerWanted;
  decks: OwnerDecks;
  cardPrefs: OwnerCardPrefs;
  shares: (area: PrivacyArea) => boolean;
};

const FriendDataContext = createContext<FriendDataValue | null>(null);

/**
 * Read-only data for one friend (`/friends/[uid]/*`). Listeners only start for
 * areas the friend shares; rules enforce the same thing server-side.
 */
export function FriendDataProvider({
  uid,
  children,
}: {
  uid: string;
  children: ReactNode;
}) {
  const { friends, friendUids, loading: friendsLoading } = useFriends();
  const isFriend = friendUids.has(uid);
  const profile = isFriend
    ? (friends.find((row) => row.uid === uid) ?? null)
    : null;

  const access: FriendAccess = friendsLoading
    ? "loading"
    : !isFriend
      ? "unavailable"
      : profile
        ? "ready"
        : "loading";

  const shares = useMemo(
    () => (area: PrivacyArea) => Boolean(profile?.privacy[area]),
    [profile],
  );

  const collection = useOwnerCollection(uid, {
    enabled: Boolean(profile?.privacy.collection),
  });
  const wanted = useOwnerWanted(uid, {
    enabled: Boolean(profile?.privacy.wanted),
  });
  const decks = useOwnerDecks(uid, { enabled: Boolean(profile?.privacy.decks) });
  const cardPrefs = useOwnerCardPrefs(uid, { enabled: Boolean(profile) });

  const name = profile
    ? profile.displayName.trim() || `@${profile.username}`
    : "This player";

  const value = useMemo(
    () => ({
      uid,
      access,
      profile,
      name,
      collection,
      wanted,
      decks,
      cardPrefs,
      shares,
    }),
    [uid, access, profile, name, collection, wanted, decks, cardPrefs, shares],
  );

  return (
    <FriendDataContext.Provider value={value}>
      {children}
    </FriendDataContext.Provider>
  );
}

export function useFriendData(): FriendDataValue {
  const ctx = useContext(FriendDataContext);
  if (!ctx) {
    throw new Error("useFriendData must be used within FriendDataProvider");
  }
  return ctx;
}
