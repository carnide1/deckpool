import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { friendRequestId, friendshipId } from "@/lib/friendIds";
import { usernameRef } from "@/lib/profiles";
import { timestampToMillis } from "@/lib/timestamps";
import { normalizeUsername, validateUsername } from "@/lib/usernames";
import type { FriendRequest, Friendship, PublicProfile } from "@/types/friends";

export const UNKNOWN_USERNAME_MESSAGE = "No account with that username.";

function friendRequestsRef() {
  return collection(getFirebaseDb(), "friendRequests");
}

function friendshipsRef() {
  return collection(getFirebaseDb(), "friendships");
}

function friendRequestRef(fromUid: string, toUid: string) {
  return doc(friendRequestsRef(), friendRequestId(fromUid, toUid));
}

function friendshipRef(a: string, b: string) {
  return doc(friendshipsRef(), friendshipId(a, b));
}

export function incomingRequestsQuery(uid: string) {
  return query(friendRequestsRef(), where("toUid", "==", uid));
}

export function outgoingRequestsQuery(uid: string) {
  return query(friendRequestsRef(), where("fromUid", "==", uid));
}

export function friendshipsQuery(uid: string) {
  return query(friendshipsRef(), where("members", "array-contains", uid));
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function parseFriendRequest(
  id: string,
  data: Record<string, unknown>,
): FriendRequest {
  return {
    id,
    fromUid: str(data.fromUid),
    toUid: str(data.toUid),
    fromUsername: str(data.fromUsername),
    fromDisplayName: str(data.fromDisplayName),
    toUsername: str(data.toUsername),
    createdAtMs: timestampToMillis(data.createdAt),
  };
}

export function parseFriendship(
  id: string,
  data: Record<string, unknown>,
): Friendship | null {
  const members = data.members;
  if (
    !Array.isArray(members) ||
    members.length !== 2 ||
    typeof members[0] !== "string" ||
    typeof members[1] !== "string"
  ) {
    return null;
  }
  return {
    id,
    members: [members[0], members[1]],
    createdAtMs: timestampToMillis(data.createdAt),
  };
}

/** Exact username → uid, or null. Invalid names never hit Firestore. */
export async function lookupUsername(rawName: string): Promise<string | null> {
  const name = normalizeUsername(rawName);
  if (validateUsername(name)) return null;
  const snap = await getDoc(usernameRef(name));
  if (!snap.exists()) return null;
  const uid = snap.data().uid;
  return typeof uid === "string" && uid ? uid : null;
}

/** Callers resolve self / friend / pending cases first (relationshipWith). */
export async function sendFriendRequest(
  me: PublicProfile,
  toUid: string,
  toUsername: string,
): Promise<void> {
  await setDoc(friendRequestRef(me.uid, toUid), {
    fromUid: me.uid,
    toUid,
    fromUsername: me.username,
    fromDisplayName: me.displayName.slice(0, 80),
    toUsername: normalizeUsername(toUsername),
    createdAt: serverTimestamp(),
  });
}

export async function cancelFriendRequest(
  myUid: string,
  toUid: string,
): Promise<void> {
  await deleteDoc(friendRequestRef(myUid, toUid));
}

export async function declineFriendRequest(
  myUid: string,
  fromUid: string,
): Promise<void> {
  await deleteDoc(friendRequestRef(fromUid, myUid));
}

/**
 * Create the friendship and clear the request in one batch. Pass
 * `alsoDeleteMyOutgoing` only when your own request to them exists
 * (rules reject deleting a missing doc, which would fail the batch).
 */
export async function acceptFriendRequest(
  myUid: string,
  fromUid: string,
  alsoDeleteMyOutgoing: boolean,
): Promise<void> {
  const batch = writeBatch(getFirebaseDb());
  const members = [myUid, fromUid].sort();
  batch.set(friendshipRef(myUid, fromUid), {
    members,
    createdAt: serverTimestamp(),
  });
  batch.delete(friendRequestRef(fromUid, myUid));
  if (alsoDeleteMyOutgoing) {
    batch.delete(friendRequestRef(myUid, fromUid));
  }
  await batch.commit();
}

export async function removeFriend(
  myUid: string,
  friendUid: string,
): Promise<void> {
  await deleteDoc(friendshipRef(myUid, friendUid));
}
