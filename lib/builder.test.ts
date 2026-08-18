import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canAddToDeck } from "@/lib/builder";
import type { ConstructionRule } from "@/types/construction";

const rules: ConstructionRule[] = [
  { kind: "copyLimit", cardId: "OP01-016", max: 4 },
];

describe("canAddToDeck", () => {
  it("blocks at the construction copy limit", () => {
    assert.equal(canAddToDeck("OP01-016", 4, 10, false, rules), false);
    assert.equal(canAddToDeck("OP01-016", 3, 10, false, rules), true);
  });

  it("blocks at owned qty when owned-only is on", () => {
    assert.equal(canAddToDeck("OP01-016", 2, 2, true, rules), false);
    assert.equal(canAddToDeck("OP01-016", 1, 2, true, rules), true);
  });

  it("ignores owned qty when owned-only is off", () => {
    assert.equal(canAddToDeck("OP01-016", 2, 2, false, rules), true);
  });
});
