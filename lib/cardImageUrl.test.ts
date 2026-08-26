import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  browserImageUrl,
  displayImageCandidates,
  getCardImageMirrorOrigin,
  imageCandidates,
  imageForCard,
  publicImageUrl,
  urlsForCatalogImage,
} from "@/lib/cardImageUrl";

const card = {
  id: "OP03-072",
  images: [
    "https://example.test/sample.png",
    "https://example.test/alt.png",
    "https://en.onepiece-cardgame.com/images/cardlist/card/OP03-072.png",
  ],
};

function withOrigin<T>(origin: string | undefined, run: () => T): T {
  const prev = process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN;
  if (origin === undefined) delete process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN;
  else process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN = origin;
  try {
    return run();
  } finally {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN;
    else process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN = prev;
  }
}

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

describe("publicImageUrl / mirror origin", () => {
  it("leaves urls unchanged when no mirror origin is set", () => {
    withOrigin(undefined, () => {
      assert.equal(getCardImageMirrorOrigin(), null);
      assert.equal(
        publicImageUrl(
          "https://en.onepiece-cardgame.com/images/cardlist/card/OP09-092.png",
        ),
        "https://en.onepiece-cardgame.com/images/cardlist/card/OP09-092.png",
      );
    });
  });

  it("rewrites Bandai host to the configured mirror origin", () => {
    withOrigin("https://cdn.example.test/", () => {
      assert.equal(
        getCardImageMirrorOrigin(),
        "https://cdn.example.test",
      );
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
    });
  });

  it("ignores an invalid mirror origin", () => {
    withOrigin("not a url", () => {
      assert.equal(getCardImageMirrorOrigin(), null);
      assert.equal(
        publicImageUrl(
          "https://en.onepiece-cardgame.com/images/cardlist/card/P-155.png",
        ),
        "https://en.onepiece-cardgame.com/images/cardlist/card/P-155.png",
      );
    });
  });
});

describe("urlsForCatalogImage / displayImageCandidates", () => {
  it("proxies Bandai urls through same-origin /card-art when no mirror is set", () => {
    withOrigin(undefined, () => {
      const bandai =
        "https://en.onepiece-cardgame.com/images/cardlist/card/P-155.png";
      assert.equal(
        browserImageUrl(bandai),
        `/card-art?url=${encodeURIComponent(bandai)}`,
      );
      assert.deepEqual(urlsForCatalogImage(bandai), [
        `/card-art?url=${encodeURIComponent(bandai)}`,
      ]);
    });
  });

  it("tries mirror then proxied Bandai for each Bandai catalog url", () => {
    withOrigin("https://cdn.example.test", () => {
      const a =
        "https://en.onepiece-cardgame.com/images/cardlist/card/P-155.png";
      const b =
        "https://en.onepiece-cardgame.com/images/cardlist/card/P-155_p1.png";
      assert.deepEqual(displayImageCandidates([a, b]), [
        "https://cdn.example.test/images/cardlist/card/P-155.png",
        `/card-art?url=${encodeURIComponent(a)}`,
        "https://cdn.example.test/images/cardlist/card/P-155_p1.png",
        `/card-art?url=${encodeURIComponent(b)}`,
      ]);
    });
  });

  it("leaves non-Bandai urls unchanged", () => {
    withOrigin(undefined, () => {
      assert.deepEqual(urlsForCatalogImage("https://example.test/x.png"), [
        "https://example.test/x.png",
      ]);
    });
  });
});
