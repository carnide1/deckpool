import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { imageForCard } from "@/lib/cardPrefs";

const card = {
  id: "OP03-072",
  images: [
    "https://example.test/sample.png",
    "https://example.test/alt.png",
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
