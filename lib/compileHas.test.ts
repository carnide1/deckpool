import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compileHas, isSearcherText } from "@/lib/compileHas";

describe("compileHas", () => {
  it("tags official bracket keywords including Unblockable", () => {
    const flags = compileHas(
      "[Blocker] (After your opponent declares an attack…) [Unblockable] during this turn.",
      null,
      1000,
    );
    assert.ok(flags.includes("blocker"));
    assert.ok(flags.includes("unblockable"));
    assert.ok(flags.includes("counter"));
    assert.ok(flags.includes("effect"));
  });

  it("tags searchers that look at the top and add to hand", () => {
    const effect =
      "[Main] Look at 5 cards from the top of your deck; reveal up to 1 {Straw Hat Crew} type card other than [Nami] and add it to your hand. Then place the rest at the bottom of your deck in any order.";
    assert.equal(isSearcherText(effect), true);
    const flags = compileHas(effect, null, null);
    assert.ok(flags.includes("searcher"));
  });

  it("does not tag look-at-and-play effects as searchers", () => {
    const effect =
      "[Counter] Look at 5 cards from the top of your deck and play up to 1 {Animal} type Character card with a cost of 3 or less.";
    assert.equal(isSearcherText(effect), false);
    const flags = compileHas(effect, null, null);
    assert.equal(flags.includes("searcher"), false);
  });
});
