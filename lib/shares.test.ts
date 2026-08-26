import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSharePayload,
  parseShare,
  pickPreferredImagesForShare,
  shareAbsoluteUrl,
  sharePagePath,
} from "@/lib/shares";

describe("sharePagePath / shareAbsoluteUrl", () => {
  it("builds a short /s/{id} path", () => {
    assert.equal(sharePagePath("abc123"), "/s/abc123");
  });

  it("prefers an explicit origin for SMS links", () => {
    assert.equal(
      shareAbsoluteUrl("abc123", "https://deckpool.example"),
      "https://deckpool.example/s/abc123",
    );
  });

  it("strips a trailing slash on the origin", () => {
    assert.equal(
      shareAbsoluteUrl("abc123", "https://deckpool.example/"),
      "https://deckpool.example/s/abc123",
    );
  });
});

describe("pickPreferredImagesForShare", () => {
  it("keeps only Bandai https prefs for requested ids", () => {
    assert.deepEqual(
      pickPreferredImagesForShare(
        ["OP01-001", "OP01-002"],
        {
          "OP01-001":
            "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png",
          "OP01-002": "http://insecure.example/b.png",
          "OP01-003":
            "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-003.png",
        },
      ),
      {
        "OP01-001":
          "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png",
      },
    );
  });
});

describe("buildSharePayload", () => {
  it("cleans card qtys and defaults names", () => {
    const payload = buildSharePayload({
      ownerUid: "u1",
      deckId: "d1",
      variationId: "v1",
      deckName: "  Purple Luffy  ",
      leaderId: "OP05-060",
      variationName: "  Main  ",
      cards: { "OP01-016": 4, "OP01-017": 0 },
      preferredImages: {
        "OP05-060":
          "https://en.onepiece-cardgame.com/images/cardlist/card/OP05-060.png",
      },
    });

    assert.equal(payload.deckName, "Purple Luffy");
    assert.equal(payload.variationName, "Main");
    assert.deepEqual(payload.cards, { "OP01-016": 4 });
    assert.deepEqual(payload.preferredImages, {
      "OP05-060":
        "https://en.onepiece-cardgame.com/images/cardlist/card/OP05-060.png",
    });
  });

  it("rejects a missing leader", () => {
    assert.throws(
      () =>
        buildSharePayload({
          ownerUid: "u1",
          deckId: "d1",
          variationId: "v1",
          deckName: "x",
          leaderId: "  ",
          variationName: "Main",
          cards: { "OP01-016": 1 },
        }),
      /Leader/,
    );
  });

  it("rejects an empty card map", () => {
    assert.throws(
      () =>
        buildSharePayload({
          ownerUid: "u1",
          deckId: "d1",
          variationId: "v1",
          deckName: "x",
          leaderId: "OP05-060",
          variationName: "Main",
          cards: { "OP01-016": 0 },
        }),
      /Add cards/,
    );
  });
});

describe("parseShare", () => {
  it("returns null when required fields are missing", () => {
    assert.equal(parseShare("s1", { deckName: "x" }), null);
  });

  it("parses a valid snapshot", () => {
    const share = parseShare("s1", {
      ownerUid: "u1",
      deckId: "d1",
      variationId: "v1",
      deckName: "Anti-yellow",
      leaderId: "OP05-060",
      variationName: "Main",
      cards: { "OP01-016": 4, "bad": "nope" },
      preferredImages: {
        "OP05-060":
          "https://en.onepiece-cardgame.com/images/cardlist/card/OP05-060.png",
        "skip": "ftp://nope",
        "other": "https://evil.example/x.png",
      },
    });

    assert.ok(share);
    assert.equal(share.id, "s1");
    assert.deepEqual(share.cards, { "OP01-016": 4 });
    assert.deepEqual(share.preferredImages, {
      "OP05-060":
        "https://en.onepiece-cardgame.com/images/cardlist/card/OP05-060.png",
    });
  });
});
