import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applySearchFilters,
  cardsSearchString,
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
  timings: [],
  block: "2",
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
  timings: [],
  block: "2",
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
  timings: [],
  block: "2",
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
  timings: [],
  block: "2",
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

  it("ORs selected decks", () => {
    const results = applySearchFilters(
      cards,
      filters({ deckIds: ["d1", "d2"] }),
      {
        deckIdsByCardId: {
          "ST07-002": ["d1"],
          "OP03-114": ["d2"],
          "ST07-003": ["d1", "d2"],
        },
      },
    );
    assert.deepEqual(
      results.map((card) => card.id).sort(),
      ["OP03-114", "ST07-002", "ST07-003"],
    );
  });

  it("filters exact costs as OR", () => {
    const results = applySearchFilters(cards, filters({ costs: [1, 3] }));
    assert.deepEqual(
      results.map((card) => card.id).sort(),
      ["OP03-114", "ST07-002"],
    );
  });

  it("filters wanted posters", () => {
    const results = applySearchFilters(cards, EMPTY_FILTERS, {
      wantedOnly: true,
      wantedIds: new Set(["ST07-002", "OP03-114"]),
    });
    assert.deepEqual(
      results.map((card) => card.id).sort(),
      ["OP03-114", "ST07-002"],
    );
  });

  it("matches description text, not name or id", () => {
    const withText = [
      { ...perona, effect: "Draw 1 card." },
      { ...anana, name: "Draw", effect: null },
    ];
    const results = applySearchFilters(
      withText,
      filters({ text: "draw", textField: "description" }),
    );
    assert.deepEqual(
      results.map((card) => card.id),
      ["OP03-114"],
    );
  });

  it("does not match card numbers in description mode", () => {
    const results = applySearchFilters(
      cards,
      filters({ text: "st07-002", textField: "description" }),
    );
    assert.deepEqual(
      results.map((card) => card.id),
      [],
    );
  });

  it("matches a typed hyphen against the printed minus", () => {
    const withPower = [
      {
        ...perona,
        effect:
          "Give up to 1 of your opponent's Characters \u22122000 power during this turn.",
      },
    ];
    const results = applySearchFilters(
      withPower,
      filters({ text: "-2000", textField: "description" }),
    );
    assert.deepEqual(
      results.map((card) => card.id),
      ["OP03-114"],
    );
  });

  it("matches opponents against opponent's", () => {
    const withPower = [
      {
        ...perona,
        effect: "Give up to 1 of your opponent's Characters \u22122000 power.",
      },
    ];
    const results = applySearchFilters(
      withPower,
      filters({ text: "opponents", textField: "description" }),
    );
    assert.deepEqual(
      results.map((card) => card.id),
      ["OP03-114"],
    );
  });

  it("matches the printed debuff line on trigger text", () => {
    const withPower = [
      {
        ...perona,
        trigger:
          "Give up to 1 of your opponent's Characters \u22122000 power during this turn.",
      },
    ];
    const results = applySearchFilters(
      withPower,
      filters({
        text: "give up to 1 of your opponents characters -2000 power",
        textField: "description",
      }),
    );
    assert.deepEqual(
      results.map((card) => card.id),
      ["OP03-114"],
    );
  });

  it("does not fold punctuation in name mode", () => {
    const withPower = [
      {
        ...perona,
        effect: "Characters \u22122000 power",
      },
    ];
    const results = applySearchFilters(
      withPower,
      filters({ text: "-2000", textField: "name" }),
    );
    assert.deepEqual(
      results.map((card) => card.id),
      [],
    );
  });

  it("ANDs selected timings", () => {
    const timed = [
      { ...perona, timings: ["on-play", "when-attacking"] },
      { ...anana, timings: ["on-play"] },
      { ...katakuri, timings: ["when-attacking"] },
    ];
    const results = applySearchFilters(
      timed,
      filters({ timings: ["on-play", "when-attacking"] }),
    );
    assert.deepEqual(
      results.map((card) => card.id),
      ["OP03-114"],
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
    assert.equal(parsed.textField, "name");
    assert.equal(params.has("in"), false);
  });

  it("round-trips description mode and timings", () => {
    const original = filters({
      text: "blocker",
      textField: "description",
      timings: ["on-play", "on-ko"],
    });
    const params = new URLSearchParams();
    writeFiltersToSearchParams(params, original);
    const parsed = filtersFromSearchParams(params);
    assert.equal(parsed.text, "blocker");
    assert.equal(parsed.textField, "description");
    assert.equal(params.get("in"), "text");
    assert.deepEqual(parsed.timings, ["on-play", "on-ko"]);
  });

  it("filters by block and by Standard", () => {
    const rotated = { ...perona, id: "TEST-001", block: "1" as const };
    const current = { ...anana, id: "TEST-002", block: "2" as const };
    const evergreen = { ...katakuri, id: "TEST-003", block: "X" as const };
    const banned = { ...perona, id: "OP06-116", name: "Reject", block: "2" as const };
    const pool = [rotated, current, evergreen, banned];

    const block1 = applySearchFilters(pool, filters({ blocks: ["1"] }));
    assert.deepEqual(
      block1.map((card) => card.id),
      ["TEST-001"],
    );

    const standard = applySearchFilters(pool, filters({ standardOnly: true }));
    assert.deepEqual(
      standard.map((card) => card.id),
      ["TEST-002", "TEST-003"],
    );

    const both = applySearchFilters(
      pool,
      filters({ blocks: ["1"], standardOnly: true }),
    );
    assert.deepEqual(both, []);
  });

  it("round-trips block and Standard", () => {
    const original = filters({ blocks: ["1", "X"], standardOnly: true });
    const params = new URLSearchParams();
    writeFiltersToSearchParams(params, original);
    const parsed = filtersFromSearchParams(params);
    assert.deepEqual(parsed.blocks, ["1", "X"]);
    assert.equal(parsed.standardOnly, true);
    assert.equal(params.get("standard"), "1");
  });

  it("drops unknown block tokens", () => {
    const parsed = filtersFromSearchParams(
      new URLSearchParams("block=1|nope|X"),
    );
    assert.deepEqual(parsed.blocks, ["1", "X"]);
  });

  it("drops unknown timing slugs", () => {
    const parsed = filtersFromSearchParams(
      new URLSearchParams("timing=on-play|not-a-window|blocker"),
    );
    assert.deepEqual(parsed.timings, ["on-play"]);
  });

  it("writes owned and wanted pool flags", () => {
    const withBoth = cardsSearchString(EMPTY_FILTERS, true, "newest", true);
    assert.equal(withBoth.includes("owned=1"), true);
    assert.equal(withBoth.includes("wanted=1"), true);
    const ownedOnly = cardsSearchString(EMPTY_FILTERS, true, "newest", false);
    assert.equal(ownedOnly, "owned=1");
    const wantedOnly = cardsSearchString(EMPTY_FILTERS, false, "newest", true);
    assert.equal(wantedOnly, "wanted=1");
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
