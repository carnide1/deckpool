import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { indexDeckMembership } from "@/lib/deckMembership";
import type { Deck, Variation } from "@/types/deck";

describe("indexDeckMembership", () => {
  const decks: Deck[] = [
    { id: "d1", name: "Linlin", leaderId: "ST07-001" },
    { id: "d2", name: "Perona brew", leaderId: "OP06-021" },
  ];
  const variationsByDeckId: Record<string, Variation[]> = {
    d1: [
      { id: "v1", name: "Main", cards: { "ST07-002": 4, "ST07-003": 2 } },
      { id: "v2", name: "Alt", cards: { "ST07-002": 2, "OP03-114": 4 } },
    ],
    d2: [{ id: "v3", name: "Main", cards: { "OP03-114": 4, "ST07-002": 0 } }],
  };

  it("includes the Leader and unions every variation", () => {
    const index = indexDeckMembership(decks, variationsByDeckId);
    assert.deepEqual(
      index.cardIdsByDeckId.d1.sort(),
      ["OP03-114", "ST07-001", "ST07-002", "ST07-003"],
    );
  });

  it("skips zero-qty rows and lists decks per card", () => {
    const index = indexDeckMembership(decks, variationsByDeckId);
    assert.deepEqual(
      index.decksByCardId["ST07-002"].map((row) => row.id),
      ["d1"],
    );
    assert.deepEqual(
      index.decksByCardId["OP03-114"].map((row) => row.id).sort(),
      ["d1", "d2"],
    );
  });
});
