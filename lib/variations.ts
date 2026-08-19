import { timestampToMillis } from "@/lib/timestamps";
import type { Variation } from "@/types/deck";

/** Pick the pinned main list, then fall back to a variation named Main, then recency. */
export function resolveFavoriteVariationId(
  favoriteVariationId: string | null | undefined,
  variations: Pick<Variation, "id" | "name" | "updatedAt">[],
): string | null {
  if (variations.length === 0) return null;
  if (
    favoriteVariationId &&
    variations.some((row) => row.id === favoriteVariationId)
  ) {
    return favoriteVariationId;
  }
  const namedMain = variations.find((row) => row.name === "Main");
  if (namedMain) return namedMain.id;
  return sortVariations(variations, null)[0]?.id ?? null;
}

/** Pin the resolved favorite (stored id, else Main, else recency), then recency. */
export function orderVariations<T extends Pick<Variation, "id" | "name" | "updatedAt">>(
  variations: T[],
  favoriteVariationId: string | null | undefined,
): T[] {
  return sortVariations(
    variations,
    resolveFavoriteVariationId(favoriteVariationId, variations),
  );
}

/** Favorite first, then most recently edited, then name. */
export function sortVariations<T extends Pick<Variation, "id" | "name" | "updatedAt">>(
  variations: T[],
  favoriteVariationId: string | null | undefined,
): T[] {
  const favoriteId =
    favoriteVariationId &&
    variations.some((row) => row.id === favoriteVariationId)
      ? favoriteVariationId
      : null;

  return [...variations].sort((a, b) => {
    if (favoriteId) {
      if (a.id === favoriteId) return -1;
      if (b.id === favoriteId) return 1;
    }
    const bm = timestampToMillis(b.updatedAt);
    const am = timestampToMillis(a.updatedAt);
    if (bm !== am) return bm - am;
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });
}
