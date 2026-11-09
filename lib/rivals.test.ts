import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assignCardBucket,
  cleanCardIdList,
  clampRecordCount,
  emptyRivalJournal,
  nextRecordCount,
  parseRivalJournal,
  totalRecord,
} from "@/lib/rivals";

describe("cleanCardIdList", () => {
  it("dedupes, trims, and drops junk", () => {
    assert.deepEqual(
      cleanCardIdList([" OP01-016 ", "OP01-016", "", 4, "OP01-017"]),
      ["OP01-016", "OP01-017"],
    );
  });

  it("excludes ids in the other bucket", () => {
    assert.deepEqual(
      cleanCardIdList(["OP01-016", "OP01-017"], {
        exclude: new Set(["OP01-016"]),
      }),
      ["OP01-017"],
    );
  });
});

describe("assignCardBucket", () => {
  it("makes key and tech mutually exclusive", () => {
    const { target, other } = assignCardBucket(
      ["OP01-016"],
      ["OP01-016", "OP01-017"],
      ["OP01-016", "OP01-018"],
    );
    assert.deepEqual(target, ["OP01-016", "OP01-018"]);
    assert.deepEqual(other, ["OP01-017"]);
  });
});

describe("record counts", () => {
  it("floors at zero", () => {
    assert.equal(nextRecordCount(0, -1), 0);
    assert.equal(nextRecordCount(2, -1), 1);
    assert.equal(clampRecordCount(-3), 0);
    assert.equal(clampRecordCount(1.9), 1);
  });
});

describe("parseRivalJournal", () => {
  it("parses and strips overlapping tech ids", () => {
    const journal = parseRivalJournal("OP01-001", {
      keyPieceIds: ["OP01-016", "OP01-016"],
      techOptionIds: ["OP01-016", "OP01-017"],
      notes: "watch out for rush",
      vsDecks: {
        deckA: {
          deckName: "Main Rayleigh",
          notes: "go second",
          wins: 3,
          losses: 1,
        },
      },
    });
    assert.equal(journal.leaderId, "OP01-001");
    assert.deepEqual(journal.keyPieceIds, ["OP01-016"]);
    assert.deepEqual(journal.techOptionIds, ["OP01-017"]);
    assert.equal(journal.notes, "watch out for rush");
    assert.equal(journal.vsDecks.deckA?.deckName, "Main Rayleigh");
    assert.equal(journal.vsDecks.deckA?.wins, 3);
    assert.deepEqual(totalRecord(journal), { wins: 3, losses: 1 });
  });

  it("uses empty defaults for junk docs", () => {
    const journal = parseRivalJournal("OP01-001", {});
    const empty = emptyRivalJournal("OP01-001");
    assert.equal(journal.leaderId, empty.leaderId);
    assert.deepEqual(journal.keyPieceIds, []);
    assert.deepEqual(journal.techOptionIds, []);
    assert.equal(journal.notes, "");
    assert.deepEqual(journal.vsDecks, {});
    assert.equal(journal.updatedAtMs, 0);
  });
});
