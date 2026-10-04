import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canIncrementCopy,
  filterBuilderCatalog,
  isColorLegalForLeader,
  stripIllegalCards,
} from "@/lib/builder";
import { EMPTY_FILTERS } from "@/lib/search/filters";
import { isForbiddenByLeader } from "@/lib/construction";
import { deckNotes, summarizeDeck, validateVariation } from "@/lib/legality";
import type { DeckPoolCard } from "@/types/catalog";
import type { ConstructionRule } from "@/types/construction";
import type { StandardRules } from "@/types/standard";

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
  {
    kind: "forbid" as const,
    whenLeader: "P-117",
    match: { requireTypes: ["East Blue"] },
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
    timings: [],
    block: "2",
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
    timings: [],
    block: "2",
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

  it("forbids non–East Blue cards under Nami P-117", () => {
    const eastBlue = mainCard("EB02-011", {
      colors: ["Blue"],
      types: ["East Blue"],
    });
    const other = mainCard("OP01-016", {
      colors: ["Blue"],
      types: ["Straw Hat Crew"],
    });
    assert.equal(isForbiddenByLeader(eastBlue, "P-117", rules), false);
    assert.equal(isForbiddenByLeader(other, "P-117", rules), true);
  });

  it("hides non–East Blue cards from Nami builder search", () => {
    const nami = leader("P-117", ["Blue"]);
    const eastBlue = mainCard("EB02-011", {
      colors: ["Blue"],
      types: ["East Blue"],
    });
    const other = mainCard("OP01-016", {
      colors: ["Blue"],
      types: ["Straw Hat Crew"],
    });
    const results = filterBuilderCatalog([eastBlue, other], nami, EMPTY_FILTERS, {
      ownedOnly: false,
      ownedIds: new Set(),
      rules,
    });
    assert.deepEqual(
      results.map((card) => card.id),
      ["EB02-011"],
    );
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

  it("rejects Leaders sitting in the main-deck map", () => {
    const status = validateVariation(
      "OP12-001",
      { "OP12-001": 1, "ST01-002": 49 },
      cardsById,
      { "OP12-001": 1, "ST01-002": 49 },
      rules,
    );
    assert.equal(status.legal, false);
    assert.match(status.reasons.join(" "), /not a main-deck card/);
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

  it("marks a Block 1 card and a Block 1 Leader Illegal", () => {
    const rotated = mainCard("ST01-002", { block: "1", colors: ["Red"] });
    const rotatedLeader = leader("OP01-001", ["Red"]);
    rotatedLeader.block = "1";
    const map = new Map<string, DeckPoolCard>([
      ["OP12-001", leader("OP12-001", ["Red"])],
      ["OP01-001", rotatedLeader],
      ["ST01-002", rotated],
    ]);
    const open: StandardRules = {
      minBlock: 2,
      banned: [],
      restricted: [],
      bannedPairs: [],
    };
    const fromCard = validateVariation(
      "OP12-001",
      { "ST01-002": 4 },
      map,
      { "OP12-001": 1, "ST01-002": 4 },
      rules,
      open,
    );
    assert.equal(fromCard.legal, false);
    assert.match(fromCard.reasons.join(" "), /ST01-002 is Block 1/);

    const fromLeader = validateVariation(
      "OP01-001",
      { "ST01-002": 4 },
      map,
      { "OP01-001": 1, "ST01-002": 4 },
      rules,
      open,
    );
    assert.equal(fromLeader.legal, false);
    assert.match(fromLeader.reasons.join(" "), /Leader OP01-001 is Block 1/);
  });

  it("marks a missing block Illegal", () => {
    const blank = mainCard("ST01-002", { block: null, colors: ["Red"] });
    const map = new Map<string, DeckPoolCard>([
      ["OP12-001", leader("OP12-001", ["Red"])],
      ["ST01-002", blank],
    ]);
    const status = validateVariation(
      "OP12-001",
      { "ST01-002": 4 },
      map,
      { "OP12-001": 1, "ST01-002": 4 },
      rules,
      { minBlock: 2, banned: [], restricted: [], bannedPairs: [] },
    );
    assert.equal(status.legal, false);
    assert.match(status.reasons.join(" "), /no block number/);
  });

  it("marks banned cards and banned pairs Illegal", () => {
    const nami = mainCard("OP03-040", { name: "Nami", colors: ["Red"] });
    const luffy = mainCard("OP11-040", { name: "Monkey.D.Luffy", colors: ["Red"] });
    const linlin = mainCard("OP08-069", { name: "Charlotte Linlin", colors: ["Red"] });
    const map = new Map<string, DeckPoolCard>([
      ["OP12-001", leader("OP12-001", ["Red"])],
      ["OP03-040", nami],
      ["OP11-040", luffy],
      ["OP08-069", linlin],
    ]);
    const standard: StandardRules = {
      minBlock: 2,
      banned: ["OP03-040"],
      restricted: [],
      bannedPairs: [["OP08-069", "OP11-040"]],
    };
    const banned = validateVariation(
      "OP12-001",
      { "OP03-040": 1 },
      map,
      { "OP12-001": 1, "OP03-040": 1 },
      rules,
      standard,
    );
    assert.match(banned.reasons.join(" "), /Nami is banned/);

    const oneSide = validateVariation(
      "OP12-001",
      { "OP11-040": 1 },
      map,
      { "OP12-001": 1, "OP11-040": 1 },
      rules,
      standard,
    );
    assert.equal(
      oneSide.reasons.some((reason) => reason.includes("cannot be in the same deck")),
      false,
    );

    const pair = validateVariation(
      "OP12-001",
      { "OP11-040": 1, "OP08-069": 1 },
      map,
      { "OP12-001": 1, "OP11-040": 1, "OP08-069": 1 },
      rules,
      standard,
    );
    assert.match(pair.reasons.join(" "), /cannot be in the same deck/);
  });

  it("enforces a restricted copy cap", () => {
    const filler = mainCard("ST01-002", { name: "Filler", colors: ["Red"] });
    const map = new Map<string, DeckPoolCard>([
      ["OP12-001", leader("OP12-001", ["Red"])],
      ["ST01-002", filler],
    ]);
    const standard: StandardRules = {
      minBlock: 2,
      banned: [],
      restricted: [{ cardId: "ST01-002", max: 1 }],
      bannedPairs: [],
    };
    const one = validateVariation(
      "OP12-001",
      { "ST01-002": 1 },
      map,
      { "OP12-001": 1, "ST01-002": 1 },
      rules,
      standard,
    );
    assert.equal(
      one.reasons.some((reason) => reason.includes("Too many copies")),
      false,
    );
    const two = validateVariation(
      "OP12-001",
      { "ST01-002": 2 },
      map,
      { "OP12-001": 1, "ST01-002": 2 },
      rules,
      standard,
    );
    assert.match(two.reasons.join(" "), /Too many copies of Filler \(2\/1\)/);
  });

  it("hides ownership notes when there is no binder", () => {
    const notes = deckNotes(
      [
        "Main deck has 1/50 cards.",
        "Leader not owned.",
        "Nami: need 4, own 0.",
      ],
      false,
    );
    assert.deepEqual(notes, ["Main deck has 1/50 cards."]);
    assert.equal(
      deckNotes(["Leader not owned."], true).length,
      1,
    );
  });

  it("leaves a Block 1 card in place when the Leader changes", () => {
    const rotated = mainCard("ST01-002", { block: "1", colors: ["Red"] });
    const map = new Map<string, DeckPoolCard>([
      ["OP12-001", leader("OP12-001", ["Red"])],
      ["ST01-002", rotated],
    ]);
    const next = stripIllegalCards({ "ST01-002": 4 }, "OP12-001", map, rules);
    assert.deepEqual(next, { "ST01-002": 4 });
  });
});
