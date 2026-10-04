# DeckPool — Codebase snapshot

**Status:** Living summary of the **as-built** app  
**Last updated:** 2026-10-04
**Git:** `main` at `https://github.com/carnide1/deckpool.git`. This snapshot adds block numbers and Currently Playable. Prior noted commits: deck import/export `5d5e872`, deck-list sort `039cac0`. **Friends** is on `main` (merged). Its `firestore.rules` were deployed on 2026-10-02.
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

6. **Friends**: add another account by exact username, then browse their decks, collection, and Wanted read-only (each area can be hidden), and copy their decks into your own.

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
| Data | Cloud Firestore, nested under `users/{uid}/…`, plus top-level `usernames`, `profiles`, `friendRequests`, `friendships` for Friends. Client SDK writes. |
| Catalog | Static JSON in `data/`, loaded in the browser. ~**2785** English cards. Don cards stripped at ingest. |
| Images | Same-origin `/card-art/{file}.png` proxy for Bandai (avoids Chrome **CORP** and Vercel `/_next/image` **402**). Strict filename allowlist, upstream timeout, ETag/304, in-flight coalesce, long cache. Optional CDN mirror first via `NEXT_PUBLIC_CARD_IMAGE_ORIGIN`. Retries + **Retry** UI. |
| Hosting (intended) | Vercel Hobby. No `vercel.json` in the repo. `.vercel/` is gitignored. Redirects (e.g. `/collection?view=wanted` → `/wanted`, `/cards` → `/explore`) live in `next.config.ts`. |
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
| `npm run ingest-catalog -- --input <punk-records english folder>` | Rebuild `data/cards.json`, packs, construction rules, has-flags, timing-flags |
| `npm run ingest-products` | Rebuild `data/products/` (ST01–ST36) from One Piece Player pages |
| `npm run build-blocks` | Rebuild `data/blocks.json` from the observed printings plus Bandai’s override list. Run this after a catalog ingest that adds card numbers. |
| `firebase deploy --only firestore:rules` | Publish `firestore.rules` to project `deckpool-64459`. The tightened rules were deployed after the audit on 2026-08-27. The Friends rules were deployed on 2026-10-02 (they only add access, so the older app code keeps working). The `invites` rule was deployed on 2026-10-02. |

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

**Public (logged out):** `/`, `/login`, `/signup`, `/forgot-password`, **`/s/[shareId]`** (shared deck snapshot), and **`/invite/[code]`** (friend invite link). The list lives in `isPublicPath` (`lib/auth-routing.ts`).  
Logged-in users on the auth landing routes (`/`, `/login`, `/signup`, `/forgot-password`) are sent to a safe `?next=` path when present, otherwise `/decks`, or `/collection` if they own zero cards (`lib/auth-routing.ts`). Logged-in users **stay** on `/s/…` and `/invite/…` (AuthGate treats them as public but not as auth landings). `/invite` is also a safe `?next=` prefix, and the "Sign up" / "Log in" switch links on the auth forms keep a safe `?next=` (`AuthSwitchLink`).

**App (requires login), nav in `AppShell`:** Collection, Wanted, Explore, Decks, Friends, Profile. There is **no solid sidebar, header, or bottom bar** — just floating round icon buttons (no text). Labels show as tooltips on hover / keyboard focus; each link has an `aria-label`. Active page = filled pirate red. The Friends button shows a red badge with the number of pending incoming requests (`9+` cap; count is in the `aria-label`).

- **Desktop (`md+`):** Icons float in a column, vertically centered on the left edge (`fixed`). `main` keeps a left gutter (`md:pl-24`) so content never sits under them.
- **Mobile (`< md`):** Same six icons float in a centered row at the bottom (safe-area aware; gap tightens below 380px). `main` has bottom padding (6rem + safe area).
- The **document** scrolls (no fixed-height inner scroll box), so content runs under the phone browser toolbar with no background strip, and back/forward restores scroll. Collection/Wanted pagination scrolls the window. The nav wrappers are `pointer-events-none` (buttons re-enable) so taps beside the icons reach the page.
- No brand title in the shell and no sidebar preference in `localStorage` anymore.
- **Page widths:** Collection, Wanted, Explore, Decks, deck View/Edit, and Profile cap at `1800px`. Card grids go up to 6 columns at `xl` and 7 at `2xl` (no fixed tile width cap). `/decks` is a grid (1 → 2 at `md` → 3 at `xl`). Profile puts the stats poster left and Account in a 380px column at `lg+`.

| Route | Job |
|---|---|
| `/collection` | **Owned binder** by default. Modes: Binder, Summary (`?view=summary`). Binder cannot create new card numbers (`useCollectionWrite(false)`). |
| `/wanted` | **Wanted** shopping board — extra copies to buy. **Caught** can create binder rows. Old `/collection?view=wanted` redirects here. |
| `/explore` | **Full catalog.** Name/text search + filters, URL-synced. `owned=1` limits to owned. `wanted=1` limits to posters. `in=text` searches rules text. `timing=` is printed ability windows (AND). Click a card to set qty (this **can** create new collection rows), bounty, labels, preferred art. Starter-deck add lives here too. Old `/cards` redirects here. |
| `/decks` | Deck grid with a sort dropdown (default newest edits). Create / rename / delete. The last choice is saved in this browser. |
| `/decks/[id]` | **View** by default (`DeckView`). **Edit** at `?mode=edit` (`BuilderView`). |
| `/friends` | Your username (copy / change), add a friend by exact username, incoming + sent requests, friend list (remove), privacy toggles. Accounts without a username see only a "pick a username" form. |
| `/friends/[uid]` | A friend's **Decks** (default tab). Shared layout with header + Decks / Collection / Wanted tabs. Non-friends see "not available". |
| `/friends/[uid]/collection` | Friend's binder (read-only grid + filters); Summary at `?view=summary`. |
| `/friends/[uid]/wanted` | Friend's Wanted board, read-only, with bounty counts. |
| `/friends/[uid]/decks/[deckId]` | Friend's deck view (all variations, read-only) + **Copy to my decks**. |
| `/profile` | Display name (Auth + Firestore), email, stats, logout. |
| `/invite/[code]` | **Public friend invite.** Shows who invited you and one action (Send friend request / Accept / Sign up / Log in, or a status line). Outside `AppShell`; layout mounts `FriendsProvider` only. Not indexed. |
| `/s/[shareId]` | **Public shared deck.** Snapshot of one variation (name, Leader, card counts + preferred art). No login. Outside `AppShell`. |
| `/card-art/[file]` | **Image proxy** (not a page). Allowlisted `*.png` under Bandai `cardlist/card/` only. |

There is **no** `/api/*` folder. Card art uses App Router `GET /card-art/[file]` (Bandai card PNGs only).

---

## Provider tree

Root (`app/layout.tsx`): `Providers` (`AuthProvider` → `UserProfileProvider` + sibling `Toaster`) → `AuthGate`

Authenticated shell (`app/(app)/layout.tsx` → `AppDataProviders`): `CatalogProvider` → `CollectionProvider` → `WantedProvider` → `CardPrefsProvider` → `DecksProvider` → `FriendsProvider` → `AppShell`

Friend pages add `FriendDataProvider` (in `app/(app)/friends/[uid]/layout.tsx` via `FriendShell`). It does **not** nest a second set of Collection/Decks providers (that would shadow your own data); it uses the owner-scoped hooks instead.

| Context | Source |
|---|---|
| Catalog | Dynamic import of `data/cards.json` into memory; `compileTimings` fills `timings` if ingest has not persisted them |
| Collection | `useOwnerCollection(uid)` → snapshot `users/{uid}/collection` |
| Wanted | `useOwnerWanted(uid)` → snapshot `users/{uid}/wanted` |
| Card prefs | `useOwnerCardPrefs(uid)` → snapshot `users/{uid}/cardPrefs` |
| Decks | `useOwnerDecks(uid)` → snapshot `users/{uid}/decks` plus each deck’s `variations` |
| User profile | `ensureUserDoc` for `users/{uid}`, plus a live `profiles/{uid}` listener (username + privacy). Exposes `claimUsername` and `setPrivacy`. Display-name saves also sync to `profiles/{uid}`. Gated like other providers so prior-account data is hidden until the current uid loads |
| Friends | Idle until you have a username. Live `friendships` (array-contains you), incoming and outgoing `friendRequests`, and one `profiles/{friendUid}` listener per friend. Exposes send / cancel / accept / decline / remove |
| Friend data | One friend's profile (from Friends) + the owner hooks above for **their** uid, each enabled only when that area is shared. `access` is loading / unavailable / ready |

The four `useOwner*` hooks (`hooks/`) take `(ownerUid, { enabled })`, keep the "hide previous uid's data" gate, and report `failed` / `denied` (permission-denied). Your own providers are thin wrappers that pass your uid.

### AuthGate (as built)

- Wraps the whole app. **No** `middleware.ts`.
- **Public** (render even while Auth is still loading): `/`, `/login`, `/signup`, `/forgot-password`, `/s/…`, `/invite/…` (`isPublicPath`). This avoids a mobile Safari hang where IndexedDB never resolves and the UI stuck on “Loading…”.
- **Protected** app routes wait for Auth. If Auth does not become ready within **8 seconds**, loading ends with `authTimedOut`; the gate shows Retry / Go to log in and does **not** auto-redirect to `/login` (so Retry works).
- Guests sent to login get `?next=` with the intended app path (safe allowlist in `lib/auth-routing.ts`). After sign-in, AuthGate prefers a safe `next` over the default post-login path.
- Post-login default (`getPostLoginPath`) races owned-count against a **5s** timeout and falls back to `/decks`.
- Auth init (`lib/firebase.ts`): `initializeAuth` with persistence **IndexedDB → localStorage → memory**. Duplicate init (HMR) falls back to `getAuth`.
- Auth landings redirect signed-in users via `getPostLoginPath` (or `?next=`). Share routes are public but **not** auth landings (signed-in users stay on `/s/…`).
- Unknown app paths may hit `app/not-found.tsx`; guests on non-public paths still go through AuthGate first.

---

## Firestore

Owner-only for writes. Friends get **read** access to some subcollections (below). Rules file: `firestore.rules`.

```
users/{uid}                          displayName, email, createdAt (field-allowlisted in rules; owner-only, friends never read it)
  collection/{cardId}                quantity, labels[], updatedAt
  wanted/{cardId}                    quantity (extra copies to buy), updatedAt
  cardPrefs/{cardId}                 preferredImageUrl
  decks/{deckId}                     name, leaderId, favoriteVariationId, createdAt, updatedAt
    variations/{variationId}         name, cards { [cardId]: number }, updatedAt
shares/{shareId}                     public snapshot: ownerUid, deckId, variationId,
                                     deckName, leaderId, variationName, cards,
                                     preferredImages, createdAt, updatedAt
usernames/{name}                     uid  (doc id = lowercase username; unique claim)
profiles/{uid}                       username, displayName, privacy {decks, collection, wanted}, updatedAt
friendRequests/{fromUid_toUid}       fromUid, toUid, fromUsername, fromDisplayName, toUsername, createdAt
friendships/{uidA_uidB}              members [uidA, uidB] (sorted), createdAt
invites/{code}                       inviterUid, inviterUsername, inviterDisplayName, createdAt, expiresAt (7 days)
```

**Friends rules (summary):**

- `usernames`: any signed-in user can **get** one name (exact lookup); **list denied** (no directory). Create only for yourself with a valid name (3–20 chars, `[a-z0-9_.]`, starts with a letter/digit, not reserved); delete your own; no update. Changing a username deletes the old doc and creates the new one in one transaction, so the old name frees up immediately.
- `profiles/{uid}`: readable by the owner and friends. Owner writes exact keys; the `usernames` doc for the new name must point at the owner after the write. No delete.
- `friendRequests`: read/delete by sender or recipient. Create checks the id format, the recipient's `usernames` mapping, the sender's profile username, not already friends, and no reverse request. Names are copied onto the request because the recipient cannot read the sender's profile yet.
- `friendships`: read/delete by either member. Create needs sorted members, the id `m0_m1`, and an existing request from the other person to you. Accept = one batch (create friendship, delete their request, delete yours too if both sent).
- `invites`: public single-doc **get** (signed-out people see who invited them), **list denied**. Create only as yourself with your current profile username, `createdAt == request.time`, and `expiresAt` within 8 days (7 + clock slack). No update; inviter may delete. Invites grant nothing: the request itself goes through the normal `friendRequests` rules. Expiry is enforced on the landing page.
- Friend reads: `collection` / `wanted` / `decks` (+ `variations`) are readable by a friend only when `profiles/{owner}.privacy.<area> == true`. A missing profile means deny. `cardPrefs` is readable by any friend (so their art shows).

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
- Catalog, construction rules, products, `has:` flags, and timing windows are **files**, not Firestore.

---

## Pages and behavior (as built)

### Collection (`/collection`)

- **Binder** shows **only cards with qty > 0**.
- Modes: **Binder** (grid) and **Summary** (breakdown by category, color, cost, rarity). Wanted is a separate route (`/wanted`), not a Collection mode.
- Filters: text (name/id or rules text via Name/Text), colors, categories, costs, rarities, types, attributes, sets, has-flags, **timing** windows, labels, **which decks the card appears in**.
- Sort includes **recently updated** (binder uses collection timestamps).
- Pagination: 60 per page.
- Binder qty stepper only adjusts existing rows. To log a **new** card, use `/explore` or **Caught** on Wanted.
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

### Explore (`/explore`)

- Full English catalog (no Don). Nav label **Explore**. `components/cards/` is still card tiles/modals.
- Filters sync to the URL (`lib/search/filters.ts`) via `window.history.replaceState` (no router navigation), debounced 350ms. Sort / Owned / Wanted are read straight from the URL. URL changes from elsewhere (links, back/forward) re-seed the filters; the page's own writes never overwrite in-progress typing. Show-more resets whenever the result set changes. Owned toggle: `owned=1`. Wanted toggle: `wanted=1`. Both can be on. Deck membership filter (`deck=`). Description mode: `in=text`. Timing facet: `timing=on-play|on-ko` (AND). Old `/cards` redirects here and keeps the query string.
- Search bar Name | Text: Name matches name or card id; Text matches `effect` + `trigger` substring. Text folds the printed minus (`−`), en dash, and fullwidth hyphen to `-`, and ignores apostrophes, then does the substring check. Switching modes keeps the query. Clearing filters resets to Name.
- Sort: newest / oldest / serial / name / category / cost. Newest = latest set family.
- Page size 48, load-more style.
- Modal: qty (can create), bounty, user labels, art picker, decks that use the card, outside Previous/Next controls through the currently loaded results, and click-to-zoom full-screen art. Card tiles show current user labels plus derived deck labels.
- WANTED stamp on every tile. Owned `+` while a poster exists catches against that bounty.
- **Add starter deck** modal: increment ST01–ST36 contents; optional labels merged; optional “also create a deck.”

### Decks (`/decks`)

- Deck cards in a responsive grid (up to 3 per row). Multiple decks per Leader are allowed.
- **Sort** sits above the grid (deck count on the left, the same dropdown control as Collection on the right). It is hidden while decks are loading and when there are none. Options, in order:
  - **Last edited** (default): newest `updatedAt`. A deck with no `updatedAt` uses `createdAt`.
  - **Oldest edit:** that same timestamp, oldest first.
  - **Name** and **Name (Z–A).**
  - **Leader:** the Leader’s catalog name. A Leader missing from the catalog sorts by its card number.
  - **Color:** Leader colors in the same order as the filter chips (Red, Green, Blue, Purple, Black, Yellow). The color list is compared from the left, so Red comes before Red/Green, which comes before Green. A missing Leader sorts last.
  - **Newest created** and **Oldest created:** `createdAt` only. A later edit does not count as a later create.
- Equal rows break the tie by deck name, then deck id. Name (Z–A) still orders equal names by id A–Z.
- The choice is saved in this browser only (`localStorage` key `deckpool.deckSort`, read and written by `useDeckSort`). It is not a Firestore field and it is not stored per account. Your Decks page and a friend’s Decks tab share that one saved choice. A missing or unknown saved value falls back to last edited.
- Create: search **owned Leaders only**, name the deck, create variation `Main` empty, pin it as the favorite.
- Rename / delete with confirm. Delete also deletes variations.
- Legal / Owned badges on each row come from the **favorite** variation only (not “any variation”).
- Leader art on the row uses the account’s preferred print when one is saved.

### Builder (`/decks/[id]?mode=edit`)

- Layout: deck **above** search results. Aside on `lg+` (sticky): variations → list summary → Legal/Owned status. Status reasons do not sit on card art. On mobile the visual deck band is **sticky** while results scroll; compact Legal/Owned badges also appear in the deck header.
- Leader art lives in the **page header** (info opens detail), not in the main-deck strip.
- Visual main deck (`BuilderDeckBoard`): **stacked copies** (up to **4** faces; no qty badge — the fan is the count). Tap a stack to **remove one**. Info opens detail. Default sort **cost** via a compact select (also name / category / serial).
- Search defaults to **owned only** (toggle off to add unowned copies). Hard filters always: Leader colors (subset of Leader), Leader forbid rules, no Leaders/Don in the 50.
- Result tiles are art-first (no bordered meta chrome, no Add button). **Tap art to add** one copy (construction copy limit, owned-only, hard stop at **50**). Bottom-right stack (fixed slots): frosted **Own** / **Listed** chips, then WANTED. **Info** (bottom-left) opens detail (Prev/Next uses results or deck order by source). Preferred art on Leader and tiles.
- WANTED stamp on results does **not** add to the 50. **Post all unowned** raises Wanted to `in this variation − owned` for the active variation (does not stack on top of an existing bounty).
- Search toolbar: search with Name/Text mode; filters (including Timing) + Owned toggle on the next row; result count left / sort right on the third.
- List summary (active tab): oval pills grouped under **Averages**, **Composition**, and **Keywords** (keywords in a 2-col grid). Composition uses **Character** when the panel is wide enough, otherwise **Char**. Header chevron expands the full breakdown. `searcher` is a derived ingest flag (look at top of deck + add to hand), not a Bandai bracket keyword.
- Status: plain **Legal · Owned** text (not pill buttons); reason notes collapse behind **“N notes”** with max-height scroll so long Unowned lists do not push List Summary.
- View ↔ Edit keeps the open variation via `?variation=` on the mode toggle (does not jump back to the favorite).
- Variations: **custom dropdown** picks the active list (matching panel borders; chevron rotates open/closed); star button pins favorite. Clone, rename, delete (cannot delete the last). Compare shows count diffs. Clone/Rename disable overlay-click dismiss and focus the name field (not the X).
- Change Leader: warning, then strip illegal cards from **every** variation of that deck. The button is disabled while a list save is in flight.
- Each tap issues `setVariationCards` immediately (Firestore keeps one client's writes in order and shows them in snapshots right away, including offline). The builder tracks pending writes **per variation**: while any are in flight, the next edit builds on the last list sent (so rapid taps never drop cards, even across tab switches); once none are pending it builds on the live Firestore snapshot, so Change Leader strips and other devices' edits are not overwritten. A failed write shows a toast and the view falls back to the snapshot.
- There is **no** text Manifest in Edit anymore (`BuilderManifest` removed).

### Deck view (`/decks/[id]` without `mode=edit`)

- Read-only look at the active variation. Opens on the favorite unless `?variation=` is set (View ↔ Edit preserves the open list). Switch to Edit to brew. Card details support outside Previous/Next controls through the active variation and full-screen art zoom.
- Same variation dropdown (favorite ★), star-to-pin, and list summary as Edit. Legal/Owned follow the list you are looking at. Reason notes collapse behind “N notes”.
- Leader portrait uses preferred art. WANTED stamp and bounty stepper still work from this page.
- **Copy share link** creates a public `shares/{id}` snapshot of the **active** variation (deck name, Leader, variation name, card counts, preferred art URLs), copies `{origin}/s/{id}` to the clipboard for texting. Empty lists cannot be shared (client + rules). The link is a frozen snapshot — later edits do not change old links. If clipboard fails, the toast shows the URL for manual copy.
- **Import List** pastes text into a **new** variation on this deck (name required, max 80). The Leader in the paste must be this deck’s Leader; a different Leader, no Leader, no cards, or more than 60 different cards does not save. Lines need a printed card number (`1xOP01-016`, `4 Nami (OP01-016)`, promo `P-029`, and the same shapes). The count is the one on that card’s line (`4x`, a trailing `x4`, or the first number, as in `4 Nami`). A later `DON!! x1` on the same line is not the count. Don lines, names with no number, unknown numbers, and numbers with no count are shown and left out. A short or illegal list still saves; Legal / Owned update after. The binder does not change. After save, the view switches to the new variation (`?variation=`).
- **Copy to Clipboard** copies the open variation as OPTCGSim text (Leader first, then `4xOP01-016` lines, ids A–Z). Empty lists are refused. An illegal list still exports. Clipboard failure asks the user to allow clipboard access. Friend deck pages do not get these buttons.

### Shared deck (`/s/[shareId]`)

- Public, no login. CatalogProvider only (no binder / Wanted / AppShell). Does **not** wait on AuthGate Auth loading.
- Shows Leader art (preferred URL if Leader is missing from catalog — only when the URL passes `isShareablePreferredUrl`), deck name, variation name, Character / Event / Stage grids with counts. Tap a card for effect text.
- Header CTA: guests see “Make your own” → `/signup`; signed-in users see “Open Decks” → `/decks`.
- Does not expose ownership, Wanted, or other variations. Unknown catalog ids are listed; if every id is unknown, copy says the catalog is behind the snapshot (not “empty list”).

### Profile

- Stats computed client-side: unique owned ids, total copies, deck count, variation count, Legal vs Illegal, Owned vs Unowned.
- Username and privacy are **not** on Profile; they live on Friends.

### Friends (`/friends`)

- **Usernames:** 3–20 chars, lowercase `a-z 0-9 _ .`, starting with a letter or digit, not reserved (`lib/usernames.ts`). Picked at **signup** (field on the signup form). If the name is taken at signup, the account is still created and a toast says to pick one on Friends. Accounts without a username see only a claim form on `/friends`. Usernames can be changed (Change modal); the old name frees up right away.
- **Add friend:** exact username only (no search, no directory). Send is disabled until your friend lists load. Messages: "That's you.", "Already friends.", "Request already sent."; if they already asked you, an inline **Accept** appears. Unknown or invalid names get one generic message; a failed send says so separately.
- **Requests:** Incoming (Accept / Decline) and Sent (Cancel). If both people send, accepting removes both requests. No blocking, messaging, or friend cap.
- **Friend list:** sorted by display name, links to `/friends/{uid}`, remove with confirm (copied decks stay yours).
- **Invite link:** button on the username card. Each tap writes a new `invites/{random id}` (7 days, reusable, no list or cancel UI) and opens the share sheet (`navigator.share`); without one it copies the link (toast shows the URL if the clipboard fails).
- **Invite page (`/invite/[code]`):** writes nothing on open (link previews are harmless). Unknown, expired, or stale (inviter changed username — checked against `usernames/{name}`) → "expired, ask for a new one". Signed out → Sign up / Log in carrying `?next=` back. No username → claim form first. Then: own link, already friends (link to their page), request sent, **Accept** (they already asked you), or **Send friend request** (request from you to the inviter, who accepts as usual).
- **Privacy:** three switches (Decks, Collection, Wanted), all on by default, stored in `profiles/{uid}.privacy`. Collection labels are visible to friends when Collection is shared. Preferred art (`cardPrefs`) is always visible to friends.

### Friend pages (`/friends/[uid]/…`)

- One layout (`FriendShell`) with back link, name + `@username`, and Decks / Collection / Wanted tabs. A hidden area keeps its tab (eye-off icon) and shows "Hidden by {name}" (also used when rules refuse). Non-friends and unknown uids see "not available".
- Listeners only start for shared areas; rules enforce the same thing.
- **Decks:** same grid, sort options, and saved choice as `/decks` (one `deckpool.deckSort` value for both). **Legal badge only** (no Owned), no rename/delete, friend's Leader art. The dropdown is hidden when they have no decks.
- **Deck view:** `DeckViewBody` with all variations, a static favorite star (not clickable), Legal only, no Wanted stamps, no Edit/Share. Reason notes are legality only. Ownership lines are omitted. Card details are read-only (no art picker, no owned line).
- **Copy to my decks** (`CopyDeckModal`): editable name; default **This variation** (saved as one `Main` variation), or **All variations** (names kept, their favorite first and pinned). Works even if you don't own the Leader. Opens your new deck after copying (`createDeckWithVariations`).
- **Collection:** binder grid with copies, labels (their labels + their deck labels when decks are shared), the same filters/sort/pager as `/collection`, and a Summary toggle. Card details show copies and labels read-only; "In decks" links go to the friend's deck pages.
- **Wanted:** read-only board with `×N` bounty stamps (not clickable) and the same filters/sort/pager. Shows their owned count on tiles if their collection is shared.

### Shared building blocks

- `hooks/useCardListBrowser.ts` + `components/cards/CardBrowserFrame.tsx`: filter / sort / 60-per-page state and the grid + sticky filter sidebar layout. Used by Collection, Wanted, and both friend boards. Card sort labels stay on `SortSelect`; deck lists pass their own labels.
- `hooks/useDeckSort.ts`: the deck-list sort saved in `localStorage`. Used by `/decks` and a friend's Decks tab.
- `DeckView` is a thin wrapper (your data, share link, Edit toggle, favorite pin, Wanted) around `components/builder/DeckViewBody.tsx`, which friend decks reuse.
- Shared components take optional props that default to today's behavior: `DeckRow` (`href`, optional rename/delete, `preferredImages`, `showOwned`), `DeckStatusBadges` (`owned` optional), `VariationTabs` (static star without `onSetFavorite`), `CardDetailModal` (`allowArtPicker`, `deckHref`, `ownedLabel`, read-only wanted/labels), `CardGrid` (read-only Wanted stamp), `CollectionModeToggle` (`baseHref`).

---

## Search (important: two systems)

**What the UI uses:** `lib/search/filters.ts` + `NameSearchBar` + `FilterPanel`.

- Text has two modes on Collection, Wanted, Explore, and Builder. **Name** matches name or card id substring. **Description** (`in=text` on Explore) matches effect or trigger text only (not name/id). Text folds the printed minus (`−`), en dash, and fullwidth hyphen to `-`, and ignores apostrophes, then does the substring check. Switching modes keeps the typed query. Clearing filters resets to Name.
- Facets: color, category, cost, rarity, type, attribute, set, **block** (`1`–`5` or `X`), has (keywords), **timing**, label, deck (Collection, Wanted, and Explore). Timing values are compiled printed windows (`on-play`, `activate-main`, …) and **AND** when several are selected. Several selected blocks match any of them. Keywords stay on `card.has` (blocker, rush, searcher, …).
- **Currently Playable** is a switch at the end of every filter panel (Collection, Wanted, Explore, the builder, and friend boards). It starts off. On, a card must be Block 2 or higher, or X, and it must not be banned. A banned-pair card still shows, because that rule needs both cards. Explore stores it as `standard=1` and blocks as `block=1|X`.
- Explore URL stores those filters plus `owned=1`, `wanted=1`, optional `in=text`, and `timing=`. Builder / Collection / Wanted keep filters in component state.

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
7. The Leader and every main-deck card are legal in **Standard**: Bandai’s current block is 2 or higher, or X. A missing block fails this check.
8. The Leader and every main-deck card are absent from the banned list in `data/standard.json`.
9. The deck does not contain both cards from a banned pair. The Leader counts as in the deck.
10. A restricted card is at or under its cap. The live list has none. The check is still there.

Change Leader still strips only color and Leader-forbid cards. A rotated or banned card stays in the list, and the variation shows Illegal. The builder still lets you add those cards.

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
| `data/timing-flags.json` | Printed ability windows found at ingest (on-play, activate-main, on-ko, …) |
| `data/blocks.json` | Bandai’s current block for every catalog id (`1`–`5` or `X`). Joined onto each card when the catalog loads. |
| `data/block-observed.json` | Printings seen for each id. Input to `npm run build-blocks`. |
| `data/block-overrides.json` | Bandai’s published X and Block 4 updates, plus `P-110`. These win over the observed printings. |
| `data/standard.json` | Standard floor (`minBlock` 2), banned ids, restricted caps, and banned pairs. `OP14-020` joins the ban list on 12 Oct 2026. |
| `data/products/index.json` | ST01–ST36 picker |
| `data/products/STxx.json` | Real box counts (`cardId` → qty) |
| `scripts/ingest-catalog.ts` | From punk-records English JSON |
| `scripts/ingest-products.ts` | From One Piece Player HTML, with `scripts/product-urls.json` and `scripts/product-overrides/` |

Card shape: `types/catalog.ts` (`DeckPoolCard`). `cost` on a Leader is Life. `block` is Bandai’s current number (`1`–`5` or `X`), or `null` when an id has not been classified. It is not stored in `cards.json`. `CatalogProvider` sets it from `data/blocks.json` as the catalog loads. Ingest normalizes punk-records’ null Event costs to printed `0`; other unavailable costs remain `null`. `images[]` is every known scan for that number; user picks one per account in `cardPrefs`. Grids, deck rows, builder portraits, and Leader pickers all use `imageCandidates` → `CardImage`. Load order is built in `lib/cardImageUrl.ts` (`displayImageCandidates`: preferred/other scans → optional mirror, then `/card-art/{file}.png`). `CardImage` uses a plain `<img>` (not `/_next/image`). The proxy (`lib/cardArtPath.ts` + `lib/cardArtFetch.ts` + `app/card-art/[file]/route.ts`) validates filenames, times out upstream fetches, coalesces concurrent loads, returns ETag/304, and sets long cache headers. One retry per URL, then the next candidate; then “No art” + **Retry**.

**Note:** Catalog JSON is still committed offline. `/card-art` only fetches **image bytes** on demand (cached). It is not catalog scrape-at-runtime. A full CDN mirror remains the most robust long-term option if Bandai blocks datacenter IPs.

When a new set releases: pull punk-records, run both ingest scripts, run `npm run build-blocks` (it stops if a new id has no block), commit `data/`, then ship. Do not guess starter counts as “1 of each id.” On 1 Apr 2027, raise `minBlock` in `data/standard.json` from 2 to 3. When Bandai changes the ban list, edit that same file. `OP14-020` Dracule Mihawk is banned starting 12 Oct 2026 and is not in the file before that date.

---

## Folder map

```
app/                    routes + layouts + globals.css + card-art/[file] proxy
app/(app)/explore/      Full-catalog Explore page (authenticated)
app/(app)/wanted/       Wanted board page (authenticated)
app/(app)/friends/      Friends page + [uid] layout and friend Decks / Collection / Wanted / deck pages
components/             UI by area: auth, builder (DeckBoard/CardStack/CardResults/DeckViewBody), cards, collection, decks, friends, profile, search, share, ui, wanted
contexts/               Auth, UserProfile, Catalog, Collection, Wanted, CardPrefs, Decks, Friends, FriendData
hooks/                  useCollectionWrite, useWantedWrite, useOwner{Collection,Wanted,CardPrefs,Decks}, useCardListBrowser, useDeckSort
lib/                    firebase, users, profiles, friends, friendIds, usernames, collection, wanted, shares, cardPrefs, cardArt*, cardImageUrl, variations, decks, deckList, sortDecks, legality, builder, search, tests
types/                  catalog, collection, wanted, deck, share, user, friends, cardPref, construction, product
app/s/[shareId]/         public shared-deck page (+ CatalogProvider layout)
app/invite/[code]/       public friend-invite page (+ FriendsProvider layout)
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
| `lib/users.ts` | Signup doc + `ensureUserDoc` (both create-if-missing in a transaction, since they race on a new account), display name, owned-count for routing |
| `lib/auth-routing.ts` | Post-login path, safe `?next=` allowlist, auth landing helpers |
| `lib/collection.ts` | Qty set/adjust, label-only updates, label merge, batch starter add |
| `lib/wanted.ts` | Bounty qty, catch transaction, raise gaps from a variation |
| `lib/cardArtPath.ts` | Safe Bandai filename parse + `/card-art/{file}` paths |
| `lib/cardArtFetch.ts` | Upstream Bandai fetch with timeout, size cap, ETag, in-flight coalesce |
| `lib/cardImageUrl.ts` | Preferred/candidates, optional mirror rewrite, browser proxy URLs |
| `lib/cardPrefs.ts` | Preferred art Firestore read/write; re-exports image URL helpers |
| `lib/compileHas.ts` | Ingest `has` flags from effect/trigger text (official tags + derived `searcher`) |
| `lib/compileTimings.ts` | Ingest/hydrate printed timing windows (On Play, Activate: Main, On K.O., …) |
| `lib/blocks.ts` | Block ids, the booster formula, and the joined `data/blocks.json` map |
| `lib/standard.ts` | Standard floor, bans, restricted caps, and banned pairs |
| `lib/variations.ts` | Favorite resolve + tab order (resolved favorite first, then recency) |
| `lib/variationStats.ts` | Average cost/power, category and keyword counts for a list |
| `lib/builderDeckStacks.ts` | Edit visual deck: stack sort + visible-face cap (4) |
| `lib/decks.ts` | Deck/variation CRUD, favorite pin, starter→deck, change Leader, delete cascade. `createDeckWithVariations` (one batch, first variation = favorite) backs create, starter→deck, and friend copy. `createVariation` adds one list to an existing deck (clone and import) |
| `lib/deckList.ts` | Paste parser and OPTCGSim export text for deck View import/export |
| `lib/sortDecks.ts` | Deck-list sort (edited, name, Leader, color, created) plus the saved `localStorage` key. Used by `/decks` and a friend's Decks tab |
| `lib/usernames.ts` | Username format, reserved list, normalize + validate |
| `lib/profiles.ts` | `profiles/{uid}` + `usernames/{name}`: claim/change username (transaction), privacy, display-name sync |
| `lib/friends.ts` | Username lookup, request send/cancel/decline/accept (batch), remove friend, queries + parsers |
| `lib/friendIds.ts` | Sorted friendship id, request id, relationship helper |
| `lib/invites.ts` | Invite links: create, read, expiry, stale-username check, URL + share text |
| `lib/firestoreErrors.ts` | `isPermissionDenied` |
| `lib/shares.ts` | Public share snapshots: create, parse, `absoluteAppUrl` (also used by invites), clipboard copy |
| `lib/labels.ts` | Union-merge labels |
| `lib/variationDiff.ts` | Compare two count maps |
| `lib/profileStats.ts` | Profile numbers |
| `lib/pagination.ts` | Page math for Collection / Wanted (via `useCardListBrowser`) |
| `lib/deckMembership.ts` | Which decks contain a card |
| `lib/collectionBreakdown.ts` | Summary view |

Tests sit next to the modules they cover (`*.test.ts`).

---

## As-built vs original V1 blueprint (do not “fix” these unless asked)

The blueprint is still the product source of truth for **rules** (color identity, 50 cards, variations). The UI drifted in a few places:

| Blueprint said | Code today |
|---|---|
| Collection searches the **full** catalog to log new cards | Collection is **owned-only**. New cards are logged on `/explore`. |
| Limitless `q=` language in the search box | Filter panel + Name/Text search. Query parser exists but is unused in pages. |
| `/cards` catalog page | **Explore** at `/explore`. `/cards` redirects and stays a safe `?next=` prefix. |
| Soft 50 (may exceed on click, then Illegal) | Builder **hard-stops** adds at 50. |
| Builder manifest as text lines + Add on results | Edit uses a **visual stacked deck** (tap remove) and art-first results (tap add + info). |
| Display font Fredoka | Cinzel |
| Builder search state may stay in the component | True. View vs Edit is `?mode=edit`. |
| Paste-a-list import, match history, LLM, scanner | **Deck View** import (new variation on the open deck) and OPTCGSim export are built. Binder import, match history, LLM, and scanner are not. See `DECKPOOL_FUTURE_FEATURES.md`. |
| Compact Legal/Owned on `/decks` is **any** variation | Compact Legal/Owned is the **favorite** variation. Profile still counts every variation. |
| Wishlist (future-features #5) | Built as **Wanted**: extra copies to buy, top-level `/wanted` route + nav, Explore `wanted=1`, catch into the binder. Not a Collection mode. |
| No public deck gallery / share network | **Share links** only: owner copies `/s/{id}` for one variation snapshot. Not a browseable gallery. **Friends** can browse each other's decks / collection / Wanted (exact-username add or a 7-day invite link, per-area privacy). Still no public directory. |

Do not silently revert Collection to a full-catalog logger, or rip out the filter UI to restore `color:purple` in the box, without the user asking.

---

## Conventions for new work

- Client components for anything that uses Firebase or hooks. Keep legality/search as pure functions with tests.
- Firestore writes: owner tree only (plus the Friends top-level collections, each rule-checked). New subcollections need a matching `firestore.rules` change **and a deploy**. Friends never read `users/{uid}` (email stays private); public bits go in `profiles/{uid}`.
- Data for "someone's" collection/decks/Wanted/art goes through the `useOwner*` hooks; do not nest a second set of providers.
- Collection qty 0 = delete the document. Wanted qty 0 = delete the document. Label edits must not rewrite quantity (`setCollectionLabels`).
- One favorite variation per deck (`favoriteVariationId`). `/decks` Legal/Owned uses that list. View/Edit badges follow the open tab. Never delete the last variation (`deleteVariation` throws).
- Do not auto-add Wanted cards to decks. Caught only touches the binder.
- Do not add Google/Apple login, dark mode, Don cards, or a browseable public deck gallery in V1. Per-variation **share links** (`/s/{id}`) are allowed.
- Primary app nav is Collection, Wanted, Explore, Decks, Friends, plus Profile, as floating icon-only buttons with tooltips (left column on desktop, bottom row on mobile). Keep the page gutters (`md:pl-24`, mobile `pb-24`) so floating icons do not cover content.
- New public routes must be added to `isPublicPath` (`lib/auth-routing.ts`, used by `AuthGate`) without treating them as auth landings (logged-in users must not be bounced off `/s/…`). Public routes must render while Auth is still loading. Preserve deep links with safe `?next=` on forced login. Do not auto-redirect to `/login` while `authTimedOut`.
- Prefer npm. Do not add Yarn.
- Mobile-first; Builder Edit is art-first (tap results to add, tap deck stacks to remove, info for detail). Do not block the whole app on Auth IndexedDB — keep the public-route bypass and Auth ready timeout.

---

## Related docs

| File | Use it for |
|---|---|
| **This file** | How the repo works today; update on every meaningful push |
| `DECKPOOL_V1_BLUEPRINT.md` | Locked V1 product rules |
| `DECKPOOL_V1_IMPLEMENTATION_GUIDE.md` | Human setup (Firebase console, Vercel clicks) |
| `DECKPOOL_FUTURE_FEATURES.md` | Post-V1 ideas and decisions (wishlist, import, sim, and so on) |
| `DECKPOOL_FRIENDS.md` | Friends decisions, data model, implementation plan, manual two-account test checklist |

---

*If you changed the app and did not update this file, the next chat will be wrong. Update it in the same commit.*
