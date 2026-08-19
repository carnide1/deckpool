import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canIncrementCopy,
  filterBuilderCatalog,
  isColorLegalForLeader,
} from "@/lib/builder";
import { EMPTY_FILTERS } from "@/lib/search/filters";
import { isForbiddenByLeader } from "@/lib/construction";
import { summarizeDeck, validateVariation } from "@/lib/legality";
import type { DeckPoolCard } from "@/types/catalog";
import type { ConstructionRule } from "@/types/construction";

const rules = [
  { kind: "copyLimit" as const, cardId: "OP08-072", max: null },
  {
    kind: "forbid" as const,
    whenLeader: "OP13-079",
    match: { category: "Event" as const, cost: { op: ">=" as const, value: 2 } },
  },
  {
    kind: "forbid" as const,
    whenLeader: "OP12-001",
    match: { cost: { op: ">=" as const, value: 5 } },
  },
] satisfies ConstructionRule[];

function leader(
  id: string,
  colors: DeckPoolCard["colors"],
): DeckPoolCard {
  return {
    id,
    name: id,
    category: "Leader",
    rarity: "Leader",
    colors,
    cost: 4,
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
  };
}

function mainCard(
  id: string,
  overrides: Partial<DeckPoolCard> = {},
): DeckPoolCard {
  return {
    id,
    name: id,
    category: "Character",
    rarity: "Common",
    colors: ["Red"],
    cost: 3,
    attributes: [],
    power: 4000,
    counter: null,
    types: [],
    effect: null,
    trigger: null,
    packId: "",
    setCode: "OP",
    series: "OP",
    images: [],
    has: [],
    ...overrides,
  };
}

describe("construction", () => {
  it("allows unlimited Biscuit Warrior copies", () => {
    assert.equal(canIncrementCopy("OP08-072", 10, rules), true);
  });

  it("forbids Imu Event cost>=2", () => {
    const event = mainCard("EB01-050", {
      category: "Event",
      colors: ["Black"],
      cost: 3,
    });
    assert.equal(isForbiddenByLeader(event, "OP13-079", rules), true);
  });

  it("forbids Rayleigh cost>=5", () => {
    const expensive = mainCard("EB01-002", { colors: ["Red"], cost: 5 });
    assert.equal(isForbiddenByLeader(expensive, "OP12-001", rules), true);
  });

  it("hides Imu-forbidden Events from builder search", () => {
    const imu = leader("OP13-079", ["Black"]);
    const event = mainCard("EB01-050", {
      category: "Event",
      colors: ["Black"],
      cost: 3,
    });
    const okEvent = mainCard("P-001", {
      category: "Event",
      colors: ["Black"],
      cost: 1,
    });
    const results = filterBuilderCatalog([event, okEvent], imu, EMPTY_FILTERS, {
      ownedOnly: false,
      ownedIds: new Set(),
      rules,
    });
    assert.deepEqual(
      results.map((card) => card.id),
      ["P-001"],
    );
  });
});

describe("legality", () => {
  const cardsById = new Map<string, DeckPoolCard>([
    ["OP12-001", leader("OP12-001", ["Red"])],
    ["OP08-072", mainCard("OP08-072", { colors: ["Purple"] })],
    ["ST01-002", mainCard("ST01-002", { colors: ["Red"], name: "Filler" })],
    [
      "EB01-050",
      mainCard("EB01-050", {
        category: "Event",
        colors: ["Black"],
        cost: 3,
      }),
    ],
  ]);

  it("marks 46-card lists Illegal", () => {
    const cards = { "ST01-002": 46 };

    const status = validateVariation(
      "OP12-001",
      cards,
      cardsById,
      { "OP12-001": 1, "ST01-002": 46 },
      rules,
    );
    assert.equal(status.legal, false);
    assert.match(status.reasons.join(" "), /46\/50/);
  });

  it("marks fully owned 50-card lists Owned", () => {
    const cards: Record<string, number> = { "ST01-002": 50 };
    const status = validateVariation(
      "OP12-001",
      cards,
      cardsById,
      { "OP12-001": 1, "ST01-002": 50 },
      rules,
    );
    assert.equal(status.owned, true);
  });

  it("marks missing copies Unowned with reasons", () => {
    const cards: Record<string, number> = { "ST01-002": 4 };
    const status = validateVariation(
      "OP12-001",
      cards,
      cardsById,
      { "OP12-001": 1, "ST01-002": 2 },
      rules,
    );
    assert.equal(status.owned, false);
    assert.match(status.reasons.join(" "), /need 4, own 2/);
  });

  it("rejects dual-color cards under single-color Leaders", () => {
    const dual = mainCard("DUAL-001", { colors: ["Red", "Green"] });
    const redLeader = leader("RED-001", ["Red"]);
    assert.equal(isColorLegalForLeader(dual, redLeader), false);
  });

  it("summarizes Legal/Owned from the favorite variation only", () => {
    const unlimitedFiller = [
      ...rules,
      { kind: "copyLimit" as const, cardId: "ST01-002", max: null },
    ];
    const legalOwned = { "ST01-002": 50 };
    const illegal = { "ST01-002": 46 };
    const variations = [
      { id: "main", name: "Main", cards: illegal },
      { id: "tech", name: "Tech", cards: legalOwned },
    ];
    const ownedQty = { "OP12-001": 1, "ST01-002": 50 };

    const fromStored = summarizeDeck(
      "OP12-001",
      variations,
      cardsById,
      ownedQty,
      unlimitedFiller,
      "tech",
    );
    assert.equal(fromStored.legal, true);
    assert.equal(fromStored.owned, true);
    assert.equal(fromStored.variationCount, 2);

    const fromNamedMain = summarizeDeck(
      "OP12-001",
      variations,
      cardsById,
      ownedQty,
      unlimitedFiller,
    );
    assert.equal(fromNamedMain.legal, false);
    assert.equal(fromNamedMain.owned, true);
  });
});
