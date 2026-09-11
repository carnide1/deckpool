import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDeckStacks,
  visibleStackCount,
} from "@/lib/builderDeckStacks";
import type { DeckPoolCard } from "@/types/catalog";

function card(
  partial: Pick<DeckPoolCard, "id" | "name" | "category" | "cost"> &
    Partial<DeckPoolCard>,
): DeckPoolCard {
  return {
    rarity: "C",
    colors: ["Red"],
    attributes: [],
    power: 5000,
    counter: null,
    types: [],
    effect: null,
    trigger: null,
    packId: "op01",
    setCode: "OP01",
    series: "OP",
    images: [],
    has: [],
    ...partial,
  };
}

describe("visibleStackCount", () => {
  it("returns 0 for non-positive qty", () => {
    assert.equal(visibleStackCount(0), 0);
    assert.equal(visibleStackCount(-1), 0);
  });

  it("caps visible faces at 4", () => {
    assert.equal(visibleStackCount(1), 1);
    assert.equal(visibleStackCount(4), 4);
    assert.equal(visibleStackCount(5), 4);
    assert.equal(visibleStackCount(99), 4);
  });
});

describe("buildDeckStacks", () => {
  const a = card({
    id: "OP01-016",
    name: "Zoro",
    category: "Character",
    cost: 3,
  });
  const b = card({
    id: "OP01-029",
    name: "Nami",
    category: "Event",
    cost: 1,
  });
  const c = card({
    id: "OP01-031",
    name: "Stage Land",
    category: "Stage",
    cost: 2,
  });
  const nullCost = card({
    id: "OP01-099",
    name: "Mystery",
    category: "Character",
    cost: null,
  });

  const byId = new Map<string, DeckPoolCard>([
    [a.id, a],
    [b.id, b],
    [c.id, c],
    [nullCost.id, nullCost],
  ]);

  it("returns empty for empty map", () => {
    assert.deepEqual(buildDeckStacks({}, byId), []);
  });

  it("skips qty <= 0 and unknown ids", () => {
    const stacks = buildDeckStacks(
      { [a.id]: 2, [b.id]: 0, "NOPE-001": 3 },
      byId,
      "name",
    );
    assert.equal(stacks.length, 1);
    assert.equal(stacks[0].card.id, a.id);
    assert.equal(stacks[0].qty, 2);
  });

  it("defaults to cost ascending, null costs last", () => {
    const stacks = buildDeckStacks(
      { [a.id]: 1, [b.id]: 2, [c.id]: 1, [nullCost.id]: 1 },
      byId,
    );
    assert.deepEqual(
      stacks.map((row) => row.card.id),
      [b.id, c.id, a.id, nullCost.id],
    );
    assert.equal(stacks[0].qty, 2);
  });

  it("sorts by category then name", () => {
    const stacks = buildDeckStacks(
      { [a.id]: 1, [b.id]: 1, [c.id]: 1 },
      byId,
      "category",
    );
    assert.deepEqual(
      stacks.map((row) => row.card.category),
      ["Character", "Event", "Stage"],
    );
  });

  it("sorts by name", () => {
    const stacks = buildDeckStacks(
      { [a.id]: 1, [b.id]: 1, [c.id]: 1 },
      byId,
      "name",
    );
    assert.deepEqual(
      stacks.map((row) => row.card.name),
      ["Nami", "Stage Land", "Zoro"],
    );
  });
});
