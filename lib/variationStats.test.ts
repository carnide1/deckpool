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
      setCode: "OP01",
    });
    const rusher = card({
      id: "C2",
      category: "Character",
      cost: 3,
      power: 4000,
      counter: 1000,
      has: ["rush", "counter"],
      setCode: "OP01",
    });
    const event = card({
      id: "E1",
      category: "Event",
      cost: 2,
      counter: 2000,
      has: ["counter"],
      setCode: "OP08",
    });
    const stage = card({
      id: "S1",
      category: "Stage",
      cost: 1,
      setCode: "ST01",
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
    assert.equal(stats.flags.unblockable, 0);
    assert.equal(stats.flags.searcher, 0);
    assert.equal(stats.counter0, 5);
    assert.equal(stats.counter1000, 2);
    assert.equal(stats.counter2000, 3);
    assert.equal(stats.highestPower, 5000);
    assert.equal(stats.lowestPower, 4000);
    assert.equal(stats.lowestCost, 1);
    assert.equal(stats.highestCost, 4);
    assert.equal(stats.avgCost, (4 * 4 + 3 * 2 + 2 * 3 + 1 * 1) / 10);
    assert.equal(stats.avgPower, (5000 * 4 + 4000 * 2) / 6);
    assert.deepEqual(stats.byCost, [
      { cost: 1, copies: 1 },
      { cost: 2, copies: 3 },
      { cost: 3, copies: 2 },
      { cost: 4, copies: 4 },
    ]);
    assert.deepEqual(stats.byPower, [
      { power: 4000, copies: 2 },
      { power: 5000, copies: 4 },
    ]);
    assert.deepEqual(stats.byColor, []);
    assert.deepEqual(stats.bySet, [
      { setCode: "OP01", copies: 6 },
      { setCode: "OP08", copies: 3 },
      { setCode: "ST01", copies: 1 },
    ]);
  });

  it("returns null averages and zeros for an empty list", () => {
    const stats = computeVariationStats({}, new Map());
    assert.equal(stats.copies, 0);
    assert.equal(stats.avgCost, null);
    assert.equal(stats.avgPower, null);
    assert.equal(stats.highestPower, null);
    assert.equal(stats.lowestPower, null);
    assert.equal(stats.lowestCost, null);
    assert.equal(stats.highestCost, null);
    assert.deepEqual(stats.byCost, []);
    assert.deepEqual(stats.byPower, []);
    assert.equal(stats.flags.blocker, 0);
    assert.equal(stats.counter0, 0);
    assert.equal(stats.counter1000, 0);
    assert.deepEqual(stats.bySet, []);
  });

  it("treats missing costs as zero while skipping missing power", () => {
    const noCost = card({
      id: "X1",
      category: "Character",
      power: 6000,
      setCode: "OP03",
    });
    const cardsById = new Map<string, DeckPoolCard>([[noCost.id, noCost]]);
    const stats = computeVariationStats({ X1: 2, MISSING: 4 }, cardsById);
    assert.equal(stats.copies, 2);
    assert.equal(stats.avgCost, 0);
    assert.equal(stats.lowestCost, 0);
    assert.equal(stats.highestCost, 0);
    assert.deepEqual(stats.byCost, [{ cost: 0, copies: 2 }]);
    assert.equal(stats.avgPower, 6000);
    assert.equal(stats.highestPower, 6000);
    assert.equal(stats.lowestPower, 6000);
    assert.equal(stats.counter0, 2);
  });

  it("breaks down colors only for multi-color Leaders and skips Leaders in the map", () => {
    const red = card({
      id: "R1",
      category: "Character",
      colors: ["Red"],
      setCode: "OP05",
    });
    const dual = card({
      id: "D1",
      category: "Character",
      colors: ["Red", "Green"],
      setCode: "OP05",
    });
    const leader = card({
      id: "L1",
      category: "Leader",
      colors: ["Red", "Green"],
      setCode: "OP05",
      power: 5000,
    });
    const cardsById = new Map<string, DeckPoolCard>([
      [red.id, red],
      [dual.id, dual],
      [leader.id, leader],
    ]);

    const mono = computeVariationStats({ R1: 4, D1: 2 }, cardsById, {
      leaderColors: ["Red"],
    });
    assert.deepEqual(mono.byColor, []);

    const multi = computeVariationStats(
      { R1: 4, D1: 2, L1: 1 },
      cardsById,
      { leaderColors: ["Red", "Green"] },
    );
    assert.equal(multi.copies, 6);
    assert.deepEqual(multi.byColor, [
      { color: "Red", copies: 6 },
      { color: "Green", copies: 2 },
    ]);
    assert.deepEqual(multi.bySet, [{ setCode: "OP05", copies: 6 }]);
  });
});
