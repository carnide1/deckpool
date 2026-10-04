import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterLeaderChoices } from "@/lib/leaderChoices";
import type { BlockId, DeckPoolCard } from "@/types/catalog";

function leader(
  id: string,
  name: string,
  effect: string | null = null,
  block: BlockId | null = "2",
): DeckPoolCard {
  return {
    id,
    name,
    category: "Leader",
    rarity: "Leader",
    colors: ["Red"],
    cost: 4,
    attributes: [],
    power: 5000,
    counter: null,
    types: [],
    effect,
    trigger: null,
    packId: "",
    setCode: "OP",
    series: "OP",
    images: [],
    has: [],
    timings: [],
    block,
  };
}

const luffy = leader("OP01-003", "Monkey D. Luffy");
const zoro = leader("OP01-001", "Roronoa Zoro");
const nami = leader("OP03-040", "Nami", "Luffy is mentioned here");
const rotated = leader("ST01-001", "Rotated Luffy", null, "1");
const banned = leader("OP14-020", "Banned Leader");

const byName = [luffy, nami, rotated, zoro, banned];

describe("filterLeaderChoices", () => {
  it("returns every Leader in input order when the query is empty", () => {
    const result = filterLeaderChoices(byName, {
      query: "  ",
      ownedOnly: false,
      ownedIds: new Set(),
    });
    assert.deepEqual(
      result.map((card) => card.id),
      byName.map((card) => card.id),
    );
  });

  it("keeps owned Leaders when Owned is on", () => {
    const result = filterLeaderChoices(byName, {
      query: "",
      ownedOnly: true,
      ownedIds: new Set(["OP01-001", "OP14-020"]),
    });
    assert.deepEqual(
      result.map((card) => card.id),
      ["OP01-001", "OP14-020"],
    );
  });

  it("drops the excluded Leader and still applies Owned", () => {
    const result = filterLeaderChoices(byName, {
      query: "",
      ownedOnly: true,
      ownedIds: new Set(["OP01-003"]),
      excludeId: "OP01-003",
    });
    assert.deepEqual(result, []);
  });

  it("matches name or id and ignores effect text", () => {
    const byNameQuery = filterLeaderChoices(byName, {
      query: "LUFFY",
      ownedOnly: false,
      ownedIds: new Set(),
    });
    assert.deepEqual(
      byNameQuery.map((card) => card.id),
      ["OP01-003", "ST01-001"],
    );

    const byId = filterLeaderChoices(byName, {
      query: "op03",
      ownedOnly: false,
      ownedIds: new Set(),
    });
    assert.deepEqual(
      byId.map((card) => card.id),
      ["OP03-040"],
    );
  });

  it("applies Owned and the query together", () => {
    const result = filterLeaderChoices(byName, {
      query: "luffy",
      ownedOnly: true,
      ownedIds: new Set(["ST01-001"]),
    });
    assert.deepEqual(
      result.map((card) => card.id),
      ["ST01-001"],
    );
  });

  it("keeps name order when an id match would sort first", () => {
    const alpha = leader("ZZ-001", "Alpha");
    const zeta = leader("AA-002", "Zeta");
    const result = filterLeaderChoices([alpha, zeta], {
      query: "a",
      ownedOnly: false,
      ownedIds: new Set(),
    });
    assert.deepEqual(
      result.map((card) => card.id),
      ["ZZ-001", "AA-002"],
    );
  });

  it("returns more than 60 name matches", () => {
    const many = Array.from({ length: 61 }, (_, index) =>
      leader(`OP99-${String(index).padStart(3, "0")}`, `Ace ${index}`),
    );
    const result = filterLeaderChoices(many, {
      query: "ace",
      ownedOnly: false,
      ownedIds: new Set(),
    });
    assert.equal(result.length, 61);
  });

  it("leaves rotated and banned Leaders in the list", () => {
    const result = filterLeaderChoices([rotated, banned], {
      query: "",
      ownedOnly: false,
      ownedIds: new Set(),
    });
    assert.deepEqual(
      result.map((card) => card.id),
      ["ST01-001", "OP14-020"],
    );
  });
});
