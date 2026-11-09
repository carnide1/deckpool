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
  rivals: true,
};

export const PRIVACY_AREAS: PrivacyArea[] = [
  "decks",
  "collection",
  "wanted",
  "rivals",
];

export function profileRef(uid: string) {
  return doc(getFirebaseDb(), "profiles", uid);
}

export function usernameRef(name: string) {
  return doc(getFirebaseDb(), "usernames", name);
}

export function parsePrivacy(raw: unknown): PrivacySettings {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    decks: record.decks === true,
    collection: record.collection === true,
    wanted: record.wanted === true,
    rivals: record.rivals === true,
  };
}

/** True when an older profile is missing the rivals privacy key. */
export function privacyNeedsRivalsBackfill(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return true;
  return !Object.prototype.hasOwnProperty.call(raw, "rivals");
}

/**
 * Write privacy.rivals: true on older profiles so rules that require four
 * keys succeed and Rivals defaults to shared (same as the other areas).
 */
export async function ensurePrivacyShape(uid: string): Promise<void> {
  const ref = profileRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as Record<string, unknown>;
  if (!privacyNeedsRivalsBackfill(data.privacy)) return;
  await updateDoc(ref, {
    "privacy.rivals": true,
    updatedAt: serverTimestamp(),
  });
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
    const rawPrivacy = profileSnap.exists()
      ? (profileSnap.data() as Record<string, unknown>).privacy
      : undefined;
    const privacy: PrivacySettings = previous
      ? {
          ...DEFAULT_PRIVACY,
          ...previous.privacy,
          rivals: privacyNeedsRivalsBackfill(rawPrivacy)
            ? true
            : previous.privacy.rivals,
        }
      : DEFAULT_PRIVACY;

    tx.set(profileRef(uid), {
      username: name,
      displayName: (previous?.displayName || displayName).trim().slice(0, 80),
      privacy,
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
  const ref = profileRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("Claim a username before changing privacy.");
  }
  const current = parsePrivacy(
    (snap.data() as Record<string, unknown>).privacy,
  );
  // Always write the full four-key map so older 3-key profiles satisfy rules.
  const privacy: PrivacySettings = {
    ...current,
    // Missing rivals on old docs should become the default (shared) unless
    // this call is explicitly setting rivals.
    rivals:
      area === "rivals"
        ? value
        : privacyNeedsRivalsBackfill(
              (snap.data() as Record<string, unknown>).privacy,
            )
          ? true
          : current.rivals,
    [area]: value,
  };
  await updateDoc(ref, {
    privacy,
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
