import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterCards } from "@/lib/search/filterCards";
import { parseQuery } from "@/lib/search/parseQuery";
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
  effect: "Sample leader effect",
  trigger: null,
  packId: "569007",
  setCode: "ST07",
  series: "ST",
  images: [],
  has: ["effect"],
};

const bigMomPurple: DeckPoolCard = {
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
  packId: "569007",
  setCode: "ST07",
  series: "ST",
  images: [],
  has: ["counter"],
};

const anana: DeckPoolCard = {
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
  packId: "569007",
  setCode: "ST07",
  series: "ST",
  images: [],
  has: ["effect"],
};

const lowCostPurple: DeckPoolCard = {
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
  effect: "Ghost effect",
  trigger: null,
  packId: "569003",
  setCode: "OP03",
  series: "OP",
  images: [],
  has: ["effect"],
};

const yellowCharacter: DeckPoolCard = {
  id: "OP01-001",
  name: "Yellow Sample",
  category: "Character",
  rarity: "Common",
  colors: ["Yellow"],
  cost: 2,
  attributes: ["Slash"],
  power: 3000,
  counter: null,
  types: ["Sample"],
  effect: null,
  trigger: null,
  packId: "569001",
  setCode: "OP01",
  series: "OP",
  images: [],
  has: [],
};

const cards = [linlin, bigMomPurple, anana, lowCostPurple, yellowCharacter];

describe("parseQuery", () => {
  it("parses field terms and quoted type values", () => {
    const expr = parseQuery('color:purple type:"Big Mom Pirates"');
    assert.equal(expr.type, "all");
    if (expr.type !== "all") return;
    assert.equal(expr.terms.length, 2);
  });

  it("parses id tokens", () => {
    const expr = parseQuery("id:OP03-114");
    assert.equal(expr.type, "term");
    if (expr.type !== "term") return;
    assert.equal(expr.term.kind, "field");
    if (expr.term.kind !== "field") return;
    assert.equal(expr.term.field, "id");
    assert.equal(expr.term.value, "OP03-114");
  });

  it("parses negated bare color terms", () => {
    const expr = parseQuery("-yellow");
    assert.equal(expr.type, "not");
  });

  it("parses numeric comparisons", () => {
    const expr = parseQuery("cost<=3");
    assert.equal(expr.type, "term");
    if (expr.type !== "term") return;
    assert.equal(expr.term.kind, "field");
    if (expr.term.kind !== "field") return;
    assert.equal(expr.term.field, "cost");
    assert.equal(expr.term.op, "<=");
    assert.equal(expr.term.value, "3");
  });
});

describe("filterCards", () => {
  it('filters color:purple type:"Big Mom Pirates"', () => {
    const expr = parseQuery('color:purple type:"Big Mom Pirates"');
    const results = filterCards(cards, expr);
    assert.deepEqual(
      results.map((card) => card.id),
      ["ST07-002"],
    );
  });

  it("filters id:OP03-114", () => {
    const expr = parseQuery("id:OP03-114");
    const results = filterCards(cards, expr);
    assert.deepEqual(
      results.map((card) => card.id),
      ["OP03-114"],
    );
  });

  it("filters -yellow", () => {
    const expr = parseQuery("-yellow");
    const results = filterCards(cards, expr);
    assert.ok(results.every((card) => !card.colors.includes("Yellow")));
    assert.ok(results.some((card) => card.id === "OP03-114"));
  });

  it("filters cost<=3", () => {
    const expr = parseQuery("cost<=3");
    const results = filterCards(cards, expr);
    assert.ok(results.every((card) => (card.cost ?? 99) <= 3));
    assert.ok(results.some((card) => card.id === "OP03-114"));
    assert.ok(results.some((card) => card.id === "ST07-002"));
  });
});
