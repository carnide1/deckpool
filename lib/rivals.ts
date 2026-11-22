import {
  collection,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { timestampToMillis } from "@/lib/timestamps";
import {
  RIVAL_CARD_LIST_MAX,
  RIVAL_DECK_NAME_MAX,
  RIVAL_NOTES_MAX,
  RIVAL_VS_DECKS_MAX,
  type RivalJournal,
  type RivalVsDeckNotes,
} from "@/types/rival";

export function userRivalsRef(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "rivals");
}

export function rivalDocRef(uid: string, leaderId: string) {
  return doc(getFirebaseDb(), "users", uid, "rivals", leaderId);
}

export function emptyRivalJournal(leaderId: string): RivalJournal {
  return {
    leaderId,
    keyPieceIds: [],
    techOptionIds: [],
    notes: "",
    vsDecks: {},
    updatedAtMs: 0,
  };
}

export function cleanCardIdList(
  ids: unknown,
  { exclude }: { exclude?: ReadonlySet<string> } = {},
): string[] {
  if (!Array.isArray(ids)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    if (typeof raw !== "string") continue;
    const id = raw.trim();
    if (!id || id.length > 32) continue;
    if (exclude?.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= RIVAL_CARD_LIST_MAX) break;
  }
  return out;
}

/** Move ids into `target`, removing them from `other`. */
export function assignCardBucket(
  _target: readonly string[],
  other: readonly string[],
  nextTarget: readonly string[],
): { target: string[]; other: string[] } {
  const cleanedTarget = cleanCardIdList(nextTarget);
  const targetSet = new Set(cleanedTarget);
  const cleanedOther = cleanCardIdList(other, { exclude: targetSet });
  return { target: cleanedTarget, other: cleanedOther };
}

export function clampNotes(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.slice(0, RIVAL_NOTES_MAX);
}

export function clampDeckName(raw: unknown): string {
  if (typeof raw !== "string") return "Deleted deck";
  const trimmed = raw.trim().slice(0, RIVAL_DECK_NAME_MAX);
  return trimmed || "Deleted deck";
}

export function clampRecordCount(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
  return Math.max(0, Math.floor(raw));
}

export function nextRecordCount(current: number, delta: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(delta)) return 0;
  return Math.max(0, Math.floor(current + delta));
}

export function parseVsDeckNotes(
  deckId: string,
  data: Record<string, unknown>,
): RivalVsDeckNotes {
  return {
    deckId,
    deckName: clampDeckName(data.deckName),
    notes: clampNotes(data.notes),
    wins: clampRecordCount(data.wins),
    losses: clampRecordCount(data.losses),
    updatedAt: data.updatedAt,
    updatedAtMs: timestampToMillis(data.updatedAt),
  };
}

export function parseRivalJournal(
  leaderId: string,
  data: Record<string, unknown>,
): RivalJournal {
  const keyPieceIds = cleanCardIdList(data.keyPieceIds);
  const keySet = new Set(keyPieceIds);
  const techOptionIds = cleanCardIdList(data.techOptionIds, {
    exclude: keySet,
  });

  const vsDecks: Record<string, RivalVsDeckNotes> = {};
  const rawVs =
    data.vsDecks && typeof data.vsDecks === "object"
      ? (data.vsDecks as Record<string, unknown>)
      : {};
  for (const [deckId, value] of Object.entries(rawVs)) {
    if (!deckId || deckId.length > 64) continue;
    if (!value || typeof value !== "object") continue;
    vsDecks[deckId] = parseVsDeckNotes(
      deckId,
      value as Record<string, unknown>,
    );
    if (Object.keys(vsDecks).length >= RIVAL_VS_DECKS_MAX) break;
  }

  return {
    leaderId,
    keyPieceIds,
    techOptionIds,
    notes: clampNotes(data.notes),
    vsDecks,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    updatedAtMs: timestampToMillis(data.updatedAt),
  };
}

export function totalRecord(journal: RivalJournal): {
  wins: number;
  losses: number;
} {
  let wins = 0;
  let losses = 0;
  for (const block of Object.values(journal.vsDecks)) {
    wins += block.wins;
    losses += block.losses;
  }
  return { wins, losses };
}

function vsDecksForWrite(
  vsDecks: Record<string, RivalVsDeckNotes>,
): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const [deckId, block] of Object.entries(vsDecks)) {
    out[deckId] = {
      deckName: clampDeckName(block.deckName),
      notes: clampNotes(block.notes),
      wins: clampRecordCount(block.wins),
      losses: clampRecordCount(block.losses),
      updatedAt: block.updatedAt ?? serverTimestamp(),
    };
  }
  return out;
}

function journalPayload(journal: RivalJournal): Record<string, unknown> {
  return {
    leaderId: journal.leaderId,
    keyPieceIds: journal.keyPieceIds,
    techOptionIds: journal.techOptionIds,
    notes: journal.notes,
    vsDecks: vsDecksForWrite(journal.vsDecks),
    createdAt: journal.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/**
 * Read-modify-write inside a transaction so notes / W-L / key-tech edits
 * cannot silently overwrite each other.
 */
async function updateRivalJournal(
  uid: string,
  leaderId: string,
  mutate: (current: RivalJournal) => RivalJournal,
): Promise<void> {
  const ref = rivalDocRef(uid, leaderId);
  await runTransaction(getFirebaseDb(), async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists()
      ? parseRivalJournal(leaderId, snap.data() as Record<string, unknown>)
      : emptyRivalJournal(leaderId);
    const next = mutate(current);
    tx.set(ref, journalPayload({ ...next, leaderId }));
  });
}

/** Create an empty journal if missing; return the parsed journal. */
export async function ensureRivalJournal(
  uid: string,
  leaderId: string,
): Promise<RivalJournal> {
  const id = leaderId.trim();
  if (!id) throw new Error("Pick a Leader.");
  const ref = rivalDocRef(uid, id);
  return runTransaction(getFirebaseDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      return parseRivalJournal(id, snap.data() as Record<string, unknown>);
    }
    const empty = emptyRivalJournal(id);
    tx.set(ref, {
      leaderId: id,
      keyPieceIds: [],
      techOptionIds: [],
      notes: "",
      vsDecks: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return empty;
  });
}

export async function deleteRivalJournal(
  uid: string,
  leaderId: string,
): Promise<void> {
  await deleteDoc(rivalDocRef(uid, leaderId));
}

export async function setRivalCardBuckets(
  uid: string,
  leaderId: string,
  keyPieceIds: readonly string[],
  techOptionIds: readonly string[],
): Promise<void> {
  const key = cleanCardIdList(keyPieceIds);
  const tech = cleanCardIdList(techOptionIds, { exclude: new Set(key) });
  await updateRivalJournal(uid, leaderId, (current) => ({
    ...current,
    keyPieceIds: key,
    techOptionIds: tech,
  }));
}

export async function setRivalGeneralNotes(
  uid: string,
  leaderId: string,
  notes: string,
): Promise<void> {
  await updateRivalJournal(uid, leaderId, (current) => ({
    ...current,
    notes: clampNotes(notes),
  }));
}

export async function upsertRivalVsDeck(
  uid: string,
  leaderId: string,
  deckId: string,
  patch: {
    deckName: string;
    notes?: string;
    wins?: number;
    losses?: number;
  },
): Promise<void> {
  await updateRivalJournal(uid, leaderId, (current) => {
    if (
      !current.vsDecks[deckId] &&
      Object.keys(current.vsDecks).length >= RIVAL_VS_DECKS_MAX
    ) {
      throw new Error("Too many deck notes on this rival.");
    }

    const prev = current.vsDecks[deckId];
    const nextBlock: RivalVsDeckNotes = {
      deckId,
      deckName: clampDeckName(patch.deckName || prev?.deckName),
      notes:
        patch.notes !== undefined
          ? clampNotes(patch.notes)
          : (prev?.notes ?? ""),
      wins:
        patch.wins !== undefined
          ? clampRecordCount(patch.wins)
          : (prev?.wins ?? 0),
      losses:
        patch.losses !== undefined
          ? clampRecordCount(patch.losses)
          : (prev?.losses ?? 0),
      updatedAt: undefined,
      updatedAtMs: Date.now(),
    };

    return {
      ...current,
      vsDecks: { ...current.vsDecks, [deckId]: nextBlock },
    };
  });
}

export async function adjustRivalVsDeckRecord(
  uid: string,
  leaderId: string,
  deckId: string,
  field: "wins" | "losses",
  delta: number,
): Promise<void> {
  await updateRivalJournal(uid, leaderId, (current) => {
    const prev = current.vsDecks[deckId];
    if (!prev) throw new Error("Deck notes not found.");
    return {
      ...current,
      vsDecks: {
        ...current.vsDecks,
        [deckId]: {
          ...prev,
          [field]: nextRecordCount(prev[field], delta),
          updatedAt: undefined,
          updatedAtMs: Date.now(),
        },
      },
    };
  });
}

export async function removeRivalVsDeck(
  uid: string,
  leaderId: string,
  deckId: string,
): Promise<void> {
  await updateRivalJournal(uid, leaderId, (current) => {
    if (!current.vsDecks[deckId]) return current;
    const vsDecks = { ...current.vsDecks };
    delete vsDecks[deckId];
    return { ...current, vsDecks };
  });
}
