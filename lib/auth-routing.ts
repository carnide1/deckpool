import { getOwnedCardCount } from "@/lib/users";

/** Auth landing pages: guests OK; signed-in users are sent into the app. */
export const AUTH_LANDING_ROUTES = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
]);

const SAFE_NEXT_PREFIXES = [
  "/collection",
  "/wanted",
  "/cards",
  "/explore",
  "/decks",
  "/profile",
] as const;

/** Give up on owned-count and send the user into the app. */
const POST_LOGIN_PATH_TIMEOUT_MS = 5_000;

export function isAuthLandingPath(pathname: string): boolean {
  return AUTH_LANDING_ROUTES.has(pathname);
}

/**
 * Validate a post-login return path from `?next=`.
 * Allows app routes (and their query strings); rejects open redirects and auth/share URLs.
 */
export function isSafeNextPath(raw: string | null | undefined): raw is string {
  if (!raw || typeof raw !== "string") return false;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return false;

  const pathOnly = path.split(/[?#]/, 1)[0] ?? path;
  if (!pathOnly || isAuthLandingPath(pathOnly)) return false;
  if (pathOnly === "/s" || pathOnly.startsWith("/s/")) return false;

  return SAFE_NEXT_PREFIXES.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`),
  );
}

/** Post-login destination: Decks, or Collection if binder is empty. Times out to /decks. */
export async function getPostLoginPath(uid: string): Promise<string> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const owned = await Promise.race([
      getOwnedCardCount(uid),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("post-login path timeout")),
          POST_LOGIN_PATH_TIMEOUT_MS,
        );
      }),
    ]);
    return owned === 0 ? "/collection" : "/decks";
  } catch {
    return "/decks";
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}
