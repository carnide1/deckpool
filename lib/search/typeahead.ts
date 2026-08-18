import {
  COLOR_NAMES,
  KEYWORD_SUGGESTIONS,
  normalizeField,
} from "@/lib/search/keywords";
import type { DeckPoolCard } from "@/types/catalog";

export type TypeaheadSuggestion = {
  label: string;
  insert: string;
};

export type TypeaheadIndex = {
  colors: string[];
  categories: string[];
  attributes: string[];
  types: string[];
  rarities: string[];
  sets: string[];
  series: string[];
  hasFlags: string[];
  labels: string[];
};

export function buildTypeaheadIndex(
  cards: DeckPoolCard[],
  userLabels: string[] = [],
): TypeaheadIndex {
  const categories = new Set<string>();
  const attributes = new Set<string>();
  const types = new Set<string>();
  const rarities = new Set<string>();
  const sets = new Set<string>();
  const series = new Set<string>();
  const hasFlags = new Set<string>();

  for (const card of cards) {
    categories.add(card.category);
    for (const attr of card.attributes) attributes.add(attr);
    for (const type of card.types) types.add(type);
    rarities.add(card.rarity);
    sets.add(card.setCode);
    series.add(card.series);
    for (const flag of card.has) hasFlags.add(flag);
  }

  return {
    colors: [...COLOR_NAMES],
    categories: [...categories].sort(),
    attributes: [...attributes].sort(),
    types: [...types].sort(),
    rarities: [...rarities].sort(),
    sets: [...sets].sort(),
    series: [...series].sort(),
    hasFlags: [...hasFlags].sort(),
    labels: [...userLabels].sort(),
  };
}

function prefixMatches(value: string, prefix: string): boolean {
  return value.toLowerCase().startsWith(prefix.toLowerCase());
}

export function getTypeaheadSuggestions(
  query: string,
  caret: number,
  index: TypeaheadIndex,
): TypeaheadSuggestion[] {
  const before = query.slice(0, caret);
  const tokenMatch = before.match(/(?:^|\s)([^\s"]*)$/);
  const token = tokenMatch?.[1] ?? before;
  const colon = token.indexOf(":");

  if (colon === -1) {
    if (!token.startsWith("-")) {
      return KEYWORD_SUGGESTIONS.filter((keyword) =>
        keyword.toLowerCase().startsWith(token.toLowerCase()),
      )
        .slice(0, 8)
        .map((keyword) => ({ label: keyword, insert: keyword }));
    }
    return [];
  }

  const field = normalizeField(token.slice(0, colon));
  const prefix = token.slice(colon + 1);
  const quoted = prefix.startsWith('"');
  const valuePrefix = quoted ? prefix.slice(1) : prefix;

  let values: string[] = [];
  switch (field) {
    case "color":
      values = index.colors;
      break;
    case "category":
      values = index.categories;
      break;
    case "attribute":
      values = index.attributes;
      break;
    case "type":
      values = index.types;
      break;
    case "rarity":
      values = index.rarities;
      break;
    case "set":
      values = index.sets;
      break;
    case "series":
      values = index.series;
      break;
    case "has":
      values = index.hasFlags;
      break;
    case "label":
      values = index.labels;
      break;
    default:
      return [];
  }

  return values
    .filter((value) => prefixMatches(value, valuePrefix))
    .slice(0, 10)
    .map((value) => {
      const needsQuotes = /\s/.test(value);
      const insertValue = needsQuotes ? `"${value}"` : value;
      const insert = quoted
        ? `${token.slice(0, colon + 1)}"${value}"`
        : `${token.slice(0, colon + 1)}${insertValue}`;
      return { label: `${field}:${value}`, insert };
    });
}
