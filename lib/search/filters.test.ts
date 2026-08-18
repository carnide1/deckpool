import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applySearchFilters,
  EMPTY_FILTERS,
  filtersFromSearchParams,
  writeFiltersToSearchParams,
  type SearchFilters,
} from "@/lib/search/filters";
import { nextCollectionQuantity } from "@/lib/collection";
import type { DeckPoolCard } from "@/types/catalog";

const linlin: DeckPoolCard = {
  id: "ST07-001",
  name: "Charlotte Linlin",
  category: "Leader",
  rarity: "Leader",
  colors: ["Yellow"],
  cost: 5,
  attributes: ["Special"],
  power: 5000,
  counter: null,
  types: ["The Four Emperors", "Big Mom Pirates"],
  effect: null,
  trigger: null,
  packId: "1",
  setCode: "ST07",
  series: "ST",
  images: [],
  has: ["effect"],
};

const anana: DeckPoolCard = {
  id: "ST07-002",
  name: "Charlotte Anana",
  category: "Character",
  rarity: "Common",
  colors: ["Purple"],
  cost: 1,
  attributes: ["Wisdom"],
  power: 1000,
  counter: 2000,
  types: ["Big Mom Pirates"],
  effect: null,
  trigger: null,
  packId: "1",
  setCode: "ST07",
  series: "ST",
  images: [],
  has: ["counter"],
};

const katakuri: DeckPoolCard = {
  id: "ST07-003",
  name: "Charlotte Katakuri",
  category: "Character",
  rarity: "SuperRare",
  colors: ["Yellow"],
  cost: 4,
  attributes: ["Strike"],
  power: 6000,
  counter: 1000,
  types: ["Big Mom Pirates"],
  effect: null,
  trigger: null,
  packId: "1",
  setCode: "ST07",
  series: "ST",
  images: [],
  has: ["effect"],
};

const perona: DeckPoolCard = {
  id: "OP03-114",
  name: "Perona",
  category: "Character",
  rarity: "Uncommon",
  colors: ["Purple"],
  cost: 3,
  attributes: ["Special"],
  power: 5000,
  counter: 1000,
  types: ["Thriller Bark Pirates"],
  effect: null,
  trigger: null,
  packId: "2",
  setCode: "OP03",
  series: "OP",
  images: [],
  has: ["effect"],
};

const cards = [linlin, anana, katakuri, perona];

function filters(partial: Partial<SearchFilters>): SearchFilters {
  return { ...EMPTY_FILTERS, ...partial };
}

describe("applySearchFilters", () => {
  it("matches name or id text", () => {
    const byName = applySearchFilters(cards, filters({ text: "perona" }));
    assert.deepEqual(
      byName.map((card) => card.id),
      ["OP03-114"],
    );
    const byId = applySearchFilters(cards, filters({ text: "st07-002" }));
    assert.deepEqual(
      byId.map((card) => card.id),
      ["ST07-002"],
    );
  });

  it("ORs selected colors", () => {
    const results = applySearchFilters(
      cards,
      filters({ colors: ["Purple", "Yellow"] }),
    );
    assert.equal(results.length, 4);
  });

  it("ANDs selected types", () => {
    const results = applySearchFilters(
      cards,
      filters({ types: ["Big Mom Pirates", "The Four Emperors"] }),
    );
    assert.deepEqual(
      results.map((card) => card.id),
      ["ST07-001"],
    );
  });

  it("ANDs selected labels", () => {
    const results = applySearchFilters(
      cards,
      filters({ labels: ["core", "trade"] }),
      {
        labelsByCardId: {
          "ST07-002": ["core", "trade"],
          "ST07-003": ["core"],
        },
      },
    );
    assert.deepEqual(
      results.map((card) => card.id),
      ["ST07-002"],
    );
  });

  it("filters exact costs as OR", () => {
    const results = applySearchFilters(cards, filters({ costs: [1, 3] }));
    assert.deepEqual(
      results.map((card) => card.id).sort(),
      ["OP03-114", "ST07-002"],
    );
  });
});

describe("filter URL params", () => {
  it("round-trips filters", () => {
    const original = filters({
      text: "luffy",
      colors: ["Red", "Blue"],
      categories: ["Character"],
      types: ["Straw Hat Crew"],
    });
    const params = new URLSearchParams();
    writeFiltersToSearchParams(params, original);
    const parsed = filtersFromSearchParams(params);
    assert.equal(parsed.text, "luffy");
    assert.deepEqual(parsed.colors, ["Red", "Blue"]);
    assert.deepEqual(parsed.categories, ["Character"]);
    assert.deepEqual(parsed.types, ["Straw Hat Crew"]);
  });
});

describe("nextCollectionQuantity", () => {
  it("blocks creating a card from collection", () => {
    assert.equal(nextCollectionQuantity(0, 1, false), null);
  });

  it("allows creating a card from catalog search", () => {
    assert.equal(nextCollectionQuantity(0, 1, true), 1);
  });

  it("allows decrementing to zero", () => {
    assert.equal(nextCollectionQuantity(1, -1, false), 0);
  });
});
