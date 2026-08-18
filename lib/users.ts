import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
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
  };
}

/** Write users/{uid} on signup (Auth profile + Firestore in sync). */
export async function createUserDocOnSignup(
  user: User,
  displayName: string,
): Promise<void> {
  const trimmed = displayName.trim();
  await setDoc(userRef(user.uid), {
    displayName: trimmed,
    email: user.email ?? "",
    createdAt: serverTimestamp(),
  });
}

/** Create users/{uid} on first session if missing; return the profile. */
export async function ensureUserDoc(user: User): Promise<UserProfile> {
  const ref = userRef(user.uid);
  const snap = await getDoc(ref);
  const fallback = {
    displayName: user.displayName?.trim() || "",
    email: user.email || "",
  };

  if (!snap.exists()) {
    const payload = {
      displayName: fallback.displayName,
      email: fallback.email,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
    return { ...fallback, createdAt: null };
  }

  return normalizeProfile(snap.data() as Record<string, unknown>, fallback);
}

export async function updateUserDisplayName(
  uid: string,
  displayName: string,
): Promise<void> {
  await updateDoc(userRef(uid), { displayName: displayName.trim() });
}

/** Count owned cards (qty > 0) for post-login routing. */
export async function getOwnedCardCount(uid: string): Promise<number> {
  const { collection, getDocs, query, where } = await import(
    "firebase/firestore"
  );
  const q = query(
    collection(getFirebaseDb(), "users", uid, "collection"),
    where("quantity", ">", 0),
  );
  const snap = await getDocs(q);
  return snap.size;
}
