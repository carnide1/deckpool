import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sortCards } from "@/lib/search/sortCards";
import type { DeckPoolCard } from "@/types/catalog";

function card(
  id: string,
  setCode: string,
  name: string,
  extras: Partial<DeckPoolCard> = {},
): DeckPoolCard {
  return {
    id,
    name,
    category: "Character",
    rarity: "Common",
    colors: ["Red"],
    cost: 1,
    attributes: [],
    power: 1000,
    counter: null,
    types: [],
    effect: null,
    trigger: null,
    packId: "1",
    setCode,
    series: setCode.replace(/\d+/g, ""),
    images: [],
    has: [],
    ...extras,
  };
}

describe("sortCards", () => {
  it("sorts newest set first, then collector number", () => {
    const cards = [
      card("OP01-016", "OP01", "Old"),
      card("OP13-001", "OP13", "New first"),
      card("OP13-050", "OP13", "New later"),
    ];
    const sorted = sortCards(cards, "newest");
    assert.deepEqual(
      sorted.map((row) => row.id),
      ["OP13-001", "OP13-050", "OP01-016"],
    );
  });

  it("sorts serial numbers numerically across sets", () => {
    const cards = [
      card("OP10-001", "OP10", "Ten"),
      card("OP09-001", "OP09", "Nine"),
    ];
    const sorted = sortCards(cards, "serial");
    assert.deepEqual(
      sorted.map((row) => row.id),
      ["OP09-001", "OP10-001"],
    );
  });

  it("sorts recently updated first", () => {
    const cards = [
      card("OP01-001", "OP01", "Alpha"),
      card("OP01-002", "OP01", "Beta"),
    ];
    const sorted = sortCards(cards, "recent", {
      updatedAtById: {
        "OP01-001": { seconds: 10 },
        "OP01-002": { seconds: 50 },
      },
    });
    assert.deepEqual(
      sorted.map((row) => row.id),
      ["OP01-002", "OP01-001"],
    );
  });
});
