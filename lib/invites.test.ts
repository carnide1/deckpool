import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INVITE_TTL_MS,
  inviteAbsoluteUrl,
  invitePagePath,
  isInviteExpired,
  parseInvite,
} from "@/lib/invites";

describe("invitePagePath", () => {
  it("builds /invite/{code} and encodes odd characters", () => {
    assert.equal(invitePagePath("abc123"), "/invite/abc123");
    assert.equal(invitePagePath("a b/c"), "/invite/a%20b%2Fc");
  });
});

describe("inviteAbsoluteUrl", () => {
  it("uses an explicit origin with or without a trailing slash", () => {
    assert.equal(
      inviteAbsoluteUrl("abc", "https://deckpool.example"),
      "https://deckpool.example/invite/abc",
    );
    assert.equal(
      inviteAbsoluteUrl("abc", "https://deckpool.example/"),
      "https://deckpool.example/invite/abc",
    );
  });
});

describe("isInviteExpired", () => {
  const invite = { expiresAtMs: 1_000 };
  it("is live until the expiry moment", () => {
    assert.equal(isInviteExpired(invite, 999), false);
  });
  it("is expired at and after expiry", () => {
    assert.equal(isInviteExpired(invite, 1_000), true);
    assert.equal(isInviteExpired(invite, 5_000), true);
  });
  it("uses a 7-day lifetime", () => {
    assert.equal(INVITE_TTL_MS, 7 * 24 * 60 * 60 * 1000);
  });
});

describe("parseInvite", () => {
  const valid = {
    inviterUid: "u1",
    inviterUsername: "luffy",
    inviterDisplayName: "Luffy",
    createdAt: { seconds: 10 },
    expiresAt: { seconds: 20 },
  };

  it("parses a valid doc", () => {
    assert.deepEqual(parseInvite("code1", valid), {
      code: "code1",
      inviterUid: "u1",
      inviterUsername: "luffy",
      inviterDisplayName: "Luffy",
      createdAtMs: 10_000,
      expiresAtMs: 20_000,
    });
  });

  it("returns null without an inviter uid, username, or expiry", () => {
    assert.equal(parseInvite("c", { ...valid, inviterUid: "" }), null);
    assert.equal(parseInvite("c", { ...valid, inviterUsername: 5 }), null);
    assert.equal(parseInvite("c", { ...valid, expiresAt: undefined }), null);
  });

  it("defaults a missing display name to empty", () => {
    const rest: Record<string, unknown> = { ...valid };
    delete rest.inviterDisplayName;
    assert.equal(parseInvite("c", rest)?.inviterDisplayName, "");
  });
});
