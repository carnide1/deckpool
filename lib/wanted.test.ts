import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyCatch,
  catchAmount,
  gapsFromVariation,
  nextToggleWanted,
  nextWantedQuantity,
  raiseWantedToGap,
  wantedGap,
} from "@/lib/wanted";

describe("wantedGap", () => {
  it("is in-deck minus owned, floored at 0", () => {
    assert.equal(wantedGap(4, 1), 3);
    assert.equal(wantedGap(4, 4), 0);
    assert.equal(wantedGap(4, 5), 0);
    assert.equal(wantedGap(0, 0), 0);
  });
});

describe("raiseWantedToGap", () => {
  it("raises want up to the gap and never stacks or lowers", () => {
    assert.equal(raiseWantedToGap(1, 3), 3);
    assert.equal(raiseWantedToGap(6, 3), 6);
    assert.equal(raiseWantedToGap(0, 4), 4);
    assert.equal(raiseWantedToGap(2, 2), 2);
  });
});

describe("catchAmount and applyCatch", () => {
  it("catches the full remaining amount", () => {
    assert.equal(catchAmount(3, "all"), 3);
    assert.deepEqual(applyCatch(0, 3, "all"), {
      caught: 3,
      owned: 3,
      wanted: 0,
    });
  });

  it("catches a partial amount", () => {
    assert.equal(catchAmount(3, 1), 1);
    assert.deepEqual(applyCatch(1, 3, 1), {
      caught: 1,
      owned: 2,
      wanted: 2,
    });
  });

  it("clamps a request larger than the poster", () => {
    assert.equal(catchAmount(3, 99), 3);
    assert.deepEqual(applyCatch(0, 3, 99), {
      caught: 3,
      owned: 3,
      wanted: 0,
    });
  });

  it("is a no-op when nothing is wanted", () => {
    assert.equal(catchAmount(0, 1), 0);
    assert.equal(catchAmount(0, "all"), 0);
    assert.deepEqual(applyCatch(2, 0, 1), {
      caught: 0,
      owned: 2,
      wanted: 0,
    });
  });

  it("ignores a non-positive request", () => {
    assert.equal(catchAmount(3, 0), 0);
    assert.equal(catchAmount(3, -2), 0);
  });
});

describe("nextToggleWanted", () => {
  it("posts 1 from empty and drops the whole poster when posted", () => {
    assert.equal(nextToggleWanted(0), 1);
    assert.equal(nextToggleWanted(1), 0);
    assert.equal(nextToggleWanted(4), 0);
  });
});

describe("nextWantedQuantity", () => {
  it("steps bounty without a create-block", () => {
    assert.equal(nextWantedQuantity(0, 1), 1);
    assert.equal(nextWantedQuantity(2, 1), 3);
    assert.equal(nextWantedQuantity(1, -1), 0);
    assert.equal(nextWantedQuantity(0, -1), 0);
  });
});

describe("gapsFromVariation", () => {
  it("uses in-deck minus owned for this variation only", () => {
    assert.deepEqual(gapsFromVariation({ A: 4, B: 2 }, { A: 1 }), {
      A: 3,
      B: 2,
    });
  });

  it("skips fully owned and empty lines", () => {
    assert.deepEqual(
      gapsFromVariation({ A: 4, B: 0, C: 2 }, { A: 4, C: 5 }),
      {},
    );
  });
});
