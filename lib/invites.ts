import {
  Timestamp,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { usernameRef } from "@/lib/profiles";
import { absoluteAppUrl } from "@/lib/shares";
import { timestampToMillis } from "@/lib/timestamps";
import type { Invite, PublicProfile } from "@/types/friends";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function invitePagePath(code: string): string {
  return `/invite/${encodeURIComponent(code)}`;
}

export function inviteAbsoluteUrl(code: string, origin?: string): string {
  return absoluteAppUrl(invitePagePath(code), origin);
}

export function isInviteExpired(
  invite: Pick<Invite, "expiresAtMs">,
  nowMs: number,
): boolean {
  return invite.expiresAtMs <= nowMs;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function parseInvite(
  code: string,
  data: Record<string, unknown>,
): Invite | null {
  const inviterUid = str(data.inviterUid);
  const inviterUsername = str(data.inviterUsername);
  const expiresAtMs = timestampToMillis(data.expiresAt);
  if (!inviterUid || !inviterUsername || expiresAtMs <= 0) return null;
  return {
    code,
    inviterUid,
    inviterUsername,
    inviterDisplayName: str(data.inviterDisplayName),
    createdAtMs: timestampToMillis(data.createdAt),
    expiresAtMs,
  };
}

export function inviteShareText(username: string): string {
  return `Add me as a friend on DeckPool (@${username})`;
}

function invitesRef() {
  return collection(getFirebaseDb(), "invites");
}

function inviteRef(code: string) {
  return doc(invitesRef(), code);
}

/** Writes invites/{random code} for the signed-in user; returns the code. */
export async function createInvite(me: PublicProfile): Promise<string> {
  const ref = doc(invitesRef());
  await setDoc(ref, {
    inviterUid: me.uid,
    inviterUsername: me.username,
    inviterDisplayName: me.displayName.slice(0, 80),
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + INVITE_TTL_MS),
  });
  return ref.id;
}

/** Public read (works signed out). Null when missing or malformed. */
export async function getInvite(code: string): Promise<Invite | null> {
  const snap = await getDoc(inviteRef(code));
  if (!snap.exists()) return null;
  return parseInvite(code, snap.data() as Record<string, unknown>);
}

/**
 * False when the inviter changed username after making the link (the request
 * rule would refuse it). Signed-in only.
 */
export async function isInviteCurrent(invite: Invite): Promise<boolean> {
  const snap = await getDoc(usernameRef(invite.inviterUsername));
  return snap.exists() && snap.data().uid === invite.inviterUid;
}
