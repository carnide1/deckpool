import type { DeckPoolCard } from "@/types/catalog";

const MAX_RESULTS = 60;

/** Simple id/name search for Collection until Phase 10 parser ships. */
export function searchCatalog(
  cards: DeckPoolCard[],
  query: string,
  limit = MAX_RESULTS,
): DeckPoolCard[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const matches: DeckPoolCard[] = [];
  for (const card of cards) {
    const id = card.id.toLowerCase();
    const name = card.name.toLowerCase();
    if (id.includes(q) || name.includes(q)) {
      matches.push(card);
    }
  }

  matches.sort((a, b) => {
    const aId = a.id.toLowerCase();
    const bId = b.id.toLowerCase();
    if (aId === q && bId !== q) return -1;
    if (bId === q && aId !== q) return 1;
    if (aId.startsWith(q) && !bId.startsWith(q)) return -1;
    if (bId.startsWith(q) && !aId.startsWith(q)) return 1;
    return a.id.localeCompare(b.id);
  });

  return matches.slice(0, limit);
}
