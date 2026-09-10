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

/** Matches firestore.rules label list size cap. */
export const MAX_COLLECTION_LABELS = 50;

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

export function normalizeCollectionLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of labels) {
    if (typeof label !== "string") continue;
    const trimmed = label.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= MAX_COLLECTION_LABELS) break;
  }
  return out.sort((a, b) => a.localeCompare(b));
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
  if (labels !== undefined) {
    payload.labels = normalizeCollectionLabels(labels);
  }
  await setDoc(ref, payload, { merge: true });
}

/**
 * Update labels without rewriting quantity.
 * Avoids races where a stale ownedMap qty overwrites a concurrent stepper/catch.
 */
export async function setCollectionLabels(
  uid: string,
  cardId: string,
  labels: string[],
  allowCreate: boolean,
): Promise<void> {
  const ref = collectionDocRef(uid, cardId);
  const nextLabels = normalizeCollectionLabels(labels);
  await runTransaction(getFirebaseDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      if (nextLabels.length === 0 || !allowCreate) return;
      tx.set(ref, {
        quantity: 1,
        labels: nextLabels,
        updatedAt: serverTimestamp(),
      });
      return;
    }
    tx.update(ref, {
      labels: nextLabels,
      updatedAt: serverTimestamp(),
    });
  });
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
    const rawQuantity = snap.data()?.quantity;
    const current =
      typeof rawQuantity === "number" && Number.isFinite(rawQuantity)
        ? Math.max(0, Math.floor(rawQuantity))
        : 0;
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
