# DeckPool — Friends

**Status:** Implemented on the `friends` branch (Phases 1–12), pushed to GitHub, not merged into `main` yet. Rules deployed 2026-10-02. Post-build review fixed the add-friend error messages, a malformed-URL crash on friend pages, and the remove-friend modal text. **Invite links** are built on the same branch (pushed); their `invites` rule was deployed 2026-10-02.  
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
| Discovery | Exact unique username only (Discord model), plus 7-day **invite links** you send yourself (planned; see Invite links). |
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

## Invite links (implemented)

As built, the plan below was followed with one change: Phase 1.6 uses the click-handler option (`components/auth/AuthSwitchLink.tsx` reads `?next=` at click time), so the login and signup pages did not need a `Suspense` boundary.

Text or send someone a link that invites them to be your friend, so they don't have to type your username.

### Decisions

| Topic | Decision |
|---|---|
| What opening the link does | Shows who invited you and a **Send friend request** button. Tapping it sends a normal request from **you to the inviter**; the inviter accepts it from Incoming (badge, as today). No auto-friending. |
| Link format | Random code: `/invite/{code}` (Firestore auto-id). Not the username, so it survives username changes. |
| Lifetime | **7 days** from creation. Usable by any number of people until then. |
| Landing page | Shows the inviter's display name + `@username` and an explicit button. Nothing happens just from opening the link (text-app link previews can't trigger anything). |
| Managing invites | None. It's just a share link: no list of open invites, no cancel. Each tap of **Invite link** makes a new link. |

### How it works

1. On `/friends`, an **Invite link** button (next to your username) creates `invites/{code}` and opens the phone's share sheet (`navigator.share`) with "Add me as a friend on DeckPool: {url}". Without a share sheet it copies the link (toast shows the URL if the clipboard fails), the same fallback as deck share links.
2. The person opens `/invite/{code}`:
   - **Signed out:** sees "{name} invited you to be friends on DeckPool" with **Sign up** and **Log in**. Both carry `?next=/invite/{code}` so they come back to the invite afterwards. Signup already asks for a username, so a brand-new person can go from the text to a sent request in one flow.
   - **Signed in, no username yet:** pick a username first (requests need one), then the button appears.
   - **Signed in:** **Send friend request**. Or, depending on the situation: "This is your own invite link", "You're already friends" (link to their page), "Request already sent", or **Accept** if the inviter already sent them a request.
   - **Expired or unknown code:** "This invite link has expired. Ask them for a new one."
3. The inviter sees the request in Incoming and accepts like any other.

### Data and rules (planned)

```
invites/{code}    inviterUid, inviterUsername, inviterDisplayName, createdAt, expiresAt
```

- **Read:** public single-doc **get** (so a signed-out person sees who invited them, same idea as `shares`); **list denied** (no directory of invites). It exposes only the display name + username, and only to people who have the link.
- **Create:** signed in, `inviterUid == auth.uid`, exact keys, `inviterUsername` equals your `profiles/{uid}.username`, `createdAt == request.time`, and `expiresAt` is a timestamp after `request.time` and no later than `request.time + 8 days`. (The client sets `expiresAt` from its own clock, which can drift from the server, so the rule allows one day of slack; the app always writes exactly 7 days.) No update. Delete by the inviter (no UI; just allowed).
- **Sending the request uses the existing `friendRequests` rules unchanged.** The invite only fills in who to send to. It grants nothing beyond what knowing the username already allows, so expiry is checked on the landing page, not in the request rule.
- **Stale username:** if the inviter changes their username after making the link, the stored `inviterUsername` no longer points at them, and the request rule would refuse the request. The landing page checks this up front (reads `usernames/{inviterUsername}` and compares the uid) and shows the expired message instead of a button that would fail.
- Old invite docs are not cleaned up by the app. Optionally turn on a Firestore TTL policy on `expiresAt` in the Firebase console.

### Implementation plan (planned)

Phases run in order. Each step says **what** to add or change, **why**, **how**, and **what existing code it reuses**. Rules deploy (Phase 2) must happen before the app ships.

#### Codebase facts this plan relies on (checked 2026-10-02)

- `AuthProvider` and `UserProfileProvider` are mounted at the **root** (`app/layout.tsx` → `Providers`), so any route can use them. `FriendsProvider` only depends on those two, so it can be mounted outside the `(app)` group.
- `AuthGate` (`components/auth/AuthGate.tsx`) has a private `isPublicRoute(pathname)`: auth landings + `/s/…`. Public routes render while Auth is still loading. Signed-in users on an auth landing (`/login`, `/signup`, …) are redirected to a safe `?next=` if present.
- `isSafeNextPath` (`lib/auth-routing.ts`) only accepts paths under `SAFE_NEXT_PREFIXES` and explicitly rejects `/s/…`. `/invite` is not in the list yet.
- `LoginForm`'s "Sign up" link and `SignupForm`'s "Log in" link are plain `/signup` and `/login`. **They drop `?next=`**, so someone who switches forms would lose the invite.
- `shareAbsoluteUrl(shareId, origin?)` in `lib/shares.ts` builds the texting URL (explicit origin → `NEXT_PUBLIC_APP_URL` → relative path). `copyTextToClipboard` is in the same file. `ShareLinkButton` shows the pattern: copy, toast; if the clipboard fails, a 12-second toast with the URL.
- `app/s/layout.tsx` is the model for a public page outside `AppShell`: a simple header with the DeckPool wordmark.
- `useFriends()` exposes `friendUids`, `incoming`, `outgoing`, `loading`, `sendRequest(toUid, toUsername)`, `acceptRequest(fromUid)`. `relationshipWith` (`lib/friendIds.ts`) turns those into `self | friend | incoming | outgoing | none`. `UsernameClaimForm` claims a username and reports via `onDone`.

#### Phase 1 — Types, helpers, tests (no UI, no Firestore yet)

**1.1 Add the `Invite` type** to `types/friends.ts`:

```ts
export interface Invite {
  code: string;
  inviterUid: string;
  inviterUsername: string;
  inviterDisplayName: string;
  createdAtMs: number;
  expiresAtMs: number;
}
```

- **Why:** one shape for the page and helpers; `*Ms` numbers keep it testable without Firestore `Timestamp`s (same convention as `FriendRequest.createdAtMs`).

**1.2 Generalize the URL builder** in `lib/shares.ts`:

- Extract the body of `shareAbsoluteUrl` into `export function absoluteAppUrl(path: string, origin?: string): string` (same order: explicit origin → `NEXT_PUBLIC_APP_URL` → bare path; trims trailing `/`).
- Make `shareAbsoluteUrl(shareId, origin)` call `absoluteAppUrl(sharePagePath(shareId), origin)`. No behavior change for shares.
- **Why:** invites need the identical logic; one copy avoids drift (e.g. someone fixes the env fallback in one place only).

**1.3 Create `lib/invites.ts`** (pure helpers first, Firestore functions in Phase 3):

- `export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;`
- `export function invitePagePath(code: string): string` → `` `/invite/${encodeURIComponent(code)}` `` (mirrors `sharePagePath`).
- `export function inviteAbsoluteUrl(code: string, origin?: string): string` → `absoluteAppUrl(invitePagePath(code), origin)`.
- `export function isInviteExpired(invite: Pick<Invite, "expiresAtMs">, nowMs: number): boolean` → `invite.expiresAtMs <= nowMs`. Takes `nowMs` as a parameter so tests don't depend on the clock.
- `export function parseInvite(code: string, data: Record<string, unknown>): Invite | null` → returns `null` if `inviterUid` or `inviterUsername` is not a non-empty string or `expiresAt` is missing; otherwise strings default to `""` and timestamps go through `timestampToMillis` (from `lib/timestamps`, already used by `lib/friends.ts`).
- `export function inviteShareText(displayName: string, username: string): string` → `` `Add me as a friend on DeckPool (@${username})` `` (display name is optional context; keep the text short for SMS).

**1.4 Tests** in a new `lib/invites.test.ts` (`node:test` + `node:assert/strict`, like `lib/friendIds.test.ts`):

- `invitePagePath` encodes odd characters; `inviteAbsoluteUrl` with an explicit origin (with and without trailing `/`) and with no origin (relative path when env is unset).
- `isInviteExpired`: one ms before expiry → false; exactly at expiry → true; after → true.
- `parseInvite`: valid doc → full object; missing `inviterUid` → `null`; missing `expiresAt` → `null`; wrong types → `null` or defaults as specified.

**1.5 Public route + safe `next`** in `lib/auth-routing.ts`:

- Add `"/invite"` to `SAFE_NEXT_PREFIXES` so `/login?next=/invite/abc` and `/signup?next=/invite/abc` return the person to the invite.
- Move the public-route check out of `AuthGate` into `lib/auth-routing.ts` as `export function isPublicPath(pathname: string): boolean` returning true for auth landings, `/s`, `/s/…`, `/invite`, `/invite/…`. `AuthGate` imports it in place of its local `isPublicRoute`.
- **Why move it:** so it can be unit-tested next to `isSafeNextPath` instead of living untested inside a component.
- **Why public:** a signed-out person must see who invited them before deciding to sign up. **Not** an auth landing: signed-in users must stay on the invite (same treatment as `/s/…`).
- Tests in `lib/auth-routing.test.ts`: `isSafeNextPath("/invite/abc")` → true; `isPublicPath` true for `/invite/abc`, `/s/x`, `/login`; false for `/decks`, `/friends`, `/invitex`.

**1.6 Keep `?next=` when switching login ⇄ signup:**

- `components/auth/LoginForm.tsx`: the "Sign up" link becomes `/signup` plus the current `?next=` when `isSafeNextPath(next)`.
- `components/auth/SignupForm.tsx`: same for the "Log in" link.
- Read `next` with `useSearchParams()`. Neither `app/login` nor `app/signup` has a `Suspense` boundary today, so wrap each form in `<Suspense>` in its page (Next requires one for `useSearchParams` in a statically rendered page and fails the build otherwise — read `node_modules/next/dist/docs` on `useSearchParams` first). Alternative that avoids Suspense: read `window.location.search` in a click handler, the way `AuthGate.readNextParam` does.
- **Why:** without this, a new person who taps **Log in** on the invite, realizes they have no account, and taps "Sign up" lands in the app instead of back on the invite.

#### Phase 2 — Firestore rules (deploy before the app)

**2.1 Add to `firestore.rules`:**

```
match /invites/{code} {
  allow get: if true;
  allow list: if false;
  allow create: if request.auth != null
    && request.resource.data.keys().hasOnly(['inviterUid', 'inviterUsername', 'inviterDisplayName', 'createdAt', 'expiresAt'])
    && request.resource.data.keys().hasAll(['inviterUid', 'inviterUsername', 'inviterDisplayName', 'createdAt', 'expiresAt'])
    && request.resource.data.inviterUid == request.auth.uid
    && validUsername(request.resource.data.inviterUsername)
    && request.resource.data.inviterUsername == get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.username
    && request.resource.data.inviterDisplayName is string
    && request.resource.data.inviterDisplayName.size() <= 80
    && request.resource.data.createdAt == request.time
    && request.resource.data.expiresAt is timestamp
    && request.resource.data.expiresAt > request.time
    && request.resource.data.expiresAt <= request.time + duration.value(8, 'd');
  allow update: if false;
  allow delete: if request.auth != null && resource.data.inviterUid == request.auth.uid;
}
```

- **Why each check:** exact keys stop junk fields; `inviterUid`/`inviterUsername` must be yours so nobody can make an invite that names someone else; `createdAt == request.time` forces `serverTimestamp()`; the `expiresAt` window caps lifetime (8 days = 7 + clock slack); `get` public + `list` denied mirrors `shares` (link holders only, no directory).
- Reuses the existing `validUsername` helper. `friendRequests` rules are **unchanged**.

**2.2 Compile:** `firebase deploy --only firestore:rules --dry-run`.

**2.3 Deploy:** `firebase deploy --only firestore:rules` (ask the user first). Safe to ship before the app: it only adds a new collection.

#### Phase 3 — Data functions

Add to `lib/invites.ts`:

- `inviteRef(code)` → `doc(getFirebaseDb(), "invites", code)`; `invitesRef()` → `collection(...)`.
- `export async function createInvite(me: PublicProfile): Promise<string>`:
  - `const ref = doc(invitesRef());` (auto-id = the random code, ~20 chars).
  - `await setDoc(ref, { inviterUid: me.uid, inviterUsername: me.username, inviterDisplayName: me.displayName.slice(0, 80), createdAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + INVITE_TTL_MS) });`
  - Returns `ref.id`.
- `export async function getInvite(code: string): Promise<Invite | null>` → `getDoc`; `null` if missing or `parseInvite` returns `null`. Works signed out (public `get`).
- `export async function isInviteCurrent(invite: Invite): Promise<boolean>` → reads `usernames/{invite.inviterUsername}` (via `usernameRef` from `lib/profiles.ts`) and returns `snap.exists() && snap.data().uid === invite.inviterUid`. **Signed-in only** (the `usernames` rule needs auth). Catches the stale-username case before showing a button that would fail.
- **Why no listener:** the invite never changes after creation; one read is enough.

#### Phase 4 — "Invite link" button on Friends

**4.1 New `components/friends/InviteLinkButton.tsx`:**

- Uses `useUserProfile().publicProfile` (renders nothing without a username; the Friends page already only shows `UsernameCard` when you have one).
- On click (button disabled while busy, label "Creating…"):
  1. `const code = await createInvite(publicProfile)`.
  2. `const url = inviteAbsoluteUrl(code, window.location.origin)`.
  3. If `navigator.share` exists: `await navigator.share({ title: "DeckPool invite", text: inviteShareText(...), url })`. If it throws an `AbortError` (user closed the sheet), do nothing. Any other error → fall through to step 4.
  4. Otherwise `await copyTextToClipboard(url)` → toast "Invite link copied — paste it in a text. It works for 7 days."; if the clipboard fails → `toast.success(\`Invite link: ${url}\`, { duration: 12000 })` (same fallback as `ShareLinkButton`).
  - Firestore error → `toast.error(message || "Could not create invite link")`.
- Icon: `Send` or `Link2` from `lucide-react`; `Button variant="secondary" size="sm"`, matching the Copy button next to it.
- **Why the share sheet first:** on phones it opens Messages directly, which is the main use. Desktop browsers mostly lack it, so they copy.

**4.2 Put it in `UsernameCard`:** add `<InviteLinkButton />` in the button row after **Change**, and add one line of helper text under the row: "Or send an invite link (works for 7 days)."

#### Phase 5 — The `/invite/[code]` page

**5.1 Route layout `app/invite/layout.tsx`** (server component; outside `(app)`, so no `AppShell`, no binder/deck providers):

- Same shell as `app/s/layout.tsx`: page background + header with the **DeckPool** wordmark linking to `/`. No `CatalogProvider` (no cards on this page).
- Wraps children in `<FriendsProvider>` so the page can use `useFriends()`. Safe because `FriendsProvider` only needs the root Auth + UserProfile providers, and it stays idle for guests and for accounts without a username.

**5.2 Page `app/invite/[code]/page.tsx`** (client component; `useParams<{ code: string }>()`, wrapped in `Suspense` like `app/(app)/decks/[id]/page.tsx`). It renders an `InviteCard` (`components/friends/InviteCard.tsx`) inside a centered `poster-panel` (max width ~28rem).

**5.3 `InviteCard` state machine** — evaluate top to bottom, render the first match:

| # | Condition | What it shows |
|---|---|---|
| 1 | Auth still loading (`useAuth().loading`) **or** invite still loading | "Loading invite…" |
| 2 | `getInvite` returned `null` (unknown code / bad doc) | **Expired view**: "This invite link has expired or doesn't exist. Ask them for a new one." + link "Go to DeckPool" (`/`) |
| 3 | `isInviteExpired(invite, Date.now())` | Expired view |
| 4 | Signed out | "**{name}** (`@{username}`) invited you to be friends on DeckPool." Buttons: **Sign up** → `/signup?next=/invite/{code}`, **Log in** → `/login?next=/invite/{code}` |
| 5 | Signed in, `publicProfileLoading` | "Loading invite…" |
| 6 | Signed in, no username (`!publicProfile?.username`) | Invite line + "Pick a username first so they know who you are." + `UsernameClaimForm` (on `onDone`, the provider picks up the new profile and the card moves on) |
| 7 | `invite.inviterUid === user.uid` | "This is your own invite link. Send it to someone you want to add." + link to `/friends` |
| 8 | `isInviteCurrent(invite)` resolved `false` | Expired view (stale username) |
| 9 | `useFriends().loading` or the current-check still pending | "Loading invite…" |
| 10 | `relationshipWith(...) === "friend"` | "You're already friends with {name}." + **View their page** → `/friends/{inviterUid}` |
| 11 | `=== "outgoing"` | "Request sent. You'll be friends once {name} accepts." + link to `/friends` |
| 12 | `=== "incoming"` | "{name} already sent you a request." + **Accept** → `acceptRequest(inviterUid)`; on success show row 10 (the live listener flips it) + toast |
| 13 | `=== "none"` | Invite line + **Send friend request** → `sendRequest(inviterUid, inviterUsername)`; on success the outgoing listener flips the card to row 11 + toast "Request sent to @{username}" |

- `{name}` = `inviterDisplayName.trim() || "@" + inviterUsername` (same fallback as the friend pages).
- `relationshipWith(invite.inviterUid, { selfUid, friendUids, incomingFromUids, outgoingToUids })` — build the two sets exactly as `AddFriendForm` does.
- Button errors (send/accept) → `toast.error(message)`; the button re-enables. A permission-denied on send (rare race: username changed after the current-check) → show the expired view.
- Loading: one effect fetches `getInvite(code)` on mount (cancelled flag; result stored with the code it belongs to, like the `loadedUid` gate). A second effect runs `isInviteCurrent` once the user is signed in and the invite is loaded. Do the state resets inside `queueMicrotask` (the repo's pattern for `react-hooks/set-state-in-effect`).
- **Nothing is written on page load.** Only the two buttons write. This is what makes link previews harmless.

**5.4 Metadata:** `export const metadata = { title: "DeckPool invite", robots: { index: false } }` in `app/invite/layout.tsx`, so search engines don't index invite pages and previews show a sensible title. (Check the Next 16 metadata docs in `node_modules/next/dist/docs` before writing it.)

#### Phase 6 — Verify

- `npm test`, `npm run lint`, `npm run build` (the route list should show `ƒ /invite/[code]`).
- Run the extra manual checks below with two accounts plus one brand-new signup in a private window.

#### Phase 7 — Docs (same commit as the code)

- `DECKPOOL_CODEBASE.md`: add `/invite/[code]` to the public routes line and the route table; add `invites/{code}` to the Firestore tree and the Friends rules summary; note the Invite link button under Friends; mention `isPublicPath` in the AuthGate section; set **Last updated**.
- This file: mark Invite links as implemented in **Status**, and change the section heading from "(planned, not built)".

#### Suggested commits

1. Phase 1 — helpers, tests, public route + `next` handling (no visible change except login/signup keeping `next`).
2. Phase 2 — rules (deploy right away).
3. Phases 3–5 — data functions, Invite link button, `/invite/[code]` page.
4. Phase 7 — docs (or fold into commit 3).

### Extra manual checks (planned)

1. A makes a link and texts it; B (signed out, new) signs up through it, lands back on the invite, sends the request; A accepts.
2. Existing signed-in user opens the link → Send works; reopening shows "Request already sent".
3. A opens their own link → "This is your own invite link".
4. A link older than 7 days, a made-up code, and a link made before A changed username all show the expired message.
5. Opening the link alone (and a link preview in a messaging app) never sends a request.
6. Signed out → **Log in** → switch to "Sign up" → finish signup → you land back on the invite (the `?next=` survives the switch).
7. Signed in without a username (taken at signup) → invite asks for a username first, then shows **Send friend request**.
8. B already sent A a request, then opens A's link → **Accept** works and the card shows "already friends".
9. On a phone, **Invite link** opens the share sheet; closing the sheet shows no error. On desktop it copies and toasts.
10. Deck share links (`/s/…`) still work exactly as before (the URL helper was generalized).

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
