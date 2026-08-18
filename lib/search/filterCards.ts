import {
  COLOR_NAMES,
  normalizeColor,
} from "@/lib/search/keywords";
import type { CompareOp, QueryExpr, Term } from "@/lib/search/parseQuery";
import { tokenMatchesRarity } from "@/lib/search/rarity";
import type { DeckPoolCard } from "@/types/catalog";

export type FilterContext = {
  ownedOnly?: boolean;
  ownedIds?: Set<string>;
  labelsByCardId?: Record<string, string[]>;
};

function compareNumber(
  actual: number | null,
  op: CompareOp,
  expected: number,
): boolean {
  if (actual === null) return false;
  switch (op) {
    case "=":
      return actual === expected;
    case "!=":
      return actual !== expected;
    case "<":
      return actual < expected;
    case "<=":
      return actual <= expected;
    case ">":
      return actual > expected;
    case ">=":
      return actual >= expected;
    default:
      return false;
  }
}

function numericFieldValue(card: DeckPoolCard, field: string): number | null {
  if (field === "life") {
    return card.category === "Leader" ? card.cost : null;
  }
  if (field === "cost") return card.cost;
  if (field === "power") return card.power;
  if (field === "counter") return card.counter;
  return null;
}

function matchesBare(card: DeckPoolCard, raw: string): boolean {
  const value = raw.toLowerCase();
  if (card.name.toLowerCase().includes(value)) return true;
  if (COLOR_NAMES.includes(value as (typeof COLOR_NAMES)[number])) {
    const color = normalizeColor(value);
    if (card.colors.includes(color as DeckPoolCard["colors"][number])) {
      return true;
    }
  }
  return false;
}

function matchesTerm(
  card: DeckPoolCard,
  term: Term,
  ctx: FilterContext,
): boolean {
  switch (term.kind) {
    case "id":
      return card.id === term.value;
    case "bare":
      return matchesBare(card, term.value);
    case "field": {
      const field = term.field;
      const value = term.value;
      const op = term.op ?? "=";

      switch (field) {
        case "name":
          return card.name.toLowerCase().includes(value.toLowerCase());
        case "id":
          return op === "="
            ? card.id === value
            : card.id.toLowerCase().includes(value.toLowerCase());
        case "color": {
          const color = normalizeColor(value);
          return card.colors.includes(color as DeckPoolCard["colors"][number]);
        }
        case "type":
          return card.types.some((type) =>
            type.toLowerCase().includes(value.toLowerCase()),
          );
        case "label": {
          const labels = ctx.labelsByCardId?.[card.id] ?? [];
          return labels.some(
            (label) => label.toLowerCase() === value.toLowerCase(),
          );
        }
        case "category":
          return card.category.toLowerCase() === value.toLowerCase();
        case "attribute":
          return card.attributes.some(
            (attr) => attr.toLowerCase() === value.toLowerCase(),
          );
        case "text":
          return (card.effect ?? "").toLowerCase().includes(value.toLowerCase());
        case "trigger":
          return (card.trigger ?? "")
            .toLowerCase()
            .includes(value.toLowerCase());
        case "cost":
        case "life":
        case "power":
        case "counter": {
          const expected = Number(value);
          if (Number.isNaN(expected)) return false;
          return compareNumber(numericFieldValue(card, field), op, expected);
        }
        case "rarity":
          return tokenMatchesRarity(value, card.rarity);
        case "set":
          return card.setCode.toLowerCase() === value.toLowerCase();
        case "series":
          return card.series.toLowerCase() === value.toLowerCase();
        case "has":
          return card.has.includes(value.toLowerCase());
        default:
          return matchesBare(card, `${field}:${value}`);
      }
    }
    default:
      return true;
  }
}

function evalExpr(
  card: DeckPoolCard,
  expr: QueryExpr,
  ctx: FilterContext,
): boolean {
  switch (expr.type) {
    case "all":
      return expr.terms.every((term) => evalExpr(card, term, ctx));
    case "any":
      return expr.terms.some((term) => evalExpr(card, term, ctx));
    case "not":
      return !evalExpr(card, expr.term, ctx);
    case "term":
      return matchesTerm(card, expr.term, ctx);
    default:
      return true;
  }
}

export function filterCards(
  cards: DeckPoolCard[],
  expr: QueryExpr,
  ctx: FilterContext = {},
): DeckPoolCard[] {
  const ownedIds = ctx.ownedIds ?? new Set<string>();

  return cards.filter((card) => {
    if (ctx.ownedOnly && !ownedIds.has(card.id)) return false;
    if (expr.type === "all" && expr.terms.length === 0) return true;
    return evalExpr(card, expr, ctx);
  });
}

export function cardMatchesQuery(
  card: DeckPoolCard,
  expr: QueryExpr,
  ctx: FilterContext = {},
): boolean {
  return filterCards([card], expr, ctx).length > 0;
}
