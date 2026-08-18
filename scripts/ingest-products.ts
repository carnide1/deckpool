import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DeckPoolCard } from "../types/catalog";
import type { PackMeta } from "../types/catalog";
import type { ProductContents, ProductIndexEntry } from "../types/product";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const PRODUCTS_DIR = path.join(DATA_DIR, "products");
const DELAY_MS = 500;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const CARD_ID_RE = /(?:ST|OP|EB|PRB)\d{2}-\d{3}|P-\d{3}/i;
const BULLET_RE =
  /((?:ST|OP|EB|PRB)\d{2}-\d{3}|P-\d{3})\s*x\s*(\d+)/gi;
const INLINE_RE =
  /(\d+)\s*x\s*((?:ST|OP|EB|PRB)\d{2}-\d{3}|P-\d{3})/gi;
const DON_RE = /don!!/i;

const ST_PACK_PREFIXES = new Set([
  "STARTER DECK",
  "STARTER DECK EX",
  "ULTRA DECK",
]);

type CatalogCard = Pick<DeckPoolCard, "id" | "category">;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("&amp;", "and")
    .replaceAll("&", "and")
    .replaceAll("/", " ")
    .replaceAll(".", " ")
    .replaceAll('"', " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function kindSlug(prefix: string | null): string {
  if (prefix === "ULTRA DECK") return "ultra-deck";
  if (prefix === "STARTER DECK EX") return "starter-deck-ex";
  return "starter-deck";
}

function productName(pack: PackMeta): string {
  const title = pack.title ?? pack.rawTitle;
  if (pack.prefix === "ULTRA DECK") return `Ultra Deck — ${title}`;
  if (pack.prefix === "STARTER DECK EX") return `Starter Deck EX — ${title}`;
  return `Starter Deck — ${title}`;
}

function urlCandidates(pack: PackMeta, override?: string): string[] {
  const urls: string[] = [];
  if (override) urls.push(override);
  const label = (pack.label ?? pack.setCode).toLowerCase().replace(/^st(\d+)$/, "st-$1");
  const titleSlug = slugify(pack.title ?? "");
  const kind = kindSlug(pack.prefix);
  const guesses = [
    `${label}-${kind}-${titleSlug}`,
    `${label}-starter-deck-${titleSlug}`,
    `${label}-${titleSlug}`,
    `${label}-${kind}`,
  ];
  for (const guess of guesses) {
    const url = `https://onepieceplayer.com/set/${guess}/`;
    if (!urls.includes(url)) urls.push(url);
  }
  return urls;
}

function decodeHtml(html: string): string {
  return html
    .replaceAll("&amp;", "&")
    .replaceAll("&#8211;", "–")
    .replaceAll("&ndash;", "–")
    .replaceAll("&#8212;", "—")
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll("&nbsp;", " ");
}

function parseContents(html: string): ProductContents {
  const text = decodeHtml(html);
  const counts = new Map<string, number>();

  const add = (id: string, qty: number, around: string) => {
    if (DON_RE.test(around)) return;
    const cardId = id.toUpperCase();
    if (!CARD_ID_RE.test(cardId)) return;
    counts.set(cardId, (counts.get(cardId) ?? 0) + qty);
  };

  for (const match of text.matchAll(BULLET_RE)) {
    const idx = match.index ?? 0;
    add(match[1], Number(match[2]), text.slice(Math.max(0, idx - 20), idx + match[0].length + 20));
  }
  if (counts.size === 0) {
    for (const match of text.matchAll(INLINE_RE)) {
      const idx = match.index ?? 0;
      add(match[2], Number(match[1]), text.slice(Math.max(0, idx - 20), idx + match[0].length + 20));
    }
  }
  return Object.fromEntries(counts);
}

async function fetchPage(url: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    redirect: "follow",
  });
  if (!res.ok) return null;
  return res.text();
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function tryOverride(setCode: string): Promise<ProductContents | null> {
  const filePath = path.join(ROOT, "scripts", "product-overrides", `${setCode}.json`);
  try {
    return await readJson<ProductContents>(filePath);
  } catch {
    return null;
  }
}

function validate(
  setCode: string,
  contents: ProductContents,
  catalog: Map<string, CatalogCard>,
): { leaderId: string; main: number; leaders: number; missing: string[] } {
  const missing: string[] = [];
  let main = 0;
  let leaders = 0;
  let leaderId = "";

  for (const [id, qty] of Object.entries(contents)) {
    const card = catalog.get(id);
    if (!card) {
      missing.push(id);
      continue;
    }
    if (card.category === "Leader") {
      leaders += qty;
      if (!leaderId) leaderId = id;
    } else {
      main += qty;
    }
  }

  if (missing.length) {
    throw new Error(`${setCode}: unknown card ids: ${missing.join(", ")}`);
  }
  if (!leaderId || leaders < 1) {
    throw new Error(`${setCode}: no Leader in contents`);
  }
  if (main !== 50) {
    throw new Error(`${setCode}: main-deck qty is ${main}, expected 50`);
  }
  const expectedTotal = 50 + leaders;
  const total = main + leaders;
  if (total !== expectedTotal) {
    throw new Error(`${setCode}: total ${total}, expected ${expectedTotal}`);
  }
  return { leaderId, main, leaders, missing };
}

async function main() {
  const catalogRows = await readJson<DeckPoolCard[]>(path.join(DATA_DIR, "cards.json"));
  const catalog = new Map(catalogRows.map((c) => [c.id, c]));
  const packs = await readJson<PackMeta[]>(path.join(DATA_DIR, "packs.json"));

  let urlOverrides: Record<string, string> = {};
  try {
    urlOverrides = await readJson(path.join(ROOT, "scripts", "product-urls.json"));
  } catch {
    urlOverrides = {};
  }

  const stPacks = packs.filter(
    (p) =>
      ST_PACK_PREFIXES.has(p.prefix ?? "") &&
      Number(p.id) >= 569001 &&
      Number(p.id) <= 569036,
  );
  if (stPacks.length !== 36) {
    throw new Error(`Expected 36 ST packs, found ${stPacks.length}`);
  }

  await mkdir(PRODUCTS_DIR, { recursive: true });
  const index: ProductIndexEntry[] = [];
  const failures: string[] = [];

  for (const pack of stPacks) {
    const setCode = pack.setCode;
    process.stdout.write(`${setCode}… `);

    let contents: ProductContents | null = null;
    let source = "";
    const knownUrl = urlOverrides[setCode];
    // Prefer a confirmed One Piece Player URL; otherwise skip slug guesses when
    // an override exists (many ST pages 404 and would add ~2s of delay each).
    const urlsToTry = knownUrl
      ? urlCandidates(pack, knownUrl)
      : (await tryOverride(setCode))
        ? []
        : urlCandidates(pack);

    for (const url of urlsToTry) {
      const html = await fetchPage(url);
      await sleep(DELAY_MS);
      if (!html) continue;
      const parsed = parseContents(html);
      if (Object.keys(parsed).length === 0) continue;
      try {
        validate(setCode, parsed, catalog);
        contents = parsed;
        source = url;
        break;
      } catch (error) {
        console.warn(`\n  skip ${url}: ${error instanceof Error ? error.message : error}`);
      }
    }

    if (!contents) {
      const override = await tryOverride(setCode);
      if (override) {
        try {
          validate(setCode, override, catalog);
          contents = override;
          source = `override:${setCode}.json`;
        } catch (error) {
          failures.push(
            `${setCode}: override invalid (${error instanceof Error ? error.message : error})`,
          );
          console.log("FAIL");
          continue;
        }
      }
    }

    if (!contents) {
      failures.push(`${setCode}: no One Piece Player page and no override`);
      console.log("FAIL");
      continue;
    }

    const { leaderId, leaders } = validate(setCode, contents, catalog);
    const outPath = path.join(PRODUCTS_DIR, `${setCode}.json`);
    await writeFile(outPath, JSON.stringify(contents, null, 2) + "\n");
    index.push({
      id: setCode,
      packId: pack.id,
      name: productName(pack),
      leaderId,
      type: "starter",
    });
    console.log(`OK (${source}${leaders > 1 ? `, ${leaders} leaders` : ""})`);
  }

  index.sort((a, b) => a.id.localeCompare(b.id));
  await writeFile(
    path.join(PRODUCTS_DIR, "index.json"),
    JSON.stringify(index, null, 2) + "\n",
  );

  console.log(`\nproducts: ${index.length}/36`);
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
