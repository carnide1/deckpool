import type { Relationship } from "@/types/friends";

/** friendships/{id}: the two uids sorted, joined by "_". Mirrored in firestore.rules (pairId). */
export function friendshipId(a: string, b: string): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

/** friendRequests/{id}: sender uid, then recipient uid. */
export function friendRequestId(fromUid: string, toUid: string): string {
  return `${fromUid}_${toUid}`;
}

export function relationshipWith(
  otherUid: string,
  {
    selfUid,
    friendUids,
    incomingFromUids,
    outgoingToUids,
  }: {
    selfUid: string;
    friendUids: ReadonlySet<string>;
    incomingFromUids: ReadonlySet<string>;
    outgoingToUids: ReadonlySet<string>;
  },
): Relationship {
  if (otherUid === selfUid) return "self";
  if (friendUids.has(otherUid)) return "friend";
  if (incomingFromUids.has(otherUid)) return "incoming";
  if (outgoingToUids.has(otherUid)) return "outgoing";
  return "none";
}
