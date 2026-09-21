import {
  isTimingSlug,
  sortTimingSlugs,
} from "@/lib/compileTimings";
import type { CardCategory, DeckPoolCard, OptcgColor } from "@/types/catalog";

export const OPTCG_COLORS: OptcgColor[] = [
  "Red",
  "Green",
  "Blue",
  "Purple",
  "Black",
  "Yellow",
];

export const CARD_CATEGORIES: CardCategory[] = [
  "Leader",
  "Character",
  "Event",
  "Stage",
];

export const COST_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type SearchTextField = "name" | "description";

export type SearchFilters = {
  text: string;
  textField: SearchTextField;
  colors: OptcgColor[];
  categories: CardCategory[];
  costs: number[];
  rarities: string[];
  types: string[];
  attributes: string[];
  sets: string[];
  has: string[];
  timings: string[];
  labels: string[];
  deckIds: string[];
};

export const EMPTY_FILTERS: SearchFilters = {
  text: "",
  textField: "name",
  colors: [],
  categories: [],
  costs: [],
  rarities: [],
  types: [],
  attributes: [],
  sets: [],
  has: [],
  timings: [],
  labels: [],
  deckIds: [],
};

export function cloneFilters(filters: SearchFilters): SearchFilters {
  return {
    text: filters.text,
    textField: filters.textField,
    colors: [...filters.colors],
    categories: [...filters.categories],
    costs: [...filters.costs],
    rarities: [...filters.rarities],
    types: [...filters.types],
    attributes: [...filters.attributes],
    sets: [...filters.sets],
    has: [...filters.has],
    timings: [...filters.timings],
    labels: [...filters.labels],
    deckIds: [...filters.deckIds],
  };
}

export function hasActiveFilters(filters: SearchFilters): boolean {
  return (
    filters.text.trim().length > 0 ||
    filters.colors.length > 0 ||
    filters.categories.length > 0 ||
    filters.costs.length > 0 ||
    filters.rarities.length > 0 ||
    filters.types.length > 0 ||
    filters.attributes.length > 0 ||
    filters.sets.length > 0 ||
    filters.has.length > 0 ||
    filters.timings.length > 0 ||
    filters.labels.length > 0 ||
    filters.deckIds.length > 0
  );
}

export function toggleListValue<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export type FilterOptions = {
  types: string[];
  sets: string[];
  rarities: string[];
  attributes: string[];
  has: string[];
  timings: string[];
};

export function uniqueFilterOptions(cards: DeckPoolCard[]): FilterOptions {
  const types = new Set<string>();
  const sets = new Set<string>();
  const rarities = new Set<string>();
  const attributes = new Set<string>();
  const has = new Set<string>();
  const timings = new Set<string>();

  for (const card of cards) {
    for (const type of card.types) types.add(type);
    if (card.setCode) sets.add(card.setCode);
    if (card.rarity) rarities.add(card.rarity);
    for (const attr of card.attributes) attributes.add(attr);
    for (const flag of card.has) has.add(flag);
    for (const timing of card.timings ?? []) timings.add(timing);
  }

  const byName = (a: string, b: string) => a.localeCompare(b);
  return {
    types: [...types].sort(byName),
    sets: [...sets].sort(byName),
    rarities: [...rarities].sort(byName),
    attributes: [...attributes].sort(byName),
    has: [...has].sort(byName),
    timings: sortTimingSlugs([...timings]),
  };
}

function matchesText(
  card: DeckPoolCard,
  raw: string,
  textField: SearchTextField = "name",
): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  if (textField === "description") {
    if ((card.effect ?? "").toLowerCase().includes(q)) return true;
    if ((card.trigger ?? "").toLowerCase().includes(q)) return true;
    return false;
  }
  if (card.name.toLowerCase().includes(q)) return true;
  if (card.id.toLowerCase().includes(q)) return true;
  return false;
}

function includesAll(haystack: string[], needles: string[]): boolean {
  return needles.every((needle) =>
    haystack.some((item) => item.toLowerCase() === needle.toLowerCase()),
  );
}

function includesAny(haystack: string[], needles: string[]): boolean {
  const lower = new Set(haystack.map((item) => item.toLowerCase()));
  return needles.some((needle) => lower.has(needle.toLowerCase()));
}

export type ApplyFilterContext = {
  ownedOnly?: boolean;
  ownedIds?: Set<string>;
  wantedOnly?: boolean;
  wantedIds?: Set<string>;
  labelsByCardId?: Record<string, string[]>;
  deckIdsByCardId?: Record<string, string[]>;
};

export function applySearchFilters(
  cards: DeckPoolCard[],
  filters: SearchFilters,
  ctx: ApplyFilterContext = {},
): DeckPoolCard[] {
  const ownedIds = ctx.ownedIds ?? new Set<string>();
  const wantedIds = ctx.wantedIds ?? new Set<string>();

  return cards.filter((card) => {
    if (ctx.ownedOnly && !ownedIds.has(card.id)) return false;
    if (ctx.wantedOnly && !wantedIds.has(card.id)) return false;
    if (!matchesText(card, filters.text, filters.textField ?? "name")) return false;

    if (filters.colors.length > 0) {
      if (!filters.colors.some((color) => card.colors.includes(color))) {
        return false;
      }
    }

    if (filters.categories.length > 0) {
      if (!filters.categories.includes(card.category)) return false;
    }

    if (filters.costs.length > 0) {
      if (card.cost === null || !filters.costs.includes(card.cost)) {
        return false;
      }
    }

    if (filters.rarities.length > 0) {
      if (!includesAny([card.rarity], filters.rarities)) return false;
    }

    if (filters.types.length > 0 && !includesAll(card.types, filters.types)) {
      return false;
    }

    if (
      filters.attributes.length > 0 &&
      !includesAll(card.attributes, filters.attributes)
    ) {
      return false;
    }

    if (filters.sets.length > 0) {
      if (!includesAny([card.setCode], filters.sets)) return false;
    }

    if (filters.has.length > 0 && !includesAll(card.has, filters.has)) {
      return false;
    }

    if (
      filters.timings.length > 0 &&
      !includesAll(card.timings ?? [], filters.timings)
    ) {
      return false;
    }

    if (filters.labels.length > 0) {
      const labels = ctx.labelsByCardId?.[card.id] ?? [];
      if (!includesAll(labels, filters.labels)) return false;
    }

    if (filters.deckIds.length > 0) {
      const memberOf = ctx.deckIdsByCardId?.[card.id] ?? [];
      if (!filters.deckIds.some((deckId) => memberOf.includes(deckId))) {
        return false;
      }
    }

    return true;
  });
}

const LIST_SEP = "|";

function readList(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw
    .split(LIST_SEP)
    .map((part) => part.trim())
    .filter(Boolean);
}

function writeList(
  params: URLSearchParams,
  key: string,
  values: string[],
): void {
  if (values.length === 0) params.delete(key);
  else params.set(key, values.join(LIST_SEP));
}

export function filtersFromSearchParams(params: URLSearchParams): SearchFilters {
  const colors = readList(params, "color")
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase())
    .filter((value): value is OptcgColor =>
      OPTCG_COLORS.includes(value as OptcgColor),
    );

  const categories = readList(params, "category").filter((value): value is CardCategory =>
    CARD_CATEGORIES.includes(value as CardCategory),
  );

  const costs = readList(params, "cost")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 10);

  return {
    text: params.get("q") ?? "",
    textField: params.get("in") === "text" ? "description" : "name",
    colors,
    categories,
    costs,
    rarities: readList(params, "rarity"),
    types: readList(params, "type"),
    attributes: readList(params, "attr"),
    sets: readList(params, "set"),
    has: readList(params, "has"),
    timings: readList(params, "timing").filter(isTimingSlug),
    labels: readList(params, "label"),
    deckIds: readList(params, "deck"),
  };
}

export function writeFiltersToSearchParams(
  params: URLSearchParams,
  filters: SearchFilters,
): void {
  if (filters.text.trim()) params.set("q", filters.text);
  else params.delete("q");

  if (filters.textField === "description") params.set("in", "text");
  else params.delete("in");

  writeList(
    params,
    "color",
    filters.colors.map((color) => color.toLowerCase()),
  );
  writeList(params, "category", filters.categories);
  writeList(
    params,
    "cost",
    filters.costs.map((cost) => String(cost)),
  );
  writeList(params, "rarity", filters.rarities);
  writeList(params, "type", filters.types);
  writeList(params, "attr", filters.attributes);
  writeList(params, "set", filters.sets);
  writeList(params, "has", filters.has);
  writeList(params, "timing", filters.timings);
  writeList(params, "label", filters.labels);
  writeList(params, "deck", filters.deckIds);
}

export function filtersEqual(a: SearchFilters, b: SearchFilters): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function cardsSearchString(
  filters: SearchFilters,
  ownedOnly: boolean,
  sort: string,
  wantedOnly = false,
): string {
  const params = new URLSearchParams();
  writeFiltersToSearchParams(params, filters);
  if (ownedOnly) params.set("owned", "1");
  if (wantedOnly) params.set("wanted", "1");
  if (sort && sort !== "newest") params.set("sort", sort);
  return params.toString();
}
