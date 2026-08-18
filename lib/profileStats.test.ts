import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeCollectionStats, computeDeckStats } from "@/lib/profileStats";
import type { DeckPoolCard } from "@/types/catalog";
import type { Deck, Variation } from "@/types/deck";

describe("profileStats", () => {
  it("counts unique owned ids and total copies", () => {
    const stats = computeCollectionStats({
      "OP01-001": 2,
      "OP01-002": 4,
      "OP01-003": 0,
    });
    assert.equal(stats.uniqueOwnedIds, 2);
    assert.equal(stats.totalCopies, 6);
  });

  it("counts legal and owned variations", () => {
    const leader: DeckPoolCard = {
      id: "ST07-001",
      name: "Big Mom",
      category: "Leader",
      rarity: "Leader",
      colors: ["Purple"],
      cost: 5,
      attributes: [],
      power: 5000,
      counter: null,
      types: [],
      effect: null,
      trigger: null,
      packId: "",
      setCode: "OP12",
      series: "OP",
      images: [],
      has: [],
    };
    const filler: DeckPoolCard = {
      id: "OP08-072",
      name: "Biscuit Warrior",
      category: "Character",
      rarity: "Common",
      colors: ["Purple"],
      cost: 5,
      attributes: [],
      power: 4000,
      counter: null,
      types: [],
      effect: null,
      trigger: null,
      packId: "",
      setCode: "ST01",
      series: "ST",
      images: [],
      has: [],
    };
    const cardsById = new Map<string, DeckPoolCard>([
      ["ST07-001", leader],
      ["OP08-072", filler],
    ]);
    const decks: Deck[] = [
      { id: "deck-1", name: "Test", leaderId: "ST07-001" },
    ];
    const variationsByDeckId: Record<string, Variation[]> = {
      "deck-1": [
        {
          id: "var-1",
          name: "Main",
          cards: { "OP08-072": 50 },
        },
        {
          id: "var-2",
          name: "Draft",
          cards: { "OP08-072": 46 },
        },
      ],
    };

    const stats = computeDeckStats(
      decks,
      variationsByDeckId,
      cardsById,
      { "ST07-001": 1, "OP08-072": 50 },
    );

    assert.equal(stats.deckCount, 1);
    assert.equal(stats.variationCount, 2);
    assert.equal(stats.legalVariations, 1);
    assert.equal(stats.illegalVariations, 1);
    assert.equal(stats.ownedVariations, 2);
    assert.equal(stats.unownedVariations, 0);
  });
});
