import blockMap from "@/data/blocks.json";
import type { BlockId } from "@/types/catalog";

export const BLOCK_IDS: BlockId[] = ["1", "2", "3", "4", "5", "X"];

const blocks = blockMap as Record<string, string>;

export function isBlockId(value: string): value is BlockId {
  return (BLOCK_IDS as string[]).includes(value);
}

/** Booster packs 1–4 are block 1, 5–8 are block 2, and so on, through block 5. */
export function opBoosterBlock(setNumber: number): BlockId | null {
  if (!Number.isInteger(setNumber) || setNumber < 1 || setNumber > 20) {
    return null;
  }
  const block = String(Math.ceil(setNumber / 4));
  return isBlockId(block) ? block : null;
}

/**
 * Pick one block from the printings that were observed.
 * A lone X stays X. A number plus X keeps the number, because a manga printing
 * can be indexed under X while Bandai's current number is still the number.
 * Two numbers keep the higher one (the updated block).
 * Official overrides are applied by assignBlock and win.
 */
export function resolveObservedBlock(
  seen: readonly string[],
): BlockId | null {
  const valid = [...new Set(seen.filter(isBlockId))];
  const numbers = valid.filter((block) => block !== "X");
  if (numbers.length === 0) return valid.includes("X") ? "X" : null;
  return numbers.sort((a, b) => Number(a) - Number(b)).at(-1) ?? null;
}

export function assignBlock(
  seen: readonly string[] | undefined,
  override: string | undefined,
): BlockId | null {
  if (override !== undefined) return isBlockId(override) ? override : null;
  if (!seen) return null;
  return resolveObservedBlock(seen);
}

export function blockForId(cardId: string): BlockId | null {
  const value = blocks[cardId];
  return value !== undefined && isBlockId(value) ? value : null;
}

export function withBlock<T extends { id: string }>(
  card: T,
): T & { block: BlockId | null } {
  return { ...card, block: blockForId(card.id) };
}
