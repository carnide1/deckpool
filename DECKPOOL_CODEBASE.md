# DeckPool — Codebase snapshot

**Status:** Living summary of the **as-built** app  
**Last updated:** 2026-08-25  
**Git:** `main` at `https://github.com/carnide1/deckpool.git`  
**Local path:** `C:\DeckPool`

This file is the default briefing for any new chat. **Do not start by re-scanning the whole repo** unless this file is missing, clearly stale, or the task is to rewrite it.

Product rules for V1 live in `DECKPOOL_V1_BLUEPRINT.md`. Later feature decisions live in `DECKPOOL_FUTURE_FEATURES.md`. **This file describes what the code actually does today.** If this file and the blueprint disagree, trust this file for “how it works now,” and the blueprint only for “what V1 originally specified.”

---

## Mandatory update rule (agents)

This file **must stay true** after every change that is committed or pushed.

**When to update**

- You added, removed, or renamed a route, context, Firestore path, env var, npm script, or important behavior.
- Search, collection, builder, legality, or ingest behavior changed.
- Deploy targets, Firebase project, or GitHub remote changed.
- You are about to commit or push, and this file would be wrong if someone cloned `main` tomorrow.

**How to update**

1. Edit the relevant sections. Change **Last updated** (and the git commit line if you know the new hash).
2. Keep language plain. Describe the app as it is, not as it might be.
3. Include this file in the same commit as the code change whenever possible.
4. Do not leave “TODO: update the snapshot later.”

**When not to rewrite the whole file**

- Typo fixes, CSS-only polish, or tests that do not change behavior: bump the date only if you mention the change; otherwise skip.
- If you are unsure a section is still right, read those files and fix the section. Do not delete the section.

**Do not**

- Invent a production URL, Vercel project, or secrets.
- Copy large code blocks into this file.
- Treat unimplemented blueprint ideas as if they already exist.

---

## What this product is

DeckPool is a **personal English One Piece Card Game deckbuilder**.

The point of the app:

1. You log the cards you **own** (one count per printed card number, such as `OP08-072`).
2. You build 50-card lists that **default to that owned pool**.
3. One deck has **one Leader** and **several named variations** (full lists, not patches), for example `Main` and `Anti-yellow`.
4. Two independent tags: **Legal / Illegal** (construction rules) and **Owned / Unowned** (whether the binder can sleeve the list).
5. **Wanted** is a shopping board of extra copies to buy. It is separate from unowned copies already sitting in a deck.

It is **not** a scanner, price tracker, public deck site, tournament browser, or playable game. Those are later ideas; see `DECKPOOL_FUTURE_FEATURES.md`.

V1 cost rules still in force in code: no paid search service, no language-model API, no separate Express server, no `/api` routes.

---

## Tech

| Layer | Choice |
|---|---|
| App | Next.js **16.3.1** App Router, React **19**, TypeScript strict, `app/` at repo root (no `src/`) |
| Path alias | `@/*` → repo root |
| CSS | Tailwind **4**, tokens in `app/globals.css` |
| Fonts (as built) | **Nunito** (body) + **Cinzel** (display). Blueprint mentioned Fredoka; the app uses Cinzel. |
| Theme | Bright only. Parchment cream, pirate red, ocean blue. No dark mode. |
| Auth | Firebase Auth, **email/password only**. Client `AuthGate`. No `middleware.ts`. |
| Data | Cloud Firestore, nested under `users/{uid}/…`. Client SDK writes. |
| Catalog | Static JSON in `data/`, loaded in the browser. ~**2785** English cards. Don cards stripped at ingest. |
| Images | Hotlink `en.onepiece-cardgame.com` via plain `<img>` in `CardImage` (not `next/image` / not `/_next/image`). Optional mirror via `NEXT_PUBLIC_CARD_IMAGE_ORIGIN`. |
| Hosting (intended) | Vercel Hobby. No `vercel.json` in the repo. `.vercel/` is gitignored. |
| Package manager | **npm** (`package-lock.json`) |
| Tests | `npm test` → `tsx --test lib/**/*.test.ts` |
| No | Firebase Admin, Storage uploads, cron, Resend, OAuth, Algolia |

---

## Commands

From `C:\DeckPool`:

| Command | What it does |
|---|---|
| `npm run dev` | Local app at `http://localhost:3000` |
| `npm run build` / `npm run start` | Production build and serve |
| `npm test` | Unit tests for search, legality, builder, variations, collection helpers |
| `npm run lint` | ESLint |
| `npm run ingest-catalog -- --input <punk-records english folder>` | Rebuild `data/cards.json`, packs, construction rules, has-flags |
| `npm run ingest-products` | Rebuild `data/products/` (ST01–ST36) from One Piece Player pages |
| `firebase deploy --only firestore:rules` | Publish `firestore.rules` to project `deckpool-64459`. **Required after adding `wanted`.** |

Ingest is a **local** maintainer task. Vercel must not scrape Bandai or One Piece Player at runtime. Commit the generated JSON.

---

## Deployments and accounts

| Piece | Value / how |
|---|---|
| GitHub | `https://github.com/carnide1/deckpool.git`, default branch `main` |
| Firebase project id | `deckpool-64459` (`.firebaserc`) |
| Firebase config | `firebase.json` points at `firestore.rules` only (no Hosting, no Functions) |
| Auth | Email/Password enabled in the Firebase console (human setup) |
| Authorized domains | Must include `localhost` and the **exact** Vercel hostname after first deploy. Do not add the parent domain `vercel.app`. |
| Env locally | Copy `.env.local.example` → `.env.local` (gitignored) |
| Env on Vercel | Same `NEXT_PUBLIC_*` names. After changing them, **redeploy** (they are baked in at build). |
| Production URL | **Not stored in this repo.** Look it up in Vercel if needed. Set `NEXT_PUBLIC_APP_URL` to that URL with no trailing slash. |

**Env vars (all public, all required for the client SDK):**

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (init only; we do not upload files)
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_APP_URL` (local: `http://localhost:3000`)
- `NEXT_PUBLIC_CARD_IMAGE_ORIGIN` (optional) — HTTPS origin with **no** trailing slash that mirrors Bandai’s `/images/cardlist/card/...` paths. Catalog and Firestore still store Bandai URLs; only the browser `src` is rewritten.

Never commit `.env.local`. Never put a language-model key in the browser.

---

## Routes

**Public (logged out):** `/`, `/login`, `/signup`, `/forgot-password`  
Logged-in users on those routes are sent to `/decks`, or `/collection` if they own zero cards (`lib/auth-routing.ts`).

**App (requires login), nav in `AppShell`:** Collection, Cards, Decks, Profile. Desktop sidebar, mobile bottom nav.

| Route | Job |
|---|---|
| `/collection` | **Owned binder** by default. Modes: Binder, Summary (`?view=summary`), **Wanted** (`?view=wanted`). Binder cannot create new card numbers (`useCollectionWrite(false)`). Wanted is extra copies to buy; **Caught** can create binder rows. |
| `/cards` | **Full catalog.** Name + filters, URL-synced. `owned=1` limits to owned. `wanted=1` limits to posters. Click a card to set qty (this **can** create new collection rows), bounty, labels, preferred art. Starter-deck add lives here too. |
| `/decks` | List decks, grouped by Leader. Create / rename / delete. |
| `/decks/[id]` | **View** by default (`DeckView`). **Edit** at `?mode=edit` (`BuilderView`). |
| `/profile` | Display name (Auth + Firestore), email, stats, logout. |

There is **no** `/api/*` folder.

---

## Provider tree

Root (`app/layout.tsx`): `AuthProvider` → `UserProfileProvider` → toaster → `AuthGate`

Authenticated shell (`app/(app)/layout.tsx`): `CatalogProvider` → `CollectionProvider` → `WantedProvider` → `CardPrefsProvider` → `DecksProvider` → `AppShell`

| Context | Source |
|---|---|
| Catalog | Dynamic import of `data/cards.json` into memory |
| Collection | Firestore snapshot `users/{uid}/collection` |
| Wanted | Firestore snapshot `users/{uid}/wanted` |
| Card prefs | Firestore snapshot `users/{uid}/cardPrefs` |
| Decks | Firestore snapshot `users/{uid}/decks` plus each deck’s `variations` |

---

## Firestore

Owner-only. Rules file: `firestore.rules`.

```
users/{uid}                          displayName, email, createdAt
  collection/{cardId}                quantity, labels[], updatedAt
  wanted/{cardId}                    quantity (extra copies to buy), updatedAt
  cardPrefs/{cardId}                 preferredImageUrl
  decks/{deckId}                     name, leaderId, favoriteVariationId, createdAt, updatedAt
    variations/{variationId}         name, cards { [cardId]: number }, updatedAt
```

- Collection document **id** is the card number. Qty 0 **deletes** the doc.
- Wanted document **id** is the same card number. Qty is extra copies to buy, not a total target. Qty 0 **deletes** the doc.
- After changing `firestore.rules`, run `firebase deploy --only firestore:rules`. Until that is published, Wanted reads/writes fail.
- Labels live only on owned collection rows. Unowned Wanted cards have no labels.
- **Caught** writes binder and Wanted in one Firestore transaction. Collection `+` while a poster exists uses that same catch helper.
- Decrementing owned qty does **not** put the bounty back.
- Variation `cards` is a full count map of the 50 (or draft). Leader is **not** in that map.
- `favoriteVariationId` is the list the owner usually plays. New decks set it in the same write as `Main`. Older decks without the field fall back to a variation named `Main`, then to the most recently edited list. Tab order and first-opened tab use that same resolve. Deleting the favorite points it at another remaining variation.
- Catalog, construction rules, products, and `has:` flags are **files**, not Firestore.

---

## Pages and behavior (as built)

### Collection (`/collection`)

- **Binder** shows **only cards with qty > 0**.
- Modes: **Binder** (grid), **Summary** (breakdown by category, color, cost, rarity), and **Wanted** (`?view=wanted`).
- Filters: text (name or id), colors, categories, costs, rarities, types, attributes, sets, has-flags, labels, **which decks the card appears in**. Wanted uses the same filters; labels only exist if the card is already owned.
- Sort includes **recently updated** (binder uses collection timestamps; Wanted uses wanted timestamps).
- Pagination: 60 per page.
- Binder qty stepper only adjusts existing rows. To log a **new** card, use `/cards` or **Caught** on Wanted.
- Card tiles have a WANTED stamp (bottom-right of the art). Tap posts bounty 1 or drops the poster. Owned `×qty` stays top-right.
- Card detail can show which decks include that number, plus a **Bounty** stepper (extra copies to buy).

### Wanted board (`/collection?view=wanted`)

- Flat shopping list of posted bounties. Count on the stamp (`×4`).
- **Caught** adds the remaining want to the binder and deletes the poster. **Caught 1** does one copy. Both use `catchWantedCopies`.
- Empty copy: “No posters.”
- Does not add cards to decks. If a card is already in a list, logging binder copies is enough for Owned/Unowned.

### Cards (`/cards`)

- Full English catalog (no Don).
- Filters sync to the URL (`lib/search/filters.ts`). Owned toggle: `owned=1`. Wanted toggle: `wanted=1`. Both can be on.
- Sort: newest / oldest / serial / name / category / cost. Newest = latest set family.
- Page size 48, load-more style.
- Modal: qty (can create), bounty, labels, art picker, decks that use the card.
- WANTED stamp on every tile. Owned `+` while a poster exists catches against that bounty.
- **Add starter deck** modal: increment ST01–ST36 contents; optional labels merged; optional “also create a deck.”

### Decks (`/decks`)

- Grouped by Leader. Multiple decks per Leader are allowed.
- Create: search **owned Leaders only**, name the deck, create variation `Main` empty, pin it as the favorite.
- Rename / delete with confirm. Delete also deletes variations.
- Legal / Owned badges on each row come from the **favorite** variation only (not “any variation”).
- Leader art on the row uses the account’s preferred print when one is saved.

### Builder (`/decks/[id]?mode=edit`)

- Search defaults to **owned only** (toggle off to add unowned copies).
- Hard filters always: Leader colors (card colors must be a subset of Leader colors), Leader forbid rules, no Leaders/Don in the 50.
- Click a result to add a copy. Cap is construction copy limit (usually 4), **not** owned qty. Minus on the list to remove.
- Result tiles are a dense 3-column grid on mobile, images capped at 120px wide (`h-auto w-full`) so they do not blow up versus View. Leader portrait and result tiles use preferred art.
- WANTED stamp on results does **not** add to the 50. **Post all unowned** raises Wanted to `in this variation − owned` for the active variation (does not stack on top of an existing bounty).
- Manifest lines show id, category, cost, and power, plus in-deck / owned. Status panel: Legal/Illegal, Owned/Unowned, reason bullets for the **active tab**.
- List summary (active tab): average cost, average power, Character/Event/Stage counts, blocker/rush/banish/double-attack/trigger counts, counter 1000 vs 2000.
- Variations: tabs ordered **favorite first**, then most recently edited. Opening the page selects the favorite. Star a tab (or **Set as main**) to pin it. Clone, rename, delete (cannot delete the last). Compare modal shows count diffs only.
- Change Leader: warning, then strip illegal cards from **every** variation of that deck.
- Writes go to Firestore through a queued `setVariationCards` so rapid clicks do not race.

### Deck view (`/decks/[id]` without `mode=edit`)

- Read-only look at the active variation. Opens on the favorite. Switch to Edit to brew.
- Same tab order, star-to-pin, and list summary as Edit. Legal/Owned follow the tab you are looking at.
- Leader portrait uses preferred art. WANTED stamp and bounty stepper still work from this page.

### Profile

- Stats computed client-side: unique owned ids, total copies, deck count, variation count, Legal vs Illegal, Owned vs Unowned.

---

## Search (important: two systems)

**What the UI uses:** `lib/search/filters.ts` + `NameSearchBar` + `FilterPanel`.

- Text matches **name or card id** substring.
- Facets: color, category, cost, rarity, type, attribute, set, has, label, deck (collection only).
- Cards URL stores those filters plus `owned=1` and `wanted=1`. Builder keeps filters in component state.

**What exists in code but is not the live UI:** Limitless-style query language in `lib/search/parseQuery.ts` + `filterCards.ts` (`color:purple type:"Big Mom Pirates"`, `or`, `-term`, quotes, parens). Covered by `lib/search/search.test.ts`. Do not assume the search box parses `color:purple` unless you wire it up.

**Simple name search:** `lib/search/simpleCatalogSearch.ts` for Leader pickers.

**Rarity tokens** (if using the query language): TreasureRare → `treasure`, not `tr` (`tr` is trigger).

---

## Legality and construction

Pure functions: `lib/legality.ts`, `lib/construction.ts`, `lib/builder.ts`.

**Legal** (does not care about ownership):

1. Valid Leader on the deck  
2. Main deck size exactly 50  
3. Every card’s colors ⊆ Leader colors  
4. Copies ≤ 4, unless a `copyLimit` rule says otherwise (`null` = unlimited)  
5. No card matching the Leader’s `forbid` rules  

**Owned:** Leader qty ≥ 1, and for every main-deck id, in-deck ≤ binder qty.

Rules JSON: `data/construction-rules.json` (generated at ingest, plus seeds). As of this snapshot that includes unlimited copies for `OP08-072` (and others), Imu (`OP13-079`) forbidding Events with cost ≥ 2, Rayleigh (`OP12-001`) forbidding cost ≥ 5, and Nami `P-117` requiring `{East Blue}` types.

Do **not** call a language model to decide legality.

---

## Catalog and ingest

| File | Role |
|---|---|
| `data/cards.json` | All searchable cards (~2785). No Don. |
| `data/packs.json` | Set/pack metadata |
| `data/construction-rules.json` | copyLimit + forbid |
| `data/has-flags.json` | Flags such as blocker, rush, banish, double-attack, counter, effect, trigger |
| `data/products/index.json` | ST01–ST36 picker |
| `data/products/STxx.json` | Real box counts (`cardId` → qty) |
| `scripts/ingest-catalog.ts` | From punk-records English JSON |
| `scripts/ingest-products.ts` | From One Piece Player HTML, with `scripts/product-urls.json` and `scripts/product-overrides/` |

Card shape: `types/catalog.ts` (`DeckPoolCard`). `cost` on a Leader is Life. `images[]` is every known scan for that number; user picks one per account in `cardPrefs`. Grids, deck rows, builder portraits, and Leader pickers all use `imageCandidates` → `CardImage` so a saved print wins over the first scan (often a SAMPLE stamp). `CardImage` loads Bandai (or an optional mirror) with a plain `<img>`, tries every remaining catalog URL on error, then shows “No art”. If the preferred URL is gone after ingest, `imageForCard` falls back to the first scan.

When a new set releases: pull punk-records, run both ingest scripts, commit `data/`, then ship. Do not guess starter counts as “1 of each id.”

---

## Folder map

```
app/                    routes + layouts + globals.css
components/             UI by area: auth, builder, cards, collection, decks, profile, search, ui, wanted
contexts/               Auth, UserProfile, Catalog, Collection, Wanted, CardPrefs, Decks
hooks/                  useCollectionWrite, useWantedWrite
lib/                    firebase, users, collection, wanted, cardPrefs, variations, decks, legality, builder, search, tests
types/                  catalog, collection, wanted, deck, user, cardPref, construction, product
data/                   committed snapshots
scripts/                ingest + product URL/override JSON
firestore.rules
firebase.json
.firebaserc
.env.local.example
```

Key libraries:

| Module | Role |
|---|---|
| `lib/firebase.ts` | Init from env |
| `lib/users.ts` | Signup doc, `ensureUserDoc`, display name, owned-count for routing |
| `lib/collection.ts` | Qty set/adjust, label merge, batch starter add |
| `lib/wanted.ts` | Bounty qty, catch transaction, raise gaps from a variation |
| `lib/cardPrefs.ts` | Preferred art read/write; `imageForCard` / `imageCandidates` pick saved art then other scans; `publicImageUrl` optional mirror rewrite |
| `lib/variations.ts` | Favorite resolve + tab order (resolved favorite first, then recency) |
| `lib/variationStats.ts` | Average cost/power, category and keyword counts for a list |
| `lib/decks.ts` | Deck/variation CRUD, favorite pin, starter→deck, change Leader, delete cascade |
| `lib/labels.ts` | Union-merge labels |
| `lib/variationDiff.ts` | Compare two count maps |
| `lib/profileStats.ts` | Profile numbers |
| `lib/pagination.ts` | Page math for Collection |
| `lib/deckMembership.ts` | Which decks contain a card |
| `lib/collectionBreakdown.ts` | Summary view |

Tests sit next to the modules they cover (`*.test.ts`).

---

## As-built vs original V1 blueprint (do not “fix” these unless asked)

The blueprint is still the product source of truth for **rules** (color identity, 50 cards, variations). The UI drifted in a few places:

| Blueprint said | Code today |
|---|---|
| Collection searches the **full** catalog to log new cards | Collection is **owned-only**. New cards are logged on `/cards`. |
| Limitless `q=` language in the search box | Filter panel + name/id text. Query parser exists but is unused in pages. |
| Display font Fredoka | Cinzel |
| Builder search state may stay in the component | True. View vs Edit is `?mode=edit`. |
| Paste-a-list import, match history, LLM, scanner | Not built. See `DECKPOOL_FUTURE_FEATURES.md`. |
| Compact Legal/Owned on `/decks` is **any** variation | Compact Legal/Owned is the **favorite** variation. Profile still counts every variation. |
| Wishlist (future-features #5) | Built as **Wanted**: extra copies to buy, Collection third mode, Cards `wanted=1`, catch into the binder. |

Do not silently revert Collection to a full-catalog logger, or rip out the filter UI to restore `color:purple` in the box, without the user asking.

---

## Conventions for new work

- Client components for anything that uses Firebase or hooks. Keep legality/search as pure functions with tests.
- Firestore writes: owner tree only. New subcollections need a matching `firestore.rules` change **and a deploy**.
- Collection qty 0 = delete the document. Wanted qty 0 = delete the document.
- One favorite variation per deck (`favoriteVariationId`). `/decks` Legal/Owned uses that list. View/Edit badges follow the open tab.
- Do not auto-add Wanted cards to decks. Caught only touches the binder.
- Do not add Google/Apple login, dark mode, Don cards, or a public deck gallery in V1.
- Prefer npm. Do not add Yarn.
- Mobile-first; Builder is allowed to feel denser.

---

## Related docs

| File | Use it for |
|---|---|
| **This file** | How the repo works today; update on every meaningful push |
| `DECKPOOL_V1_BLUEPRINT.md` | Locked V1 product rules |
| `DECKPOOL_V1_IMPLEMENTATION_GUIDE.md` | Human setup (Firebase console, Vercel clicks) |
| `DECKPOOL_FUTURE_FEATURES.md` | Post-V1 ideas and decisions (wishlist, import, sim, and so on) |

---

*If you changed the app and did not update this file, the next chat will be wrong. Update it in the same commit.*
