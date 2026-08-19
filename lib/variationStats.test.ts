import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeVariationStats } from "@/lib/variationStats";
import type { DeckPoolCard } from "@/types/catalog";

function card(
  partial: Pick<DeckPoolCard, "id" | "category"> & Partial<DeckPoolCard>,
): DeckPoolCard {
  return {
    name: partial.id,
    rarity: "Common",
    colors: ["Red"],
    cost: null,
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

describe("computeVariationStats", () => {
  it("weights averages, categories, flags, and counter buckets by copy count", () => {
    const blocker = card({
      id: "C1",
      category: "Character",
      cost: 4,
      power: 5000,
      has: ["blocker"],
    });
    const rusher = card({
      id: "C2",
      category: "Character",
      cost: 3,
      power: 4000,
      counter: 1000,
      has: ["rush", "counter"],
    });
    const event = card({
      id: "E1",
      category: "Event",
      cost: 2,
      counter: 2000,
      has: ["counter"],
    });
    const stage = card({
      id: "S1",
      category: "Stage",
      cost: 1,
    });

    const cardsById = new Map<string, DeckPoolCard>([
      [blocker.id, blocker],
      [rusher.id, rusher],
      [event.id, event],
      [stage.id, stage],
    ]);

    const stats = computeVariationStats(
      { C1: 4, C2: 2, E1: 3, S1: 1 },
      cardsById,
    );

    assert.equal(stats.copies, 10);
    assert.equal(stats.byCategory.Character, 6);
    assert.equal(stats.byCategory.Event, 3);
    assert.equal(stats.byCategory.Stage, 1);
    assert.equal(stats.flags.blocker, 4);
    assert.equal(stats.flags.rush, 2);
    assert.equal(stats.counter1000, 2);
    assert.equal(stats.counter2000, 3);
    assert.equal(stats.avgCost, (4 * 4 + 3 * 2 + 2 * 3 + 1 * 1) / 10);
    assert.equal(stats.avgPower, (5000 * 4 + 4000 * 2) / 6);
  });

  it("returns null averages and zeros for an empty list", () => {
    const stats = computeVariationStats({}, new Map());
    assert.equal(stats.copies, 0);
    assert.equal(stats.avgCost, null);
    assert.equal(stats.avgPower, null);
    assert.equal(stats.flags.blocker, 0);
    assert.equal(stats.counter1000, 0);
  });

  it("skips unknown ids and null cost/power when averaging", () => {
    const noCost = card({
      id: "X1",
      category: "Character",
      power: 6000,
    });
    const cardsById = new Map<string, DeckPoolCard>([[noCost.id, noCost]]);
    const stats = computeVariationStats({ X1: 2, MISSING: 4 }, cardsById);
    assert.equal(stats.copies, 2);
    assert.equal(stats.avgCost, null);
    assert.equal(stats.avgPower, 6000);
  });
});
