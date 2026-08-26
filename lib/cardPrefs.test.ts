import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  imageCandidates,
  imageForCard,
  publicImageUrl,
} from "@/lib/cardPrefs";

const card = {
  id: "OP03-072",
  images: [
    "https://example.test/sample.png",
    "https://example.test/alt.png",
    "https://en.onepiece-cardgame.com/images/cardlist/card/OP03-072.png",
  ],
};

describe("imageForCard", () => {
  it("uses preferred art when that url is still in the catalog list", () => {
    assert.equal(
      imageForCard(card, { "OP03-072": "https://example.test/alt.png" }),
      "https://example.test/alt.png",
    );
  });

  it("falls back to the first scan when nothing is preferred", () => {
    assert.equal(imageForCard(card, {}), "https://example.test/sample.png");
  });

  it("falls back when the saved url is gone from the catalog", () => {
    assert.equal(
      imageForCard(card, { "OP03-072": "https://example.test/old.png" }),
      "https://example.test/sample.png",
    );
  });

  it("returns null when the card has no scans", () => {
    assert.equal(imageForCard({ id: "X", images: [] }, { X: "gone" }), null);
  });
});

describe("imageCandidates", () => {
  it("puts preferred first then the rest of the catalog scans", () => {
    assert.deepEqual(
      imageCandidates(card, { "OP03-072": "https://example.test/alt.png" }),
      [
        "https://example.test/alt.png",
        "https://example.test/sample.png",
        "https://en.onepiece-cardgame.com/images/cardlist/card/OP03-072.png",
      ],
    );
  });

  it("returns empty when there is no art", () => {
    assert.deepEqual(imageCandidates({ id: "X", images: [] }, {}), []);
  });
});

describe("publicImageUrl", () => {
  it("leaves urls unchanged when no mirror origin is set", () => {
    const prev = process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN;
    delete process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN;
    try {
      assert.equal(
        publicImageUrl(
          "https://en.onepiece-cardgame.com/images/cardlist/card/OP09-092.png",
        ),
        "https://en.onepiece-cardgame.com/images/cardlist/card/OP09-092.png",
      );
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN;
      else process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN = prev;
    }
  });

  it("rewrites Bandai host to the configured mirror origin", () => {
    const prev = process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN;
    process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN = "https://cdn.example.test/";
    try {
      assert.equal(
        publicImageUrl(
          "https://en.onepiece-cardgame.com/images/cardlist/card/OP09-092.png",
        ),
        "https://cdn.example.test/images/cardlist/card/OP09-092.png",
      );
      assert.equal(
        publicImageUrl("https://example.test/other.png"),
        "https://example.test/other.png",
      );
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN;
      else process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN = prev;
    }
  });
});
