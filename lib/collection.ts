import {
  collection,
  deleteDoc,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { mergeLabels } from "@/lib/labels";
import { timestampToMillis } from "@/lib/timestamps";
import type { CollectionItem } from "@/types/collection";

export function userCollectionRef(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "collection");
}

export function collectionDocRef(uid: string, cardId: string) {
  return doc(getFirebaseDb(), "users", uid, "collection", cardId);
}

export function parseCollectionItem(
  cardId: string,
  data: Record<string, unknown>,
): CollectionItem {
  const rawQuantity = data.quantity;
  const quantity =
    typeof rawQuantity === "number" && Number.isFinite(rawQuantity)
      ? Math.max(0, Math.floor(rawQuantity))
      : 0;
  return {
    cardId,
    quantity,
    labels: Array.isArray(data.labels)
      ? data.labels.filter((l): l is string => typeof l === "string")
      : [],
    updatedAt: data.updatedAt,
    updatedAtMs: timestampToMillis(data.updatedAt),
  };
}

export function nextCollectionQuantity(
  current: number,
  delta: number,
  allowCreate: boolean,
): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(delta)) return null;
  if (current <= 0 && delta > 0 && !allowCreate) return null;
  return Math.max(0, current + delta);
}

export async function setCollectionQuantity(
  uid: string,
  cardId: string,
  quantity: number,
  labels?: string[],
): Promise<void> {
  const ref = collectionDocRef(uid, cardId);
  const normalized = Number.isFinite(quantity) ? Math.floor(quantity) : 0;
  if (normalized <= 0) {
    await deleteDoc(ref);
    return;
  }

  const payload: Record<string, unknown> = {
    quantity: normalized,
    updatedAt: serverTimestamp(),
  };
  if (labels !== undefined) payload.labels = labels;
  await setDoc(ref, payload, { merge: true });
}

export async function adjustCollectionQuantity(
  uid: string,
  cardId: string,
  delta: number,
  allowCreate: boolean,
): Promise<number> {
  const ref = collectionDocRef(uid, cardId);
  return runTransaction(getFirebaseDb(), async (tx) => {
    const snap = await tx.get(ref);
    const current =
      typeof snap.data()?.quantity === "number" ? snap.data()!.quantity : 0;
    const next = nextCollectionQuantity(current, delta, allowCreate);
    if (next === null) return current;
    if (next <= 0) {
      if (snap.exists()) tx.delete(ref);
      return 0;
    }
    tx.set(
      ref,
      { quantity: next, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return next;
  });
}

export async function incrementCollectionFromProduct(
  uid: string,
  contents: Record<string, number>,
  extraLabels: string[],
  ownedMap: Record<string, CollectionItem>,
): Promise<void> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  const now = serverTimestamp();

  for (const [cardId, addQty] of Object.entries(contents)) {
    if (addQty <= 0) continue;
    const existing = ownedMap[cardId];
    // Atomic qty bump — do not trust ownedMap for the written quantity.
    const payload: Record<string, unknown> = {
      quantity: increment(addQty),
      updatedAt: now,
    };
    if (extraLabels.length > 0 || (existing?.labels.length ?? 0) > 0) {
      payload.labels = mergeLabels(existing?.labels ?? [], extraLabels);
    }
    batch.set(collectionDocRef(uid, cardId), payload, { merge: true });
  }

  await batch.commit();
}
