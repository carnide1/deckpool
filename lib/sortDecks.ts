import { OPTCG_COLORS } from "@/lib/search/filters";
import { timestampToMillis } from "@/lib/timestamps";
import type { DeckPoolCard } from "@/types/catalog";
import type { Deck } from "@/types/deck";

export type DeckSortKey =
  | "edited"
  | "edited-asc"
  | "name"
  | "name-desc"
  | "leader"
  | "color"
  | "created"
  | "created-asc";

export const DECK_SORTS: DeckSortKey[] = [
  "edited",
  "edited-asc",
  "name",
  "name-desc",
  "leader",
  "color",
  "created",
  "created-asc",
];

const DECK_SORT_STORAGE_KEY = "deckpool.deckSort";

export function parseDeckSort(raw: string | null | undefined): DeckSortKey {
  if (raw && (DECK_SORTS as readonly string[]).includes(raw)) {
    return raw as DeckSortKey;
  }
  return "edited";
}

export function readStoredDeckSort(): DeckSortKey {
  if (typeof window === "undefined") return "edited";
  try {
    return parseDeckSort(window.localStorage.getItem(DECK_SORT_STORAGE_KEY));
  } catch {
    return "edited";
  }
}

export function writeStoredDeckSort(key: DeckSortKey): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DECK_SORT_STORAGE_KEY, key);
  } catch {
    // Private mode or a full quota. The dropdown still updates for this visit.
  }
}

export const DECK_SORT_LABELS: Record<DeckSortKey, string> = {
  edited: "Last edited",
  "edited-asc": "Oldest edit",
  name: "Name",
  "name-desc": "Name (Z–A)",
  leader: "Leader",
  color: "Color",
  created: "Newest created",
  "created-asc": "Oldest created",
};

/** Past the last real color, so an unrecognized color sorts after Yellow. */
const UNKNOWN_COLOR_RANK = OPTCG_COLORS.length;
/** Past unrecognized colors, so a missing Leader sorts last. */
const MISSING_LEADER_RANK = OPTCG_COLORS.length + 1;

function editedMillis(deck: Deck): number {
  return timestampToMillis(deck.updatedAt ?? deck.createdAt);
}

function createdMillis(deck: Deck): number {
  return timestampToMillis(deck.createdAt);
}

function compareName(a: Deck, b: Deck): number {
  return a.name.localeCompare(b.name);
}

function compareId(a: Deck, b: Deck): number {
  return a.id.localeCompare(b.id);
}

function compareNameThenId(a: Deck, b: Deck): number {
  const name = compareName(a, b);
  return name !== 0 ? name : compareId(a, b);
}

function leaderLabel(
  deck: Deck,
  leaderById: ReadonlyMap<string, DeckPoolCard>,
): string {
  return leaderById.get(deck.leaderId)?.name ?? deck.leaderId;
}

function colorRanks(leader: DeckPoolCard | undefined): number[] {
  if (!leader || leader.colors.length === 0) return [MISSING_LEADER_RANK];
  return leader.colors.map((color) => {
    const index = OPTCG_COLORS.indexOf(color);
    return index === -1 ? UNKNOWN_COLOR_RANK : index;
  });
}

function compareColorRanks(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return a.length - b.length;
}

function compareDecks(
  a: Deck,
  b: Deck,
  key: DeckSortKey,
  leaderById: ReadonlyMap<string, DeckPoolCard>,
): number {
  switch (key) {
    case "edited": {
      const delta = editedMillis(b) - editedMillis(a);
      return delta !== 0 ? delta : compareNameThenId(a, b);
    }
    case "edited-asc": {
      const delta = editedMillis(a) - editedMillis(b);
      return delta !== 0 ? delta : compareNameThenId(a, b);
    }
    case "name":
      return compareNameThenId(a, b);
    case "name-desc": {
      const name = compareName(b, a);
      return name !== 0 ? name : compareId(a, b);
    }
    case "leader": {
      const leader = leaderLabel(a, leaderById).localeCompare(
        leaderLabel(b, leaderById),
      );
      return leader !== 0 ? leader : compareNameThenId(a, b);
    }
    case "color": {
      const leaderA = leaderById.get(a.leaderId);
      const leaderB = leaderById.get(b.leaderId);
      const color = compareColorRanks(colorRanks(leaderA), colorRanks(leaderB));
      if (color !== 0) return color;
      if (!leaderA && !leaderB) {
        const leaderId = a.leaderId.localeCompare(b.leaderId);
        if (leaderId !== 0) return leaderId;
      }
      return compareNameThenId(a, b);
    }
    case "created": {
      const delta = createdMillis(b) - createdMillis(a);
      return delta !== 0 ? delta : compareNameThenId(a, b);
    }
    case "created-asc": {
      const delta = createdMillis(a) - createdMillis(b);
      return delta !== 0 ? delta : compareNameThenId(a, b);
    }
    default:
      return compareNameThenId(a, b);
  }
}

export function sortDecks(
  decks: Deck[],
  key: DeckSortKey,
  leaderById: ReadonlyMap<string, DeckPoolCard>,
): Deck[] {
  const next = [...decks];
  next.sort((a, b) => compareDecks(a, b, key, leaderById));
  return next;
}
