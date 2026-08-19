import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  orderVariations,
  resolveFavoriteVariationId,
  sortVariations,
} from "@/lib/variations";
import type { Variation } from "@/types/deck";

function variation(
  id: string,
  name: string,
  updatedAt?: number,
): Variation {
  return { id, name, cards: {}, updatedAt };
}

describe("resolveFavoriteVariationId", () => {
  it("returns the stored id when that variation still exists", () => {
    const variations = [
      variation("a", "Anti-yellow"),
      variation("m", "Main"),
    ];
    assert.equal(resolveFavoriteVariationId("a", variations), "a");
  });

  it("falls back to a variation named Main", () => {
    const variations = [
      variation("a", "Anti-yellow", 200),
      variation("m", "Main", 100),
    ];
    assert.equal(resolveFavoriteVariationId("gone", variations), "m");
    assert.equal(resolveFavoriteVariationId(undefined, variations), "m");
  });

  it("falls back to most recently edited when nothing is named Main", () => {
    const variations = [
      variation("old", "Budget", 10),
      variation("new", "Tech", 50),
    ];
    assert.equal(resolveFavoriteVariationId(null, variations), "new");
  });

  it("returns null for an empty list", () => {
    assert.equal(resolveFavoriteVariationId("x", []), null);
  });
});

describe("sortVariations", () => {
  it("pins the favorite first, then recency", () => {
    const variations = [
      variation("old", "Alpha", 10),
      variation("fav", "Zulu", 20),
      variation("new", "Mid", 50),
    ];
    assert.deepEqual(
      sortVariations(variations, "fav").map((row) => row.id),
      ["fav", "new", "old"],
    );
  });

  it("sorts by recency then name when there is no favorite", () => {
    const variations = [
      variation("b", "Beta", 10),
      variation("a", "Alpha", 10),
      variation("c", "Gamma", 30),
    ];
    assert.deepEqual(
      sortVariations(variations, null).map((row) => row.id),
      ["c", "a", "b"],
    );
  });

  it("ignores a favorite id that is not in the list", () => {
    const variations = [
      variation("a", "Alpha", 1),
      variation("b", "Beta", 2),
    ];
    assert.deepEqual(
      sortVariations(variations, "missing").map((row) => row.id),
      ["b", "a"],
    );
  });
});

describe("orderVariations", () => {
  it("pins a variation named Main when no favorite is stored", () => {
    const variations = [
      variation("tech", "Anti-yellow", 90),
      variation("main", "Main", 10),
    ];
    assert.deepEqual(
      orderVariations(variations, undefined).map((row) => row.id),
      ["main", "tech"],
    );
  });
});
