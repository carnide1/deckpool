import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseDeckSort, sortDecks } from "@/lib/sortDecks";
import type { DeckPoolCard, OptcgColor } from "@/types/catalog";
import type { Deck } from "@/types/deck";

function deck(
  id: string,
  name: string,
  extras: Partial<Deck> = {},
): Deck {
  return {
    id,
    name,
    leaderId: "OP01-001",
    ...extras,
  };
}

function leader(
  id: string,
  name: string,
  colors: OptcgColor[],
): DeckPoolCard {
  return {
    id,
    name,
    category: "Leader",
    rarity: "Leader",
    colors,
    cost: 5,
    attributes: [],
    power: 5000,
    counter: null,
    types: [],
    effect: null,
    trigger: null,
    packId: "1",
    setCode: "OP01",
    series: "OP",
    images: [],
    has: [],
    timings: [],
  };
}

describe("parseDeckSort", () => {
  it("keeps a known key and falls back otherwise", () => {
    assert.equal(parseDeckSort("leader"), "leader");
    assert.equal(parseDeckSort("nope"), "edited");
    assert.equal(parseDeckSort(null), "edited");
    assert.equal(parseDeckSort(undefined), "edited");
  });
});

describe("sortDecks", () => {
  it("sorts last edited first and falls back to createdAt", () => {
    const decks = [
      deck("old", "Old", { updatedAt: { seconds: 10 } }),
      deck("fresh", "Fresh", { createdAt: { seconds: 50 } }),
      deck("newer", "Newer", { updatedAt: { seconds: 40 } }),
    ];
    const sorted = sortDecks(decks, "edited", new Map());
    assert.deepEqual(
      sorted.map((row) => row.id),
      ["fresh", "newer", "old"],
    );
  });

  it("breaks equal edit times by name, then id", () => {
    const decks = [
      deck("b", "Same", { updatedAt: { seconds: 10 } }),
      deck("a", "Same", { updatedAt: { seconds: 10 } }),
      deck("c", "Beta", { updatedAt: { seconds: 10 } }),
    ];
    const sorted = sortDecks(decks, "edited", new Map());
    assert.deepEqual(
      sorted.map((row) => row.id),
      ["c", "a", "b"],
    );
  });

  it("sorts names Z–A and keeps equal names in id order", () => {
    const decks = [
      deck("b", "Same"),
      deck("z", "Alpha"),
      deck("a", "Same"),
      deck("m", "Zebra"),
    ];
    const sorted = sortDecks(decks, "name-desc", new Map());
    assert.deepEqual(
      sorted.map((row) => row.id),
      ["m", "a", "b", "z"],
    );
  });

  it("sorts by Leader name and uses the card number when the Leader is missing", () => {
    const leaders = new Map<string, DeckPoolCard>([
      ["OP01-001", leader("OP01-001", "Nami", ["Blue"])],
    ]);
    const decks = [
      deck("missing", "Missing", { leaderId: "OP09-001" }),
      deck("nami", "Nami deck", { leaderId: "OP01-001" }),
    ];
    const sorted = sortDecks(decks, "leader", leaders);
    assert.deepEqual(
      sorted.map((row) => row.id),
      ["nami", "missing"],
    );
  });

  it("sorts color Red, then Red/Green, then Blue, then a missing Leader", () => {
    const leaders = new Map<string, DeckPoolCard>([
      ["red", leader("red", "Red", ["Red"])],
      ["mix", leader("mix", "Mix", ["Red", "Green"])],
      ["blue", leader("blue", "Blue", ["Blue"])],
    ]);
    const decks = [
      deck("missing", "Missing", { leaderId: "gone" }),
      deck("blue", "Blue deck", { leaderId: "blue" }),
      deck("mix", "Mix deck", { leaderId: "mix" }),
      deck("red", "Red deck", { leaderId: "red" }),
    ];
    const sorted = sortDecks(decks, "color", leaders);
    assert.deepEqual(
      sorted.map((row) => row.id),
      ["red", "mix", "blue", "missing"],
    );
  });

  it("sorts by created time and ignores a newer edit", () => {
    const decks = [
      deck("edited", "Edited", {
        createdAt: { seconds: 10 },
        updatedAt: { seconds: 999 },
      }),
      deck("born", "Born", {
        createdAt: { seconds: 100 },
        updatedAt: { seconds: 1 },
      }),
    ];
    const sorted = sortDecks(decks, "created", new Map());
    assert.deepEqual(
      sorted.map((row) => row.id),
      ["born", "edited"],
    );
  });

  it("returns a new array and leaves the input order alone", () => {
    const decks = [deck("b", "Beta"), deck("a", "Alpha")];
    const before = decks.map((row) => row.id);
    const sorted = sortDecks(decks, "name", new Map());
    assert.notEqual(sorted, decks);
    assert.deepEqual(
      decks.map((row) => row.id),
      before,
    );
    assert.deepEqual(
      sorted.map((row) => row.id),
      ["a", "b"],
    );
  });
});
