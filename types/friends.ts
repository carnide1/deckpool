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

export type Relationship = "self" | "friend" | "incoming" | "outgoing" | "none";
