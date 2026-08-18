export type VariationDiffEntry = {
  cardId: string;
  baseQty: number;
  compareQty: number;
  delta: number;
};

export function diffVariations(
  base: Record<string, number>,
  compare: Record<string, number>,
): VariationDiffEntry[] {
  const ids = new Set([...Object.keys(base), ...Object.keys(compare)]);
  const entries: VariationDiffEntry[] = [];

  for (const cardId of ids) {
    const baseQty = base[cardId] ?? 0;
    const compareQty = compare[cardId] ?? 0;
    if (baseQty === compareQty) continue;
    entries.push({
      cardId,
      baseQty,
      compareQty,
      delta: compareQty - baseQty,
    });
  }

  return entries.sort((a, b) => a.cardId.localeCompare(b.cardId));
}
