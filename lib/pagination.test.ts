import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampPage,
  pageCountFor,
  visiblePageTokens,
} from "@/lib/pagination";

describe("pagination", () => {
  it("returns 0 pages for an empty list", () => {
    assert.equal(pageCountFor(0, 60), 0);
  });

  it("rounds up partial pages", () => {
    assert.equal(pageCountFor(61, 60), 2);
  });

  it("clamps the current page into range", () => {
    assert.equal(clampPage(0, 4), 1);
    assert.equal(clampPage(9, 4), 4);
  });

  it("windows page numbers around the current page", () => {
    assert.deepEqual(visiblePageTokens(1, 3), [1, 2, 3]);
    assert.deepEqual(visiblePageTokens(5, 10), [1, "gap", 4, 5, 6, "gap", 10]);
  });
});
