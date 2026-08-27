import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { compileHas } from "../lib/compileHas";
import type { CardCategory, DeckPoolCard, OptcgColor, PackMeta } from "../types/catalog";
import type { CardMatch, ConstructionRule } from "../types/construction";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");

const VALID_CATEGORIES = new Set<CardCategory>([
  "Leader",
  "Character",
  "Event",
  "Stage",
]);

const VALID_COLORS = new Set<OptcgColor>([
  "Red",
  "Green",
  "Blue",
  "Purple",
  "Black",
  "Yellow",
]);

const ANY_NUMBER_RE =
  /you may have any number of this card in your deck/i;
const CANNOT_INCLUDE_RE = /you cannot include (.+?) in your deck/i;
const ONLY_INCLUDE_TYPE_RE =
  /you can only include \{(.+?)\} type cards in your deck/i;
const CONSTRUCTION_HINT_RE =
  /any number of this card|cannot include|can only include/i;

const SEED_RULES: ConstructionRule[] = [
  { kind: "copyLimit", cardId: "OP08-072", max: null },
  {
    kind: "forbid",
    whenLeader: "OP13-079",
    match: { category: "Event", cost: { op: ">=", value: 2 } },
  },
  {
    kind: "forbid",
    whenLeader: "OP12-001",
    match: { cost: { op: ">=", value: 5 } },
  },
];

type RawCard = {
  id?: string;
  pack_id?: string;
  name?: string;
  rarity?: string;
  category?: string;
  colors?: string[];
  cost?: number | null;
  attributes?: string[];
  power?: number | null;
  counter?: number | null;
  types?: string[];
  effect?: string | null;
  trigger?: string | null;
  img_full_url?: string | null;
};

type RawPack = {
  id: string;
  raw_title: string;
  title_parts: {
    label: string | null;
    prefix: string | null;
    title: string | null;
  };
};

type UnparsedConstruction = {
  cardId: string;
  effect: string;
  reason: string;
};

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function inputDirFromArgs(): string {
  const flagged = argValue("--input");
  if (flagged) return flagged;
  const positional = process.argv.slice(2).find((a) => !a.startsWith("-"));
  if (positional) return positional;
  return path.join(ROOT, ".tmp", "punk-records", "english");
}

function decodeHtml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function cleanText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = decodeHtml(String(value)).trim();
  if (!trimmed || trimmed === "-") return null;
  return trimmed;
}

function cleanImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\?.*$/, "");
}

/** OP08-072_p1 / OP08-072_r1 → OP08-072 */
function baseCardId(id: string): string {
  return id.replace(/_[pr]\d+$/i, "");
}

function isVariantId(id: string): boolean {
  return /_[pr]\d+$/i.test(id);
}

function seriesAndSetFromCardId(id: string): { series: string; setCode: string } {
  const prefix = id.split("-")[0] ?? id;
  if (prefix === "P") return { series: "P", setCode: "P" };
  if (prefix.startsWith("ST")) return { series: "ST", setCode: prefix };
  if (prefix.startsWith("EB")) return { series: "EB", setCode: prefix };
  if (prefix.startsWith("PRB")) return { series: "PRB", setCode: prefix };
  if (prefix.startsWith("OP")) return { series: "OP", setCode: prefix };
  return { series: prefix.replace(/\d+$/, "") || prefix, setCode: prefix };
}

function packSeriesAndSet(pack: RawPack): { series: string; setCode: string } {
  const prefix = pack.title_parts.prefix ?? "";
  const label = pack.title_parts.label;
  const setFromLabel = label ? label.replaceAll("-", "") : null;

  if (
    prefix === "STARTER DECK" ||
    prefix === "STARTER DECK EX" ||
    prefix === "ULTRA DECK"
  ) {
    return { series: "ST", setCode: setFromLabel ?? "ST" };
  }
  if (prefix === "BOOSTER PACK") {
    return { series: "OP", setCode: setFromLabel ?? "OP" };
  }
  if (prefix === "EXTRA BOOSTER") {
    return { series: "EB", setCode: setFromLabel ?? "EB" };
  }
  if (prefix === "PREMIUM BOOSTER") {
    return { series: "PRB", setCode: setFromLabel ?? "PRB" };
  }
  if (/promo/i.test(prefix) || /promotion/i.test(pack.raw_title)) {
    return { series: "P", setCode: "P" };
  }
  return { series: setFromLabel?.replace(/\d+$/, "") ?? "P", setCode: setFromLabel ?? "P" };
}

function titleCaseColor(color: string): OptcgColor | null {
  const normalized = color.trim().toLowerCase();
  const mapped = (normalized.charAt(0).toUpperCase() + normalized.slice(1)) as OptcgColor;
  return VALID_COLORS.has(mapped) ? mapped : null;
}

function parseForbidMatch(clause: string): CardMatch | null {
  const text = clause.trim().replace(/\.$/, "");

  const eventCost = text.match(
    /^events?(?: cards?)? with a cost of (\d+) or more$/i,
  );
  if (eventCost) {
    return {
      category: "Event",
      cost: { op: ">=", value: Number(eventCost[1]) },
    };
  }

  const anyCost = text.match(
    /^(?:cards?|any cards?) with a cost of (\d+) or more$/i,
  );
  if (anyCost) {
    return { cost: { op: ">=", value: Number(anyCost[1]) } };
  }

  const eventOnly = text.match(/^events?(?: cards?)?$/i);
  if (eventOnly) return { category: "Event" };

  const typeCost = text.match(
    /^\{(.+?)\} type (?:cards?|events?|characters?|stages?) with a cost of (\d+) or more$/i,
  );
  if (typeCost) {
    return {
      types: [typeCost[1]],
      cost: { op: ">=", value: Number(typeCost[2]) },
    };
  }

  return null;
}

function ruleKey(rule: ConstructionRule): string {
  if (rule.kind === "copyLimit") return `copyLimit:${rule.cardId}`;
  return `forbid:${rule.whenLeader}:${JSON.stringify(rule.match)}`;
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function main() {
  const inputDir = inputDirFromArgs();
  const packsPath = path.join(inputDir, "packs.json");
  const dataDir = path.join(inputDir, "data");
  const cardsDir = path.join(inputDir, "cards");

  const packsRaw = await readJson<Record<string, RawPack>>(packsPath);
  const packMeta = new Map<string, PackMeta>();
  for (const [id, pack] of Object.entries(packsRaw)) {
    const mapped = packSeriesAndSet(pack);
    packMeta.set(id, {
      id,
      rawTitle: decodeHtml(pack.raw_title),
      prefix: pack.title_parts.prefix,
      label: pack.title_parts.label,
      title: pack.title_parts.title ? decodeHtml(pack.title_parts.title) : null,
      series: mapped.series,
      setCode: mapped.setCode,
    });
  }

  const rawCards: RawCard[] = [];

  try {
    const packFiles = (await readdir(dataDir)).filter((f) => f.endsWith(".json"));
    for (const file of packFiles.sort()) {
      const rows = await readJson<RawCard[]>(path.join(dataDir, file));
      rawCards.push(...rows);
    }
  } catch {
    const packFolders = await readdir(cardsDir);
    for (const folder of packFolders.sort()) {
      const folderPath = path.join(cardsDir, folder);
      const files = (await readdir(folderPath)).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        rawCards.push(await readJson<RawCard>(path.join(folderPath, file)));
      }
    }
  }

  const byId = new Map<string, DeckPoolCard>();
  let droppedDon = 0;
  let droppedUnknown = 0;

  for (const raw of rawCards) {
    const rawId = raw.id?.trim();
    if (!rawId) continue;

    const category = raw.category?.trim();
    if (category === "Don" || category === "DON" || category === "DON!!") {
      droppedDon += 1;
      continue;
    }
    if (!category || !VALID_CATEGORIES.has(category as CardCategory)) {
      droppedUnknown += 1;
      continue;
    }

    const id = baseCardId(rawId);
    const image = cleanImageUrl(raw.img_full_url);
    const fromId = seriesAndSetFromCardId(id);
    const colors = (raw.colors ?? [])
      .map(titleCaseColor)
      .filter((c): c is OptcgColor => c != null);

    const incoming: DeckPoolCard = {
      id,
      name: decodeHtml(raw.name ?? id),
      category: category as CardCategory,
      rarity: raw.rarity ?? "",
      colors,
      cost: typeof raw.cost === "number" ? raw.cost : null,
      attributes: raw.attributes ?? [],
      power: typeof raw.power === "number" ? raw.power : null,
      counter: typeof raw.counter === "number" ? raw.counter : null,
      types: (raw.types ?? []).map(decodeHtml),
      effect: cleanText(raw.effect),
      trigger: cleanText(raw.trigger),
      packId: raw.pack_id ?? "",
      setCode: fromId.setCode,
      series: fromId.series,
      images: image ? [image] : [],
      has: [],
    };

    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, incoming);
      continue;
    }

    for (const img of incoming.images) {
      if (!existing.images.includes(img)) {
        if (isVariantId(rawId)) existing.images.push(img);
        else existing.images.unshift(img);
      }
    }

    if (!isVariantId(rawId)) {
      existing.name = incoming.name;
      existing.category = incoming.category;
      existing.rarity = incoming.rarity;
      existing.colors = incoming.colors;
      existing.cost = incoming.cost;
      existing.attributes = incoming.attributes;
      existing.power = incoming.power;
      existing.counter = incoming.counter;
      existing.types = incoming.types;
      existing.effect = incoming.effect;
      existing.trigger = incoming.trigger;
      if (incoming.packId) existing.packId = incoming.packId;
    }
  }

  const rules: ConstructionRule[] = [];
  const seenRules = new Set<string>();
  const unparsed: UnparsedConstruction[] = [];

  function addRule(rule: ConstructionRule) {
    const key = ruleKey(rule);
    if (seenRules.has(key)) return;
    seenRules.add(key);
    rules.push(rule);
  }

  for (const card of byId.values()) {
    const effect = card.effect;
    if (!effect || !/in your deck/i.test(effect)) continue;
    if (!CONSTRUCTION_HINT_RE.test(effect)) continue;

    if (ANY_NUMBER_RE.test(effect)) {
      addRule({ kind: "copyLimit", cardId: card.id, max: null });
      continue;
    }

    const onlyType = effect.match(ONLY_INCLUDE_TYPE_RE);
    if (onlyType && card.category === "Leader") {
      addRule({
        kind: "forbid",
        whenLeader: card.id,
        match: { requireTypes: [onlyType[1]] },
      });
      continue;
    }

    const cannot = effect.match(CANNOT_INCLUDE_RE);
    if (cannot && card.category === "Leader") {
      const match = parseForbidMatch(cannot[1]);
      if (match) {
        addRule({ kind: "forbid", whenLeader: card.id, match });
        continue;
      }
      unparsed.push({
        cardId: card.id,
        effect,
        reason: `Could not parse cannot-include clause: "${cannot[1]}"`,
      });
      continue;
    }

    unparsed.push({
      cardId: card.id,
      effect,
      reason: "Construction-like text did not match known templates",
    });
  }

  for (const seed of SEED_RULES) addRule(seed);

  const allFlags = new Set<string>();
  const cards = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  for (const card of cards) {
    card.has = compileHas(card.effect, card.trigger, card.counter);
    for (const flag of card.has) allFlags.add(flag);
  }

  await mkdir(DATA_DIR, { recursive: true });
  const unparsedPath = path.join(DATA_DIR, "unparsed-construction.json");

  if (unparsed.length > 0) {
    await writeFile(unparsedPath, JSON.stringify(unparsed, null, 2));
    console.error(
      `Ingest failed: ${unparsed.length} unparsed construction rule(s). See data/unparsed-construction.json`,
    );
    process.exit(1);
  }

  await rm(unparsedPath, { force: true });

  await writeFile(path.join(DATA_DIR, "cards.json"), JSON.stringify(cards));
  await writeFile(
    path.join(DATA_DIR, "packs.json"),
    JSON.stringify([...packMeta.values()], null, 2),
  );
  await writeFile(
    path.join(DATA_DIR, "construction-rules.json"),
    JSON.stringify(rules, null, 2),
  );
  await writeFile(
    path.join(DATA_DIR, "has-flags.json"),
    JSON.stringify({ flags: [...allFlags].sort() }, null, 2),
  );

  console.log(`cards: ${cards.length}`);
  console.log(`dropped Don: ${droppedDon}`);
  console.log(`dropped unknown category: ${droppedUnknown}`);
  console.log(`construction rules: ${rules.length}`);
  console.log(`has flags: ${[...allFlags].join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
