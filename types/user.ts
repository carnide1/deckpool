export interface UserProfile {
  displayName: string;
  email: string;
  createdAt?: unknown;
  /** From profiles/{uid}; null until the account claims a username. */
  username: string | null;
}
