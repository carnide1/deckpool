import constructionRules from "@/data/construction-rules.json";
import type { DeckPoolCard, OptcgColor } from "@/types/catalog";
import type { CardMatch, ConstructionRule } from "@/types/construction";

export function getConstructionRules(): ConstructionRule[] {
  return constructionRules as ConstructionRule[];
}

export function copyLimitForCard(
  cardId: string,
  rules: ConstructionRule[] = getConstructionRules(),
): number | null {
  const rule = rules.find(
    (row) => row.kind === "copyLimit" && row.cardId === cardId,
  );
  if (rule?.kind === "copyLimit") return rule.max;
  return 4;
}

function compareCost(
  cost: number | null,
  op: ">=" | "<=" | "=",
  value: number,
): boolean {
  if (cost === null) return false;
  if (op === ">=") return cost >= value;
  if (op === "<=") return cost <= value;
  return cost === value;
}

export function cardMatches(card: DeckPoolCard, match: CardMatch): boolean {
  if (match.category && card.category !== match.category) return false;

  if (match.cost) {
    if (!compareCost(card.cost, match.cost.op, match.cost.value)) return false;
  }

  if (match.types?.length) {
    if (!match.types.every((type) => card.types.includes(type))) return false;
  }

  if (match.colors?.length) {
    if (
      !match.colors.every((color) =>
        card.colors.includes(color as OptcgColor),
      )
    ) {
      return false;
    }
  }

  if (match.cardIds?.length) {
    if (!match.cardIds.includes(card.id)) return false;
  }

  return true;
}

export function isForbiddenByLeader(
  card: DeckPoolCard,
  leaderId: string,
  rules: ConstructionRule[] = getConstructionRules(),
): boolean {
  for (const rule of rules) {
    if (rule.kind !== "forbid" || rule.whenLeader !== leaderId) continue;

    if (rule.match.requireTypes?.length) {
      const hasRequired = rule.match.requireTypes.every((type) =>
        card.types.includes(type),
      );
      if (!hasRequired) return true;
      continue;
    }

    if (cardMatches(card, rule.match)) return true;
  }

  return false;
}
