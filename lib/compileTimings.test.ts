import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compileTimings,
  timingLabel,
  withCompiledTimings,
} from "@/lib/compileTimings";

describe("compileTimings", () => {
  it("tags On Play and When Attacking on one card", () => {
    const timings = compileTimings(
      "[On Play] Draw 1 card. [When Attacking] This Character gains +1000 power.",
      null,
    );
    assert.deepEqual(timings, ["on-play", "when-attacking"]);
  });

  it("keeps Activate: Main and ignores Once Per Turn and DON!! costs", () => {
    const timings = compileTimings(
      "[Activate: Main] [Once Per Turn] [DON!! x1] Give this Leader 1 rested DON!!.",
      null,
    );
    assert.deepEqual(timings, ["activate-main"]);
  });

  it("tags [Counter] in effect text, not a numeric counter value", () => {
    const fromText = compileTimings(
      "[Counter] Up to 1 of your Leader or Character cards gains +2000 power.",
      null,
    );
    assert.deepEqual(fromText, ["counter"]);
    const noBrackets = compileTimings("This Character has 2000 counter.", null);
    assert.deepEqual(noBrackets, []);
  });

  it("tags Trigger from the trigger box even without a [Trigger] bracket", () => {
    const timings = compileTimings(null, "Play this card.");
    assert.deepEqual(timings, ["trigger"]);
  });

  it("tags [Trigger] in effect text", () => {
    const timings = compileTimings("[Trigger] Draw 1 card.", null);
    assert.deepEqual(timings, ["trigger"]);
  });

  it("ignores keyword and character-name brackets", () => {
    const timings = compileTimings(
      "[Blocker] [Rush] [Banish] [Double Attack] [Unblockable] You may trash 1 [Nami].",
      null,
    );
    assert.deepEqual(timings, []);
  });

  it("tags the remaining official windows", () => {
    const timings = compileTimings(
      "[On Block] [On K.O.] [Main] [Your Turn] [Opponent's Turn] [End of Your Turn] [On Your Opponent's Attack]",
      null,
    );
    assert.deepEqual(timings, [
      "on-block",
      "on-ko",
      "main",
      "your-turn",
      "opponents-turn",
      "end-of-your-turn",
      "on-opponents-attack",
    ]);
  });
});

describe("timingLabel", () => {
  it("maps slugs to printed window names", () => {
    assert.equal(timingLabel("on-play"), "On Play");
    assert.equal(timingLabel("on-ko"), "On K.O.");
    assert.equal(timingLabel("activate-main"), "Activate: Main");
  });
});

describe("withCompiledTimings", () => {
  it("fills missing or empty timings from printed text", () => {
    const hydrated = withCompiledTimings({
      effect: "[On Play] Draw 1 card.",
      trigger: null,
    });
    assert.deepEqual(hydrated.timings, ["on-play"]);
  });

  it("keeps ingest-compiled timings", () => {
    const hydrated = withCompiledTimings({
      effect: "[On Play] Draw 1 card.",
      trigger: null,
      timings: ["when-attacking"],
    });
    assert.deepEqual(hydrated.timings, ["when-attacking"]);
  });
});
