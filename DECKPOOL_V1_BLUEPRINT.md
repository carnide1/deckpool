# DeckPool — V1 Product & Technical Blueprint

**Status:** Locked for V1 implementation  
**Last updated:** 2026-08-17  
**Working location:** `C:\DeckPool`

This document is the **single source of truth** for DeckPool V1: product scope, official-play rules we enforce, search UX, Diligence engineering patterns to copy, stack, catalog, construction exceptions, and what is explicitly deferred.

Do **not** open other docs to implement V1. The contracts from Bandai rules, Limitless-style search, and Diligence’s as-built app are **inlined here**. Related files exist only as optional extra reading (§15).

---

## 0. How to use this document

| Source people might want to paste in | What V1 actually needs | Where it lives |
|---|---|---|
| Bandai comprehensive rules PDF | Only the construction rules V1 **enforces** (Leader, 50, color subset, 4-copy, printed exceptions). Not mulligans, combat, DON!! gameplay, or rotation. | §5.1 and §5.6 |
| Limitless website | Query language, facets that write `q=`, URL-synced search, typeahead. Not their HTML, CSS, servers, or tournament pages. | §5.5 |
| One Piece visual language | Bright promotional tone, card color hex, wanted-poster paper UI. Not Bandai logo files or dark “tool” aesthetic. | §8 |
| `C:\Diligence\DILIGENCE_V1_BLUEPRINT.md` | **Do not paste.** That is a habit-tracker product spec. | — |
| `C:\Diligence\ARCHITECTURE.md` | Stack, folder shape, AuthGate, nested `users/{uid}`, env names, npm. Domain code (habits/gym/cron) is **not** copied. | §9.1 |
| Catalog ingest (punk-records / vega) | Exact commands, normalized card shape, pack mapping, rarity map | §9.7 |
| TypeScript + Firestore rules | Interfaces, document shapes, rules file | §9.8 |

If a future rule contradicts this file, **this file wins** until it is edited. If official OPTCG text contradicts our color/copy/construction encoding, fix the encoding to match official play and update this file.

---

## 1. Product summary

**DeckPool** is a personal One Piece Card Game (OPTCG) deckbuilder. It exists because existing deckbuilders do not combine:

- Building **starting from the cards you actually own**, not dumping the entire printed catalog into the brew UI
- **Named variations** of the same Leader / deck (`Main` vs `Anti-yellow` vs `Budget`) without cloning a whole new deck record
- **Limitless-style search** (`color:purple type:"Big Mom Pirates"`) with an **owned-only toggle**, plus personal **labels** on owned cards

V1 is that core — nothing more. The product should feel like a **minimal brewing tool**: one collection, one search language, one builder with variation tabs. It is **not** a scanner app, a price tracker, a tournament meta browser, or a public deck-sharing network.

The **sell** is owned-pool-first brewing. Users may still add cards they do not own (ideal / wishlist lists). That is an opt-in in search, not the default in the Builder. Missing copies are loud on the list. This is **not** “browse the full catalog with a tiny owned pip” like Mugi/Haki.

### What makes it stand out

Public OPTCG sites (Limitless, onepiece.gg, OnePieceDB, DECKING.gg) search every printed card. Collection apps (Mugi, Haki, Logia, OP.TCG, Dex) usually show owned **badges** while you still browse the full catalog. Closest overlaps:

- **Beli TCG** (iOS): “build from cards you own” — phone-only, paid, no variation tabs
- **OP Deck Builder** (Android): owned-card filter — small indie app, not a website
- **OPTCG Collection Guru**: ranks *published* tournament lists by missing cards — not a freeform brewer
- **punkrecords.info**: same catalog family + Limitless-like syntax + collection tracker — not owned-pool-as-the-default-brew-universe, and not sibling 50-card variations

DeckPool’s hole: a **website** whose Builder search **defaults to your binder**, with variation tabs, a diff, legality that understands printed construction exceptions, and a clear owned vs unowned split when you opt into wishlist cards.

Do **not** copy scanners, price charts, or meta browsers. Those markets are crowded.

---

## 2. Product principles

| Principle | Decision |
|---|---|
| Privacy | Each user’s collection, decks, variations, labels, and art prefs are private. Only signed-in users see their own data. |
| Accounts | Required from day one (Firebase Auth). **Open signup.** Avoids a later rework. |
| Display name | **Required at signup.** Editable later on Profile. |
| Cost | Free tiers only (Vercel + Firebase). No paid search (Algolia), no LLM API, no separate backend. |
| Complexity | Same shape as Diligence: one Next.js app, no Express / Cloud Run API. |
| Mobile | Mobile-first, fully usable on desktop (builder is the one surface that may feel denser on phone). |
| Language | English cards only. |
| Catalog | We **own** a JSON snapshot in the repo. We do not live-query Limitless or optcgapi.com at search time. **No snapshot exists yet** — ingest is an implementation task, not a given file. |
| Images | **Lots of official card art** in every grid. Hotlink Bandai URLs (easiest). One card **number**, user-pickable scan **per account**. |
| Online | Online-only; no offline-first sync, no push, no CSV export in V1. |

---

## 3. Audience & accounts

- **Open signup:** Anyone can create an account. No invite flag.
- **Auth:** Firebase Authentication, **email/password only** (Diligence pattern). No Google/Apple OAuth.
- **Password reset:** Supported on the landing/auth flow via Firebase.
- **Signup fields:** email, password, **display name (required)**.
- **Display name storage (both, kept in sync):**
  1. On signup: write trimmed name to Firebase Auth `updateProfile({ displayName })` **and** `users/{uid}.displayName` in Firestore.
  2. On profile edit: update **both** Auth and Firestore.
  3. `ensureUserDoc` (§9.1) creates `users/{uid}` on first session if missing; uses Auth displayName as fallback.
- **Access model:**
  - Logged out → landing / sign-in / sign-up / forgot-password only
  - Logged in → app pages; data scoped to that user’s Firebase UID
- **Post-login destination:** Decks — or Collection if the user has zero owned cards (empty-state CTA to start the binder)
- **Profile:** Editable display name, email (from auth), summary stats, logout
- **Monetization:** None in V1
- **Infra:** **New Firebase project and new Vercel project.** Do not share Diligence’s `diligence-38744` or its Vercel project.

### Why accounts in V1 (strategy)

Without accounts, DeckPool would be device-local (painful to migrate) or a shared public site (anyone could edit “your” binder). Collection counts and deck lists are the product’s source of truth. Nested `users/{uid}/…` from day one matches Diligence and the intended multi-user future.

---

## 4. V1 page map

| Page | Route | Purpose | Search universe |
|---|---|---|---|
| Landing / Auth | `/` (logged out), `/login`, `/signup`, `/forgot-password` | Marketing-lite + email/password + required display name + reset | — |
| Collection | `/collection` | Binder editor: search-and-count, labels, add starter product | **Always full English catalog** (so you can log a card you just acquired) |
| Cards | `/cards` | General Limitless-style browser. **Must ship in V1.** | Full catalog by default; **Owned only** toggle (off by default) |
| Decks | `/decks` | List decks grouped by Leader | — |
| Builder | `/decks/[id]` | Leader + variation tabs + 50-card editor + two badge axes + search | **Owned only on** by default; toggle off to include unowned. Always ∩ Leader colors ∩ construction |
| Profile | `/profile` | Name (editable), email, stats, logout | — |

**V1 = these surfaces only.** No meta page, no prices, no admin console, no public deck gallery.

**Why three search surfaces (do not collapse them):**

| Surface | Job | Density |
|---|---|---|
| Collection | **Counter** — set qty, apply labels, add a starter | Qty-first |
| Cards | **Browser** — Limitless clone of the English catalog (optional owned filter), big art, URL `q=` | Art-first; no qty editor required |
| Builder | **Brew** — add/remove copies on the active variation | Search + list + badges |

Adding to a deck happens in the Builder, not on Cards/Collection.

### Profile stats

- Unique card numbers owned / total copies
- Number of decks / variations
- Count of variations that are **Legal** vs **Illegal**, and **Owned** vs **Unowned** (two axes; see §5.4)

---

## 5. Core concepts

### 5.1 Official play — rules V1 enforces

Source: Bandai comprehensive rules **5-1** (deck construction) and the rule manual color note. V1 does **not** implement the rest of the rulebook (turns, combat, DON!! as a resource, life, blockers in play, etc.).

**Constructed list shape**

| Rule | V1 |
|---|---|
| Exactly **1 Leader** | Enforced. Leader is **not** one of the 50. |
| **50** Character / Event / Stage cards | Enforced for the **Legal** tag. Drafts may be ≠ 50; they save as **Illegal**. |
| **10 DON!!** cards | **Not tracked. Not in the UI. Not in search. Not in the collection.** Catalog rows with `category: Don` are stripped at ingest or filtered out everywhere. |
| Max **4** copies of the same **card number** | Enforced, unless a construction exception sets a different `copyLimit`. Alt arts / reprints of `OP01-016` are the **same** id. |
| No side deck | No sideboard UI. |
| Printed construction effects (rule **5-1-2-4**) | Enforced via compiled JSON (§5.6). |
| Standard / Extra / ban list / rotation | **Not V1.** |

**Color identity (official, locked)**

Official text (paraphrased): only cards of a color **included on the Leader** may be in the deck; a card that has a color **not** on the Leader cannot be added. Multi-color cards are treated as **all** of their colors at once.

Implementation: a main-deck card is color-legal iff **every color on the card is a color on the Leader** (card `colors` ⊆ Leader `colors`).

| Example | Legal? |
|---|---|
| Red Leader + Red card | Yes |
| Red/Green **Leader** + Red card | Yes |
| Red/Green **Leader** + Green card | Yes |
| Red/Green **Leader** + Red/Green dual card | Yes |
| Red **Leader** + Red/Green dual card | **No** (Green is not on the Leader) |
| Red/Green Leader + Yellow card | **No** |

Builder search never shows off-color cards (owned or unowned). Changing Leader **strips** off-color and construction-illegal lines after a warning (§7.5).

**Leader ownership**

- Creating a deck: the Leader picker is **owned Leaders only**. You cannot start a deck with a Leader you do not own.
- The 50-card list **may** contain unowned cards (§5.4).
- If the user later drops the Leader’s binder qty to 0, the deck remains; the active variation becomes **Unowned**. It is not auto-deleted.

**Copy limit vs owned qty**

- **Click-to-add cap** = per-id copy limit only: **4**, or construction `copyLimit` for that id (`null` = no max). Example: Biscuit Warrior has no copy cap.
- **Not** capped by owned qty — unowned copies are allowed (§5.4).
- **Not** hard-capped at 50 on click — user may exceed 50 and the variation becomes **Illegal** until trimmed.
- The **Owned / Unowned** tag reflects whether every line satisfies `inDeck ≤ ownedQty` (and Leader owned).

### 5.2 Collection (one binder + labels)

**One physical inventory per user.** Card number → owned quantity. Quantity is never split across locations.

**Labels (V1 — this is not a second inventory)**

When the user **logs** a card (sets qty > 0), they may add **optional extra labels**. A card can have **multiple labels**. Labels overlap: the same stack can be `Big Mom` and `trades` at once. That is the “subpool”: a **filter view** of the same copies, not a vault.

| Rule | Decision |
|---|---|
| What is labeled | The **whole stack** for that card number (all copies share the labels). No “2 copies in box A, 2 in box B.” |
| Required? | No. Logging qty with zero labels is fine. |
| Create | Free-text chips on the collection row / log UI. Autocomplete from labels the user already has. |
| Edit | Add/remove labels later on Collection. |
| Empty qty | Qty 0 → omit the collection doc; labels go with it. |
| Unowned cards | No labels (nothing to log). `label:` only matches owned rows. |
| Search | `label:` / `tag:` plus a facet. Builder, Cards, and Collection can filter by labels **and** by every catalog field (§5.5). |

**Not in V1:** named binders that allocate copies, box locations, “move 2 copies to trades.”

| Field | Notes |
|---|---|
| Card id | Official number, e.g. `OP08-072` |
| Quantity | Integer ≥ 0. Zero means not owned (omit the doc). |
| Labels | `string[]`, optional, user-defined; stored on `collection/{cardId}` only |
| Preferred art | Account-level on `cardPrefs/{cardId}` only (§9.8) |

**Prints vs copies:** owning 2 regular + 1 alt art of the same number = **3** legal copies. Collection is keyed by card number. Art choice is display-only (§6.3).

**How cards enter the collection**

1. **Search-and-count** (primary): find a card in the full catalog, set owned qty, optional labels.
2. **Add starter / constructed product:** one action increments owned counts for every card in that product’s **contents list** (real quantities, not “1 of each ST07-* id”). See §5.2.1.

Paste-a-list import is **deferred**.

#### 5.2.1 Starter / constructed-product add

Someone bought ST-07. They should not click 17 cards by hand.

The catalog snapshot is an **encyclopedia** (`id`, name, art). It does **not** know that ST-07 contains **4** `ST07-002`. V1 ships a second dataset:

```
data/products/ST07.json   # { "ST07-001": 1, "ST07-002": 4, ... }
```

(Exact filenames can vary; the contract is `productId → { cardId: qty }`.)

| Rule | Decision |
|---|---|
| Which products | Official **constructed** products we can get a contents list for: **Starter Decks (ST)** required. Extra Decks (EB) / similar preconstructed products if contents are available. **Not** booster boxes / OP packs (random). |
| DON!! in the product | Skip. Do not add Don cards to the binder. |
| Leader in the product | Add to the binder (qty 1 typically). |
| Math | **Increment** existing qty (second ST-07 → another 4 Anana). Do not replace. No “set to starter amounts” required to ship. |
| Labels | Optional field on the add-product modal: apply these labels to **every** card incremented. **Merge** with existing labels on that card (set union, dedupe) — never replace. |
| Also create a deck | **Optional checkbox** on the same modal. If checked: create a deck named after the product, Leader = the product’s Leader (must end up owned, which it will), default variation `Main` = the 50 non-Leader cards at product counts. |
| Missing contents data | Do not guess 1-of-each. Ingest/fail or omit that product from the picker until a contents file exists. |

#### 5.2.2 Starter products — all 36, automated at ingest

**Users never enter product contents.** They tap “Add ST-07” and counts update. Building the 36 starter JSON files is a **one-time dev ingest task**, committed to the repo — not user-facing, not manual typing in production.

**Scope (V1):** all **36** official English starter / ultra / starter-EX products **ST01–ST36**, derived from punk-records `packs.json` entries whose prefix is `STARTER DECK`, `STARTER DECK EX`, or `ULTRA DECK` (pack ids `569001`–`569036`).

**Why the card catalog is not enough:** punk-records lists every **card printed** in set ST07 (`ST07-001` … `ST07-017`). The **product box** is a specific 51-card list with counts (4× Anana, 2× Katakuri, …). Newer starters (ST15+) also include **reprints** from OP/ST/P sets — you cannot infer counts from id prefix alone.

**Automated ingest (locked):** `npm run ingest-products` (§9.7.1) generates:

```
data/products/index.json      # all 36 products — auto-built
data/products/ST01.json … ST36.json
```

Only products with a successful contents file appear in the Collection picker. Ingest **fails** if any ST01–ST36 product is missing after fallbacks (do not ship with holes).

**Primary source:** [One Piece Player](https://onepieceplayer.com/) set pages — each ST page includes a full deck list with quantities. Two HTML formats the parser must handle:

| Era | Example page | List shape |
|---|---|---|
| ST01–ST14 (typical) | [ST-01 Straw Hat Crew](https://onepieceplayer.com/set/st-01-starter-deck-straw-hat-crew/) | Bullets: `ST01-001 x 1 – Leader – …` |
| ST15+ (reprint-heavy) | [ST-19 Black Smoker](https://onepieceplayer.com/set/st-19-starter-deck-black-smoker/) | Inline: `1 x OP02-093 Smoker – Leader 2 x ST19-003 …` |

**Parser rules:**

1. Extract `cardId` + `quantity` via regex; accept `ST01-001`, `OP02-093`, `P-029`, etc.
2. **Skip** Don / DON!! lines.
3. **Leader** = the card with category Leader in catalog, or the single `x 1` Leader line; store in contents and set `leaderId` on index entry.
4. Sum main-deck qty (excl. Leader) should be **50**; total incl. Leader **51**. Log warning if not; fail ingest if off by more than 0 (data error).
5. Cross-check every id exists in `data/cards.json`.

**URL discovery:** for each ST in `packs.json`, derive slug from `title_parts` (e.g. `ST-07` + `Big Mom Pirates` → try `st-07-starter-deck-big-mom-pirates`). Maintain a small **`scripts/product-urls.json`** override map for slugs that 404 (hand-fix rare mismatches only).

**Fallbacks (in order):**

1. One Piece Player page (primary)
2. Manual override file `scripts/product-overrides/ST07.json` (emergency only)
3. **Do not** fall back to “1 of each id in the ST set” — ever

**Also-create-deck:** deck name = product `name` from index; `leaderId` from index; variation `Main` = all entries except Leader, same counts.

**Example generated `data/products/index.json` entry:**

```json
{
  "id": "ST07",
  "packId": "569007",
  "name": "Starter Deck — Big Mom Pirates",
  "leaderId": "ST07-001",
  "type": "starter"
}
```

**Example `data/products/ST07.json` (abbreviated):**

```json
{
  "ST07-001": 1,
  "ST07-002": 4,
  "ST07-003": 2,
  "ST07-014": 4,
  "ST07-015": 4,
  "ST07-017": 2
}
```

### 5.3 Deck

One **Deck** has:

- A name
- Exactly **one Leader**, chosen from **Leaders the user owns**
- One or more **Variations**
- Implicit inventory = the user’s single collection (labels are filters, not a second pool)

**Changing Leader** is allowed. UX:

1. Confirm: *Cards that do not match the new Leader’s colors or construction rules will be removed.*
2. Do **not** list which cards.
3. On confirm, **strip** illegal lines from **every variation** of that deck (Leader is per deck; all variations share it).
4. Stripped cards are removed from each variation’s count map; the user re-adds if they switch back.

### 5.4 Variation

Named lists under the same deck. Examples: `Main`, `Anti-yellow`, `Budget`. Each is a full 50-or-draft count map.

| Rule | Decision |
|---|---|
| Storage | Full count map (`cardId → 0–N`), not a diff/patch |
| Create | Clone the currently selected variation, then edit |
| Inventory | Each variation is checked **alone** against owned qty. You are not packing two lists at once |
| Incomplete | **Savable.** 46/50 is a draft |
| Cut is not free | Removing a 4-of leaves 46 until 4 other cards are added |
| Unowned copies | **Allowed.** Wishlist / ideal lists. |
| UI | Variation switcher + **diff** vs another variation (cards that changed only) |
| Last variation | Cannot delete the last one |

Do **not** model this as “Save As / duplicate deck.”

**Two independent tags (always both visible)**

| Axis | **Positive** | **Negative** | Meaning |
|---|---|---|---|
| List rules | **Legal** | **Illegal** | Exactly 1 Leader on the deck; main-deck size **50**; every card color-legal; copy limits; construction forbids. **Does not care about ownership.** |
| Sleeve | **Owned** | **Unowned** | Leader qty ≥ 1 in the binder, and for every main-deck id `inDeck ≤ ownedQty`. |

A 50-card Imu list that follows construction but is missing two Events: **Legal** + **Unowned**.  
A 46-card list you fully own: **Illegal** + **Owned**.  
Show **why** (bullet reasons) for Illegal and for Unowned (which ids, how many short).

On each **line** of the list: show `in deck / owned` (e.g. `4 / 2`) and a clear owned vs unowned treatment. Unowned copies must not look like a tiny catalog pip.

### 5.5 Search (Limitless-style UX — copy this, not their site)

Search is a **local query language** over the JSON catalog in the browser, then intersected with the page’s universe and Builder constraints.

We copy Limitless **behavior**: one search box, facets that **write the same `q` string**, URL-synced `q=`, typeahead for keywords and values. We do **not** scrape Limitless, hotlink their images, or call their APIs at runtime.

**One search bar** everywhere (not a second “unowned” bar). **Owned only** is a toggle that changes the universe of that same bar.

| Surface | Owned-only toggle | Other hard filters |
|---|---|---|
| Collection | None (always full catalog) | Hide Don; English catalog |
| Cards | **Off** by default (browse in general). User can turn **on** to see only the binder. | Hide Don |
| Builder | **On** by default (the sell). User can turn **off** to add unowned cards. | Hide Don; **Leader colors**; **Leader construction forbids** (§5.5.1) |

Example that must work:

```
color:purple type:"Big Mom Pirates"
```

URL shape: `/cards?q=color%3Apurple+type%3A%22Big+Mom+Pirates%22&owned=1`. Builder may keep `q` in the URL or in component state; Cards **must** URL-sync **`q`** and **`owned`** (`owned=1` = owned-only on; param absent or `owned=0` = full catalog).

#### 5.5.1 Builder construction filter

When the active deck’s Leader has `forbid` rules (§5.6), Builder search **excludes** any catalog card that would fail that forbid if added — same as off-color cards. Example: under Imu (`OP13-079`), Event cards with `cost >= 2` never appear in Builder results (owned or unowned). Under Rayleigh, cost ≥ 5 cards are hidden.

Implementation: compute `isForbiddenByLeader(card, leaderId, constructionRules)` and filter search results after color filter. This is separate from the **Legal** tag (which also checks cards already in the list and copy limits).

#### 5.5.2 Search parsing defaults

| Topic | Rule |
|---|---|
| Case | Keywords and enum values are **case-insensitive** (`color:Red` = `color:red`). Card **names** in bare-word / `name:` search are **case-insensitive** substring match. |
| `id:` | Case-sensitive as printed (`OP03-114`). Bare token matching `/^OP\d{2}-\d{3}$/` etc. is treated as `id:`. |
| Colors | Normalize to title case internally (`purple` → `Purple`). |
| Rarity aliases | Map catalog strings → search tokens per §9.7 (`SuperRare` → `sr`, etc.). |
| Empty `q` | No text filter; universe toggles (owned, Builder color/forbid) still apply. |
| Unknown keyword | Treat as bare name search (Limitless-style fallback). |

**Logic:** space = AND; `or` = OR; `-term` = NOT; `"multi word"` for phrases; `( )` for grouping.

**Typeahead (required):** as the user types a keyword (`color:`, `has:`, `type:`, `label:`, …), **autopopulate the legal values** from the catalog (and, for `label:` / `tag:`, from **this user’s** labels). Facet chips add/remove tokens in `q` the same way.

**V1 keywords**

| Keyword | Aliases | Matches | Example |
|---|---|---|---|
| bare word / `name:` | | Name substring | `luffy` |
| `id:` | typing `OP03-114` | Card number | `id:OP03-114` |
| `color:` | `c:` | Red, Green, Blue, Purple, Black, Yellow | `color:purple` |
| `type:` | `feature:` | Official trait tags (`types` on the card) | `type:"Big Mom Pirates"` |
| `label:` | `tag:` | **User** collection labels | `label:trades` |
| `category:` | `t:` | Leader, Character, Event, Stage (not Don) | `t:character` |
| `attribute:` | `a:`, `attr:` | Slash, Strike, Special, Wisdom, Ranged | `a:slash` |
| `text:` | `o:` | Effect text | `text:blocker` |
| `trigger:` | `tr:` | Trigger text | `trigger:life` |
| `cost:` | | Numeric `= != < <= > >=` | `cost<=3` |
| `life:` | | Leader Life (stored as `cost` on Leaders) | `life:5` |
| `power:` | `pow:` | Numeric | `power>=7000` |
| `counter:` | | Numeric counter value | `counter:2000` |
| `rarity:` | `r:` | Mapped from catalog rarity strings to C, UC, R, SR, SEC, L, P, Special, Treasure | `r:sr` |
| `set:` | `s:` | OP01, ST07, EB02, P | `set:OP03` |
| `series:` | | OP, ST, EB, P | `series:ST` |
| `has:` | | Compiled flags from ingest (see below) | `has:blocker` |

**`has:` flags** — compile at ingest from effect/trigger text (e.g. `[Blocker]`, `[Rush]`, `[Banish]`, `[Double Attack]`) plus structural flags (`trigger` if trigger text exists, `counter` if counter value exists, `effect` if effect text exists). Do **not** hardcode a closed product list in the UI: typeahead offers **whatever flags ingest produced**. Overlay extra flags by hand if a keyword is missing.

**Filter by anything:** every keyword above is also a facet where practical (colors, category, set, rarity, `has:`, official `type:`, user `label:`). If a card has it, the user can filter on it.

`color:purple` matches any card that **includes** Purple (dual-color cards included). Builder color-identity is a separate hard filter (subset of Leader colors).

### 5.6 Construction exceptions

Do **not** call an LLM while someone is building. Legality must be deterministic.

Bandai construction text is two stock sentences (comprehensive rules 5-1-2-4):

| Pattern | Example | Runtime rule |
|---|---|---|
| `you may have any number of this card in your deck` | Biscuit Warrior `OP08-072` | `copyLimit` for that id = unlimited (`null`) |
| `you cannot include [X] in your deck` | Imu `OP13-079`: Events with cost ≥ 2; Rayleigh `OP12-001`: cards with cost ≥ 5 | `forbid` matcher on the Leader |

**Seed `construction-rules.json` rows (hand-verify after ingest):**

```json
[
  { "kind": "copyLimit", "cardId": "OP08-072", "max": null },
  {
    "kind": "forbid",
    "whenLeader": "OP13-079",
    "match": { "category": "Event", "cost": { "op": ">=", "value": 2 } }
  },
  {
    "kind": "forbid",
    "whenLeader": "OP12-001",
    "match": { "cost": { "op": ">=", "value": 5 } }
  }
]
```

**Ingest regex starters** (run on `effect` where `"in your deck"` appears; extend when Bandai adds templates):

```js
// unlimited copies of this card
/you may have any number of this card in your deck/i

// cannot include … — parse X into CardMatch manually or with follow-up patterns; on failure → unparsed-construction.json
/you cannot include (.+?) in your deck/i
```

Imu line parses to **Events with printed cost ≥ 2 only** (not “all Events plus all cost ≥ 2”). Rayleigh parses to **any card with printed cost ≥ 5** (any category).

`Under the rules of this game` is **not** by itself construction. Brook `OP15-022` and Nami `OP03-040` use it for win/lose conditions. The discriminator is **`in your deck`** plus include / cannot / any number.

**Not construction (hint only, never fails Legal):**

- Imu: “at the start of the game, play **up to** 1 {Mary Geoise} type Stage from your deck” — optional gameplay. A 50-card Imu list with zero Stages is **Legal**. Optional UI hint: “start-of-game Stage will do nothing.”

**Compile pipeline (catalog ingest, not request path):**

1. Grep every card `effect` for `in your deck`
2. Regex the two templates above → append to `data/construction-rules.json`
3. If a hit does not parse, write it to `data/unparsed-construction.json` and **fail the ingest** (do not guess)
4. Compile `has:` flags into the card records (or a sidecar map)

**Runtime schema (conceptual):**

```ts
type ConstructionRule =
  | { kind: "copyLimit"; cardId: string; max: number | null } // null = unlimited
  | { kind: "forbid"; whenLeader: string; match: CardMatch }

type CardMatch = {
  category?: "Event" | "Character" | "Stage"
  cost?: { op: ">=" | "<=" | "="; value: number }
  types?: string[]
  colors?: string[]
  cardIds?: string[]
}
```

**Validation order (Legal vs Owned are separate)**

**Legal / Illegal**

1. Deck has exactly 1 Leader id.
2. Main deck size is 50.
3. Every main-deck card: `colors` ⊆ Leader `colors`.
4. Per-id copies ≤ 4, then apply `copyLimit` from cards in the list (Biscuit Warrior).
5. Apply Leader `forbid` matchers (Imu, Rayleigh).

**Owned / Unowned** (after or beside the above; does not flip Legal)

1. Leader `ownedQty ≥ 1`.
2. For each main-deck id, `inDeck ≤ ownedQty` (unlimited copyLimit still cannot exceed the binder for **Owned**).

Incomplete lists save. Both tags and reason bullets always show.

**Known V1 examples to seed/test**

- `OP08-072` Biscuit Warrior — unlimited copies of that number (**Legal**); **Owned** only up to binder qty
- `OP13-079` Imu — forbid Event AND cost ≥ 2
- `OP12-001` Silvers Rayleigh — forbid cost ≥ 5 (printed cost; in-game cost reduction does not make a 5-drop legal to **include**)

LLM at ingest is **out of V1**. If regex misses a future template, add a row by hand.

---

## 6. Card catalog (data we own)

### 6.1 Source — locked

**Nothing is in the repo yet.** First catalog work is: obtain English JSON (vega / punk-records from [en.onepiece-cardgame.com](https://en.onepiece-cardgame.com)), normalize, commit.

| Option | Role | Verdict |
|---|---|---|
| **vega / punk-records JSON** from the official English site | Catalog we snapshot into the repo/app | **Preferred.** Offline, versioned, no rate limits |
| Limitless `/cards/?q=` | Website search, not a public card API | Copy the **query UX only** (§5.5). Do not scrape |
| [optcgapi.com](https://optcgapi.com) | Volunteer REST API; split set/ST/promo; lags newest sets | Fallback ingest only, not the live search engine |
| Limitless tournament API | Events / submitted lists | V2+ import, not the card database |

Related site [punkrecords.info](https://punkrecords.info) already uses this dataset. We still **ship our own snapshot** so DeckPool does not depend on them.

**Images:** official `img_full_url` (e.g. `https://en.onepiece-cardgame.com/images/cardlist/card/ST01-001.png`). **Hotlink Bandai** (easiest; personal-use V1). Do not hotlink Limitless. Configure `next/image` remote patterns for `en.onepiece-cardgame.com`. Text fallback if an image fails.

### 6.2 Raw card fields (from the snapshot)

Example `ST01-001`:

```json
{
  "id": "ST01-001",
  "pack_id": "569001",
  "name": "Monkey.D.Luffy",
  "rarity": "Leader",
  "category": "Leader",
  "colors": ["Red"],
  "cost": 5,
  "attributes": ["Strike"],
  "power": 5000,
  "counter": null,
  "types": ["Supernovas", "Straw Hat Crew"],
  "effect": "[Activate: Main] [Once Per Turn] Give this Leader or 1 of your Characters up to 1 rested DON!! card.",
  "trigger": null,
  "img_full_url": "https://en.onepiece-cardgame.com/images/cardlist/card/ST01-001.png"
}
```

| Field | Meaning |
|---|---|
| `id` | Card number. 4-copy rule and collection key |
| `pack_id` | Official pack id; map to OP / ST / EB / P set codes |
| `name` | English name |
| `rarity` | Common, Uncommon, Rare, SuperRare, SecretRare, Leader, Special, TreasureRare, Promo — map to search tokens |
| `category` | Leader, Character, Event, Stage, Don (**drop Don from app data**) |
| `colors` | Array. Dual-color Leaders/cards have two |
| `cost` | DON!! cost. **On Leaders this is Life** |
| `attributes` | Slash, Strike, Special, Wisdom, Ranged. Empty on Events/Stages |
| `power` | Null on Events/Stages |
| `counter` | Numeric counter on Characters. Counter *events* put `[Counter]` in `effect` |
| `types` | Official traits — `type:` |
| `effect` / `trigger` | Rules text |
| `img_full_url` | Default official image |
| `images` (normalized) | **All known scans for this id** (alt/manga/AA if the snapshot has them). May be a single-element array. |

**Not in V1 as first-class inventory:** artist, prices, manga vs AA vs serial as separate **owned** lines, Western-format toggle, block icon. Unique **owned copies** collapse on `id`. Extra images are **display variants** of that id.

Catalog size is a few thousand English cards — **search in the browser**. No Algolia, Typesense, or Postgres.

### 6.3 Preferred art (per account, per card number)

- Grids always show **card images** (not a text-first UI).
- Default image = first / official `img_full_url`.
- User can **click the card and pick** which scan to use. That choice is **one per card number per account** (not per deck line).
- Store on `users/{uid}/cardPrefs/{cardId}` (or equivalent) so a preference can exist even if they don’t own the card (they saw it on `/cards` or as unowned in a list).
- If ingest only found **one** image, the picker has nothing else to choose — that is fine.

---

## 7. Page behavior detail

### 7.1 Landing / auth

- Open signup + login + password reset
- Signup requires display name
- Logged-in users should not stay on marketing chrome; send them into the app (Decks or Collection per §3)
- AuthGate pattern: public routes `/`, `/login`, `/signup`, `/forgot-password`; everything else requires auth (Diligence)

### 7.2 Collection

- Search the **full catalog**, set quantity owned, optional labels (multi, overlapping, editable later)
- Starter / constructed-product picker (§5.2.1): increment contents; optional labels; optional “also create a deck”
- Empty state: explain that the Builder defaults to these cards, and that labels are filters not separate binders
- Set completion % is optional polish, not required to ship

### 7.3 Cards

- Limitless-like search bar + facets that write the same `q` + typeahead
- Default universe: **full catalog**
- **Owned only** toggle (off by default)
- Big official art; click opens art picker (saves account pref) and card detail
- Does not edit qty (that’s Collection) and does not add to a deck (that’s Builder)

### 7.4 Decks

- List **grouped visually by Leader** (section headers or Leader portrait clusters). **Multiple decks per Leader are allowed** — e.g. two different Red Luffy brews. Grouping is UI-only, not a data constraint.
- Each row: mini wanted-poster card (§8.5): Leader art, deck name, color pills, variation count; compact **Legal/Owned** summary (worst case or “any legal” — show whether **any** variation is Legal and whether **any** is Owned).
- Create deck: search **owned Leaders only**, name the deck, create default variation `Main` empty

### 7.5 Builder

- **Layout:** mobile = search + filters on top, variation tabs + badge row below, scrollable card results, deck manifest pinned or bottom sheet for the 50 list. Desktop = two columns: **left** search + results grid, **right** Leader + tabs + manifest + badges (sticky summary).
- **One** search bar. Owned-only **on** by default. Toggle off → same bar searches color-legal catalog cards you may not own. Results still mark owned vs unowned.
- Hard filters always: Leader colors (subset rule) ∩ Leader construction forbids (§5.5.1) ∩ no Don
- Right/summary: Leader, variation tabs, 50-count, **Legal/Illegal** + **Owned/Unowned** + reason bullets
- Click card → increment (cap = copy limit only, not owned qty)
- List lines: `in deck / owned`, unowned copies visually obvious
- Variation tab: clone / rename / delete (cannot delete the last)
- **Diff:** “Compare variations” opens a **modal**. User picks **base** and **compare** from dropdowns (default: current vs previous tab). Show only ids where counts differ (+/−/added/removed). Read-only; no merge.
- Leader change: warning in §5.3, then strip all variations of that deck

### 7.6 Profile

- Editable display name
- Email (from Firebase)
- Stats (§4)
- Logout

---

## 8. Visual / UX direction — bright, fun, Grand Line energy

**Copy Diligence’s engineering layout, not its look.** DeckPool should feel like the cards and the anime: bright, warm, adventurous, and character-forward. The manga and Bandai promotional art are saturated and joyful; the UI matches that energy.

**Do not** ship Diligence’s dark navy minimal theme. **Do not** look like a gacha casino, an esports broadcast, or a generic gray SaaS dashboard. **Do** look like a pirate’s desk covered in wanted posters, booster packs, and deck lists — but still **readable and fast** as a brewing tool.

V1 does not wait on custom illustration. The theme comes from **CSS tokens, typography, layout motifs, and official card art** (already hotlinked). No licensed logo files required.

### 8.1 Inspiration sources (read these cold)

Someone implementing with **only this document** should picture the following references:

| Source | What to steal | Example / URL |
|---|---|---|
| **Official OPTCG site** | Clean white/bright product pages, bold red wordmark energy, hero banners with deck photography, “treasure and adventure” marketing tone | [en.onepiece-cardgame.com](https://en.onepiece-cardgame.com/) — tagline *“A World of Treasure and Adventure Await”*; product heroes on [Romance Dawn OP-01](https://en.onepiece-cardgame.com/products/boosters/op01.php) (*manga + animation + illustrator new art*, mixed-color Leaders) |
| **Physical card frames** | Color as identity: each card’s **border band** and **hex color symbol** (bottom-left) match Red / Green / Blue / Purple / Black / Yellow. Leader cards: bold name, strong color wash behind art, Life on the frame | Any Leader scan, e.g. `ST01-001` — use **game colors** for pills, filters, and deck rows (§8.3) |
| **Promotional / anniversary art** | High saturation, gold highlights, celebratory gold foil accents on special prints; dynamic character poses — use as **mood**, not as background noise | [OP-05 Awakening of the New Era](https://en.onepiece-cardgame.com/products/boosters/op05.php) (Oda anniversary illustrations); Jump / FILM RED–style promo sets (bright, character-centric) |
| **Wanted posters (bounty papers)** | The franchise’s most iconic **paper UI**: aged parchment, bold red **WANTED** stamp, large **bounty number**, character portrait, World Government / Marine authority mark, weathered edges | In-world examples: Luffy / Zoro / Nami bounty papers throughout the series. Fan layout references for structure (not assets to ship): [wanted poster typography notes](https://www.thefontworld.com/one-piece-font/) (bold serif, adventurous curves); [poster layout guide](https://breathbodymind.co/wp-content/cache/html/one_piece_blank_wanted_poster.html) (portrait center, name, bounty, red seal, government mark) |

**Wanted posters are the signature DeckPool motif.** Use them for **deck identity**, **profile highlights**, and **empty states** — not for every button. The app is a deckbuilder first; posters are flavor that makes Decks and Profile memorable.

### 8.2 Design principles

| Principle | V1 rule |
|---|---|
| **Bright default** | **Light / bright theme only.** Warm parchment and sky tones — no dark mode, no Diligence charcoal. |
| **Art is the hero** | Official card scans are the largest, brightest elements on Collection, Cards, and Builder. Chrome frames art; it does not compete with it. |
| **Fun, not childish** | Rounded corners, warm color, and poster motifs — but type stays legible at small sizes and the Builder stays dense enough to brew on phone. |
| **Color = game language** | When showing Red / Green / Blue / Purple / Black / Yellow, use the **same hues players see on cards** (§8.3), not arbitrary Tailwind defaults. |
| **Paper & ink** | Surfaces feel like **wanted paper**, logbooks, and deck lists: cream backgrounds, soft shadows, subtle grain — not flat sterile white. |
| **Accessible** | WCAG-friendly contrast on parchment (dark ink text `#1A1208` on `#FAF3E6`). Red/gold accents for emphasis, not body text. |

### 8.3 Color tokens (CSS variables in `globals.css`)

Map Tailwind v4 `@theme` to these. Adjust slightly in implementation; keep the **relationships**.

**App shell (parchment & sky)**

| Token | Hex (start) | Use |
|---|---|---|
| `--bg-page` | `#FAF3E6` | Main page — warm cream, like wanted-poster paper |
| `--bg-panel` | `#FFFDF8` | Cards, modals, search panels — slightly lighter sheet |
| `--bg-inset` | `#F0E4CE` | Inset search fields, secondary wells |
| `--ink-primary` | `#1A1208` | Body text — warm black ink |
| `--ink-muted` | `#5C4A3A` | Secondary labels |
| `--accent-pirate-red` | `#D7000F` | Primary actions, **WANTED**-style stamps, active nav — matches official OPTCG red family |
| `--accent-ocean` | `#2E63A4` | Links, secondary actions — official site blue |
| `--accent-sky` | `#60BFF5` | Highlights, info chips |
| `--accent-gold` | `#FFCE00` | Treasure / success / “complete” moments — foil and anniversary promo gold |

**OPTCG attribute colors** (filters, Leader pills, color facets, deck row accents — clockwise hex order from top-right: Red → Green → Blue → Purple → Black → Yellow)

| Color | Hex (start) | On-card meaning (for tooltips only) |
|---|---|---|
| Red | `#E02020` | Aggression / Rush |
| Green | `#2EAD4B` | Tempo / rest |
| Blue | `#2563EB` | Control / bounce |
| Purple | `#7B3FAE` | Ramp / DON!! |
| Black | `#2D2D2D` | Removal — use as **ink** on light bg, not page background |
| Yellow | `#F5C400` | Life / Triggers |

Dual-color Leaders: show **both** color pills (or a split pill), same as official deck feature pages listing `(Red/Green) Monkey.D.Luffy`.

### 8.4 Typography

| Role | Direction | Notes |
|---|---|---|
| **Display / page titles** | Bold, slightly adventurous serif or rounded display — pirate **logbook headline**, not the exact One Piece logo | Google Fonts candidates: **Fredoka** (friendly bold), **Bitter** or **Roboto Slab** (poster headline). Use sparingly on H1 / deck names. |
| **UI / body** | Clean rounded sans — high readability | **Nunito**, **DM Sans**, or **Source Sans 3** for forms, lists, search, stats |
| **Bounty / numeric stats** | Tabular bold figures | Profile stats and copy counts (`4 / 2`) — large numbers echo **bounty amounts** on posters |
| **Accent word** | Optional single-word stamp styling | “WANTED”, “Legal”, section labels — letter-spaced, red stamp on cream (poster motif) |

Do **not** set the entire UI in a comic font. One display face + one body face is enough.

### 8.5 Wanted-poster motif — where it appears

| Surface | Poster treatment |
|---|---|
| **Decks list row** | Mini poster card: Leader art as **portrait**, deck name as **name line**, variation count + Legal/Owned tags below. Subtle parchment texture, thin border, optional corner wear (CSS only). |
| **Create deck / pick Leader** | Leader grid tiles feel like **selecting a bounty target** — portrait-forward, color wash from §8.3. |
| **Profile** | Stats block styled as a **personal poster**: display name prominent, numeric stats as **bounty-style figures** (cards owned, decks built — label clearly as collection stats, not literal Berries unless we add a playful subtitle). |
| **Empty states** | “No decks yet” / empty binder — light poster frame with CTA, cheerful copy (*set sail*, *build your crew*) — short, not cringe paragraphs. |
| **Auth landing** | Bright hero: tagline + card collage or single iconic Leader art; warm cream bg, red CTA — **not** a dark login wall. |

**Poster ingredients to implement in CSS** (no copyrighted Marine logo assets required):

1. Cream / tan **parchment** background with subtle **noise or grain**
2. Top **red stamp bar** or angled **WANTED** ribbon (solid `#D7000F`, white text)
3. **Portrait** area (Leader or card art) with thin dark frame
4. **Large number** for key stats
5. Soft **drop shadow** so panels feel like paper on a desk
6. Optional: faint **ruled lines** or map-grid watermark at very low opacity (Grand Line / logbook)

### 8.6 Card-browser & Builder chrome

| Element | Direction |
|---|---|
| **Card grid** | Large images, thin **color-band** border matching card `colors[]` (like the physical card frame). Rarity can add a subtle gold edge on SR/SEC — optional polish. |
| **Search bar** | Clean inset on parchment; facet chips use **attribute colors** when filtering by color. Typeahead dropdown: bright panel, not dark popover. |
| **Builder list** | Deck lines as a **manifest**: name, qty, owned gap; color dot from card. Unowned lines: muted parchment + clear “missing” ink stamp — still readable, not shame-red wall of text. |
| **Badges** | **Legal** = green/gold success on cream. **Illegal** = pirate red outline stamp. **Owned** = ocean blue check tone. **Unowned** = warm amber “missing” — two axes, both visible. |
| **Nav** | Bright sidebar / bottom nav on cream; active item = pirate red or ocean underline. Icons: simple (compass, cards, anchor) via lucide — no emoji. |

### 8.7 What we explicitly avoid

| Avoid | Why |
|---|---|
| Diligence dark navy theme | Wrong IP tone; user locked **bright & fun** |
| Neon esports / RGB gamer UI | Fights card art |
| Gacha summon animations, loot boxes | Wrong product category |
| Full-screen manga panels behind text | Illegible; art belongs in card slots |
| Copying official Bandai logos / Marine emblem raster assets | Personal fan site — **inspired by** poster layout, not trademark reproduction |
| Light mode toggle | **Bright only** for V1 (inverse of old “dark only”) |

### 8.8 Implementation checklist (V1)

| Choice | V1 |
|---|---|
| Theme | **Bright / light only** — parchment cream, pirate red, ocean blue, treasure gold (§8.3) |
| Tone | Fun, adventurous, character-forward — still a **utility** brewer |
| Signature motif | **Wanted posters** on Decks, Profile, empty states (§8.5) |
| Color language | OPTCG six-color hex palette on filters, pills, card borders (§8.3) |
| Density | Builder denser than Collection; Cards is the most art-forward browse surface |
| Card images | **Everywhere, large** — official scans; text fallback if image fails |
| Legal / Illegal | Gold/green vs red stamp; never hide why |
| Owned / Unowned | Ocean vs amber; list lines show `in deck / owned` |
| Fonts | One display + one body (§8.4); CSS variables in `globals.css`, Tailwind v4 `@theme` |
| Diligence | Reuse **folder shape & providers only** — **not** Outfit/Fraunces/dark tokens |

---

## 9. Technical strategy

### 9.1 Copy from Diligence (as-built), not the Diligence product

**Read for scaffolding:** `C:\Diligence\ARCHITECTURE.md` (optional). Everything required to implement is below. **Do not** copy habits, goals, gym, films, day-parts, Resend, cron, Letterboxd, or `DILIGENCE_V1_BLUEPRINT.md`.

**Keep / mirror**

| Piece | Diligence fact | DeckPool |
|---|---|---|
| App | Next.js **16** App Router, React **19**, TypeScript, `app/` at repo root (no `src/`) | Same |
| UI | Tailwind CSS **4**, `components/ui/` | Same structure; **bright OPTCG theme** (§8), not Diligence dark |
| Forms | `react-hook-form` + Zod | Auth + entity modals |
| Icons | `lucide-react` | Same |
| Auth | Firebase email/password; client listener; password reset | Same |
| Gate | `AuthGate` client-side; **no `middleware.ts`** | Same public routes |
| Data | Cloud Firestore; **nested** `users/{uid}/…`; client SDK writes | Same nesting |
| Rules | `request.auth.uid == userId` for the whole user tree | Same |
| Hosting | Vercel Hobby; Firebase is **not** the web host | Same |
| Package manager | **npm** + `package-lock.json` | **npm** (do not introduce Yarn) |
| Tests | `tsx --test` on `lib/**/*.test.ts` | Same for search parser, legality, construction |
| Env | `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_APP_URL` | Same names; new project values |
| Path alias | `@/*` → repo root | Same |

**Drop**

- All tracker domain, streaks, gym, films
- `vercel.json` cron, Resend, `FIREBASE_SERVICE_ACCOUNT_JSON`, `CRON_SECRET` — **not needed for V1** (no Admin job). Catalog ingest is a **local** `npm run ingest-catalog` script.
- Firebase Storage (Diligence unused it; we hotlink images, still send `STORAGE_BUCKET` if the client SDK requires it at init)

**Layout to mirror**

```
C:\DeckPool
├── app/
│   ├── layout.tsx                 # fonts, Providers, AuthGate
│   ├── page.tsx                   # logged-out landing
│   ├── globals.css
│   ├── login|signup|forgot-password/
│   ├── (app)/                     # authenticated shell
│   │   ├── layout.tsx             # app providers + AppShell
│   │   ├── collection|cards|decks|profile/
│   │   └── decks/[id]/
│   └── (no /api required for V1)
├── components/  contexts/  hooks/  lib/  types/
├── data/                          # committed cards.json, construction, products, flags
├── firestore.rules
├── firebase.json
├── .firebaserc                    # NEW project id
├── package.json                   # npm
└── .env.local.example
```

Nav (AppShell): Collection, Cards, Decks, Profile. Mobile bottom nav + desktop sidebar like Diligence.

**Client providers (mirror Diligence pattern):**

```
Root layout:  AuthProvider → UserProfileProvider → Toaster → AuthGate
(app) layout: CatalogProvider (loads static cards.json)
              CollectionProvider (users/{uid}/collection listener)
              DecksProvider (decks + variations listeners)
              AppShell
```

- `CatalogProvider` — static JSON + search index in memory; no Firestore.
- `CollectionProvider` — owned qty + labels; exposes `ownedMap`, label list.
- `DecksProvider` — decks CRUD + active variation; calls `lib/legality.ts` for tags.
- `UserProfileProvider` — `ensureUserDoc` on auth; displayName/email.

**AuthGate redirect:** logged-in user on auth routes → `/decks` (or `/collection` if zero owned cards). **Not** Diligence’s `/today`.

**Scaffold source:** copy structural files from `C:\Diligence` when available (`AuthGate`, `Providers`, `AppShell`, `lib/firebase.ts`, form components). Replace domain contexts and routes per above. If Diligence is unavailable, recreate from §9 folder layout — behavior is fully specified here.

### 9.2 Chosen V1 stack

| Layer | Choice | Rationale |
|---|---|---|
| App | Next.js 16 App Router + React 19 + TypeScript + Tailwind 4 | Diligence skeleton; one deployable |
| Hosting | **New** Vercel project (Hobby) | Fits Next |
| Auth | Firebase Auth email/password | Diligence; free; open signup + reset |
| User data | Cloud Firestore, nested under `users/{uid}` | Diligence; UID-scoped |
| Card catalog | Static JSON committed in-repo | Search in-browser |
| Construction + `has:` flags + products | Static JSON from ingest | Deterministic |
| Firebase | **New** Spark project | Do not reuse Diligence |
| Package manager | **npm** | Copy Diligence; no mixed lockfiles |

**No separate backend. No production LLM. No Admin SDK unless a future privileged job appears (not V1).**

After first deploy: add the Vercel domain to Firebase Auth authorized domains; set `NEXT_PUBLIC_APP_URL`.

### 9.3 Data model (Firestore — nested like Diligence)

```
users/{uid}                                      # displayName, email, createdAt
  collection/{cardId}                            # quantity, labels: string[]
  cardPrefs/{cardId}                             # preferredImageUrl (optional)
  decks/{deckId}                                 # name, leaderId, createdAt, updatedAt
    variations/{variationId}                     # name, cards { [cardId]: number }, updatedAt
```

Catalog, construction, product contents, and `has:` flags are **files in `data/`**, not Firestore.

Document ids for collection rows should be the **card number** (`OP08-072`) so qty updates are idempotent.

**Rules:** owner-only `users/{uid}/**`. Light shape checks optional (qty ≥ 0, labels strings). Deploy rules **before** any client writes (production-mode Firestore denies otherwise).

### 9.4 Security

- Firestore: only `request.auth.uid == uid` for that user tree. Unauthenticated denied.
- Catalog JSON is public printed-card data shipped as static files. User decks are never a public collection.
- No admin product; client never trusts an `isAdmin` flag.

### 9.5 Env vars

Copy Diligence **names**. New values. Never commit secrets.

**Public (`NEXT_PUBLIC_*`):**

| Variable | Used by |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client SDK |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client SDK |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client SDK |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client init (unused for files) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client SDK |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client SDK |
| `NEXT_PUBLIC_APP_URL` | Absolute links if needed |

**Server:** none required for V1.

### 9.6 Catalog ingest (summary)

Local script `npm run ingest-catalog`. **Full spec: §9.7.** Starter contents: **`npm run ingest-products`** (§9.7.1) — automated, all ST01–ST36. Commit all generated JSON; Vercel must not scrape Bandai at runtime.

### 9.7 Catalog ingest appendix (concrete)

**Preferred source:** [buhbbl/punk-records](https://github.com/buhbbl/punk-records) English dataset (static, versioned). Generated with [vega](https://github.com/Coko7/vegapull) (`cargo install vegapull` → binary `vega`).

**Option A — use prefetched JSON (fastest for V1):**

```bash
git clone --depth 1 https://github.com/buhbbl/punk-records.git /tmp/punk-records
# English pack files: /tmp/punk-records/english/cards/{pack_id}.json
# English pack index:  /tmp/punk-records/english/packs.json
npm run ingest-catalog -- --input /tmp/punk-records/english
```

**Option B — regenerate locally:**

```bash
git clone https://github.com/buhbbl/punk-records.git
cd punk-records
# requires vega on PATH
python build_punk_records.py --language english --out-dir .
npm run ingest-catalog -- --input ./english
```

**`scripts/ingest-catalog.ts` (or `.mjs`) must:**

1. Read all `english/cards/*.json` + `english/packs.json`
2. Merge cards; **drop** `category === "Don"`
3. Dedupe by `id` (last write wins if duplicates)
4. Enrich each card (normalized **`DeckPoolCard`** shape below)
5. Write `data/cards.json`, `data/packs.json`, `data/construction-rules.json`, `data/has-flags.json` (optional sidecar)
6. Exit non-zero if `data/unparsed-construction.json` is non-empty

**`pack_id` → set metadata** (from punk-records `packs.json`):

| `packs[id].title_parts.prefix` | `series` | `setCode` (for `set:` / display) |
|---|---|---|
| `STARTER DECK`, `STARTER DECK EX`, `ULTRA DECK` | `ST` | `label` with hyphens removed, e.g. `ST-07` → `ST07` |
| `BOOSTER PACK` | `OP` | `OP-01` → `OP01` |
| `EXTRA BOOSTER` | `EB` | `EB-02` → `EB02` |
| `PREMIUM BOOSTER` | `PRB` | `PRB-01` → `PRB01` |
| `Promotion card` / promo packs | `P` | `P` |

Also store raw `packId` (e.g. `569007`) on each card for debugging. If `title_parts.label` is null, derive `series` from card id prefix before `-` (e.g. `OP08-072` → `OP` / `OP08`).

**Rarity → search token map:**

| Catalog `rarity` | `r:` token |
|---|---|
| Common | `c` |
| Uncommon | `uc` |
| Rare | `r` |
| SuperRare | `sr` |
| SecretRare | `sec` |
| Leader | `l` |
| Special | `sp` |
| TreasureRare | `tr` |
| Promo | `p` |

**Normalized card example (`data/cards.json` entry):**

```json
{
  "id": "ST07-001",
  "name": "Charlotte Linlin",
  "category": "Leader",
  "rarity": "Leader",
  "colors": ["Yellow"],
  "cost": 5,
  "attributes": ["Special"],
  "power": 5000,
  "counter": null,
  "types": ["The Four Emperors", "Big Mom Pirates"],
  "effect": "…",
  "trigger": null,
  "packId": "569007",
  "setCode": "ST07",
  "series": "ST",
  "images": ["https://en.onepiece-cardgame.com/images/cardlist/card/ST07-001.png"],
  "has": ["effect"]
}
```

**`has:` compile rules:** scan `effect` + `trigger` for `[Blocker]`, `[Rush]`, `[Banish]`, `[Double Attack]`; add `trigger` if trigger non-null; `counter` if counter non-null; `effect` if effect non-null. Collect distinct flags globally for typeahead.

**`next.config.ts`:** allow remote images:

```ts
images: { remotePatterns: [{ protocol: "https", hostname: "en.onepiece-cardgame.com", pathname: "/images/**" }] }
```

#### 9.7.1 Product contents ingest (automated — all ST01–ST36)

**Command:** `npm run ingest-products` (run after `ingest-catalog`; needs `data/cards.json` + punk-records `packs.json`).

**What it does:**

1. Read ST products from punk-records `english/packs.json` (`569001`–`569036`).
2. For each `ST01` … `ST36`, fetch the One Piece Player deck-list page (§5.2.2).
3. Parse quantities → write `data/products/{STxx}.json`.
4. Write `data/products/index.json` with `id`, `packId`, `name`, `leaderId`, `type`.
5. Print summary; **exit 1** if any of the 36 products failed.

**Implementation sketch (`scripts/ingest-products.ts`):**

```ts
// Per ST product:
// 1. Resolve URL from scripts/product-urls.json or slug guess
// 2. fetch(url) — polite delay (e.g. 500ms between requests)
// 3. Parse HTML with two regex paths:
//    - /([A-Z]{2,3}\d{2}-\d{3}|P-\d{3})\s*x\s*(\d+)/gi  (bullet lists)
//    - /(\d+)\s*x\s*([A-Z]{2,3}\d{2}-\d{3}|P-\d{3})/gi  (inline lists)
// 4. Skip lines matching /don!!/i
// 5. Validate ids against cards.json; validate 50+1 totals
// 6. Write JSON
```

**Not used for product contents:** punk-records card packs (no qty), optcgapi (card metadata only, no deck counts), official product marketing pages (no per-card counts in HTML).

**When a new ST37 releases:** add pack to punk-records on next catalog pull, add URL to `product-urls.json` if slug guess fails, re-run ingest — no app code change.

### 9.8 Types, DAOs, and Firestore rules

**`types/catalog.ts`**

```ts
export type CardCategory = "Leader" | "Character" | "Event" | "Stage";
export type OptcgColor = "Red" | "Green" | "Blue" | "Purple" | "Black" | "Yellow";

export interface DeckPoolCard {
  id: string;
  name: string;
  category: CardCategory;
  rarity: string;
  colors: OptcgColor[];
  cost: number | null;
  attributes: string[];
  power: number | null;
  counter: number | null;
  types: string[];
  effect: string | null;
  trigger: string | null;
  packId: string;
  setCode: string;
  series: string;
  images: string[];
  has: string[];
}
```

**`types/collection.ts`**

```ts
export interface CollectionItem {
  cardId: string;
  quantity: number;
  labels: string[];
  updatedAt?: unknown;
}
```

**`types/deck.ts`**

```ts
export interface Deck {
  id: string;
  name: string;
  leaderId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Variation {
  id: string;
  name: string;
  cards: Record<string, number>; // main-deck ids only; no Leader
  updatedAt?: unknown;
}
```

**`types/user.ts`**

```ts
export interface UserProfile {
  displayName: string;
  email: string;
  createdAt?: unknown;
}
```

**`types/cardPref.ts`**

```ts
export interface CardPref {
  preferredImageUrl: string;
}
```

**Firestore document shapes**

| Path | Fields |
|---|---|
| `users/{uid}` | `displayName`, `email`, `createdAt` |
| `users/{uid}/collection/{cardId}` | `quantity` (int ≥ 0), `labels` (string[]), `updatedAt` |
| `users/{uid}/cardPrefs/{cardId}` | `preferredImageUrl` |
| `users/{uid}/decks/{deckId}` | `name`, `leaderId`, `createdAt`, `updatedAt` |
| `users/{uid}/decks/{deckId}/variations/{variationId}` | `name`, `cards` (map string→int), `updatedAt` |

**`firestore.rules` (minimum V1):**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(uid) {
      return request.auth != null && request.auth.uid == uid;
    }
    match /users/{uid} {
      allow read, write: if isOwner(uid);
      match /collection/{cardId} {
        allow read, write: if isOwner(uid);
      }
      match /cardPrefs/{cardId} {
        allow read, write: if isOwner(uid);
      }
      match /decks/{deckId} {
        allow read, write: if isOwner(uid);
        match /variations/{variationId} {
          allow read, write: if isOwner(uid);
        }
      }
    }
  }
}
```

Deploy with `firebase deploy --only firestore:rules` before first client write.

**Pure logic modules (unit-test first):**

| Module | Responsibility |
|---|---|
| `lib/search/parseQuery.ts` | Parse `q` string → AST |
| `lib/search/filterCards.ts` | Apply AST + universe + Builder filters |
| `lib/search/typeahead.ts` | Keyword/value suggestions |
| `lib/legality.ts` | `Legal/Illegal` + `Owned/Unowned` + reason bullets |
| `lib/construction.ts` | `isForbiddenByLeader`, `copyLimitForCard` |
| `lib/collection.ts` | Firestore CRUD for collection |
| `lib/decks.ts` | Firestore CRUD for decks/variations |
| `lib/users.ts` | `ensureUserDoc`, profile updates |

---

## 10. Explicitly out of V1 (deferred)

| Idea | Status |
|---|---|
| Live Limitless HTML/search scraping | Not wanted |
| optcgapi.com as the live search engine | Not wanted |
| Split inventory / box locations / allocating copies across binders | Not wanted (labels are overlapping **views**, V1) |
| Paste-a-list collection import | Deferred |
| DON!! deck tracking | Not wanted |
| Standard / Extra / ban list / rotation | Deferred |
| Public deck sharing, upvotes, meta | Deferred |
| Prices (TCGPlayer / Cardmarket) | Deferred |
| Japanese (or other) prints | Not wanted |
| LLM in the builder or ingest | Not wanted for V1 |
| Artist, block icon, AA/manga/serial as **owned** print types | Deferred (images as display variants only) |
| Leader construction-effect NLP | Not wanted (regex + overlay only) |
| Auto-include Imu’s Stage | Not wanted |
| Proxies / print sheets | Deferred |
| Draw / mulligan simulator | Deferred |
| Match history / goldfish | Deferred |
| OAuth (Google/Apple) | Not wanted |
| **Dark mode / theme toggle** | Not wanted — **bright-only** (§8) |
| Offline mode | Not wanted |
| Monetization | None |
| Separate Express + Cloud SQL stack | Not for V1 |
| Diligence cron / Resend / Admin SDK | Not for V1 |
| Sharing Diligence Firebase or Vercel projects | Not wanted |

**Possible V2 themes (not designed yet):** list paste import, Limitless list import, format legality, public share links, per-copy print inventory, allocating qty to locations.

---

## 11. Implementation order (recommended)

1. Scaffold Next.js 16 + Tailwind 4 + Firebase Auth (landing, signup **with display name**, login, reset, AuthGate) — **npm**
2. **New** Firebase project + **publish nested `users/{uid}` rules** before writes
3. Profile + empty Collection / Cards / Decks / Builder shells (AppShell)
4. Catalog ingest (§9.7) → `data/cards.json`; then **product ingest (§9.7.1)** → all **ST01–ST36** in `data/products/`; ship static files
5. Collection: search catalog, set qty, labels, add starter (+ optional create deck)
6. Cards: search language + URL `q=` + owned-only toggle (default off) + art grid + art picker
7. Decks CRUD: owned Leader only, name, default variation `Main`
8. Builder: one search bar, owned-only default on, add/remove, copy cap, 50 counter, **Legal/Illegal** + **Owned/Unowned**, line-level owned gap
9. Variations: clone, rename, delete, switcher, diff; Leader change warning + strip
10. Construction tests: Biscuit Warrior, Imu, Rayleigh; ingest grep for `in your deck`
11. Profile stats + polish (empty states, mobile builder)
12. New Vercel project deploy + Auth authorized domain + re-verify rules

---

## 12. Decision log (quick reference)

| Topic | Decision |
|---|---|
| Name | **DeckPool** |
| Differentiator | Owned-first brew + named variations + Limitless-like search + labels as views |
| Accounts | Day one, Firebase, **open signup**, email/password only |
| Display name | **Required at signup**; Firebase Auth + Firestore `users/{uid}`; editable on profile |
| Decks list | Visual group by Leader; **multiple decks per Leader OK** |
| Variation diff | Modal; pick base + compare; changed ids only |
| Cards URL | `q=` + `owned=1` for owned-only |
| Label merge on starter | **Union** with existing labels |
| Builder construction filter | Hide Leader-forbidden cards in search (§5.5.1) |
| Catalog ingest | punk-records prefetched or `build_punk_records.py`; §9.7 |
| Starter products | **All ST01–ST36** via `npm run ingest-products`; users never enter contents |
| Types / rules | §9.8 |
| Providers | Catalog, Collection, Decks, UserProfile (§9.1) |
| Password reset | Yes |
| Infra | **New** Firebase + **new** Vercel; do not reuse Diligence |
| Backend | Next 16 + Firebase Auth + Firestore; no Express; no Admin/cron in V1 |
| Package manager | **npm** (copy Diligence) |
| Firestore shape | Nested `users/{uid}/collection\|cardPrefs\|decks/variations` |
| Catalog | punk-records / vega snapshot; **none owned yet**; search in-browser |
| Live Limitless API | No (copy UX only, §5.5) |
| Card language | English only |
| Images | Lots; hotlink Bandai; `next/image` remote pattern |
| Art picker | One preferred scan **per card number per account**; no-op if only one image |
| Collection | One binder; card number → qty |
| Labels | Optional, multiple, overlapping; on the stack; filter via `label:` |
| Copy allocation / locations | No |
| Enter owned cards | Search-and-count; constructed-product increment from contents JSON |
| Add product extras | Optional labels on all incremented cards; optional create deck from contents |
| Paste list | Deferred |
| DON!! / Don category | Excluded everywhere |
| Create deck | **Owned Leader required** |
| Unowned in the 50 | **Yes**; Builder owned-only toggle defaults **on**; one search bar |
| Variation tags | **Legal/Illegal** (rules) and **Owned/Unowned** (binder) — both always shown |
| Add click cap | Copy limit only, not owned qty |
| Color identity | Card colors **⊆** Leader colors (official) |
| Dual-color Leader | Either (and both) of its colors; dual cards still must be a subset |
| Leader change | Warn (no card list) → strip illegal lines from **all** variations of that deck |
| Deck model | One Leader + many full count-map variations |
| Variation diffs | Clone-then-edit; UI diff; not stored as patches |
| Incomplete variations | Save; **Illegal** until 50 + rules |
| Inventory vs variations | Each variation checked independently for Owned |
| Search | §5.5; typeahead of real values; filter by any catalog field + labels |
| `/cards` | Ships; catalog default; owned-only toggle off by default |
| Collection vs Cards vs Builder | Counter vs browser vs brew — do not merge |
| Format / bans | Not V1 |
| Construction | Regex + JSON overlay; no runtime LLM |
| Imu Stage line | Hint only |
| Theme | **Bright / light only** — parchment, wanted posters, OPTCG colors (§8) |
| Cost | Free only |
| Repo | `C:\DeckPool` |

---

## 13. Success criteria for V1 ship

A signed-in user can:

1. Create an account **with a display name**, reset a password, edit their name, and log out  
2. Mark owned quantities, attach **multiple labels**, filter by those labels, and **add a starter’s real counts** in one action (optional: also create that deck)  
3. Browse `/cards` over the **full catalog**, toggle **Owned only**, and run `color:purple type:"Big Mom Pirates"` (and the other V1 keywords, with typeahead)  
4. Create a deck only from an **owned** Leader  
5. Maintain multiple named variations without duplicating the deck record  
6. See **Illegal** on a 46/50 draft; **Legal** when 50 + colors + copies + construction pass — **even if** some copies are unowned  
7. See **Unowned** when the list asks for more copies than the binder (or no Leader in binder); **Owned** when every line is sleeveable  
8. Toggle Builder search to include unowned cards, add them, and see `in deck / owned` on each line  
9. Run 5+ Biscuit Warriors if construction allows (**Legal**); **Unowned** if they don’t have that many; be blocked from 2-cost Events under Imu and 5-cost cards under Rayleigh  
10. Change Leader, confirm a generic strip warning, and lose off-color / construction-illegal cards  
11. Click a card and pick a preferred image for their account when more than one scan exists  
12. Use the app comfortably on phone and desktop in the **bright wanted-poster theme** with large card art in grids  

When those work, V1 is done.

---

## 14. Competitive notes (do not rebuild)

Checked 2026-08-17. Collection + a separate builder is common on phones. Hard **owned-first** brew on the **web**, plus first-class variations, was not found as a combined product. Wishlist unowned copies are allowed but must stay visually secondary to the binder. If Beli or OP Deck Builder later feels identical on a phone, shrink DeckPool rather than adding scanners and prices to compete.

---

## 15. Related files (optional — not required to implement)

| File | Role vs this blueprint |
|---|---|
| **This file** | Only SoT for DeckPool V1 |
| Official comprehensive rules PDF | Authority if a construction/color dispute appears; then **update this file** |
| Limitless TCG (website) | Inspiration for search chrome; never a dependency |
| [en.onepiece-cardgame.com](https://en.onepiece-cardgame.com/) | Bright product/marketing tone for §8 |
| One Piece wanted posters (in-world + fan layout guides) | Poster composition for §8.5 — layout only, no trademark assets |
| `C:\Diligence\ARCHITECTURE.md` | Optional scaffold copy for AuthGate/AppShell/firebase.ts |
| `C:\Diligence\DILIGENCE_V1_BLUEPRINT.md` | **Ignore for DeckPool product rules** |
