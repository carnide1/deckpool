# DeckPool — Friends

**Status:** Planning / decision record (not implemented)  
**Last updated:** 2026-10-02  
**Product:** Add friends by exact username and view each other's decks, binder, and Wanted board, read-only.

This file records the friends decisions. For how the live app works today, trust `DECKPOOL_CODEBASE.md`. **Do not implement this unless the user asks.**

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
| Where it lives | Its own **Friends** section at `/friends`: the 5th primary nav item after Decks, in the desktop sidebar and the mobile bottom bar. |
| Settings home | Your username and the privacy switches live on the Friends page, not Profile. |
| Alerts | Badge on the Friends nav item for pending incoming requests. No toasts. |
| Friend cap | None for now. |
| Card art on friend pages | The **friend's** preferred art (their `cardPrefs` are readable by friends). |
| Friend page default tab | Decks. |

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

- Friend page: display name, `@username`, and tabs for **Decks**, **Collection**, **Wanted** (only the ones they share). Opens on **Decks**.
- **Decks:** their deck list grouped by Leader, like `/decks`. Badges show **Legal** only.
- **Deck view:** read-only, same layout as Deck View — variation dropdown with their favorite starred, list summary, Legal status with notes. No Edit, no share-link button, no WANTED stamp actions on their cards.
- **Collection:** read-only binder grid with quantities, same filters as Collection. No steppers.
- **Wanted:** read-only poster board with bounty counts. No Caught.
- Card details open read-only (effect text, art, their quantity where relevant). Your own binder and Wanted are unaffected by browsing.
- Art: friend pages use the **friend's** preferred art, so their decks look the way they set them up. Catalog defaults fill in where they have no pick.

## Copy a friend's deck

- **Copy to my decks** on a friend's deck view copies the **active variation** into a new deck you own: their deck name (editable), same Leader, one variation named `Main` with the same card counts, pinned as favorite.
- Optional: "Copy all variations" copies every variation into the new deck.
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
| `/friends/[uid]` | Friend page with Decks / Collection / Wanted tabs (authenticated, friends only) |
| `/friends/[uid]/decks/[deckId]` | Read-only friend deck view (`?variation=` supported) + Copy to my decks |

Friend pages use account ids, not usernames, so links survive username changes. Non-friends and logged-out visitors see a "not available" page.

---

## App conventions this changes (when built)

- Primary nav grows from four items to five: Collection, Wanted, Explore, Decks, **Friends**. `DECKPOOL_CODEBASE.md` currently states the four-item nav as a convention; update it when this ships.
- `/friends` must be added to the safe `?next=` allowlist in `lib/auth-routing.ts` so deep links survive login.

## Open questions

_(none right now)_

## Related docs

| File | Use for |
|---|---|
| **This file** | Friends decisions + planned design |
| `DECKPOOL_CODEBASE.md` | As-built app today (update when friends ships) |
| `DECKPOOL_FUTURE_FEATURES.md` | Other post-V1 ideas |
