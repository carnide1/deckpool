import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseDb } from "@/lib/firebase";
import type { UserProfile } from "@/types/user";

function userRef(uid: string) {
  return doc(getFirebaseDb(), "users", uid);
}

function normalizeProfile(
  data: Record<string, unknown>,
  fallback: { displayName: string; email: string },
): UserProfile {
  return {
    displayName:
      typeof data.displayName === "string"
        ? data.displayName
        : fallback.displayName,
    email: typeof data.email === "string" ? data.email : fallback.email,
    createdAt: data.createdAt ?? null,
    username: null,
  };
}

/**
 * Write users/{uid} on signup. Runs in a transaction because `ensureUserDoc`
 * races it on a brand-new account; rules reject a second create (createdAt
 * would change), so whichever runs second must update displayName only.
 */
export async function createUserDocOnSignup(
  user: User,
  displayName: string,
): Promise<void> {
  const ref = userRef(user.uid);
  const trimmed = displayName.trim();
  await runTransaction(getFirebaseDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      tx.update(ref, { displayName: trimmed });
    } else {
      tx.set(ref, {
        displayName: trimmed,
        email: user.email ?? "",
        createdAt: serverTimestamp(),
      });
    }
  });
}

/** Create users/{uid} on first session if missing; return the profile. */
export async function ensureUserDoc(user: User): Promise<UserProfile> {
  const ref = userRef(user.uid);
  const fallback = {
    displayName: user.displayName?.trim() || "",
    email: user.email || "",
  };

  return runTransaction(getFirebaseDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      tx.set(ref, { ...fallback, createdAt: serverTimestamp() });
      return { ...fallback, createdAt: null, username: null };
    }
    return normalizeProfile(snap.data() as Record<string, unknown>, fallback);
  });
}

export async function updateUserDisplayName(
  uid: string,
  displayName: string,
): Promise<void> {
  await updateDoc(userRef(uid), { displayName: displayName.trim() });
}

/** Count owned cards (qty > 0) for post-login routing. */
export async function getOwnedCardCount(uid: string): Promise<number> {
  const q = query(
    collection(getFirebaseDb(), "users", uid, "collection"),
    where("quantity", ">", 0),
  );
  const snap = await getDocs(q);
  return snap.size;
}
