import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatOptcgSimList, parseDeckList } from "@/lib/deckList";
import { VARIATION_UNIQUE_CARD_MAX } from "@/lib/decks";
import type { DeckPoolCard } from "@/types/catalog";

function card(
  id: string,
  category: DeckPoolCard["category"],
  name = id,
): DeckPoolCard {
  return {
    id,
    name,
    category,
    rarity: category === "Leader" ? "Leader" : "Common",
    colors: ["Red"],
    cost: category === "Leader" ? 4 : 3,
    attributes: [],
    power: 5000,
    counter: null,
    types: [],
    effect: null,
    trigger: null,
    packId: "",
    setCode: "OP",
    series: "OP",
    images: [],
    has: [],
    timings: [],
  };
}

function catalog(): Map<string, DeckPoolCard> {
  return new Map(
    [
      card("OP12-001", "Leader", "Rayleigh"),
      card("OP01-001", "Leader", "Zoro"),
      card("OP01-016", "Character", "Nami"),
      card("OP02-015", "Character", "Usopp"),
      card("EB01-003", "Character", "EB"),
      card("ST07-001", "Character", "ST"),
      card("PRB01-001", "Character", "PRB"),
      card("P-029", "Character", "Promo"),
    ].map((row) => [row.id, row]),
  );
}

const cards = catalog();

describe("parseDeckList", () => {
  it("reads a tight OPTCGSim list and drops the matching Leader", () => {
    const parsed = parseDeckList(
      "1xOP12-001\n4xOP01-016\n2xOP02-015",
      cards,
      "OP12-001",
    );
    assert.equal(parsed.blocked, null);
    assert.deepEqual(parsed.leaderIds, ["OP12-001"]);
    assert.deepEqual(parsed.cards, { "OP01-016": 4, "OP02-015": 2 });
  });

  it("reads counts with a space, several cards on one line, and Limitless lines", () => {
    const sim = parseDeckList(
      "1xOP12-001 4x OP01-016 2xOP02-015",
      cards,
      "OP12-001",
    );
    assert.equal(sim.blocked, null);
    assert.deepEqual(sim.cards, { "OP01-016": 4, "OP02-015": 2 });

    const limitless = parseDeckList(
      "1 Rayleigh (OP12-001)\n4 Nami (OP01-016)\n2 Usopp (OP02-015)",
      cards,
      "OP12-001",
    );
    assert.equal(limitless.blocked, null);
    assert.deepEqual(limitless.cards, { "OP01-016": 4, "OP02-015": 2 });
  });

  it("sums repeat ids, uppercases, and keeps promo, ST, EB, and PRB numbers", () => {
    const parsed = parseDeckList(
      "1xop12-001\n4xop01-016\n2xOP01-016\n1xEB01-003\n1xST07-001\n1xPRB01-001\n1xP-029",
      cards,
      "OP12-001",
    );
    assert.equal(parsed.blocked, null);
    assert.equal(parsed.cards["OP01-016"], 6);
    assert.equal(parsed.cards["EB01-003"], 1);
    assert.equal(parsed.cards["ST07-001"], 1);
    assert.equal(parsed.cards["PRB01-001"], 1);
    assert.equal(parsed.cards["P-029"], 1);
  });

  it("skips Don, names without numbers, unknown ids, and ids with no count", () => {
    const parsed = parseDeckList(
      [
        "1xOP12-001",
        "4xOP01-016",
        "10xDON!!",
        "4 Nami",
        "4xOP99-999",
        "See OP02-015",
      ].join("\n"),
      cards,
      "OP12-001",
    );
    assert.equal(parsed.blocked, null);
    assert.deepEqual(parsed.cards, { "OP01-016": 4 });
    assert.deepEqual(
      parsed.skipped.map((row) => row.kind),
      ["don", "no-number", "unknown", "no-count"],
    );
  });

  it("does not treat a longer token as a card number", () => {
    const parsed = parseDeckList(
      "1xOP12-001\n4xOP01-016\nOP01-0160",
      cards,
      "OP12-001",
    );
    assert.equal(parsed.cards["OP01-016"], 4);
    assert.equal(parsed.skipped.some((row) => row.text.includes("OP01-0160")), true);
  });

  it("stops when the Leader does not match this deck", () => {
    const parsed = parseDeckList(
      "1xOP01-001\n4xOP01-016",
      cards,
      "OP12-001",
    );
    assert.equal(parsed.blocked, "This list is for Zoro, not Rayleigh.");
  });

  it("stops when the list has no Leader, two Leaders, or no cards", () => {
    assert.match(
      parseDeckList("4xOP01-016", cards, "OP12-001").blocked ?? "",
      /no Leader/,
    );
    assert.match(
      parseDeckList(
        "1xOP12-001\n1xOP01-001\n4xOP01-016",
        cards,
        "OP12-001",
      ).blocked ?? "",
      /more than one Leader/,
    );
    assert.equal(
      parseDeckList("1xOP12-001", cards, "OP12-001").blocked,
      "No cards to import.",
    );
  });

  it("keeps the leading count when the same line also has DON x1", () => {
    const parsed = parseDeckList(
      "1xOP12-001\n4 Nami [DON!! x1] (OP01-016)",
      cards,
      "OP12-001",
    );
    assert.equal(parsed.blocked, null);
    assert.equal(parsed.cards["OP01-016"], 4);
  });

  it("does not take a count from the previous line", () => {
    const parsed = parseDeckList(
      "1xOP12-001\nTurn 2\nNami (OP01-016)\n4xOP02-015",
      cards,
      "OP12-001",
    );
    assert.equal(parsed.blocked, null);
    assert.equal(parsed.cards["OP01-016"], undefined);
    assert.equal(parsed.cards["OP02-015"], 4);
    assert.equal(
      parsed.skipped.some((row) => row.kind === "no-count" && row.text === "OP01-016"),
      true,
    );
  });

  it("stops above the variation card cap", () => {
    const many = new Map(cards);
    const lines = ["1xOP12-001"];
    for (let n = 1; n <= VARIATION_UNIQUE_CARD_MAX + 1; n += 1) {
      const id = `OP03-${String(n).padStart(3, "0")}`;
      many.set(id, card(id, "Character"));
      lines.push(`1x${id}`);
    }
    const parsed = parseDeckList(lines.join("\n"), many, "OP12-001");
    assert.match(parsed.blocked ?? "", /different cards/);
  });
});

describe("formatOptcgSimList", () => {
  it("puts the Leader first and sorts the rest", () => {
    assert.equal(
      formatOptcgSimList("op12-001", { "OP02-015": 2, "OP01-016": 4, "OP01-016-zero": 0 }),
      "1xOP12-001\n4xOP01-016\n2xOP02-015",
    );
  });

  it("lists the Leader once when that id is also in the card map", () => {
    assert.equal(
      formatOptcgSimList("OP12-001", { "OP12-001": 4, "OP01-016": 2 }),
      "1xOP12-001\n2xOP01-016",
    );
  });

  it("round-trips through the parser", () => {
    const text = formatOptcgSimList("OP12-001", {
      "OP02-015": 2,
      "OP01-016": 4,
      "P-029": 1,
    });
    const parsed = parseDeckList(text, cards, "OP12-001");
    assert.equal(parsed.blocked, null);
    assert.deepEqual(parsed.cards, {
      "OP01-016": 4,
      "OP02-015": 2,
      "P-029": 1,
    });
  });
});
