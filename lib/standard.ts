import standardFile from "@/data/standard.json";
import type { BlockId, DeckPoolCard } from "@/types/catalog";
import type { StandardRules } from "@/types/standard";

function sortPair(pair: [string, string]): [string, string] {
  return pair[0] <= pair[1] ? pair : [pair[1], pair[0]];
}

const raw = standardFile as unknown as StandardRules;

const standardRules: StandardRules = {
  minBlock: raw.minBlock,
  banned: [...raw.banned],
  restricted: raw.restricted.map((row) => ({ ...row })),
  bannedPairs: raw.bannedPairs.map((pair) => sortPair(pair)),
};

export function getStandardRules(): StandardRules {
  return standardRules;
}

export function isRotated(
  block: BlockId | null,
  minBlock: number = standardRules.minBlock,
): boolean {
  if (block == null || block === "X") return false;
  return Number(block) < minBlock;
}

export function isBanned(
  cardId: string,
  rules: StandardRules = standardRules,
): boolean {
  return rules.banned.includes(cardId);
}

export function restrictedMax(
  cardId: string,
  rules: StandardRules = standardRules,
): number | null {
  const row = rules.restricted.find((item) => item.cardId === cardId);
  return row ? row.max : null;
}

/** Search toggle: in-rotation block, and not a banned card id. Pairs need a whole deck. */
export function isPlayableInStandard(
  card: Pick<DeckPoolCard, "id" | "block">,
  rules: StandardRules = standardRules,
): boolean {
  if (card.block == null) return false;
  if (isBanned(card.id, rules)) return false;
  return !isRotated(card.block, rules.minBlock);
}

export function bannedPairsIn(
  ids: ReadonlySet<string>,
  rules: StandardRules = standardRules,
): [string, string][] {
  return rules.bannedPairs.filter(([a, b]) => ids.has(a) && ids.has(b));
}

export function formatBlockStatus(
  card: Pick<DeckPoolCard, "id" | "block">,
  rules: StandardRules = standardRules,
): string {
  if (card.block == null) return "—";
  const parts: string[] = [card.block];
  if (isRotated(card.block, rules.minBlock)) parts.push("Rotated");
  if (isBanned(card.id, rules)) parts.push("Banned");
  return parts.join(" · ");
}
