import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { cleanCardsMap } from "@/lib/decks";
import { getFirebaseDb } from "@/lib/firebase";
import type { DeckShare } from "@/types/share";

const MAX_UNIQUE_CARDS = 60;

export function sharesCollectionRef() {
  return collection(getFirebaseDb(), "shares");
}

export function shareDocRef(shareId: string) {
  return doc(getFirebaseDb(), "shares", shareId);
}

export function sharePagePath(shareId: string): string {
  return `/s/${encodeURIComponent(shareId)}`;
}

/** Absolute URL for texting. Prefers an explicit origin, then env, then relative path. */
export function shareAbsoluteUrl(shareId: string, origin?: string): string {
  const path = sharePagePath(shareId);
  const fromArg = origin?.trim().replace(/\/$/, "") ?? "";
  if (fromArg) return `${fromArg}${path}`;

  const fromEnv = (process.env.NEXT_PUBLIC_APP_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (fromEnv) return `${fromEnv}${path}`;

  return path;
}

export function pickPreferredImagesForShare(
  cardIds: string[],
  preferredByCardId: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of cardIds) {
    const url = preferredByCardId[id];
    if (typeof url === "string" && url.startsWith("https://")) {
      out[id] = url;
    }
  }
  return out;
}

export function buildSharePayload(input: {
  ownerUid: string;
  deckId: string;
  variationId: string;
  deckName: string;
  leaderId: string;
  variationName: string;
  cards: Record<string, number>;
  preferredImages?: Record<string, string>;
}): Omit<DeckShare, "id" | "createdAt"> {
  const cards = cleanCardsMap(input.cards);
  if (Object.keys(cards).length > MAX_UNIQUE_CARDS) {
    throw new Error("This list has too many unique cards to share.");
  }
  if (!input.leaderId.trim()) {
    throw new Error("A Leader is required to share a deck.");
  }

  const preferredImages = pickPreferredImagesForShare(
    [input.leaderId, ...Object.keys(cards)],
    input.preferredImages ?? {},
  );

  return {
    ownerUid: input.ownerUid,
    deckId: input.deckId,
    variationId: input.variationId,
    deckName: input.deckName.trim() || "Untitled deck",
    leaderId: input.leaderId.trim(),
    variationName: input.variationName.trim() || "Main",
    cards,
    preferredImages,
  };
}

export function parseShare(
  shareId: string,
  data: Record<string, unknown>,
): DeckShare | null {
  if (typeof data.ownerUid !== "string" || !data.ownerUid) return null;
  if (typeof data.leaderId !== "string" || !data.leaderId) return null;
  if (typeof data.deckName !== "string") return null;
  if (typeof data.variationName !== "string") return null;

  const cards: Record<string, number> = {};
  if (data.cards && typeof data.cards === "object" && !Array.isArray(data.cards)) {
    for (const [id, qty] of Object.entries(
      data.cards as Record<string, unknown>,
    )) {
      if (typeof qty === "number" && qty > 0 && Number.isFinite(qty)) {
        cards[id] = Math.floor(qty);
      }
    }
  }

  const preferredImages: Record<string, string> = {};
  if (
    data.preferredImages &&
    typeof data.preferredImages === "object" &&
    !Array.isArray(data.preferredImages)
  ) {
    for (const [id, url] of Object.entries(
      data.preferredImages as Record<string, unknown>,
    )) {
      if (typeof url === "string" && url.startsWith("https://")) {
        preferredImages[id] = url;
      }
    }
  }

  return {
    id: shareId,
    ownerUid: data.ownerUid,
    deckId: typeof data.deckId === "string" ? data.deckId : "",
    variationId: typeof data.variationId === "string" ? data.variationId : "",
    deckName: data.deckName.trim() || "Untitled deck",
    leaderId: data.leaderId,
    variationName: data.variationName.trim() || "Main",
    cards,
    preferredImages,
    createdAt: data.createdAt,
  };
}

export async function createDeckShare(input: {
  ownerUid: string;
  deckId: string;
  variationId: string;
  deckName: string;
  leaderId: string;
  variationName: string;
  cards: Record<string, number>;
  preferredImages?: Record<string, string>;
}): Promise<DeckShare> {
  const payload = buildSharePayload(input);
  const ref = await addDoc(sharesCollectionRef(), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, ...payload };
}

export async function getDeckShare(shareId: string): Promise<DeckShare | null> {
  const id = shareId.trim();
  if (!id || id.length > 128 || /[\/\\]/.test(id)) return null;
  const snap = await getDoc(shareDocRef(id));
  if (!snap.exists()) return null;
  return parseShare(snap.id, snap.data() as Record<string, unknown>);
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error("Clipboard is not available in this browser.");
}
