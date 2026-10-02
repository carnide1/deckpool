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
import type { User } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  claimUsername as claimUsernameDoc,
  parsePublicProfile,
  profileRef,
  setPrivacy as setPrivacyDoc,
  syncProfileDisplayName,
} from "@/lib/profiles";
import { ensureUserDoc, updateUserDisplayName } from "@/lib/users";
import type {
  PrivacyArea,
  PrivacySettings,
  PublicProfile,
} from "@/types/friends";
import type { UserProfile } from "@/types/user";

type UserProfileContextValue = {
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  /** profiles/{uid} (username + privacy); null until a username is claimed. */
  publicProfile: PublicProfile | null;
  publicProfileLoading: boolean;
  privacy: PrivacySettings | null;
  refreshProfile: () => Promise<void>;
  saveDisplayName: (displayName: string) => Promise<void>;
  claimUsername: (name: string) => Promise<string>;
  setPrivacy: (area: PrivacyArea, value: boolean) => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user, updateDisplayName } = useAuth();
  const uid = user?.uid ?? null;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(
    null,
  );
  const [publicLoadedUid, setPublicLoadedUid] = useState<string | null>(null);

  const loadProfile = useCallback(async (authUser: User) => {
    const expectedUid = authUser.uid;
    setProfileLoading(true);
    setProfileError(null);
    try {
      const next = await ensureUserDoc(authUser);
      if (expectedUid !== authUser.uid) return;
      setProfile(next);
      setLoadedUid(expectedUid);
    } catch (error) {
      console.error(error);
      if (expectedUid !== authUser.uid) return;
      setProfileError(
        error instanceof Error
          ? error.message
          : "Could not load your profile. Check Firestore rules.",
      );
      setProfile(null);
      setLoadedUid(expectedUid);
    } finally {
      if (expectedUid === authUser.uid) setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      setLoadedUid(null);
      return;
    }
    await loadProfile(user);
  }, [user, loadProfile]);

  useEffect(() => {
    let cancelled = false;

    if (!user || !uid) {
      queueMicrotask(() => {
        if (cancelled) return;
        setProfile(null);
        setProfileError(null);
        setProfileLoading(false);
        setLoadedUid(null);
      });
      return () => {
        cancelled = true;
      };
    }

    // Hide the previous account on switch (before the async load resolves).
    queueMicrotask(() => {
      if (cancelled) return;
      setProfile(null);
      setProfileError(null);
      setLoadedUid(null);
      setProfileLoading(true);
    });

    const expectedUid = uid;
    void (async () => {
      try {
        const next = await ensureUserDoc(user);
        if (cancelled || expectedUid !== user.uid) return;
        setProfile(next);
        setLoadedUid(expectedUid);
      } catch (error) {
        console.error(error);
        if (cancelled || expectedUid !== user.uid) return;
        setProfileError(
          error instanceof Error
            ? error.message
            : "Could not load your profile. Check Firestore rules.",
        );
        setProfile(null);
        setLoadedUid(expectedUid);
      } finally {
        if (!cancelled && expectedUid === user.uid) {
          setProfileLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, uid]);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setPublicProfile(null);
    });
    const unsub = onSnapshot(
      profileRef(uid),
      (snap) => {
        if (cancelled) return;
        setPublicProfile(
          snap.exists()
            ? parsePublicProfile(uid, snap.data() as Record<string, unknown>)
            : null,
        );
        setPublicLoadedUid(uid);
      },
      (err) => {
        console.error(err);
        if (cancelled) return;
        setPublicProfile(null);
        setPublicLoadedUid(uid);
      },
    );
    return () => {
      cancelled = true;
      unsub();
    };
  }, [uid]);

  const saveDisplayName = useCallback(
    async (displayName: string) => {
      if (!user) throw new Error("You must be signed in.");
      const trimmed = displayName.trim();
      if (!trimmed) throw new Error("Display name is required.");
      await updateDisplayName(trimmed);
      await updateUserDisplayName(user.uid, trimmed);
      await syncProfileDisplayName(user.uid, trimmed);
      setProfile((prev) =>
        prev ? { ...prev, displayName: trimmed } : prev,
      );
    },
    [user, updateDisplayName],
  );

  const hasCurrentUserData = Boolean(uid && loadedUid === uid);
  const hasCurrentPublic = Boolean(uid && publicLoadedUid === uid);
  const currentPublic = hasCurrentPublic ? publicProfile : null;

  const claimUsername = useCallback(
    async (name: string) => {
      if (!user) throw new Error("You must be signed in.");
      const displayName =
        profile?.displayName?.trim() || user.displayName?.trim() || "";
      return claimUsernameDoc(user.uid, name, displayName);
    },
    [user, profile?.displayName],
  );

  const setPrivacy = useCallback(
    async (area: PrivacyArea, value: boolean) => {
      if (!user) throw new Error("You must be signed in.");
      await setPrivacyDoc(user.uid, area, value);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      profile:
        hasCurrentUserData && profile
          ? { ...profile, username: currentPublic?.username || null }
          : null,
      profileLoading: Boolean(uid) && !hasCurrentUserData ? true : profileLoading,
      profileError: hasCurrentUserData ? profileError : null,
      publicProfile: currentPublic,
      publicProfileLoading: Boolean(uid) && !hasCurrentPublic,
      privacy: currentPublic?.privacy ?? null,
      refreshProfile,
      saveDisplayName,
      claimUsername,
      setPrivacy,
    }),
    [
      uid,
      hasCurrentUserData,
      hasCurrentPublic,
      currentPublic,
      profile,
      profileLoading,
      profileError,
      refreshProfile,
      saveDisplayName,
      claimUsername,
      setPrivacy,
    ],
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextValue {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used within UserProfileProvider");
  }
  return ctx;
}
