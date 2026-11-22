import { bandaiCardArtFile } from "@/lib/cardArtPath";
import cards from "@/data/cards.json";

let cached: Set<string> | null = null;

/** Filenames present on catalog image URLs (Bandai cardlist PNGs only). */
export function catalogCardArtFiles(): Set<string> {
  if (cached) return cached;
  const next = new Set<string>();
  for (const card of cards as Array<{ images?: string[] }>) {
    for (const url of card.images ?? []) {
      const file = bandaiCardArtFile(url);
      if (file) next.add(file);
    }
  }
  cached = next;
  return next;
}

export function isCatalogCardArtFile(file: string): boolean {
  return catalogCardArtFiles().has(file);
}
