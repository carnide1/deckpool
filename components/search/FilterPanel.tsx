"use client";

import { useMemo } from "react";
import { FacetMultiSelect } from "@/components/search/FacetMultiSelect";
import {
  CARD_CATEGORIES,
  COST_VALUES,
  EMPTY_FILTERS,
  OPTCG_COLORS,
  hasActiveFilters,
  uniqueFilterOptions,
  type SearchFilters,
} from "@/lib/search/filters";
import type { CardCategory, DeckPoolCard, OptcgColor } from "@/types/catalog";

const COLOR_CLASS: Record<OptcgColor, string> = {
  Red: "bg-[var(--color-red)]",
  Green: "bg-[var(--color-green)]",
  Blue: "bg-[var(--color-blue)]",
  Purple: "bg-[var(--color-purple)]",
  Black: "bg-[var(--color-black)]",
  Yellow: "bg-[var(--color-yellow)]",
};

function isOptcgColor(value: string): value is OptcgColor {
  return OPTCG_COLORS.includes(value as OptcgColor);
}

export function FilterPanel({
  filters,
  onChange,
  cards,
  labelOptions = [],
  deckOptions,
  allowedColors,
  allowedCategories,
  layout = "inline",
}: {
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
  cards: DeckPoolCard[];
  labelOptions?: string[];
  deckOptions?: { id: string; name: string }[];
  allowedColors?: OptcgColor[];
  allowedCategories?: CardCategory[];
  layout?: "inline" | "sidebar";
}) {
  const options = useMemo(() => uniqueFilterOptions(cards), [cards]);
  const deckNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const deck of deckOptions ?? []) map[deck.id] = deck.name;
    return map;
  }, [deckOptions]);
  const colors = allowedColors ?? OPTCG_COLORS;
  const categories = allowedCategories ?? CARD_CATEGORIES;
  const stacked = layout === "sidebar";

  const patch = (partial: Partial<SearchFilters>) => {
    onChange({ ...filters, ...partial });
  };

  const selects = (
    <>
      <FacetMultiSelect
        label="Color"
        fullWidth={stacked}
        options={colors}
        selected={filters.colors}
        onChange={(next) => patch({ colors: next.filter(isOptcgColor) })}
        renderOption={(color) =>
          isOptcgColor(color) ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${COLOR_CLASS[color]}`}
                aria-hidden
              />
              {color}
            </span>
          ) : (
            color
          )
        }
      />
      <FacetMultiSelect
        label="Category"
        fullWidth={stacked}
        options={categories}
        selected={filters.categories}
        onChange={(next) =>
          patch({
            categories: next.filter((value): value is CardCategory =>
              CARD_CATEGORIES.includes(value as CardCategory),
            ),
          })
        }
      />
      <FacetMultiSelect
        label="Cost"
        fullWidth={stacked}
        options={COST_VALUES.map(String)}
        selected={filters.costs.map(String)}
        onChange={(next) =>
          patch({
            costs: next
              .map((value) => Number(value))
              .filter((value) => Number.isInteger(value)),
          })
        }
      />
      <FacetMultiSelect
        label="Rarity"
        fullWidth={stacked}
        options={options.rarities}
        selected={filters.rarities}
        onChange={(rarities) => patch({ rarities })}
      />
      <FacetMultiSelect
        label="Attribute"
        fullWidth={stacked}
        options={options.attributes}
        selected={filters.attributes}
        onChange={(attributes) => patch({ attributes })}
      />
      <FacetMultiSelect
        label="Keywords"
        fullWidth={stacked}
        options={options.has}
        selected={filters.has}
        onChange={(has) => patch({ has })}
      />
      <FacetMultiSelect
        label="Type"
        fullWidth={stacked}
        options={options.types}
        selected={filters.types}
        onChange={(types) => patch({ types })}
      />
      <FacetMultiSelect
        label="Set"
        fullWidth={stacked}
        options={options.sets}
        selected={filters.sets}
        onChange={(sets) => patch({ sets })}
      />
      {deckOptions ? (
        <FacetMultiSelect
          label="Decks"
          fullWidth={stacked}
          options={deckOptions.map((deck) => deck.id)}
          selected={filters.deckIds}
          onChange={(deckIds) => patch({ deckIds })}
          optionLabel={(id) => deckNameById[id] ?? id}
          renderOption={(id) => deckNameById[id] ?? id}
          emptyMessage="None"
        />
      ) : null}
      <FacetMultiSelect
        label="Labels"
        fullWidth={stacked}
        options={labelOptions}
        selected={filters.labels}
        onChange={(labels) => patch({ labels })}
        emptyMessage="None"
      />
    </>
  );

  return (
    <div className={stacked ? "flex flex-col gap-2" : "flex flex-col gap-3"}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink-primary)]">
          Filters
        </h2>
        {hasActiveFilters(filters) ? (
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_FILTERS })}
            className="text-xs font-semibold text-[var(--accent-ocean)] hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>
      <div
        className={
          stacked ? "flex flex-col gap-2" : "flex flex-wrap gap-2"
        }
      >
        {selects}
      </div>
    </div>
  );
}
