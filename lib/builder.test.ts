import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canAddToDeck, filterRivalReferenceUniverse } from "@/lib/builder";
import type { DeckPoolCard } from "@/types/catalog";
import type { ConstructionRule } from "@/types/construction";

const rules: ConstructionRule[] = [
  { kind: "copyLimit", cardId: "OP01-016", max: 4 },
];

function card(
  partial: Partial<DeckPoolCard> & Pick<DeckPoolCard, "id" | "name" | "category" | "colors">,
): DeckPoolCard {
  return {
    rarity: "C",
    cost: 1,
    attributes: [],
    types: [],
    effect: "",
    trigger: "",
    packId: "OP01",
    setCode: "OP01",
    series: "OP",
    images: [],
    has: [],
    timings: [],
    power: null,
    counter: null,
    block: "2",
    ...partial,
  };
}

describe("filterRivalReferenceUniverse", () => {
  const leader = card({
    id: "OP01-001",
    name: "Blue Leader",
    category: "Leader",
    colors: ["Blue"],
  });

  it("keeps on-color main-deck cards and drops off-color and banned", () => {
    const pool = [
      card({
        id: "OP01-016",
        name: "Blue Char",
        category: "Character",
        colors: ["Blue"],
      }),
      card({
        id: "OP01-017",
        name: "Red Char",
        category: "Character",
        colors: ["Red"],
      }),
      card({
        id: "OP03-040",
        name: "Banned Blue",
        category: "Character",
        colors: ["Blue"],
      }),
      card({
        id: "OP01-002",
        name: "Other Leader",
        category: "Leader",
        colors: ["Blue"],
      }),
    ];
    const ids = filterRivalReferenceUniverse(pool, leader).map((row) => row.id);
    assert.deepEqual(ids, ["OP01-016"]);
  });
});

describe("canAddToDeck", () => {
  it("blocks at the construction copy limit", () => {
    assert.equal(canAddToDeck("OP01-016", 4, 10, false, rules), false);
    assert.equal(canAddToDeck("OP01-016", 3, 10, false, rules), true);
  });

  it("blocks at owned qty when owned-only is on", () => {
    assert.equal(canAddToDeck("OP01-016", 2, 2, true, rules), false);
    assert.equal(canAddToDeck("OP01-016", 1, 2, true, rules), true);
  });

  it("ignores owned qty when owned-only is off", () => {
    assert.equal(canAddToDeck("OP01-016", 2, 2, false, rules), true);
  });

  it("blocks adds once the main deck is full", () => {
    assert.equal(canAddToDeck("OP01-016", 0, 10, false, rules, 50), false);
    assert.equal(canAddToDeck("OP01-016", 0, 10, false, rules, 49), true);
  });
});
