import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  friendRequestId,
  friendshipId,
  relationshipWith,
} from "@/lib/friendIds";

describe("friendshipId", () => {
  it("is the same in either order", () => {
    assert.equal(friendshipId("b", "a"), "a_b");
    assert.equal(friendshipId("a", "b"), "a_b");
  });
});

describe("friendRequestId", () => {
  it("keeps sender first", () => {
    assert.equal(friendRequestId("b", "a"), "b_a");
  });
});

describe("relationshipWith", () => {
  const ctx = {
    selfUid: "me",
    friendUids: new Set(["f"]),
    incomingFromUids: new Set(["in"]),
    outgoingToUids: new Set(["out"]),
  };

  it("classifies every case", () => {
    assert.equal(relationshipWith("me", ctx), "self");
    assert.equal(relationshipWith("f", ctx), "friend");
    assert.equal(relationshipWith("in", ctx), "incoming");
    assert.equal(relationshipWith("out", ctx), "outgoing");
    assert.equal(relationshipWith("x", ctx), "none");
  });

  it("prefers friend over a leftover request", () => {
    assert.equal(
      relationshipWith("f", { ...ctx, incomingFromUids: new Set(["f"]) }),
      "friend",
    );
  });
});
