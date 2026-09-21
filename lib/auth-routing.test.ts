import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isAuthLandingPath,
  isSafeNextPath,
} from "@/lib/auth-routing";

describe("isAuthLandingPath", () => {
  it("recognizes auth landings", () => {
    assert.equal(isAuthLandingPath("/"), true);
    assert.equal(isAuthLandingPath("/login"), true);
    assert.equal(isAuthLandingPath("/decks"), false);
  });
});

describe("isSafeNextPath", () => {
  it("allows app routes and query strings", () => {
    assert.equal(isSafeNextPath("/decks"), true);
    assert.equal(isSafeNextPath("/decks/abc?mode=edit"), true);
    assert.equal(isSafeNextPath("/collection"), true);
    assert.equal(isSafeNextPath("/wanted"), true);
    assert.equal(isSafeNextPath("/cards?owned=1"), true);
    assert.equal(isSafeNextPath("/explore?owned=1"), true);
    assert.equal(isSafeNextPath("/profile"), true);
  });

  it("rejects open redirects and auth/share paths", () => {
    assert.equal(isSafeNextPath(null), false);
    assert.equal(isSafeNextPath(""), false);
    assert.equal(isSafeNextPath("//evil.example"), false);
    assert.equal(isSafeNextPath("https://evil.example"), false);
    assert.equal(isSafeNextPath("/login"), false);
    assert.equal(isSafeNextPath("/signup"), false);
    assert.equal(isSafeNextPath("/"), false);
    assert.equal(isSafeNextPath("/s/abc"), false);
    assert.equal(isSafeNextPath("/api/secret"), false);
  });
});
