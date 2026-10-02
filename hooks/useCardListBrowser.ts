"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { clampPage, pageCountFor } from "@/lib/pagination";
import {
  EMPTY_FILTERS,
  applySearchFilters,
  type ApplyFilterContext,
  type SearchFilters,
} from "@/lib/search/filters";
import type { SortKey } from "@/lib/search/sortCards";
import { sortCards } from "@/lib/search/sortCards";
import type { DeckPoolCard } from "@/types/catalog";

export const CARD_LIST_SORTS: SortKey[] = [
  "recent",
  "newest",
  "oldest",
  "serial",
  "name",
  "category",
  "cost",
];
export const CARD_LIST_PAGE_SIZE = 60;

/**
 * Filter + sort + page state for a binder-style card list (Collection, Wanted,
 * and the friend versions). Pass a memoized `filterContext`.
 */
export function useCardListBrowser({
  cards,
  filterContext,
  updatedAtById,
  pageSize = CARD_LIST_PAGE_SIZE,
}: {
  cards: DeckPoolCard[];
  filterContext: ApplyFilterContext;
  updatedAtById: Record<string, unknown>;
  pageSize?: number;
}) {
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const gridTopRef = useRef<HTMLDivElement>(null);
  const deferredFilters = useDeferredValue(filters);
  const [pageResetKey, setPageResetKey] = useState({
    filters: deferredFilters,
    sort,
  });

  if (pageResetKey.filters !== deferredFilters || pageResetKey.sort !== sort) {
    setPageResetKey({ filters: deferredFilters, sort });
    setPage(1);
  }

  const results = useMemo(() => {
    const filtered = applySearchFilters(cards, deferredFilters, filterContext);
    return sortCards(filtered, sort, { updatedAtById });
  }, [cards, deferredFilters, filterContext, sort, updatedAtById]);

  const totalPages = pageCountFor(results.length, pageSize);
  const currentPage = clampPage(page, totalPages);
  const pagedResults = useMemo(
    () => results.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [results, currentPage, pageSize],
  );

  const goToPage = (next: number) => {
    setPage(next);
    if (!gridTopRef.current) return;
    const offset =
      window.scrollY + gridTopRef.current.getBoundingClientRect().top - 8;
    window.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
  };

  return {
    browser: {
      filters,
      setFilters,
      sort,
      setSort,
      filtersOpen,
      setFiltersOpen,
      results,
      pagedResults,
      currentPage,
      pageSize,
      goToPage,
    },
    /** Attach to the toolbar above the grid; paging scrolls back to it. */
    gridTopRef,
  };
}

export type CardListBrowser = ReturnType<
  typeof useCardListBrowser
>["browser"];
