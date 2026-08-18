import type { DeckPoolCard } from "@/types/catalog";

/** Catalog rarity → search token (implementation guide: treasure not tr). */
const RARITY_TO_TOKEN: Record<string, string> = {
  Common: "c",
  Uncommon: "uc",
  Rare: "r",
  SuperRare: "sr",
  SecretRare: "sec",
  Leader: "l",
  Special: "sp",
  TreasureRare: "treasure",
  Promo: "p",
};

const TOKEN_TO_RARITY: Record<string, string[]> = Object.entries(
  RARITY_TO_TOKEN,
).reduce<Record<string, string[]>>((acc, [rarity, token]) => {
  acc[token] = acc[token] ?? [];
  acc[token].push(rarity);
  return acc;
}, {});

export function rarityToToken(rarity: string): string {
  return RARITY_TO_TOKEN[rarity] ?? rarity.toLowerCase();
}

export function tokenMatchesRarity(token: string, rarity: string): boolean {
  const normalized = token.toLowerCase();
  const mapped = TOKEN_TO_RARITY[normalized];
  if (mapped) return mapped.includes(rarity);
  return rarity.toLowerCase().includes(normalized);
}

export function cardRarityToken(card: DeckPoolCard): string {
  return rarityToToken(card.rarity);
}
