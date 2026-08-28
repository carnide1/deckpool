import {
  collection,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { collectionDocRef } from "@/lib/collection";
import { getFirebaseDb } from "@/lib/firebase";
import { timestampToMillis } from "@/lib/timestamps";
import type { WantedItem } from "@/types/wanted";

export type CatchRequest = number | "all";

export type CatchResult = {
  caught: number;
  owned: number;
  wanted: number;
};

export function userWantedRef(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "wanted");
}

export function wantedDocRef(uid: string, cardId: string) {
  return doc(getFirebaseDb(), "users", uid, "wanted", cardId);
}

export function parseWantedItem(
  cardId: string,
  data: Record<string, unknown>,
): WantedItem {
  const rawQuantity = data.quantity;
  const quantity =
    typeof rawQuantity === "number" && Number.isFinite(rawQuantity)
      ? Math.max(0, Math.floor(rawQuantity))
      : 0;
  return {
    cardId,
    quantity,
    updatedAt: data.updatedAt,
    updatedAtMs: timestampToMillis(data.updatedAt),
  };
}

export function nextWantedQuantity(current: number, delta: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(delta)) return 0;
  return Math.max(0, Math.floor(current + delta));
}

export function nextToggleWanted(current: number): number {
  return current > 0 ? 0 : 1;
}

export function wantedGap(inDeck: number, owned: number): number {
  return Math.max(0, inDeck - owned);
}

export function raiseWantedToGap(currentWant: number, gap: number): number {
  return Math.max(currentWant, Math.max(0, gap));
}

export function catchAmount(
  currentWant: number,
  requested: CatchRequest,
): number {
  if (currentWant <= 0) return 0;
  const n = requested === "all" ? currentWant : requested;
  if (n <= 0) return 0;
  return Math.min(n, currentWant);
}

export function applyCatch(
  owned: number,
  wanted: number,
  requested: CatchRequest,
): CatchResult {
  const caught = catchAmount(wanted, requested);
  return {
    caught,
    owned: owned + caught,
    wanted: wanted - caught,
  };
}

export function gapsFromVariation(
  inDeckById: Record<string, number>,
  ownedQtyById: Record<string, number>,
): Record<string, number> {
  const gaps: Record<string, number> = {};
  for (const [cardId, inDeck] of Object.entries(inDeckById)) {
    if (inDeck <= 0) continue;
    const gap = wantedGap(inDeck, ownedQtyById[cardId] ?? 0);
    if (gap > 0) gaps[cardId] = gap;
  }
  return gaps;
}

export async function setWantedQuantity(
  uid: string,
  cardId: string,
  quantity: number,
): Promise<void> {
  const ref = wantedDocRef(uid, cardId);
  const normalized = Number.isFinite(quantity) ? Math.floor(quantity) : 0;
  if (normalized <= 0) {
    await deleteDoc(ref);
    return;
  }

  await setDoc(
    ref,
    { quantity: normalized, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** Atomically apply a stepper delta so rapid clicks cannot overwrite each other. */
export async function adjustWantedQuantity(
  uid: string,
  cardId: string,
  delta: number,
): Promise<number> {
  if (!Number.isFinite(delta) || delta === 0) return 0;

  const ref = wantedDocRef(uid, cardId);
  return runTransaction(getFirebaseDb(), async (tx) => {
    const snap = await tx.get(ref);
    const rawQuantity = snap.data()?.quantity;
    const current =
      typeof rawQuantity === "number" && Number.isFinite(rawQuantity)
        ? Math.max(0, Math.floor(rawQuantity))
        : 0;
    const next = nextWantedQuantity(current, delta);

    if (next <= 0) {
      if (snap.exists()) tx.delete(ref);
    } else {
      tx.set(
        ref,
        { quantity: next, updatedAt: serverTimestamp() },
        { merge: true },
      );
    }
    return next;
  });
}

export async function catchWantedCopies(
  uid: string,
  cardId: string,
  requested: CatchRequest,
): Promise<CatchResult> {
  const wantedRef = wantedDocRef(uid, cardId);
  const ownedRef = collectionDocRef(uid, cardId);

  return runTransaction(getFirebaseDb(), async (tx) => {
    const wantedSnap = await tx.get(wantedRef);
    const ownedSnap = await tx.get(ownedRef);

    const rawWant = wantedSnap.data()?.quantity;
    const currentWant =
      typeof rawWant === "number" && Number.isFinite(rawWant)
        ? Math.max(0, Math.floor(rawWant))
        : 0;
    const rawOwned = ownedSnap.data()?.quantity;
    const currentOwned =
      typeof rawOwned === "number" && Number.isFinite(rawOwned)
        ? Math.max(0, Math.floor(rawOwned))
        : 0;

    const result = applyCatch(currentOwned, currentWant, requested);
    if (result.caught <= 0) return result;

    tx.set(
      ownedRef,
      { quantity: result.owned, updatedAt: serverTimestamp() },
      { merge: true },
    );

    if (result.wanted <= 0) {
      if (wantedSnap.exists()) tx.delete(wantedRef);
    } else {
      tx.set(
        wantedRef,
        { quantity: result.wanted, updatedAt: serverTimestamp() },
        { merge: true },
      );
    }

    return result;
  });
}

export async function raiseWantedGaps(
  uid: string,
  gaps: Record<string, number>,
): Promise<number> {
  const entries = Object.entries(gaps).filter(([, gap]) => gap > 0);
  if (entries.length === 0) return 0;

  return runTransaction(getFirebaseDb(), async (tx) => {
    const reads: {
      cardId: string;
      gap: number;
      current: number;
    }[] = [];

    for (const [cardId, gap] of entries) {
      const snap = await tx.get(wantedDocRef(uid, cardId));
      const rawQuantity = snap.data()?.quantity;
      const current =
        typeof rawQuantity === "number" && Number.isFinite(rawQuantity)
          ? Math.max(0, Math.floor(rawQuantity))
          : 0;
      reads.push({ cardId, gap, current });
    }

    let updated = 0;
    for (const row of reads) {
      const next = raiseWantedToGap(row.current, row.gap);
      if (next <= 0 || next === row.current) continue;
      tx.set(
        wantedDocRef(uid, row.cardId),
        { quantity: next, updatedAt: serverTimestamp() },
        { merge: true },
      );
      updated += 1;
    }

    return updated;
  });
}
