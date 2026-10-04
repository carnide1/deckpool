import { searchCatalog } from "@/lib/search/simpleCatalogSearch";
import type { DeckPoolCard } from "@/types/catalog";

export type LeaderChoiceOptions = {
  query: string;
  ownedOnly: boolean;
  ownedIds: ReadonlySet<string>;
  excludeId?: string;
};

/**
 * Leaders for the New deck and Change Leader pickers.
 * Input order is kept (callers pass name order).
 */
export function filterLeaderChoices(
  leaders: readonly DeckPoolCard[],
  options: LeaderChoiceOptions,
): readonly DeckPoolCard[] {
  let list = leaders;
  if (options.excludeId) {
    list = list.filter((leader) => leader.id !== options.excludeId);
  }
  if (options.ownedOnly) {
    list = list.filter((leader) => options.ownedIds.has(leader.id));
  }

  const query = options.query.trim();
  if (!query) return list;

  // Pass the full candidate count so the default 60-result cap does not hide Leaders.
  const ids = new Set(
    searchCatalog(list, query, list.length).map((card) => card.id),
  );
  return list.filter((leader) => ids.has(leader.id));
}
