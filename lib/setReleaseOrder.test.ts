import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareSetsByReleaseOrder, SET_RELEASE_ORDER } from "./setReleaseOrder";

describe("compareSetsByReleaseOrder", () => {
  it("sorts sets by release order, not alphabetically", () => {
    const sets = ["OP01", "EB01", "ST06", "PRB01", "ST01", "OP02"];
    const sorted = [...sets].sort(compareSetsByReleaseOrder);
    
    // ST01 came first, then OP01, then ST06, then OP02, then EB01, then much later PRB01
    assert.deepEqual(sorted, ["ST01", "OP01", "ST06", "OP02", "EB01", "PRB01"]);
  });
  
  it("places EB sets at their correct release positions, not alphabetically first", () => {
    const sets = ["EB01", "OP01", "OP02"];
    const sorted = [...sets].sort(compareSetsByReleaseOrder);
    
    // EB01 was released after OP02, not before OP01 (as alphabetical would suggest)
    assert.deepEqual(sorted, ["OP01", "OP02", "EB01"]);
  });
  
  it("places PRB sets at their correct release positions", () => {
    const sets = ["PRB01", "OP06", "OP07", "OP08"];
    const sorted = [...sets].sort(compareSetsByReleaseOrder);
    
    // PRB01 was released with OP06, not before
    assert.deepEqual(sorted, ["OP06", "PRB01", "OP07", "OP08"]);
  });
  
  it("places promotional sets at the bottom when sorting by newest", () => {
    const sets = ["P", "OP01", "ST01", "EB01"];
    const sorted = [...sets].sort(compareSetsByReleaseOrder);
    
    // P has order 0, so it comes first chronologically (before ST01)
    // When sorting by "newest", P will appear at the bottom
    assert.deepEqual(sorted, ["P", "ST01", "OP01", "EB01"]);
  });
  
  it("handles mixed ST, OP, EB, and PRB sets correctly", () => {
    const sets = ["ST28", "EB03", "OP13", "PRB02", "ST29"];
    const sorted = [...sets].sort(compareSetsByReleaseOrder);
    
    // Check they're in chronological order per our release mapping
    for (let i = 1; i < sorted.length; i++) {
      const prevOrder = SET_RELEASE_ORDER[sorted[i - 1]];
      const currOrder = SET_RELEASE_ORDER[sorted[i]];
      assert.ok(prevOrder < currOrder, 
        `${sorted[i - 1]} (order ${prevOrder}) should come before ${sorted[i]} (order ${currOrder})`);
    }
  });
  
  it("falls back to alphabetical for unknown sets", () => {
    const sets = ["UNKNOWN2", "UNKNOWN1", "OP01"];
    const sorted = [...sets].sort(compareSetsByReleaseOrder);
    
    // Known sets come first, then unknown sets alphabetically
    assert.deepEqual(sorted, ["OP01", "UNKNOWN1", "UNKNOWN2"]);
  });
});
