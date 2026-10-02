"use client";

import type { ReactNode, RefObject } from "react";
import { SlidersHorizontal } from "lucide-react";
import { FilterPanel } from "@/components/search/FilterPanel";
import { NameSearchBar } from "@/components/search/NameSearchBar";
import { SortSelect } from "@/components/search/SortSelect";
import { Pagination } from "@/components/ui/Pagination";
import {
  CARD_LIST_SORTS,
  type CardListBrowser,
} from "@/hooks/useCardListBrowser";
import type { DeckPoolCard } from "@/types/catalog";

export function FiltersToggleButton({
  browser,
  controlsId,
}: {
  browser: CardListBrowser;
  controlsId: string;
}) {
  return (
    <button
      type="button"
      onClick={() => browser.setFiltersOpen((open) => !open)}
      aria-expanded={browser.filtersOpen}
      aria-controls={controlsId}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] px-3 py-2 text-sm font-semibold lg:hidden"
    >
      <SlidersHorizontal className="h-4 w-4" />
      Filters
    </button>
  );
}

/**
 * Grid column + sticky filter sidebar used by Collection, Wanted, and the
 * friend versions. `children` is the grid (or empty / loading state); the
 * pager renders under it when `showPagination` is true.
 */
export function CardBrowserFrame({
  browser,
  gridTopRef,
  filtersId,
  statusText,
  showFiltersToggle = false,
  showPagination,
  searchPlaceholder,
  filterCards,
  labelOptions,
  deckOptions,
  children,
}: {
  browser: CardListBrowser;
  gridTopRef: RefObject<HTMLDivElement | null>;
  filtersId: string;
  statusText: ReactNode;
  /** Put the mobile Filters button in the toolbar (next to Sort). */
  showFiltersToggle?: boolean;
  showPagination: boolean;
  searchPlaceholder: string;
  filterCards: DeckPoolCard[];
  labelOptions?: string[];
  deckOptions?: { id: string; name: string }[];
  children: ReactNode;
}) {
  const { filters, setFilters } = browser;
  const sortSelect = (
    <SortSelect
      value={browser.sort}
      onChange={browser.setSort}
      options={CARD_LIST_SORTS}
    />
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="order-2 min-w-0 flex-1 lg:order-1">
        <div
          ref={gridTopRef}
          className="mb-3 flex flex-wrap items-center justify-between gap-2"
        >
          <p className="text-sm text-[var(--ink-muted)]">{statusText}</p>
          {showFiltersToggle ? (
            <div className="flex items-center gap-2">
              <FiltersToggleButton browser={browser} controlsId={filtersId} />
              {sortSelect}
            </div>
          ) : (
            sortSelect
          )}
        </div>

        {children}
        {showPagination ? (
          <Pagination
            page={browser.currentPage}
            total={browser.results.length}
            pageSize={browser.pageSize}
            onPageChange={browser.goToPage}
          />
        ) : null}
      </div>

      <aside
        id={filtersId}
        className={[
          "order-1 shrink-0 lg:sticky lg:top-4 lg:order-2 lg:w-64",
          browser.filtersOpen ? "block" : "hidden lg:block",
        ].join(" ")}
      >
        <div className="poster-panel flex flex-col gap-4 p-4">
          <NameSearchBar
            value={filters.text}
            onChange={(text) => setFilters((prev) => ({ ...prev, text }))}
            placeholder={searchPlaceholder}
            textField={filters.textField}
            onTextFieldChange={(textField) =>
              setFilters((prev) => ({ ...prev, textField }))
            }
          />
          <FilterPanel
            layout="sidebar"
            filters={filters}
            onChange={setFilters}
            cards={filterCards}
            labelOptions={labelOptions}
            deckOptions={deckOptions}
          />
        </div>
      </aside>
    </div>
  );
}
