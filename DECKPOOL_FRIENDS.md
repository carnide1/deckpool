# DeckPool — Friends

**Status:** Implemented on the local `friends` branch (Phases 1–12). Rules deployed 2026-10-02; next step is the Phase 11 manual two-account checklist.  
**Last updated:** 2026-10-02  
**Product:** Add friends by exact username and view each other's decks, binder, and Wanted board, read-only.

This file records the friends decisions and the build plan. For how the app works today, trust `DECKPOOL_CODEBASE.md`.

---

## Goals

1. Let accounts connect with people they already know, without turning DeckPool into a public site.
2. Let friends browse each other's decks, binder, and Wanted board, read-only.
3. Let you copy a friend's deck into your own decks to brew from it.

## Non-goals (decided)

- **No user directory or partial-match search.** You need someone's exact username.
- **No messaging or chat.** People coordinate on Discord, by text, or in person.
- **No trade matching** ("friend owns a card on your Wanted"). Not wanted.
- **No editing a friend's data.** Ever.
- **No blocking in the first version.** Decline and remove are enough. Revisit if spam shows up.
- **No public profiles.** Friend pages need login and an accepted friendship.

---

## Locked decisions

| Topic | Decision |
|---|---|
| Discovery | Exact unique username only (Discord model). |
| Username timing | New accounts pick a username at signup. Existing accounts are asked the first time they open Friends. |
| Username changes | Allowed. The old name frees up immediately. |
| Requests | Send by username → recipient accepts or declines. Sender can cancel. Either friend can remove. |
| What friends see | Decks, binder (collection), and Wanted, each behind its own privacy toggle. **All on by default.** |
| Friend's deck view | All variations + **Legal** status. Their **Owned** status is hidden. |
| Copy deck | Yes. "Copy to my decks" creates your own editable deck. |
| Trade matching | No. |
| Messaging | No. |
| Blocking | Not in the first version. |
| Where it lives | Its own **Friends** section at `/friends`: a primary nav button after Decks, in both the desktop and mobile floating nav. Profile is already in both, so the mobile row becomes six buttons. |
| Settings home | Your username and the privacy switches live on the Friends page, not Profile. |
| Alerts | Badge on the Friends nav item for pending incoming requests. No toasts. |
| Friend cap | None for now. |
| Card art on friend pages | The **friend's** preferred art (their `cardPrefs` are readable by friends). |
| Friend page default tab | Decks. |
| Friend collection | Binder grid **and** Summary, same Binder / Summary toggle as your Collection. |
| Taken username at signup | Account is still created; a toast says to pick a username on Friends. |
| Copy default | "This variation" is selected; "All variations" is the other choice. |
| Username on Profile | No. It lives only on Friends. |
| Rules testing | Manual two-account checklist (no emulator). |

---

## Usernames

- Lowercase letters, digits, `_` and `.`; 3–20 characters; must start with a letter or digit. Stored lowercase; lookup is case-insensitive.
- Unique across all accounts. A small reserved list (e.g. `admin`, `deckpool`, `support`) cannot be claimed.
- Shown as `@username` next to the display name. Display name stays non-unique and free-form.
- The Friends page shows **Your username** with a copy button and a **Change** action.
- Changing a username does not break friendships (friendships key on account id, not username).

## Friend requests

- **Add friend** field on the Friends page: type an exact username → Send. Unknown names return a generic "No account with that username."
- Cannot send to yourself, to an existing friend, or twice to the same person.
- If they already sent you a request, the UI offers **Accept** instead of sending a second one.
- Lists: **Friends**, **Incoming requests** (Accept / Decline), **Sent requests** (Cancel).
- **Remove friend** with a confirm. Removing does not delete decks you already copied from them.

## Privacy toggles

On the Friends page:

- Show my decks to friends — on
- Show my collection to friends — on
- Show my Wanted to friends — on

A hidden area shows "Hidden by {name}" on their page. Toggles apply immediately to all friends (no per-friend settings, no per-deck hiding in the first version).

**Note:** collection labels live on the collection rows, so friends who can see your collection also see your labels.

## Viewing a friend

- Friend page: display name, `@username`, and tabs for **Decks**, **Collection**, **Wanted**. Opens on **Decks**. A tab for an area they hide still shows, with "Hidden by {name}".
- **Decks:** their deck list, newest edits first, like `/decks`. Badges show **Legal** only.
- **Deck view:** read-only, same layout as Deck View — variation dropdown with their favorite starred (not clickable), list summary, Legal badge. No Edit, no share-link button, no WANTED stamp actions on their cards.
- **Collection:** read-only binder grid with quantities, same filters as Collection, plus the **Summary** view. No steppers.
- **Wanted:** read-only poster board with bounty counts. No Caught.
- Card details open read-only (effect text, art, their quantity where relevant). Your own binder and Wanted are unaffected by browsing.
- Art: friend pages use the **friend's** preferred art, so their decks look the way they set them up. Catalog defaults fill in where they have no pick.

## Copy a friend's deck

- **Copy to my decks** on a friend's deck view copies the **active variation** into a new deck you own: their deck name (editable), same Leader, one variation named `Main` with the same card counts, pinned as favorite.
- The other choice, **All variations**, copies every variation with its name; their favorite comes first and becomes your favorite.
- The copy is yours and independent; later edits on either side do not sync.
- The copy's Legal/Owned is computed against **your** binder like any deck. Copying works even if you do not own the Leader (deck shows Unowned), which differs from the normal Create Deck picker that only offers owned Leaders.

---

## Data model (planned)

The current Firestore model is owner-only, and `users/{uid}` holds the email, so friends must not read that doc.

```
users/{uid}                          (unchanged; still owner-only, holds email)
profiles/{uid}                       username, displayName, privacy { decks, collection, wanted }, updatedAt
usernames/{username}                 uid                       (uniqueness reservation)
friendRequests/{fromUid_toUid}       fromUid, toUid, fromUsername, fromDisplayName, toUsername, createdAt
friendships/{lowUid_highUid}         members [lowUid, highUid], createdAt
```

- **Claim / change username:** one transaction creates `usernames/{new}`, deletes `usernames/{old}` (if any), and updates `profiles/{uid}.username`. Rules ensure a username doc can only point at the writer's own uid and can only be deleted by its owner.
- **Lookup:** signed-in users may `get` a single `usernames/{name}` doc; `list` is denied (no directory).
- **Profiles:** readable by the owner and by friends (the add-friend flow reads only `usernames/{name}` and shows the typed name until accepted).
- **Requests:** sender creates; sender or recipient deletes; each side can list requests where they are `fromUid` or `toUid`. Names are copied onto the request because the recipient cannot read the sender's profile until they are friends.
- **Accept:** recipient creates `friendships/{pair}` only if the matching request exists, then deletes the request (batched).
- **Remove:** either member deletes the friendship doc.
- **Reading a friend's data:** rules on `users/{uid}/decks`, `variations`, `collection`, `wanted` add a read path for signed-in friends: the friendship doc exists **and** `profiles/{uid}.privacy.<area> == true`. `cardPrefs` is readable by any friend (no toggle). Writes stay owner-only.
- **Copy deck:** client reads the friend's variation, then writes a new deck in the copier's own tree using the existing deck-create helpers.
- New collections + rule changes require a `firestore.rules` deploy. No Admin SDK, no Cloud Functions, no `/api` routes.

## Routes (planned)

| Route | Job |
|---|---|
| `/friends` | Friends home: your username, add friend, incoming/sent requests, friends list, privacy toggles |
| `/friends/[uid]` | Friend's **Decks** tab (default) |
| `/friends/[uid]/collection` | Friend's binder (`?view=summary` for Summary), read-only |
| `/friends/[uid]/wanted` | Friend's Wanted board, read-only |
| `/friends/[uid]/decks/[deckId]` | Read-only friend deck view (`?variation=` supported) + Copy to my decks |

All friend routes are authenticated and friends-only. They share one layout so the friend's data loads once. Friend pages use account ids, not usernames, so links survive username changes. Non-friends see a "not available" page.

---

## App conventions this changes (when built)

- Floating nav gains **Friends** after Decks: desktop column and mobile row both become Collection, Wanted, Explore, Decks, Friends, Profile (six buttons). `DECKPOOL_CODEBASE.md` still describes an older sidebar and a four-item bottom bar; fix that when this ships.
- `/friends` must be added to the safe `?next=` allowlist in `lib/auth-routing.ts` so deep links survive login.

## Open questions

_(none right now)_

---

## Implementation plan

Step-by-step build order. Each step says **what** to add or change, **why**, **how**, and **what existing code it reuses**. Phases run in order. All phases are built; small deviations: the card-browser hook returns `{ browser, gridTopRef }` (lint forbids reading refs off a state object), `DeckViewBody` derives the active variation during render instead of syncing it in an effect, and `CardDetailModal` also gained `showReadOnlyWanted` / `showReadOnlyLabels` (and `ownedLabel={null}` hides the owned line) for friend views.

### Codebase review findings (2026-10-02)

What already helps:

- `users/{uid}` (displayName, email, createdAt) is written by `createUserDocOnSignup` / `ensureUserDoc` in `lib/users.ts` and loaded by `UserProfileContext`.
- `DecksProvider`, `CollectionProvider`, `WantedProvider`, `CardPrefsProvider` share one pattern: live listeners on `users/{auth uid}/…`, plus a `loadedUid` gate that hides a previous account's data.
- Path and parse helpers already take any uid: `userDecksRef`, `deckVariationsRef`, `parseDeck`, `parseVariation`, `userCollectionRef`, `parseCollectionItem`, `userWantedRef`, `parseWantedItem`, `userCardPrefsRef`.
- Pure logic does not care whose data it gets: `validateVariation`, `summarizeDeck`, `indexDeckMembership`, `computeVariationStats`, `computeCollectionBreakdown`, `applySearchFilters`, `sortCards`, `resolveFavoriteVariationId`, `cleanCardsMap`.
- `CardGrid` is already read-only when stepper/Wanted callbacks are omitted (as `ShareDeckView` uses it). `VariationTabs` already has `readOnly`.
- `createDeck` / `createDeckFromStarter` write a deck + `Main` variation in one batch. `createDeck` does not check Leader ownership; only `CreateDeckModal` does.
- Tests are pure-logic only (`tsx --test lib/**/*.test.ts`). No rules tests, no emulator.

What blocks friends today:

1. Every rule is `isOwner(uid)`. Friends need new read rules and new top-level collections.
2. `users/{uid}` contains the email, so friends cannot read it. A separate `profiles/{uid}` is required.
3. Providers always read the signed-in uid. Friend pages need the same logic for another uid.
4. Components assume "your" data:
   - `DeckView` reads your contexts and has the share button, mode toggle, favorite writes, and Wanted writes.
   - `DeckRow` always shows Rename/Delete, links to `/decks/{id}`, and uses your art.
   - `CardDetailModal` always shows the art picker (writes **your** `cardPrefs`), hardcodes `/decks/{id}` links, and says "Owned".
   - `DeckStatusBadges` always shows Owned/Unowned.
   - `VariationTabs` only shows the favorite star when it is clickable.
   - `CardGrid` only shows the WANTED stamp when it is clickable.
   - `CollectionModeToggle` hardcodes `/collection` links.
5. Search/filter/sort/paging logic (~150 lines) is duplicated between `app/(app)/collection/page.tsx` and `components/wanted/WantedBoard.tsx`.

Snapshot drift to fix when this ships: `DECKPOOL_CODEBASE.md` describes a collapsible sidebar, but the app uses floating icon buttons (commit `b815556`) with Profile already in the mobile row. `/decks` is sorted newest-first, not grouped by Leader.

### Phase 0 — Prep

**0.1 Branch.** Create `friends` from `main`. Rules, providers, and nav all change; keep `main` shippable.

**0.2 Read the Next.js 16 docs first.** Required by `AGENTS.md`. Existing pages are client components that read params with `useParams()`. Read the layout, dynamic-segment, and `useParams` guides in `node_modules/next/dist/docs/` to confirm how a nested layout gets its params in 16.3.1 before writing Phase 9.

### Phase 1 — Pure logic and types (no Firebase)

**1.1 `lib/usernames.ts` (new).**

- `normalizeUsername(raw)`: trim + lowercase.
- `validateUsername(name)`: returns `null` or an error message. Rule: `^[a-z0-9][a-z0-9_.]{2,19}$`.
- `RESERVED_USERNAMES`: e.g. `admin`, `deckpool`, `support`, `help`, `mod`, `moderator`, `system`, `null`, `undefined`.
- **Why:** signup, the Friends claim form, and Add friend must agree. `firestore.rules` mirrors the same regex and list, with a comment pointing here.

**1.2 `lib/friendIds.ts` (new, pure).**

- `friendshipId(a, b)`: sorted `low_high`.
- `friendRequestId(fromUid, toUid)`: `from_to`.
- `relationshipWith(otherUid, { selfUid, friendUids, incoming, outgoing })`: `"self" | "friend" | "incoming" | "outgoing" | "none"`.
- **Why:** predictable ids let rules check a friendship with one `exists()` and no query. The relationship helper drives the Add friend messages.

**1.3 Types.**

- `types/friends.ts` (new): `PublicProfile { uid, username, displayName, privacy: { decks, collection, wanted } }`, `FriendRequest { id, fromUid, toUid, fromUsername, fromDisplayName, toUsername, createdAtMs }`, `Friendship { id, members: [string, string], createdAtMs }`.
- `types/user.ts`: add `username: string | null` to `UserProfile` (filled from `profiles/{uid}`).

**1.4 Tests.**

- `lib/usernames.test.ts`: valid/invalid, case folding, reserved names, 3 and 20 character limits.
- `lib/friendIds.test.ts`: id symmetry; every `relationshipWith` branch.
- `lib/auth-routing.test.ts`: add `/friends`, `/friends/abc`, `/friends/abc/decks/x` as safe.

### Phase 2 — Firestore rules

Deploy rules **before** the client ships. They only add permissions, so deploying early breaks nothing.

**2.1 Helpers in `firestore.rules`.**

- `pairId(a, b)`: `a < b ? a + '_' + b : b + '_' + a`.
- `isFriend(uid)`: signed in, not self, and `exists(/friendships/$(pairId(request.auth.uid, uid)))`.
- `sharesArea(uid, area)`: `get(/profiles/$(uid)).data.privacy[area] == true`. A missing profile makes `get` fail, which denies, so privacy fails closed.
- `validUsername(name)`: regex + reserved list from 1.1.

**2.2 Friend read access.**

| Path | New read condition |
|---|---|
| `users/{uid}/decks/{deckId}` and `variations` | owner **or** `isFriend(uid) && sharesArea(uid, 'decks')` |
| `users/{uid}/collection/{cardId}` | owner **or** `isFriend(uid) && sharesArea(uid, 'collection')` |
| `users/{uid}/wanted/{cardId}` | owner **or** `isFriend(uid) && sharesArea(uid, 'wanted')` |
| `users/{uid}/cardPrefs/{cardId}` | owner **or** `isFriend(uid)` (no toggle) |
| `users/{uid}` | **unchanged**, owner only |

Writes stay owner-only. These conditions do not look at the individual document, so a friend's list query is checked once, not per document. Each check uses two document reads (`exists` + `get`), well under the limit of 10.

**2.3 `usernames/{name}` (new) — `{ uid }`.**

- get: any signed-in user. list: never (no directory).
- create: id passes `validUsername`, keys are only `uid`, `uid == request.auth.uid`.
- delete: `resource.data.uid == request.auth.uid`. update: never.
- **Why:** username as doc id means "taken" = "doc exists", so a transaction claims it atomically without a server.

**2.4 `profiles/{uid}` (new) — `username`, `displayName`, `privacy`, `updatedAt`.**

- read: owner or `isFriend(uid)`.
- create/update: owner only; exact keys; `displayName` string ≤ 80; `privacy` has exactly three booleans; `updatedAt` timestamp; `getAfter(/usernames/$(username)).data.uid == request.auth.uid`. On update with a changed username, also `!existsAfter(/usernames/$(resource.data.username))` (old name must be released, no hoarding).
- delete: never.

**2.5 `friendRequests/{id}` (new) — `fromUid`, `toUid`, `fromUsername`, `fromDisplayName`, `toUsername`, `createdAt`.**

- create: `fromUid == request.auth.uid`; uids differ; id equals `fromUid + '_' + toUid`; `get(/usernames/$(toUsername)).data.uid == toUid`; `fromUsername == get(/profiles/$(fromUid)).data.username`; `fromDisplayName` ≤ 80; not already friends; no reverse request (`toUid_fromUid`). Four document reads.
- read: requester is `fromUid` or `toUid` (list queries filter on those fields).
- delete: sender or recipient (cancel, decline, accept cleanup). update: never.

**2.6 `friendships/{id}` (new) — `members: [low, high]`, `createdAt`.**

- create: requester is a member; `members[0] < members[1]`; id equals `members[0] + '_' + members[1]`; the other member's request to you exists: `exists(/friendRequests/$(other + '_' + request.auth.uid))`. In a batch, plain `exists()` sees pre-batch data, so deleting the request in the same batch still passes.
- read: `request.auth.uid in resource.data.members` (list uses `array-contains`).
- delete: either member. update: never.

**2.7 Deploy.** `firebase deploy --only firestore:rules`. Verified with the manual checklist in Phase 11 (no emulator).

### Phase 3 — Data layer (`lib/`)

**3.1 `lib/profiles.ts` (new).**

- `profileRef(uid)`, `usernameRef(name)`.
- `parsePublicProfile(uid, data)`: defensive like `parseDeck`; missing `privacy` → all hidden.
- `claimUsername(uid, rawName, displayName)`: one `runTransaction` (same style as `createUserDocOnSignup`): normalize + validate; read `usernames/{new}` (someone else's → "That username is taken."; yours → no-op); read `profiles/{uid}`; delete `usernames/{old}` if any; set `usernames/{new} = { uid }`; set/update the profile (new profiles get privacy all `true`; existing keep theirs).
- `setPrivacy(uid, area, value)`: `updateDoc` of `privacy.<area>` + `updatedAt`.
- `syncProfileDisplayName(uid, displayName)`: updates the profile only if it exists.

**3.2 `lib/friends.ts` (new).**

- Queries: `incomingRequestsQuery(uid)` (`toUid ==`), `outgoingRequestsQuery(uid)` (`fromUid ==`), `friendshipsQuery(uid)` (`members array-contains`).
- Parsers `parseFriendRequest`, `parseFriendship` (timestamps via `timestampToMillis`).
- `lookupUsername(rawName)` → uid or `null`.
- `sendFriendRequest(me, rawTargetName)`: lookup → generic "No account with that username." if missing → write `friendRequests/{me_them}`. Callers check `relationshipWith` first.
- `cancelFriendRequest(me, toUid)`, `declineFriendRequest(me, fromUid)`: delete one doc.
- `acceptFriendRequest(me, fromUid, alsoDeleteMyOutgoing)`: one batch — create `friendships/{pair}`, delete `friendRequests/{them_me}`, and only if your own request to them is in your outgoing list, delete `friendRequests/{me_them}` (deleting a missing doc would fail the batch).
- `removeFriend(me, friendUid)`: delete `friendships/{pair}`.

**3.3 `lib/decks.ts` — general deck creation.**

- Add `createDeckWithVariations(uid, name, leaderId, variations: { name, cards }[])`: one batch, deck + N variations, `favoriteVariationId` = first, `cleanCardsMap` on each.
- Rewrite `createDeck` and `createDeckFromStarter` to call it. Behavior unchanged.
- **Why:** copy-deck needs the same atomic write; avoids a third copy of the batch code.

**3.4 Display name sync.** In `UserProfileContext.saveDisplayName`, after `updateUserDisplayName`, call `syncProfileDisplayName` so friends never see a stale name.

### Phase 4 — Reusable data hooks (no visible change)

**4.1 Move each provider's logic into a uid-parameterized hook** under `hooks/`:

- `useOwnerDecks(ownerUid, { enabled })`: decks + per-deck variation listeners, favorite reorder, `deckIdsKey` (moved verbatim).
- `useOwnerCollection(ownerUid, { enabled })`: `ownedMap`, `allLabels`, `ownedCardCount`.
- `useOwnerWanted(ownerUid, { enabled })`: `wantedMap`, `wantedCardCount`.
- `useOwnerCardPrefs(ownerUid, { enabled })`: `preferredByCardId`.
- Each returns today's context shape plus `denied: boolean` (`permission-denied`). `enabled: false` or null uid → no listener, empty data. Friend pages use `enabled` so they never open a listener the rules would refuse.

**4.2 Providers become thin wrappers** (e.g. `DecksProvider` = `useOwnerDecks(user?.uid ?? null)` → context). Existing error strings stay in the wrappers.

**Why hooks and not a second set of providers:** nesting another `DecksProvider` etc. pointed at a friend would silently replace "your" data for everything underneath, including write hooks and Wanted stamps. Hooks keep "mine" and "theirs" as separate values.

**Check:** `npm test` + manual pass of Collection, Wanted, Decks, Builder, Profile. Nothing changes.

### Phase 5 — Usernames for your account

**5.1 `UserProfileContext`.** Add a live listener on `profiles/{uid}` next to the existing `ensureUserDoc` load. Expose `username` (or `null`), `privacy`, `claimUsername(name)`, `setPrivacy(area, value)`. Use the existing `loadedUid` gate.

**5.2 Signup.**

- `components/auth/SignupForm.tsx`: add a **Username** field (zod `refine` via `validateUsername`, shown with an `@` prefix).
- `AuthContext.signup(email, password, displayName, username)`: after `createUserDocOnSignup`, call `claimUsername` in its own try/catch (like the existing profile writes).
- If the name is taken, signup still succeeds and a toast says: "Account created. That username was taken — pick one on Friends."
- **Why not check first:** `usernames` lookups need sign-in (no anonymous enumeration), and `AuthGate` redirects signed-in users off `/signup` immediately.

**5.3 Existing accounts.** No migration. They get the claim prompt on first `/friends` visit (7.2).

### Phase 6 — `FriendsProvider`, nav badge, routing

**6.1 `contexts/FriendsContext.tsx` (new).**

- Listens to `friendshipsQuery`, `incomingRequestsQuery`, `outgoingRequestsQuery`.
- Per friend uid, listens to `profiles/{friendUid}` (same add/remove listener pattern `DecksProvider` uses for variations).
- Exposes `friends: PublicProfile[]` (sorted by display name), `friendUids`, `incoming`, `outgoing`, `pendingIncomingCount`, `loading`, `error`, and the 3.2 actions.
- Inactive until you have a username. Uses the `loadedUid` gate.
- Mount in `components/AppDataProviders.tsx` under `DecksProvider` (the badge needs it on every app page).

**6.2 Nav (`components/AppShell.tsx`).**

- Add `{ href: "/friends", label: "Friends", icon: Users }` to `PRIMARY_NAV` after Decks.
- `FloatingNavButton` gets optional `badgeCount`: pirate-red bubble top-right, caps at "9+", included in `aria-label` ("Friends, 2 pending requests").
- Check 360px width: six 44px buttons + gaps ≈ 324px. If tight, use `gap-2` on mobile only.

**6.3 Routing.** Add `"/friends"` to `SAFE_NEXT_PREFIXES` in `lib/auth-routing.ts`. `AuthGate` needs no change (friend routes are login-only).

### Phase 7 — `/friends` page

**7.1 `app/(app)/friends/page.tsx` (new).** Header like other pages. Sections in order:

1. **Your username**: `@name`, **Copy** (clipboard with toast fallback, like `lib/shares.ts`), **Change**.
2. **Add friend**: input + Send.
3. **Incoming requests** (only if any): name, `@username`, Accept / Decline.
4. **Sent requests** (only if any): `@username`, Cancel.
5. **Friends**: name + `@username` linking to `/friends/{uid}`; menu with **Remove** (confirm modal).
6. **Privacy**: three switches calling `setPrivacy`.

New components in `components/friends/`: `UsernameCard`, `UsernameClaimForm`, `AddFriendForm`, `RequestList`, `FriendList`, `PrivacyToggles`, `RemoveFriendModal`. Built from `Button`, `TextInput`, `Modal`, `poster-panel`, react-hook-form + zod (pattern: `EditDisplayNameForm`), `react-hot-toast`.

**7.2 Username prompt.** If `username` is `null`, the page shows only `UsernameClaimForm` ("Pick a username so friends can find you"). The Change dialog reuses the same form.

**7.3 Add friend behavior.** Normalize + validate → lookup → `relationshipWith`: self → "That's you."; friend → "Already friends."; outgoing → "Request already sent."; incoming → inline **Accept**; none → send. Unknown names and lookup failures show the same message.

### Phase 8 — Shared component changes (reuse, don't copy)

Every new prop defaults to today's behavior.

**8.1 `DeckStatusBadges`:** `owned` optional; when absent, show only Legal/Illegal.

**8.2 `DeckRow`:** new `href` (default `/decks/{id}`); `onRename`/`onDelete` optional (buttons hidden when both absent); optional `preferredImages` (overrides `useCardPrefs()`); `showOwned` (default `true`).

**8.3 `VariationTabs`:** when `favoriteId` is set but `onSetFavorite` is not, draw a non-clickable star on the favorite.

**8.4 `CardDetailModal`:** `allowArtPicker` (default `true`; friend views `false`, since the picker writes **your** prefs); `deckHref(id)` (default `/decks/{id}`); `ownedLabel` (default "Owned"; friend views "{Name} owns").

**8.5 `CardGrid`:** when `showWantedCount` and `wantedQtyById` are set but `onToggleWanted` is not, render `WantedStamp` disabled with no click.

**8.6 `CollectionModeToggle`:** add `baseHref` (default `/collection`) so friend pages link to `/friends/{uid}/collection` and `?view=summary`.

**8.7 Split `DeckView`.**

- New `components/builder/DeckViewBody.tsx` with props: `deck`, `variations`, `preferredImages`, `backHref`, `backLabel`, `headerActions`, `ownedQtyById?`, `onSetFavorite?`, `wanted?` (`wantedQtyById`, `onToggle`, `onDelta`, `saving`), `showOwned` (default `true`), `cardDetailProps` (8.4 options).
- It holds today's logic: active variation + `?variation=`, `validateVariation`, category grouping + cost sort, stats panel, grid + detail modal.
- `DeckView` becomes a wrapper passing your contexts, the share button and mode toggle as `headerActions`, your favorite handler, and your Wanted callbacks.
- Legal does not depend on ownership, so friend views pass `{}` for owned counts.

**8.8 Shared card browser.**

- New `hooks/useCardListBrowser.ts`: inputs `cards`, sort options, page size, and `applySearchFilters` inputs (`ownedOnly`/`ownedIds` or `wantedOnly`/`wantedIds`, `labelsByCardId`, `deckIdsByCardId`, `updatedAtById`). Returns `filters`/`setFilters`, `sort`/`setSort`, `results`, `pagedResults`, `currentPage`, `goToPage`, `gridTopRef`, `filtersOpen`/`setFiltersOpen`. Deferred filters, reset-to-page-1, and clamp effects move verbatim.
- New `components/cards/CardBrowserFrame.tsx`: count + sort row, mobile Filters button, aside with `NameSearchBar` + `FilterPanel`, `Pagination`; grid passed as children.
- Refactor `app/(app)/collection/page.tsx` and `components/wanted/WantedBoard.tsx` to use both. **Check:** identical behavior (sort, paging, filter reset).

### Phase 9 — Friend pages

**9.1 Routes** (inside `app/(app)/` for the shell and nav): `/friends/[uid]` (Decks), `/friends/[uid]/collection`, `/friends/[uid]/wanted`, `/friends/[uid]/decks/[deckId]`. Subroutes give real links and back-button behavior; the active tab comes from the path (like `AppShell`'s `isActivePath`).

**9.2 `app/(app)/friends/[uid]/layout.tsx` + `FriendDataProvider` (new).**

- Client provider reads `uid` with `useParams()` (confirm in 0.2).
- Friend check via `useFriends().friendUids`: loading → "Loading…"; not a friend → "This page is only visible to friends" + link to `/friends`, and nothing subscribes.
- Friend: live `profiles/{uid}`; `useOwnerDecks(uid, { enabled: privacy.decks })`, `useOwnerCollection(uid, { enabled: privacy.collection })`, `useOwnerWanted(uid, { enabled: privacy.wanted })`, `useOwnerCardPrefs(uid, { enabled: true })`; exposed via `FriendDataContext`.
- Header on every friend page: display name, `@username`, tabs (Decks, Collection, Wanted), back link to Friends.
- Hidden area → its tab shows "Hidden by {name}". A `denied` listener (privacy flipped or friendship removed mid-view) shows the same hidden / not-available state, not an error.

**9.3 Decks tab (`/friends/[uid]/page.tsx`).** Newest edit first (same `timestampToMillis` sort as `/decks`). `DeckRow` with `href=/friends/{uid}/decks/{id}`, friend art, `showOwned={false}`, no rename/delete. Legal from `summarizeDeck(..., {}, rules, favoriteVariationId)`.

**9.4 Deck page (`/friends/[uid]/decks/[deckId]/page.tsx`).** Find the deck in `FriendDataContext` ("Deck not found" + back link if missing). Render `FriendDeckView` = `DeckViewBody` with `backHref=/friends/{uid}`, friend variations and art, `showOwned={false}`, `favoriteId` (static star), no favorite handler, no Wanted callbacks, `cardDetailProps={{ allowArtPicker: false, deckHref: (id) => /friends/{uid}/decks/{id} }}`, and **Copy to my decks** in `headerActions`. Wrap in `Suspense` (uses `useSearchParams`).

**9.5 Collection tab.**

- Binder: `useCardListBrowser` + `CardBrowserFrame` + `CardGrid`; cards = catalog filtered to their qty > 0; Own chip = their counts; labels = their labels + "Deck: name" from `indexDeckMembership` on their decks (only if decks are shared); deck filter options from their decks; no steppers or WANTED stamps.
- Summary: `?view=summary` renders `CollectionSummary` with `computeCollectionBreakdown(theirQtyById, cardsById)`. Toggle = `CollectionModeToggle baseHref=/friends/{uid}/collection`.
- Card detail: `allowArtPicker={false}`, `ownedLabel`, friend `deckHref`; no qty, Wanted, or label editing.

**9.6 Wanted tab.** Same building blocks; cards with their Wanted qty > 0; read-only stamp with counts (8.5); no Caught; read-only detail.

### Phase 10 — Copy a friend's deck

**10.1 `components/friends/CopyDeckModal.tsx` (new).**

- Opened from **Copy to my decks**.
- Name field prefilled with their deck name (≤ 120, matches `validDeck`).
- Choice: **This variation** (default) → one `Main` variation with the active cards; **All variations (N)** → every variation with its name, their favorite first.
- Note when you do not own their Leader: "You don't own this Leader — the copy will show as Unowned."
- Submit → `createDeckWithVariations(myUid, name, deck.leaderId, chosen)` → toast "Deck copied" → `router.push('/decks/{newId}')`.
- **Why no new rules:** the friend's variations are already loaded; the write goes into your own tree under existing rules.

### Phase 11 — Verification

**11.1 Automated:** `npm test`, `npm run lint`, `npm run build`.

**11.2 Manual, two accounts (A and B), after the rules deploy:**

1. New signup claims a username. A taken name still creates the account and prompts on `/friends`. An older account is prompted on first visit.
2. A changes username; B can claim the old name right away; friendships survive.
3. A requests B's exact name; B's Friends button shows the badge. Partial name, unknown name, own name, and repeat send each show the right message.
4. Both send requests at once; accepting leaves no leftover requests.
5. Accept, decline, cancel, remove update both accounts live.
6. A views B's decks, binder, Summary, and Wanted: nothing editable, no art picker, B's art shows; deck view shows Legal only and a non-clickable favorite star.
7. B hides collection while A is on it → A sees "Hidden by B", no error.
8. B removes A → A's open friend page switches to "not available".
9. A signed-in non-friend opening `/friends/{uid}` sees "not available". From the browser console, reading `users/{B}`, reading `profiles/{B}`, and listing `usernames` are all denied.
10. Copy (single and all variations) creates an editable deck, including with an unowned Leader.
11. Your own Collection, Wanted, Decks, Builder, Profile behave exactly as before (Phase 4 and 8.8 refactors).
12. Mobile at 360px: six nav buttons fit, badge readable, friend tabs wrap cleanly.

### Phase 12 — Docs and deploy

1. Update `DECKPOOL_CODEBASE.md` in the same commit: routes, Firestore tree + rules, provider tree, nav convention, fix the sidebar and decks-grouping drift, **Last updated**.
2. Set this file's **Status** to implemented.
3. Deploy order: rules first (`firebase deploy --only firestore:rules`), then merge and deploy the app.

### Suggested commits

1. Phase 1 — pure libs + tests.
2. Phase 2 — rules (deploy right away).
3. Phase 4 — provider hooks refactor (no visible change).
4. Step 8.8 — card browser refactor (no visible change).
5. Phases 3 + 5 — data layer + usernames (incl. signup).
6. Phases 6 + 7 — `FriendsProvider`, nav badge, `/friends`.
7. Steps 8.1–8.7 + Phase 9 — shared component props, `DeckView` split, friend pages.
8. Phase 10 — copy deck.
9. Phase 12 — docs.

The two refactor commits come early so any regression shows up before friends code is mixed in.

## Related docs

| File | Use for |
|---|---|
| **This file** | Friends decisions + design + build plan + test checklist |
| `DECKPOOL_CODEBASE.md` | As-built app today (includes Friends) |
| `DECKPOOL_FUTURE_FEATURES.md` | Other post-V1 ideas |
