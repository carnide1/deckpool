import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextCollectionQuantity, parseCollectionItem } from "@/lib/collection";
import { nextWantedQuantity, parseWantedItem } from "@/lib/wanted";

describe("quantity sanitization", () => {
  it("normalizes malformed collection quantities", () => {
    assert.equal(
      parseCollectionItem("OP01-001", { quantity: 2.9 }).quantity,
      2,
    );
    assert.equal(
      parseCollectionItem("OP01-001", { quantity: -1 }).quantity,
      0,
    );
  });

  it("normalizes malformed wanted quantities", () => {
    assert.equal(parseWantedItem("OP01-001", { quantity: 2.9 }).quantity, 2);
    assert.equal(parseWantedItem("OP01-001", { quantity: -1 }).quantity, 0);
  });

  it("rejects non-finite quantity calculations", () => {
    assert.equal(nextCollectionQuantity(1, Number.NaN, true), null);
    assert.equal(nextWantedQuantity(1, Number.POSITIVE_INFINITY), 0);
  });
});
