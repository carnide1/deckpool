import {
  bandaiCardArtFile,
  cardArtProxyPath,
} from "@/lib/cardArtPath";

const BANDAI_IMAGE_HOST = "en.onepiece-cardgame.com";

let warnedInvalidOrigin = false;

/**
 * Optional mirror: NEXT_PUBLIC_CARD_IMAGE_ORIGIN = https origin with no trailing
 * slash that serves the same `/images/cardlist/card/...` paths as Bandai.
 * Invalid values are ignored so a bad Vercel env cannot blank every tile.
 */
export function getCardImageMirrorOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN?.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    // HTTPS only — http mirrors are mixed content on production deploys.
    if (parsed.protocol !== "https:") {
      warnInvalidOrigin(raw);
      return null;
    }
    return raw.replace(/\/$/, "");
  } catch {
    warnInvalidOrigin(raw);
    return null;
  }
}

function warnInvalidOrigin(raw: string): void {
  if (warnedInvalidOrigin) return;
  warnedInvalidOrigin = true;
  console.warn(
    `[DeckPool] Ignoring invalid NEXT_PUBLIC_CARD_IMAGE_ORIGIN: ${JSON.stringify(raw)}`,
  );
}

/** Rewrite a Bandai catalog URL onto the mirror origin when configured. */
export function publicImageUrl(url: string): string {
  const origin = getCardImageMirrorOrigin();
  if (!origin) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== BANDAI_IMAGE_HOST) return url;
    // Drop query for stable mirror keys (ingest already strips these).
    return `${origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

/**
 * Browser-safe URL for a catalog image.
 * Bandai → `/card-art/{file}.png` (same-origin proxy).
 */
export function browserImageUrl(catalogUrl: string): string {
  const file = bandaiCardArtFile(catalogUrl);
  if (file) return cardArtProxyPath(file);
  return catalogUrl;
}

/**
 * Browser load order for one catalog URL: optional mirror, then Bandai via
 * same-origin proxy.
 */
export function urlsForCatalogImage(catalogUrl: string): string[] {
  if (!catalogUrl) return [];
  const mirrored = publicImageUrl(catalogUrl);
  const proxied = browserImageUrl(catalogUrl);
  if (mirrored !== catalogUrl && mirrored !== proxied) {
    return [mirrored, proxied];
  }
  return [proxied];
}

/**
 * Expand preferred + alternate catalog scans into the ordered list the <img>
 * should try (mirror then proxied Bandai per scan, deduped).
 */
export function displayImageCandidates(catalogUrls: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of catalogUrls) {
    if (!raw) continue;
    for (const url of urlsForCatalogImage(raw)) {
      if (seen.has(url)) continue;
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

export function imageForCard(
  card: { id: string; images: string[] },
  preferredByCardId: Record<string, string>,
): string | null {
  const preferred = preferredByCardId[card.id];
  if (preferred && card.images.includes(preferred)) return preferred;
  return card.images[0] ?? null;
}

/** Preferred art first, then every other catalog scan. */
export function imageCandidates(
  card: { id: string; images: string[] },
  preferredByCardId: Record<string, string> = {},
): string[] {
  const primary = imageForCard(card, preferredByCardId);
  if (!primary) return [];
  const rest = card.images.filter((url) => url !== primary);
  return [primary, ...rest];
}
