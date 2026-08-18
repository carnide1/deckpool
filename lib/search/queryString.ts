export function toggleQueryToken(query: string, token: string): string {
  const parts = query.trim().split(/\s+/).filter(Boolean);
  const lowerToken = token.toLowerCase();
  const index = parts.findIndex((part) => part.toLowerCase() === lowerToken);
  if (index >= 0) {
    parts.splice(index, 1);
    return parts.join(" ");
  }
  return [...parts, token].join(" ");
}

export function hasQueryToken(query: string, token: string): boolean {
  return query
    .trim()
    .split(/\s+/)
    .some((part) => part.toLowerCase() === token.toLowerCase());
}
