# DeckPool — Codebase snapshot

**Status:** Living summary of the **as-built** app  
**Last updated:** 2026-09-10
**Git:** `main` at `https://github.com/carnide1/deckpool.git` (commit at last update: local WIP — audit fixes for auth, profile isolation, labels, rules, Cards deck filter)
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
| Auth | Firebase Auth, **email/password only**. Client `AuthGate`. No `middleware.ts`. Public routes render while Auth is still resolving (avoids mobile “Loading…” freeze). Auth init falls back IndexedDB → localStorage → memory, with an 8s ready timeout + Retry. |
| Data | Cloud Firestore, nested under `users/{uid}/…`. Client SDK writes. |
| Catalog | Static JSON in `data/`, loaded in the browser. ~**2785** English cards. Don cards stripped at ingest. |
| Images | Same-origin `/card-art/{file}.png` proxy for Bandai (avoids Chrome **CORP** and Vercel `/_next/image` **402**). Strict filename allowlist, upstream timeout, ETag/304, in-flight coalesce, long cache. Optional CDN mirror first via `NEXT_PUBLIC_CARD_IMAGE_ORIGIN`. Retries + **Retry** UI. |
| Hosting (intended) | Vercel Hobby. No `vercel.json` in the repo. `.vercel/` is gitignored. Redirects (e.g. `/collection?view=wanted` → `/wanted`) live in `next.config.ts`. |
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
| `firebase deploy --only firestore:rules` | Publish `firestore.rules` to project `deckpool-64459`. The tightened rules were deployed after the audit on 2026-08-27. |

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
- `NEXT_PUBLIC_CARD_IMAGE_ORIGIN` (optional) — **HTTPS** origin with **no** trailing slash that mirrors Bandai’s `/images/cardlist/card/...` paths. Invalid values (including `http:`) are ignored. When set, tiles try the mirror URL first, then same-origin `/card-art` for Bandai. Catalog and Firestore still store Bandai URLs.

Never commit `.env.local`. Never put a language-model key in the browser.

---

## Routes

**Public (logged out):** `/`, `/login`, `/signup`, `/forgot-password`, and **`/s/[shareId]`** (shared deck snapshot).  
Logged-in users on the auth landing routes (`/`, `/login`, `/signup`, `/forgot-password`) are sent to a safe `?next=` path when present, otherwise `/decks`, or `/collection` if they own zero cards (`lib/auth-routing.ts`). Logged-in users **stay** on `/s/…` (AuthGate treats share links as public but not as auth landings).

**App (requires login), nav in `AppShell`:** Collection, Wanted, Cards, Decks as primary; Profile separate.

- **Desktop (`md+`):** Collapsible sidebar that **resizes** the main column (no overlay). Expanded header: “DeckPool” + `PanelLeftClose` collapse control on the right. Collapsed header shows “DP”. **Collapse** is button-only. **Expand** is click empty rail chrome (nav links still navigate). Preference in `localStorage` `deckpool.sidebarExpanded`. Profile pinned at the bottom of the rail.
- **Mobile (`< md`):** No sidebar. Top header = DeckPool + Profile. Bottom bar = Collection, Wanted, Cards, Decks (safe-area padding).

| Route | Job |
|---|---|
| `/collection` | **Owned binder** by default. Modes: Binder, Summary (`?view=summary`). Binder cannot create new card numbers (`useCollectionWrite(false)`). |
| `/wanted` | **Wanted** shopping board — extra copies to buy. **Caught** can create binder rows. Old `/collection?view=wanted` redirects here. |
| `/cards` | **Full catalog.** Name + filters, URL-synced. `owned=1` limits to owned. `wanted=1` limits to posters. Click a card to set qty (this **can** create new collection rows), bounty, labels, preferred art. Starter-deck add lives here too. |
| `/decks` | List decks, grouped by Leader. Create / rename / delete. |
| `/decks/[id]` | **View** by default (`DeckView`). **Edit** at `?mode=edit` (`BuilderView`). |
| `/profile` | Display name (Auth + Firestore), email, stats, logout. |
| `/s/[shareId]` | **Public shared deck.** Snapshot of one variation (name, Leader, card counts + preferred art). No login. Outside `AppShell`. |
| `/card-art/[file]` | **Image proxy** (not a page). Allowlisted `*.png` under Bandai `cardlist/card/` only. |

There is **no** `/api/*` folder. Card art uses App Router `GET /card-art/[file]` (Bandai card PNGs only).

---

## Provider tree

Root (`app/layout.tsx`): `Providers` (`AuthProvider` → `UserProfileProvider` + sibling `Toaster`) → `AuthGate`

Authenticated shell (`app/(app)/layout.tsx`): `CatalogProvider` → `CollectionProvider` → `WantedProvider` → `CardPrefsProvider` → `DecksProvider` → `AppShell`

| Context | Source |
|---|---|
| Catalog | Dynamic import of `data/cards.json` into memory |
| Collection | Firestore snapshot `users/{uid}/collection` |
| Wanted | Firestore snapshot `users/{uid}/wanted` |
| Card prefs | Firestore snapshot `users/{uid}/cardPrefs` |
| Decks | Firestore snapshot `users/{uid}/decks` plus each deck’s `variations` |
| User profile | `ensureUserDoc` for `users/{uid}`; gated like other providers so prior-account data is hidden until the current uid loads |

### AuthGate (as built)

- Wraps the whole app. **No** `middleware.ts`.
- **Public** (render even while Auth is still loading): `/`, `/login`, `/signup`, `/forgot-password`, `/s/…`. This avoids a mobile Safari hang where IndexedDB never resolves and the UI stuck on “Loading…”.
- **Protected** app routes wait for Auth. If Auth does not become ready within **8 seconds**, loading ends with `authTimedOut`; the gate shows Retry / Go to log in and does **not** auto-redirect to `/login` (so Retry works).
- Guests sent to login get `?next=` with the intended app path (safe allowlist in `lib/auth-routing.ts`). After sign-in, AuthGate prefers a safe `next` over the default post-login path.
- Post-login default (`getPostLoginPath`) races owned-count against a **5s** timeout and falls back to `/decks`.
- Auth init (`lib/firebase.ts`): `initializeAuth` with persistence **IndexedDB → localStorage → memory**. Duplicate init (HMR) falls back to `getAuth`.
- Auth landings redirect signed-in users via `getPostLoginPath` (or `?next=`). Share routes are public but **not** auth landings (signed-in users stay on `/s/…`).
- Unknown app paths may hit `app/not-found.tsx`; guests on non-public paths still go through AuthGate first.

---

## Firestore

Owner-only. Rules file: `firestore.rules`.

```
users/{uid}                          displayName, email, createdAt (field-allowlisted in rules)
  collection/{cardId}                quantity, labels[], updatedAt
  wanted/{cardId}                    quantity (extra copies to buy), updatedAt
  cardPrefs/{cardId}                 preferredImageUrl
  decks/{deckId}                     name, leaderId, favoriteVariationId, createdAt, updatedAt
    variations/{variationId}         name, cards { [cardId]: number }, updatedAt
shares/{shareId}                     public snapshot: ownerUid, deckId, variationId,
                                     deckName, leaderId, variationName, cards,
                                     preferredImages, createdAt, updatedAt
```

- Collection document **id** is the card number. Qty 0 **deletes** the doc.
- Wanted document **id** is the same card number. Qty is extra copies to buy, not a total target. Qty 0 **deletes** the doc.
- **Shares** are immutable snapshots (create + single-doc public **get**; **list denied** so there is no gallery). Create requires signed-in `ownerUid`, `keys().hasOnly(...)` (no extra fields), non-empty `cards` map of size ≤ 60, preferredImages map ≤ 61, and **createdAt/updatedAt timestamps**. Rules cannot iterate dynamic map *values*; the client cleans card qtys (`cleanCardsMap`) and preferred art (`isShareablePreferredUrl` — Bandai cardlist PNG path) on write and parse. Owner decks stay private.
- Collection, Wanted, card-preference, deck, and user-profile writes are shape-checked by the deployed `firestore.rules`. Variation writes check keys/name/map size/timestamp; positive int card values are enforced client-side.
- User labels live only on owned collection rows. Label updates use `setCollectionLabels` (transaction) and **do not rewrite quantity**. Cap is 50 labels (UI + rules). Card tiles also show derived `Deck: <name>` labels for current deck membership; these are not stored as user labels and update automatically when decks change.
- **Caught** writes binder and Wanted in one Firestore transaction. Collection `+` while a poster exists uses that same catch helper.
- Deck and variation operations that update multiple documents use batched writes so metadata and list changes commit together. `deleteVariation` refuses to delete the last variation (lib + UI).
- Wanted stepper deltas use transactions, and user-scoped providers (Collection, Wanted, Decks, CardPrefs, **UserProfile**) hide prior-account data until the current account snapshot arrives.
- Decrementing owned qty does **not** put the bounty back.
- Variation `cards` is a full count map of the 50 (or draft). Leader is **not** in that map.
- `favoriteVariationId` is the list the owner usually plays. New decks set it in the same write as `Main`. Older decks without the field fall back to a variation named `Main`, then to the most recently edited list. Tab order and first-opened tab use that same resolve. Deleting the favorite points it at another remaining variation.
- Catalog, construction rules, products, and `has:` flags are **files**, not Firestore.

---

## Pages and behavior (as built)

### Collection (`/collection`)

- **Binder** shows **only cards with qty > 0**.
- Modes: **Binder** (grid) and **Summary** (breakdown by category, color, cost, rarity). Wanted is a separate route (`/wanted`), not a Collection mode.
- Filters: text (name or id), colors, categories, costs, rarities, types, attributes, sets, has-flags, labels, **which decks the card appears in**.
- Sort includes **recently updated** (binder uses collection timestamps).
- Pagination: 60 per page.
- Binder qty stepper only adjusts existing rows. To log a **new** card, use `/cards` or **Caught** on Wanted.
- Card tiles have a WANTED stamp (bottom-right of the art). Tap posts bounty 1 or drops the poster. Owned `×qty` stays top-right.
- Card detail opens in a wide, two-column modal with which decks include that number, plus a **Bounty** stepper (extra copies to buy). Previous/Next controls sit outside the modal panel but remain in the modal keyboard focus loop, and the modal includes a focus-isolated, scroll-locking full-screen art lightbox.

### Wanted board (`/wanted`)

- Page header matches Collection (title + supporting line; no leftover Collection-mode accent bar).
- Flat shopping list of posted bounties. Count on the stamp (`×4`). Primary nav item (not a Collection tab).
- **Caught** adds the remaining want to the binder and deletes the poster. **Caught 1** does one copy. Both use `catchWantedCopies`. Wanted card details also use the shared navigation and full-screen art zoom; collection labels are editable only once the wanted card is already owned.
- Empty copy: “No posters.”
- Does not add cards to decks. If a card is already in a list, logging binder copies is enough for Owned/Unowned.
- Legacy URL `/collection?view=wanted` redirects to `/wanted` (`next.config.ts` + lightweight client fallback that avoids mounting the binder).
- Wanted uses the same filters as Collection; labels only exist if the card is already owned. Sort includes recently updated (wanted timestamps).

### Cards (`/cards`)

- Full English catalog (no Don).
- Filters sync to the URL (`lib/search/filters.ts`). Owned toggle: `owned=1`. Wanted toggle: `wanted=1`. Both can be on. Deck membership filter (`deck=`) is wired like Collection (options + `deckIdsByCardId`).
- Sort: newest / oldest / serial / name / category / cost. Newest = latest set family.
- Page size 48, load-more style.
- Modal: qty (can create), bounty, user labels, art picker, decks that use the card, outside Previous/Next controls through the currently loaded results, and click-to-zoom full-screen art. Card tiles show current user labels plus derived deck labels.
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
- Use the explicit **Add** button on a result to add a copy. Cap is construction copy limit (usually 4), **not** owned qty. Hard stop at **50** cards in the list. Minus on the list to remove.
- Result tiles are a dense 3-column grid on mobile, images capped at 120px wide (`h-auto w-full`) so they do not blow up versus View. Click an image or name to inspect a card; use the explicit Add button to add a copy. The detail modal supports outside Previous/Next controls through the current results and full-screen art zoom. Leader portrait and result tiles use preferred art.
- WANTED stamp on results does **not** add to the 50. **Post all unowned** raises Wanted to `in this variation − owned` for the active variation (does not stack on top of an existing bounty).
- Manifest lines show id, category, cost, and power, plus in-deck / owned. Status panel: Legal/Illegal, Owned/Unowned, reason bullets for the **active tab**.
- List summary (active tab): compact collapsed row (avg cost, avg power, Character/Event/Stage, keyword pills including Unblockable and Searcher) with a smooth expand; expanded shows cost/power avg·low·high with horizontal distributions, including zero-cost cards and zero-power Characters in the averages and zero buckets, composition bar, keywords, counters, multi-color Leader color counts, and set counts (Leader excluded). `searcher` is a derived ingest flag (look at top of deck + add to hand), not a Bandai bracket keyword.
- Variations: tabs ordered **favorite first**, then most recently edited. Opening the page selects the favorite. Star a tab (or **Set as main**) to pin it. Clone, rename, delete (cannot delete the last). Compare modal shows count diffs only.
- Change Leader: warning, then strip illegal cards from **every** variation of that deck.
- Writes go to Firestore through a queued `setVariationCards` so rapid clicks do not race. On write failure, optimistic local cards clear so the UI falls back to the Firestore snapshot.

### Deck view (`/decks/[id]` without `mode=edit`)

- Read-only look at the active variation. Opens on the favorite. Switch to Edit to brew. Card details support outside Previous/Next controls through the active variation and full-screen art zoom.
- Same tab order, star-to-pin, and list summary as Edit. Legal/Owned follow the tab you are looking at.
- Leader portrait uses preferred art. WANTED stamp and bounty stepper still work from this page.
- **Copy share link** creates a public `shares/{id}` snapshot of the **active** variation (deck name, Leader, variation name, card counts, preferred art URLs), copies `{origin}/s/{id}` to the clipboard for texting. Empty lists cannot be shared (client + rules). The link is a frozen snapshot — later edits do not change old links. If clipboard fails, the toast shows the URL for manual copy.

### Shared deck (`/s/[shareId]`)

- Public, no login. CatalogProvider only (no binder / Wanted / AppShell). Does **not** wait on AuthGate Auth loading.
- Shows Leader art (preferred URL if Leader is missing from catalog — only when the URL passes `isShareablePreferredUrl`), deck name, variation name, Character / Event / Stage grids with counts. Tap a card for effect text.
- Header CTA: guests see “Make your own” → `/signup`; signed-in users see “Open Decks” → `/decks`.
- Does not expose ownership, Wanted, or other variations. Unknown catalog ids are listed; if every id is unknown, copy says the catalog is behind the snapshot (not “empty list”).

### Profile

- Stats computed client-side: unique owned ids, total copies, deck count, variation count, Legal vs Illegal, Owned vs Unowned.

---

## Search (important: two systems)

**What the UI uses:** `lib/search/filters.ts` + `NameSearchBar` + `FilterPanel`.

- Text matches **name or card id** substring.
- Facets: color, category, cost, rarity, type, attribute, set, has, label, deck (Collection, Wanted, and Cards).
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
3. Every card is Character / Event / Stage (no Leaders or Don in the list)  
4. Every card’s colors ⊆ Leader colors  
5. Copies ≤ 4, unless a `copyLimit` rule says otherwise (`null` = unlimited)  
6. No card matching the Leader’s `forbid` rules  

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
| `data/has-flags.json` | Flags such as blocker, rush, banish, double-attack, unblockable, searcher (derived), counter, effect, trigger |
| `data/products/index.json` | ST01–ST36 picker |
| `data/products/STxx.json` | Real box counts (`cardId` → qty) |
| `scripts/ingest-catalog.ts` | From punk-records English JSON |
| `scripts/ingest-products.ts` | From One Piece Player HTML, with `scripts/product-urls.json` and `scripts/product-overrides/` |

Card shape: `types/catalog.ts` (`DeckPoolCard`). `cost` on a Leader is Life. Ingest normalizes punk-records’ null Event costs to printed `0`; other unavailable costs remain `null`. `images[]` is every known scan for that number; user picks one per account in `cardPrefs`. Grids, deck rows, builder portraits, and Leader pickers all use `imageCandidates` → `CardImage`. Load order is built in `lib/cardImageUrl.ts` (`displayImageCandidates`: preferred/other scans → optional mirror, then `/card-art/{file}.png`). `CardImage` uses a plain `<img>` (not `/_next/image`). The proxy (`lib/cardArtPath.ts` + `lib/cardArtFetch.ts` + `app/card-art/[file]/route.ts`) validates filenames, times out upstream fetches, coalesces concurrent loads, returns ETag/304, and sets long cache headers. One retry per URL, then the next candidate; then “No art” + **Retry**.

**Note:** Catalog JSON is still committed offline. `/card-art` only fetches **image bytes** on demand (cached). It is not catalog scrape-at-runtime. A full CDN mirror remains the most robust long-term option if Bandai blocks datacenter IPs.

When a new set releases: pull punk-records, run both ingest scripts, commit `data/`, then ship. Do not guess starter counts as “1 of each id.”

---

## Folder map

```
app/                    routes + layouts + globals.css + card-art/[file] proxy
app/(app)/wanted/       Wanted board page (authenticated)
components/             UI by area: auth, builder, cards, collection, decks, profile, search, share, ui, wanted
contexts/               Auth, UserProfile, Catalog, Collection, Wanted, CardPrefs, Decks
hooks/                  useCollectionWrite, useWantedWrite
lib/                    firebase, users, collection, wanted, shares, cardPrefs, cardArt*, cardImageUrl, variations, decks, legality, builder, search, tests
types/                  catalog, collection, wanted, deck, share, user, cardPref, construction, product
app/s/[shareId]/         public shared-deck page (+ CatalogProvider layout)
data/                   committed snapshots (~2785 cards; includes OP17)
scripts/                ingest + product URL/override JSON
firestore.rules
firebase.json
.firebaserc
.env.local.example
```

Key libraries:

| Module | Role |
|---|---|
| `lib/firebase.ts` | Init from env; Auth persistence IndexedDB → localStorage → memory |
| `lib/users.ts` | Signup doc, `ensureUserDoc`, display name, owned-count for routing |
| `lib/auth-routing.ts` | Post-login path, safe `?next=` allowlist, auth landing helpers |
| `lib/collection.ts` | Qty set/adjust, label-only updates, label merge, batch starter add |
| `lib/wanted.ts` | Bounty qty, catch transaction, raise gaps from a variation |
| `lib/cardArtPath.ts` | Safe Bandai filename parse + `/card-art/{file}` paths |
| `lib/cardArtFetch.ts` | Upstream Bandai fetch with timeout, size cap, ETag, in-flight coalesce |
| `lib/cardImageUrl.ts` | Preferred/candidates, optional mirror rewrite, browser proxy URLs |
| `lib/cardPrefs.ts` | Preferred art Firestore read/write; re-exports image URL helpers |
| `lib/compileHas.ts` | Ingest `has` flags from effect/trigger text (official tags + derived `searcher`) |
| `lib/variations.ts` | Favorite resolve + tab order (resolved favorite first, then recency) |
| `lib/variationStats.ts` | Average cost/power, category and keyword counts for a list |
| `lib/decks.ts` | Deck/variation CRUD, favorite pin, starter→deck, change Leader, delete cascade |
| `lib/shares.ts` | Public share snapshots: create, parse, SMS URL helpers, clipboard copy |
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
| Soft 50 (may exceed on click, then Illegal) | Builder **hard-stops** adds at 50. |
| Display font Fredoka | Cinzel |
| Builder search state may stay in the component | True. View vs Edit is `?mode=edit`. |
| Paste-a-list import, match history, LLM, scanner | Not built. See `DECKPOOL_FUTURE_FEATURES.md`. |
| Compact Legal/Owned on `/decks` is **any** variation | Compact Legal/Owned is the **favorite** variation. Profile still counts every variation. |
| Wishlist (future-features #5) | Built as **Wanted**: extra copies to buy, top-level `/wanted` route + nav, Cards `wanted=1`, catch into the binder. Not a Collection mode. |
| No public deck gallery / share network | **Share links** only: owner copies `/s/{id}` for one variation snapshot. Not a browseable gallery. |

Do not silently revert Collection to a full-catalog logger, or rip out the filter UI to restore `color:purple` in the box, without the user asking.

---

## Conventions for new work

- Client components for anything that uses Firebase or hooks. Keep legality/search as pure functions with tests.
- Firestore writes: owner tree only. New subcollections need a matching `firestore.rules` change **and a deploy**.
- Collection qty 0 = delete the document. Wanted qty 0 = delete the document. Label edits must not rewrite quantity (`setCollectionLabels`).
- One favorite variation per deck (`favoriteVariationId`). `/decks` Legal/Owned uses that list. View/Edit badges follow the open tab. Never delete the last variation (`deleteVariation` throws).
- Do not auto-add Wanted cards to decks. Caught only touches the binder.
- Do not add Google/Apple login, dark mode, Don cards, or a browseable public deck gallery in V1. Per-variation **share links** (`/s/{id}`) are allowed.
- Primary app nav is Collection, Wanted, Cards, Decks. Profile stays separate (sidebar bottom / mobile header), not in the mobile bottom bar. Desktop sidebar resizes main content; collapse via header button, expand via click on collapsed rail chrome. Mobile uses header + bottom nav only.
- New public routes must be allowlisted in `AuthGate` without treating them as auth landings (logged-in users must not be bounced off `/s/…`). Public routes must render while Auth is still loading. Preserve deep links with safe `?next=` on forced login. Do not auto-redirect to `/login` while `authTimedOut`.
- Prefer npm. Do not add Yarn.
- Mobile-first; Builder is allowed to feel denser. Do not block the whole app on Auth IndexedDB — keep the public-route bypass and Auth ready timeout.

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
