"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import {
  readStoredDeckSort,
  writeStoredDeckSort,
  type DeckSortKey,
} from "@/lib/sortDecks";

/** Last deck-list sort, remembered in localStorage for this browser. */
export function useDeckSort(): [DeckSortKey, (next: DeckSortKey) => void] {
  const [sort, setSort] = useState<DeckSortKey>("edited");

  useLayoutEffect(() => {
    setSort(readStoredDeckSort());
  }, []);

  const update = useCallback((next: DeckSortKey) => {
    setSort(next);
    writeStoredDeckSort(next);
  }, []);

  return [sort, update];
}
