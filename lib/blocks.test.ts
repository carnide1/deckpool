import assert from "node:assert/strict";
import { describe, it } from "node:test";
import cards from "@/data/cards.json";
import blocks from "@/data/blocks.json";
import {
  assignBlock,
  blockForId,
  isBlockId,
  opBoosterBlock,
  resolveObservedBlock,
} from "@/lib/blocks";

describe("opBoosterBlock", () => {
  it("groups booster packs four at a time", () => {
    assert.equal(opBoosterBlock(4), "1");
    assert.equal(opBoosterBlock(5), "2");
    assert.equal(opBoosterBlock(17), "5");
    assert.equal(opBoosterBlock(21), null);
  });
});

describe("resolveObservedBlock", () => {
  it("keeps a numbered block when a manga printing is also indexed as X", () => {
    assert.equal(resolveObservedBlock(["4", "X"]), "4");
    assert.equal(resolveObservedBlock(["X"]), "X");
    assert.equal(resolveObservedBlock(["4", "5"]), "5");
  });
});

describe("assignBlock", () => {
  it("lets an official override win", () => {
    assert.equal(assignBlock(["1", "X"], "X"), "X");
    assert.equal(assignBlock(undefined, "4"), "4");
    assert.equal(assignBlock(["1"], undefined), "1");
  });
});

describe("catalog blocks", () => {
  it("assigns a current block to every catalog card", () => {
    const table = blocks as Record<string, string>;
    const missing: string[] = [];
    for (const card of cards as { id: string }[]) {
      if (!isBlockId(table[card.id] ?? "")) missing.push(card.id);
    }
    assert.deepEqual(missing, []);
  });

  it("matches Bandai's current number on known cards", () => {
    assert.equal(blockForId("OP01-001"), "1");
    assert.equal(blockForId("OP01-016"), "X");
    assert.equal(blockForId("OP01-039"), "4");
    assert.equal(blockForId("OP05-001"), "2");
    assert.equal(blockForId("OP16-032"), "5");
    assert.equal(blockForId("OP17-001"), "5");
    assert.equal(blockForId("EB04-061"), "4");
    assert.equal(blockForId("ST01-011"), "4");
    assert.equal(blockForId("P-110"), "4");
  });
});
