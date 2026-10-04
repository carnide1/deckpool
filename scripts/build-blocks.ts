import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assignBlock, isBlockId, opBoosterBlock } from "../lib/blocks";
import type { BlockId } from "../types/catalog";

const ROOT = process.cwd();

type CatalogCard = { id: string };
type ObservedFile = { blocks: Record<string, string[]> };
type OverrideFile = { blocks: Record<string, string> };

function opSetNumber(cardId: string): number | null {
  const match = /^OP(\d+)-/.exec(cardId);
  if (!match) return null;
  return Number(match[1]);
}

async function main() {
  const cards = JSON.parse(
    await readFile(path.join(ROOT, "data/cards.json"), "utf8"),
  ) as CatalogCard[];
  const observed = JSON.parse(
    await readFile(path.join(ROOT, "data/block-observed.json"), "utf8"),
  ) as ObservedFile;
  const overrides = JSON.parse(
    await readFile(path.join(ROOT, "data/block-overrides.json"), "utf8"),
  ) as OverrideFile;

  const resolved: Record<string, BlockId> = {};
  const missing: string[] = [];
  const belowFormula: string[] = [];

  for (const card of cards) {
    const block = assignBlock(
      observed.blocks[card.id],
      overrides.blocks[card.id],
    );
    if (!block) {
      missing.push(card.id);
      continue;
    }
    resolved[card.id] = block;

    const setNumber = opSetNumber(card.id);
    const formula = setNumber == null ? null : opBoosterBlock(setNumber);
    if (
      formula &&
      block !== "X" &&
      Number(block) < Number(formula)
    ) {
      belowFormula.push(`${card.id} is ${block}, booster formula is ${formula}`);
    }
  }

  if (missing.length > 0 || belowFormula.length > 0) {
    if (missing.length > 0) {
      console.error(`Missing a block for ${missing.length} cards:`);
      for (const id of missing) console.error(`  ${id}`);
    }
    if (belowFormula.length > 0) {
      console.error("Resolved block is older than the booster formula:");
      for (const line of belowFormula) console.error(`  ${line}`);
    }
    process.exit(1);
  }

  for (const [cardId, block] of Object.entries(overrides.blocks)) {
    if (!isBlockId(block)) {
      console.error(`Override ${cardId} is not a block: ${block}`);
      process.exit(1);
    }
    if (resolved[cardId] !== undefined && resolved[cardId] !== block) {
      console.error(
        `Override ${cardId} → ${block} did not win (resolved ${resolved[cardId]}).`,
      );
      process.exit(1);
    }
  }

  const ordered = Object.fromEntries(
    Object.entries(resolved).sort(([a], [b]) => a.localeCompare(b)),
  );
  await writeFile(
    path.join(ROOT, "data/blocks.json"),
    `${JSON.stringify(ordered, null, 2)}\n`,
  );
  console.log(`Wrote ${Object.keys(ordered).length} blocks.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
