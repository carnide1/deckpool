import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeCollectionBreakdown } from "@/lib/collectionBreakdown";
import type { DeckPoolCard } from "@/types/catalog";

function card(
  partial: Pick<DeckPoolCard, "id" | "category" | "colors" | "cost" | "rarity">,
): DeckPoolCard {
  return {
    name: partial.id,
    attributes: [],
    power: null,
    counter: null,
    types: [],
    effect: null,
    trigger: null,
    packId: "",
    setCode: "",
    series: "",
    images: [],
    has: [],
    ...partial,
  };
}

describe("computeCollectionBreakdown", () => {
  const leader = card({
    id: "ST07-001",
    category: "Leader",
    colors: ["Yellow"],
    cost: 5,
    rarity: "Leader",
  });
  const dual = card({
    id: "OP01-002",
    category: "Character",
    colors: ["Red", "Green"],
    cost: 4,
    rarity: "SuperRare",
  });
  const event = card({
    id: "OP01-003",
    category: "Event",
    colors: ["Red"],
    cost: 1,
    rarity: "Common",
  });

  const cardsById = new Map<string, DeckPoolCard>([
    [leader.id, leader],
    [dual.id, dual],
    [event.id, event],
  ]);

  it("counts unique and copies, skipping qty 0", () => {
    const breakdown = computeCollectionBreakdown(
      { "ST07-001": 1, "OP01-002": 4, "OP01-003": 0, missing: 2 },
      cardsById,
    );
    assert.equal(breakdown.unique, 2);
    assert.equal(breakdown.copies, 5);
  });

  it("counts dual-color cards in each color", () => {
    const breakdown = computeCollectionBreakdown(
      { "OP01-002": 4, "OP01-003": 2 },
      cardsById,
    );
    const red = breakdown.byColor.find((row) => row.color === "Red");
    const green = breakdown.byColor.find((row) => row.color === "Green");
    assert.deepEqual(red, { color: "Red", unique: 2, copies: 6 });
    assert.deepEqual(green, { color: "Green", unique: 1, copies: 4 });
  });

  it("breaks down category and rarity", () => {
    const breakdown = computeCollectionBreakdown(
      { "ST07-001": 1, "OP01-003": 3 },
      cardsById,
    );
    const leaders = breakdown.byCategory.find(
      (row) => row.category === "Leader",
    );
    const events = breakdown.byCategory.find((row) => row.category === "Event");
    assert.deepEqual(leaders, { category: "Leader", unique: 1, copies: 1 });
    assert.deepEqual(events, { category: "Event", unique: 1, copies: 3 });
    assert.equal(
      breakdown.byRarity.find((row) => row.rarity === "Common")?.copies,
      3,
    );
  });
});
