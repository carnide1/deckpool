import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bannedPairsIn,
  isBanned,
  isPlayableInStandard,
  isRotated,
} from "@/lib/standard";

describe("standard format", () => {
  it("treats X as always in rotation and Block 1 as rotated", () => {
    assert.equal(isRotated("X", 2), false);
    assert.equal(isRotated("2", 2), false);
    assert.equal(isRotated("1", 2), true);
    assert.equal(isRotated(null, 2), false);
  });

  it("hides rotated and banned cards from the Standard filter", () => {
    assert.equal(isPlayableInStandard({ id: "OP01-001", block: "1" }), false);
    assert.equal(isPlayableInStandard({ id: "OP01-016", block: "X" }), true);
    assert.equal(isPlayableInStandard({ id: "OP05-001", block: "2" }), true);
    assert.equal(isBanned("OP06-116"), true);
    assert.equal(isPlayableInStandard({ id: "OP06-116", block: "2" }), false);
    assert.equal(isBanned("OP14-020"), false);
  });

  it("flags a banned pair only when both cards are present", () => {
    const both = new Set(["OP08-069", "OP11-040"]);
    assert.equal(bannedPairsIn(both).length, 1);
    assert.equal(bannedPairsIn(new Set(["OP11-040"])).length, 0);
  });
});
