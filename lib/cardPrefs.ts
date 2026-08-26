import { collection, doc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

const BANDAI_IMAGE_HOST = "en.onepiece-cardgame.com";

export function userCardPrefsRef(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "cardPrefs");
}

function cardPrefRef(uid: string, cardId: string) {
  return doc(getFirebaseDb(), "users", uid, "cardPrefs", cardId);
}

/**
 * Optional mirror: set NEXT_PUBLIC_CARD_IMAGE_ORIGIN to a host that serves the
 * same `/images/cardlist/card/...` paths (no trailing slash). Catalog and
 * Firestore still store Bandai URLs; only the browser request is rewritten.
 */
export function publicImageUrl(url: string): string {
  const origin = process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN?.replace(/\/$/, "");
  if (!origin) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== BANDAI_IMAGE_HOST) return url;
    return `${origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

export function imageForCard(
  card: { id: string; images: string[] },
  preferredByCardId: Record<string, string>,
): string | null {
  const preferred = preferredByCardId[card.id];
  if (preferred && card.images.includes(preferred)) return preferred;
  return card.images[0] ?? null;
}

/** Preferred art first, then every other catalog scan (for onError fallback). */
export function imageCandidates(
  card: { id: string; images: string[] },
  preferredByCardId: Record<string, string> = {},
): string[] {
  const primary = imageForCard(card, preferredByCardId);
  if (!primary) return [];
  const rest = card.images.filter((url) => url !== primary);
  return [primary, ...rest];
}

export async function setPreferredImage(
  uid: string,
  cardId: string,
  preferredImageUrl: string,
): Promise<void> {
  await setDoc(
    cardPrefRef(uid, cardId),
    { preferredImageUrl },
    { merge: true },
  );
}
