export function mergeLabels(existing: string[], added: string[]): string[] {
  const labels = new Set<string>();
  for (const label of existing) {
    const trimmed = label.trim();
    if (trimmed) labels.add(trimmed);
  }
  for (const label of added) {
    const trimmed = label.trim();
    if (trimmed) labels.add(trimmed);
  }
  return [...labels].sort((a, b) => a.localeCompare(b));
}
