import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { normalizeUsername, validateUsername } from "@/lib/usernames";
import type {
  PrivacyArea,
  PrivacySettings,
  PublicProfile,
} from "@/types/friends";

export const DEFAULT_PRIVACY: PrivacySettings = {
  decks: true,
  collection: true,
  wanted: true,
};

export function profileRef(uid: string) {
  return doc(getFirebaseDb(), "profiles", uid);
}

export function usernameRef(name: string) {
  return doc(getFirebaseDb(), "usernames", name);
}

function parsePrivacy(raw: unknown): PrivacySettings {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    decks: record.decks === true,
    collection: record.collection === true,
    wanted: record.wanted === true,
  };
}

export function parsePublicProfile(
  uid: string,
  data: Record<string, unknown>,
): PublicProfile {
  return {
    uid,
    username: typeof data.username === "string" ? data.username : "",
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    privacy: parsePrivacy(data.privacy),
  };
}

/**
 * Reserve usernames/{name} and point profiles/{uid} at it in one transaction.
 * Releases the previous username when changing. New profiles share everything.
 */
export async function claimUsername(
  uid: string,
  rawName: string,
  displayName: string,
): Promise<string> {
  const name = normalizeUsername(rawName);
  const invalid = validateUsername(name);
  if (invalid) throw new Error(invalid);

  const db = getFirebaseDb();
  await runTransaction(db, async (tx) => {
    const nameSnap = await tx.get(usernameRef(name));
    const profileSnap = await tx.get(profileRef(uid));

    if (nameSnap.exists() && nameSnap.data().uid !== uid) {
      throw new Error("That username is taken.");
    }

    const previous = profileSnap.exists()
      ? parsePublicProfile(uid, profileSnap.data())
      : null;
    if (previous?.username === name) return;

    if (previous?.username) {
      tx.delete(usernameRef(previous.username));
    }
    if (!nameSnap.exists()) {
      tx.set(usernameRef(name), { uid });
    }
    tx.set(profileRef(uid), {
      username: name,
      displayName: (previous?.displayName || displayName).trim().slice(0, 80),
      privacy: previous ? previous.privacy : DEFAULT_PRIVACY,
      updatedAt: serverTimestamp(),
    });
  });
  return name;
}

export async function setPrivacy(
  uid: string,
  area: PrivacyArea,
  value: boolean,
): Promise<void> {
  await updateDoc(profileRef(uid), {
    [`privacy.${area}`]: value,
    updatedAt: serverTimestamp(),
  });
}

/** Keep the friend-visible name in step with users/{uid}. No-op without a profile. */
export async function syncProfileDisplayName(
  uid: string,
  displayName: string,
): Promise<void> {
  const ref = profileRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await updateDoc(ref, {
    displayName: displayName.trim().slice(0, 80),
    updatedAt: serverTimestamp(),
  });
}
