import {
  VARIATION_UNIQUE_CARD_MAX,
  cleanCardsMap,
} from "@/lib/decks";
import type { DeckPoolCard } from "@/types/catalog";

/** Printed card numbers. `x` may sit immediately in front (`1xOP01-016`). */
const CARD_ID_RE = /(?:OP|ST|EB|PRB)\d{2}-\d{3}|P-\d{3}/gi;
const DON_RE = /don!!/i;

export const DECK_LIST_PASTE_MAX = 20_000;

export type DeckListSkipKind = "no-number" | "no-count" | "unknown" | "don";

export type DeckListSkip = {
  kind: DeckListSkipKind;
  text: string;
};

export type DeckListParse = {
  cards: Record<string, number>;
  leaderIds: string[];
  skipped: DeckListSkip[];
  /** Set when Import must not write. Null when the paste may be saved. */
  blocked: string | null;
};

type IdHit = {
  id: string;
  index: number;
  end: number;
};

function isIdStart(text: string, index: number): boolean {
  if (index === 0) return true;
  const prev = text[index - 1] ?? "";
  if (!/[A-Za-z0-9]/.test(prev)) return true;
  // The x in `1xOP01-016` is a count marker, not part of a longer token.
  if (/[xX]/.test(prev)) {
    if (index === 1) return true;
    const beforeX = text[index - 2] ?? "";
    return !/[A-Za-z]/.test(beforeX);
  }
  return false;
}

function isIdEnd(text: string, end: number): boolean {
  if (end >= text.length) return true;
  return !/[A-Za-z0-9]/.test(text[end] ?? "");
}

function findCardIds(text: string): IdHit[] {
  const hits: IdHit[] = [];
  CARD_ID_RE.lastIndex = 0;
  let match = CARD_ID_RE.exec(text);
  while (match) {
    const raw = match[0] ?? "";
    const index = match.index;
    const end = index + raw.length;
    if (isIdStart(text, index) && isIdEnd(text, end)) {
      hits.push({ id: raw.toUpperCase(), index, end });
    }
    match = CARD_ID_RE.exec(text);
  }
  return hits;
}

function quantityBeside(prefix: string, suffix: string): number | null {
  const suffixMatch = /^\s*x\s*(\d+)/i.exec(suffix);
  if (suffixMatch) return Number(suffixMatch[1]);
  const prefixX = /(\d+)\s*x\s*$/i.exec(prefix);
  if (prefixX) return Number(prefixX[1]);
  const leading = prefix.match(/\d+/);
  if (!leading) return null;
  return Number(leading[0]);
}

/** Same line as `index`, not including the newline. */
function lineSlice(text: string, index: number): { start: number; end: number } {
  const start = text.lastIndexOf("\n", index - 1) + 1;
  const nl = text.indexOf("\n", index);
  return { start, end: nl === -1 ? text.length : nl };
}

/**
 * Read a pasted deck list. Leader lines must match `leaderId`.
 * Main-deck counts are summed by card number. Nothing is written here.
 */
export function parseDeckList(
  text: string,
  cardsById: Map<string, DeckPoolCard>,
  leaderId: string,
): DeckListParse {
  const hits = findCardIds(text);
  const skipped: DeckListSkip[] = [];
  const leaderIds: string[] = [];
  const seenLeaders = new Set<string>();
  const rawCards: Record<string, number> = {};

  const hitLineStarts = new Set<number>();
  for (const hit of hits) {
    hitLineStarts.add(lineSlice(text, hit.index).start);
  }
  let lineStart = 0;
  while (lineStart <= text.length) {
    const nl = text.indexOf("\n", lineStart);
    const lineEnd = nl === -1 ? text.length : nl;
    const contentEnd =
      lineEnd > lineStart && text[lineEnd - 1] === "\r" ? lineEnd - 1 : lineEnd;
    const trimmed = text.slice(lineStart, contentEnd).trim();
    if (trimmed && !hitLineStarts.has(lineStart)) {
      skipped.push({
        kind: DON_RE.test(trimmed) ? "don" : "no-number",
        text: trimmed,
      });
    }
    if (nl === -1) break;
    lineStart = nl + 1;
  }

  for (let i = 0; i < hits.length; i += 1) {
    const hit = hits[i];
    if (!hit) continue;
    const prevEnd = i === 0 ? 0 : (hits[i - 1]?.end ?? 0);
    const nextStart = hits[i + 1]?.index ?? text.length;
    const line = lineSlice(text, hit.index);
    const prefix = text.slice(Math.max(line.start, prevEnd), hit.index);
    const suffix = text.slice(hit.end, Math.min(line.end, nextStart));
    const qty = quantityBeside(prefix, suffix);
    const card = cardsById.get(hit.id);

    if (!card) {
      skipped.push({ kind: "unknown", text: hit.id });
      continue;
    }

    if (card.category === "Leader") {
      if (!seenLeaders.has(hit.id)) {
        seenLeaders.add(hit.id);
        leaderIds.push(hit.id);
      }
      continue;
    }

    const count = qty === null ? null : Math.floor(qty);
    if (count === null || count < 1 || !Number.isSafeInteger(count)) {
      skipped.push({ kind: "no-count", text: hit.id });
      continue;
    }

    const nextQty = (rawCards[hit.id] ?? 0) + count;
    if (!Number.isSafeInteger(nextQty)) {
      skipped.push({ kind: "no-count", text: hit.id });
      continue;
    }
    rawCards[hit.id] = nextQty;
  }

  const cards = cleanCardsMap(rawCards);
  const deckLeader = cardsById.get(leaderId);
  const uniqueCount = Object.keys(cards).length;
  let blocked: string | null = null;

  if (!deckLeader || deckLeader.category !== "Leader") {
    blocked = "This deck's Leader is not in the catalog.";
  } else if (leaderIds.length === 0) {
    blocked = "This list has no Leader. Paste a list that includes this deck's Leader.";
  } else if (leaderIds.length > 1) {
    blocked = "This list includes more than one Leader.";
  } else if (leaderIds[0] !== deckLeader.id) {
    const other = cardsById.get(leaderIds[0] ?? "");
    const label = other?.name ?? leaderIds[0];
    blocked = `This list is for ${label}, not ${deckLeader.name}.`;
  } else if (uniqueCount === 0) {
    blocked = "No cards to import.";
  } else if (uniqueCount > VARIATION_UNIQUE_CARD_MAX) {
    blocked = `This list has ${uniqueCount} different cards. A variation can hold ${VARIATION_UNIQUE_CARD_MAX}.`;
  }

  return { cards, leaderIds, skipped, blocked };
}

/** OPTCGSim clipboard text. Leader first, then card ids A–Z. */
export function formatOptcgSimList(
  leaderId: string,
  cards: Record<string, number>,
): string {
  const leader = leaderId.trim().toUpperCase();
  const cleaned = cleanCardsMap(cards);
  delete cleaned[leader];
  const lines = [`1x${leader}`];
  const ids = Object.keys(cleaned).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  for (const id of ids) {
    lines.push(`${cleaned[id]}x${id}`);
  }
  return lines.join("\n");
}
