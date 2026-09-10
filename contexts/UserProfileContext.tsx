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
import { useAuth } from "@/contexts/AuthContext";
import { ensureUserDoc, updateUserDisplayName } from "@/lib/users";
import type { UserProfile } from "@/types/user";

type UserProfileContextValue = {
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  saveDisplayName: (displayName: string) => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user, updateDisplayName } = useAuth();
  const uid = user?.uid ?? null;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

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
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      setLoadedUid(null);
      return () => {
        cancelled = true;
      };
    }

    // Hide the previous account immediately on switch (do not wait for async).
    setProfile(null);
    setProfileError(null);
    setLoadedUid(null);
    setProfileLoading(true);

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

  const saveDisplayName = useCallback(
    async (displayName: string) => {
      if (!user) throw new Error("You must be signed in.");
      const trimmed = displayName.trim();
      if (!trimmed) throw new Error("Display name is required.");
      await updateDisplayName(trimmed);
      await updateUserDisplayName(user.uid, trimmed);
      setProfile((prev) =>
        prev ? { ...prev, displayName: trimmed } : prev,
      );
    },
    [user, updateDisplayName],
  );

  const hasCurrentUserData = Boolean(uid && loadedUid === uid);

  const value = useMemo(
    () => ({
      profile: hasCurrentUserData ? profile : null,
      profileLoading: Boolean(uid) && !hasCurrentUserData ? true : profileLoading,
      profileError: hasCurrentUserData ? profileError : null,
      refreshProfile,
      saveDisplayName,
    }),
    [
      uid,
      hasCurrentUserData,
      profile,
      profileLoading,
      profileError,
      refreshProfile,
      saveDisplayName,
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
