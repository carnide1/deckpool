import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { stripIllegalCards } from "@/lib/builder";
import { getConstructionRules } from "@/lib/construction";
import { getFirebaseDb } from "@/lib/firebase";
import type { Deck, Variation } from "@/types/deck";
import type { DeckPoolCard } from "@/types/catalog";
import type { ConstructionRule } from "@/types/construction";
import type { ProductContents, ProductIndexEntry } from "@/types/product";

export function userDecksRef(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "decks");
}

export function deckDocRef(uid: string, deckId: string) {
  return doc(getFirebaseDb(), "users", uid, "decks", deckId);
}

export function deckVariationsRef(uid: string, deckId: string) {
  return collection(getFirebaseDb(), "users", uid, "decks", deckId, "variations");
}

export function parseDeck(deckId: string, data: Record<string, unknown>): Deck {
  return {
    id: deckId,
    name: typeof data.name === "string" ? data.name : "Untitled deck",
    leaderId: typeof data.leaderId === "string" ? data.leaderId : "",
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export function parseVariation(
  variationId: string,
  data: Record<string, unknown>,
): Variation {
  const cards: Record<string, number> = {};
  if (data.cards && typeof data.cards === "object" && !Array.isArray(data.cards)) {
    for (const [id, qty] of Object.entries(
      data.cards as Record<string, unknown>,
    )) {
      if (typeof qty === "number" && qty > 0) cards[id] = qty;
    }
  }
  return {
    id: variationId,
    name: typeof data.name === "string" ? data.name : "Main",
    cards,
    updatedAt: data.updatedAt,
  };
}

export function mainDeckFromProductContents(
  contents: ProductContents,
  cardsById: Map<string, DeckPoolCard>,
): Record<string, number> {
  const cards: Record<string, number> = {};
  for (const [id, qty] of Object.entries(contents)) {
    if (qty <= 0) continue;
    const card = cardsById.get(id);
    if (!card || card.category === "Leader") continue;
    cards[id] = qty;
  }
  return cards;
}

export async function createDeckFromStarter(
  uid: string,
  product: ProductIndexEntry,
  contents: ProductContents,
  cardsById: Map<string, DeckPoolCard>,
): Promise<string> {
  const deckRef = await addDoc(userDecksRef(uid), {
    name: product.name,
    leaderId: product.leaderId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addDoc(deckVariationsRef(uid, deckRef.id), {
    name: "Main",
    cards: mainDeckFromProductContents(contents, cardsById),
    updatedAt: serverTimestamp(),
  });

  return deckRef.id;
}

export async function createDeck(
  uid: string,
  name: string,
  leaderId: string,
): Promise<string> {
  const deckRef = await addDoc(userDecksRef(uid), {
    name: name.trim() || "Untitled deck",
    leaderId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addDoc(deckVariationsRef(uid, deckRef.id), {
    name: "Main",
    cards: {},
    updatedAt: serverTimestamp(),
  });

  return deckRef.id;
}

export async function renameDeck(
  uid: string,
  deckId: string,
  name: string,
): Promise<void> {
  await updateDoc(deckDocRef(uid, deckId), {
    name: name.trim() || "Untitled deck",
    updatedAt: serverTimestamp(),
  });
}

export function variationDocRef(
  uid: string,
  deckId: string,
  variationId: string,
) {
  return doc(
    getFirebaseDb(),
    "users",
    uid,
    "decks",
    deckId,
    "variations",
    variationId,
  );
}

export function cleanCardsMap(cards: Record<string, number>): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [cardId, qty] of Object.entries(cards)) {
    if (qty > 0) next[cardId] = qty;
  }
  return next;
}

export async function setVariationCards(
  uid: string,
  deckId: string,
  variationId: string,
  cards: Record<string, number>,
): Promise<void> {
  await updateDoc(variationDocRef(uid, deckId, variationId), {
    cards: cleanCardsMap(cards),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(deckDocRef(uid, deckId), {
    updatedAt: serverTimestamp(),
  });
}

export async function cloneVariation(
  uid: string,
  deckId: string,
  source: Variation,
  name: string,
): Promise<string> {
  const ref = await addDoc(deckVariationsRef(uid, deckId), {
    name: name.trim() || `${source.name} copy`,
    cards: cleanCardsMap(source.cards),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(deckDocRef(uid, deckId), {
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function renameVariation(
  uid: string,
  deckId: string,
  variationId: string,
  name: string,
): Promise<void> {
  await updateDoc(variationDocRef(uid, deckId, variationId), {
    name: name.trim() || "Variation",
    updatedAt: serverTimestamp(),
  });
}

export async function deleteVariation(
  uid: string,
  deckId: string,
  variationId: string,
): Promise<void> {
  await deleteDoc(variationDocRef(uid, deckId, variationId));
  await updateDoc(deckDocRef(uid, deckId), {
    updatedAt: serverTimestamp(),
  });
}

export async function changeDeckLeader(
  uid: string,
  deckId: string,
  newLeaderId: string,
  cardsById: Map<string, DeckPoolCard>,
  rules: ConstructionRule[] = getConstructionRules(),
): Promise<void> {
  const db = getFirebaseDb();
  const variationsSnap = await getDocs(deckVariationsRef(uid, deckId));
  const batch = writeBatch(db);

  for (const variationSnap of variationsSnap.docs) {
    const variation = parseVariation(
      variationSnap.id,
      variationSnap.data() as Record<string, unknown>,
    );
    const stripped = stripIllegalCards(
      variation.cards,
      newLeaderId,
      cardsById,
      rules,
    );
    batch.update(variationSnap.ref, {
      cards: stripped,
      updatedAt: serverTimestamp(),
    });
  }

  batch.update(deckDocRef(uid, deckId), {
    leaderId: newLeaderId,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function deleteDeck(uid: string, deckId: string): Promise<void> {
  const db = getFirebaseDb();
  const variationsSnap = await getDocs(deckVariationsRef(uid, deckId));
  const batch = writeBatch(db);

  for (const variationSnap of variationsSnap.docs) {
    batch.delete(variationSnap.ref);
  }
  batch.delete(deckDocRef(uid, deckId));
  await batch.commit();
}
