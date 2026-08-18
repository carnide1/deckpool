export function pageCountFor(total: number, pageSize: number): number {
  if (total <= 0 || pageSize <= 0) return 0;
  return Math.ceil(total / pageSize);
}

export function clampPage(page: number, pageCount: number): number {
  if (pageCount <= 0) return 1;
  return Math.min(Math.max(1, page), pageCount);
}

export type PageToken = number | "gap";

/** Compact page list: first, last, current ±1, with gaps. */
export function visiblePageTokens(
  page: number,
  pageCount: number,
): PageToken[] {
  if (pageCount <= 0) return [];
  const current = clampPage(page, pageCount);
  const included = new Set<number>([1, pageCount, current]);
  if (current > 1) included.add(current - 1);
  if (current < pageCount) included.add(current + 1);

  const sorted = [...included].sort((a, b) => a - b);
  const tokens: PageToken[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const value = sorted[i];
    if (i > 0 && value - sorted[i - 1] > 1) tokens.push("gap");
    tokens.push(value);
  }
  return tokens;
}
