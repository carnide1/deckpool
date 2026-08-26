/** Allowed Bandai card scan filenames only (no path segments). */
export const CARD_ART_FILE_RE =
  /^[A-Za-z0-9][A-Za-z0-9._-]{0,38}\.png$/;

export function isSafeCardArtFile(file: string): boolean {
  if (!file || file.includes("/") || file.includes("\\") || file.includes("..")) {
    return false;
  }
  return CARD_ART_FILE_RE.test(file);
}

/**
 * Extract the card PNG filename from a Bandai catalog image URL.
 * Query strings and fragments are ignored (stable cache keys).
 */
export function bandaiCardArtFile(catalogUrl: string): string | null {
  try {
    const parsed = new URL(catalogUrl);
    if (parsed.protocol !== "https:") return null;
    if (parsed.hostname !== "en.onepiece-cardgame.com") return null;
    const prefix = "/images/cardlist/card/";
    if (!parsed.pathname.startsWith(prefix)) return null;
    const file = parsed.pathname.slice(prefix.length);
    if (!isSafeCardArtFile(file)) return null;
    return file;
  } catch {
    return null;
  }
}

/** Same-origin proxy path for a validated Bandai card filename. */
export function cardArtProxyPath(file: string): string {
  return `/card-art/${encodeURIComponent(file)}`;
}

export function bandaiUpstreamUrl(file: string): string {
  return `https://en.onepiece-cardgame.com/images/cardlist/card/${file}`;
}
