/** Mirrored in firestore.rules (validUsername). Keep both in sync. */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.]{2,19}$/;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

/** Mirrored in firestore.rules (validUsername). Keep both in sync. */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  "admin",
  "deckpool",
  "support",
  "help",
  "mod",
  "moderator",
  "system",
  "null",
  "undefined",
]);

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Returns an error message, or null when the (already normalized) name is valid. */
export function validateUsername(name: string): string | null {
  if (name.length < USERNAME_MIN_LENGTH) {
    return `Username must be at least ${USERNAME_MIN_LENGTH} characters.`;
  }
  if (name.length > USERNAME_MAX_LENGTH) {
    return `Username must be at most ${USERNAME_MAX_LENGTH} characters.`;
  }
  if (!USERNAME_PATTERN.test(name)) {
    return "Use letters, numbers, _ or . and start with a letter or number.";
  }
  if (RESERVED_USERNAMES.has(name)) {
    return "That username is reserved.";
  }
  return null;
}
