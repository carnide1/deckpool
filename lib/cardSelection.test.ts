import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adjacentCard, cardSelectionIndex } from "@/lib/cardSelection";
import type { DeckPoolCard } from "@/types/catalog";

function card(id: string): DeckPoolCard {
  return {
    id,
    name: id,
    category: "Character",
    rarity: "Common",
    colors: ["Red"],
    cost: 1,
    attributes: [],
    power: 1000,
    counter: 1000,
    types: [],
    effect: null,
    trigger: null,
    packId: "test",
    setCode: "OP01",
    series: "OP",
    images: [],
    has: [],
  };
}

const cards = [card("OP01-001"), card("OP01-002"), card("OP01-003")];

describe("card selection", () => {
  it("finds the selected card index", () => {
    assert.equal(cardSelectionIndex(cards, "OP01-002"), 1);
    assert.equal(cardSelectionIndex(cards, "missing"), -1);
  });

  it("returns adjacent cards without wrapping", () => {
    assert.equal(adjacentCard(cards, "OP01-002", -1)?.id, "OP01-001");
    assert.equal(adjacentCard(cards, "OP01-002", 1)?.id, "OP01-003");
    assert.equal(adjacentCard(cards, "OP01-001", -1), null);
    assert.equal(adjacentCard(cards, "OP01-003", 1), null);
  });

  it("returns null when the selected card is not in the list", () => {
    assert.equal(adjacentCard(cards, "missing", 1), null);
  });
});
