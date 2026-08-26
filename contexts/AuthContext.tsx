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
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { createUserDocOnSignup } from "@/lib/users";

/** If IndexedDB/Auth never resolves (seen on some mobile Safari builds), unblock the UI. */
const AUTH_READY_TIMEOUT_MS = 8_000;

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  /** True when we gave up waiting for Firebase Auth. */
  authTimedOut: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  retryAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthError(error: unknown): string {
  if (typeof error === "object" && error && "code" in error) {
    const code = String((error as { code: string }).code);
    switch (code) {
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Incorrect email or password.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/too-many-requests":
        return "Too many attempts. Try again later.";
      case "auth/network-request-failed":
        return "Network error. Check your connection.";
      default:
        break;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [authEpoch, setAuthEpoch] = useState(0);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;
    let sawAuthEvent = false;

    const timeoutId = setTimeout(() => {
      if (cancelled || sawAuthEvent) return;
      console.warn(
        "[DeckPool] Firebase Auth did not become ready in time; continuing without a session.",
      );
      setAuthTimedOut(true);
      setLoading(false);
    }, AUTH_READY_TIMEOUT_MS);

    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(
        auth,
        (next) => {
          if (cancelled) return;
          sawAuthEvent = true;
          clearTimeout(timeoutId);
          setUser(next);
          setAuthTimedOut(false);
          setLoading(false);
        },
        (error) => {
          console.error(error);
          if (cancelled) return;
          sawAuthEvent = true;
          clearTimeout(timeoutId);
          setUser(null);
          setAuthTimedOut(false);
          setLoading(false);
        },
      );
    } catch (error) {
      console.error(error);
      clearTimeout(timeoutId);
      queueMicrotask(() => {
        if (cancelled) return;
        sawAuthEvent = true;
        setUser(null);
        setAuthTimedOut(false);
        setLoading(false);
      });
    }

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      unsub?.();
    };
  }, [authEpoch]);

  const retryAuth = useCallback(() => {
    setLoading(true);
    setAuthTimedOut(false);
    setUser(null);
    setAuthEpoch((n) => n + 1);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  }, []);

  const signup = useCallback(
    async (email: string, password: string, displayName: string) => {
      const trimmed = displayName.trim();
      if (!trimmed) {
        throw new Error("Display name is required.");
      }
      try {
        const cred = await createUserWithEmailAndPassword(
          getFirebaseAuth(),
          email,
          password,
        );
        await updateProfile(cred.user, { displayName: trimmed });
        await createUserDocOnSignup(cred.user, trimmed);
        setUser(getFirebaseAuth().currentUser);
      } catch (error) {
        throw new Error(mapAuthError(error));
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await signOut(getFirebaseAuth());
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  }, []);

  const updateDisplayName = useCallback(async (displayName: string) => {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) {
      throw new Error("You must be signed in.");
    }
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
      });
      setUser({ ...auth.currentUser });
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authTimedOut,
      login,
      signup,
      logout,
      resetPassword,
      updateDisplayName,
      retryAuth,
    }),
    [
      user,
      loading,
      authTimedOut,
      login,
      signup,
      logout,
      resetPassword,
      updateDisplayName,
      retryAuth,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
