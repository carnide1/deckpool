export type PrivacyArea = "decks" | "collection" | "wanted";

export type PrivacySettings = Record<PrivacyArea, boolean>;

/** profiles/{uid}: the friend-readable part of an account (never the email). */
export interface PublicProfile {
  uid: string;
  username: string;
  displayName: string;
  privacy: PrivacySettings;
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  toUid: string;
  fromUsername: string;
  fromDisplayName: string;
  toUsername: string;
  createdAtMs: number;
}

export interface Friendship {
  id: string;
  members: [string, string];
  createdAtMs: number;
}

/** invites/{code}: a 7-day link that leads to a friend request to the inviter. */
export interface Invite {
  code: string;
  inviterUid: string;
  inviterUsername: string;
  inviterDisplayName: string;
  createdAtMs: number;
  expiresAtMs: number;
}

export type Relationship = "self" | "friend" | "incoming" | "outgoing" | "none";
