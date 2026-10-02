import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeUsername, validateUsername } from "@/lib/usernames";

describe("normalizeUsername", () => {
  it("trims and lowercases", () => {
    assert.equal(normalizeUsername("  Luffy_D.Monkey "), "luffy_d.monkey");
  });
});

describe("validateUsername", () => {
  it("accepts valid names", () => {
    assert.equal(validateUsername("luffy"), null);
    assert.equal(validateUsername("zoro_3"), null);
    assert.equal(validateUsername("a.b"), null);
    assert.equal(validateUsername("0range"), null);
    assert.equal(validateUsername("a".repeat(20)), null);
  });

  it("enforces length", () => {
    assert.notEqual(validateUsername("ab"), null);
    assert.notEqual(validateUsername("a".repeat(21)), null);
  });

  it("rejects bad characters and leading punctuation", () => {
    assert.notEqual(validateUsername("_luffy"), null);
    assert.notEqual(validateUsername(".luffy"), null);
    assert.notEqual(validateUsername("luf fy"), null);
    assert.notEqual(validateUsername("luffy!"), null);
    assert.notEqual(validateUsername("Luffy"), null);
  });

  it("rejects reserved names", () => {
    assert.notEqual(validateUsername("admin"), null);
    assert.notEqual(validateUsername("deckpool"), null);
  });
});
