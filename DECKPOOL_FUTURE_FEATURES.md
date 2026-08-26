# DeckPool — Future features (post-V1)

**Status:** Planning notes, not V1 work  
**Last updated:** 2026-08-18  
**Use this file as:** the decision record for six feature ideas that came up after V1 was locked.

V1 is still defined by `DECKPOOL_V1_BLUEPRINT.md`. Do not treat this file as permission to add scanners, AI, or a game simulator before V1 ships.

If a future chat is asked to implement any of these, read this file first, then the V1 blueprint. If the two disagree, the V1 blueprint wins for anything still in V1. This file wins for the six ideas below.

---

## How to use this document

| Question | Answer |
|---|---|
| What is DeckPool? | A personal One Piece Card Game deckbuilder. You log the cards you own, then build 50-card lists from that pool. One deck can have several named lists (variations) under the same Leader, such as `Main` and `Anti-yellow`. |
| What is V1? | Collection, card search, decks, builder, legality, starter-deck add. No scanner, no chatbot, no match history, no battle simulator. |
| What is this file? | Research and decisions for six later ideas. Scores and build order included. |
| Research date | 18 August 2026. Phone apps were checked from public pages, not fully installed. |

**Scores used below**

- **Feasibility (1–10):** Can we build this in the current app (Next.js website + Firebase login + Firestore), without turning DeckPool into a different product?
- **Uniqueness (1–10):** Does something like this already exist for One Piece TCG? 1 = common, 10 = almost nobody has it.
- **Fit (1–10):** Does it make “build from the cards you own” and “named variations” stronger?

---

## Short decisions

| # | Idea | Decision | When |
|---|---|---|---|
| 5 | Wishlist | **Build** | First, after V1. 1–3 days. |
| 2 | Win/loss + notes on each variation | **Build** | Second. 3–7 days. |
| 1 | Bulk photo scan of a collection | **Do not build our own camera scanner.** **Do build import**, so people can scan in other apps and load the list here. | Import: 1–2 weeks after wishlist / match log. |
| 4 | AI deck-building chatbot | **Optional later.** Only if we agree to add a server route and pay for (or let the user provide) a language-model API. | After import. 2–4 weeks for a first chat. |
| 3 | Battle simulator you play against a computer | **Long-term yes, as solo practice**, with real tournament decks already loaded. Not online play against other people. | After V1 is solid. Months for a first limited version; years to feel complete. |
| 6 | Computer plays both decks N times and reports a score | **Yes, later, as practice only.** Must be labeled “simulated practice.” Must never be saved as real wins and losses. | Blocked until idea 3 can actually play a game. |

**Build order after V1**

1. Wishlist  
2. Win/loss + notes per variation (real matches only)  
3. Collection import + deck-list export (this is how scanning reaches DeckPool)  
4. A shelf of dated tournament “practice opponent” decks (lists only, no game yet)  
5. Draw tester, then a limited playable game, then a computer opponent  
6. Batch practice games vs those tournament lists, clearly labeled

---

## What the current app already does

This matters so later work does not duplicate V1.

| Area | Already true | Why it matters here |
|---|---|---|
| Collection | Search the full catalog, set owned quantity, optional labels, add a whole starter deck (ST01–ST36) in one tap | Logging by hand is still painful, but starters already cover constructed products. |
| Cards page | Browse every English card, optional “owned only” filter | Natural place for a wishlist button. There is no wishlist storage yet. |
| Builder | Search defaults to owned cards. You may still add cards you do not own. Several named 50-card lists per deck. Legal vs Illegal is separate from Owned vs Unowned. | Cards you do not own that sit in a deck are “this brew wants these cards,” not a hunting list. Win/loss should attach to a **variation**, not only to the deck. |
| Data | One owned count per card **number** (`OP08-072`). Alternate arts of the same number are the same card. | A scanner that tells manga rares from base prints is extra work we do not need for inventory. |
| Tech limits (V1) | Website talks to Firestore directly. No extra backend. No language-model API. No file storage. Free hosting only. | A real camera scanner, a full game, or a chatbot all require new infrastructure, not just a new page. |

V1 already listed paste-a-list import, match history, draw testers, and builder AI as **deferred**. These six ideas are that later work, plus a battle simulator.

---

## 1. Bulk photo scan (and how we still get the benefit)

**User intent:** Logging a whole collection by hand is miserable. People should be able to photograph a pile of cards and have DeckPool count them.

**Decision:** Do not build a DeckPool camera scanner. Do build **import**, and treat that as the scan feature. People scan in apps that already do this well, export a file or paste a list, and DeckPool adds those counts to the binder.

### Scores

| Path | Feasibility | Timeline | Uniqueness | Fit |
|---|---|---|---|---|
| Our own bulk photo scanner on the website | 2 / 10 | 3–6 months for a weak one-card-at-a-time version; 1–2 years to approach the best phone apps | 2 / 10 | High as a pain point, low as a product to compete in |
| Import (recommended) | 8 / 10 | 1–2 weeks | 3 / 10 | 9 / 10 |
| Later: phone camera that reads the printed code on **one** card and asks you to confirm | 5 / 10 | After import, if import is not enough | — | Useful extra, not required |

### Why not our own scanner

One Piece already has many phone scanners: Haki, Mugi, OP.TCG, Beli, Logia, Dex, Guardian, Collectr, and the TCGPlayer app. They are built for camera speed, sleeves, glare, and (in Haki’s case) English vs Japanese and alt-art prices.

DeckPool only needs the printed card number and a quantity. We do not track “this copy is the manga rare.” That is the hard problem those apps solve. Rebuilding it on a website camera would lose to opening Haki for ten minutes.

### How import leverages those apps

There is **no single official export format**. What every list shares is the card number printed on the card.

DeckPool should accept a pasted list or a `.csv` / `.txt` file, find card numbers like `OP13-079`, `ST07-001`, `P-029`, `EB01-003`, `PRB01-001`, read a quantity next to them, merge alternate arts onto the same number, show a preview, then add to the collection. Unknown numbers go on a reject list. Extra columns (price, condition, language) are ignored.

| Source | What we can take | Notes |
|---|---|---|
| Haki TCG | Collection CSV export | Column names are not publicly documented. Detect headers such as card number / card id / code and qty / quantity / count. |
| Logia | Collection or folder CSV | Same detection. Folder export helps if they scanned into “trades” vs “main.” |
| Mugi | Community deck-list text | Do not promise a full-binder CSV until we see a real file. A pasted 50-card list can still add those counts. |
| Limitless | `4 Nami (OP01-016)` style lines, plus Copy to Clipboard | Common deck format. Also how we load tournament lists later. |
| OPTCGSim and community converters | `1xOP13-001` or `4x OP01-016`, Leader first | Same parser. |
| Anything else | Paste or file upload | If a card number is on the line, it counts. |

Empty-state copy on Collection should say, in plain words: scan in Haki or Logia, export, import here.

### Implementation list (import)

1. Support our own simple format: `cardId,quantity` and optional labels. Also parse Limitless lines and `4x OP01-016` lines.
2. Collection page: Import modal. Preview first (new cards vs adding to existing counts vs unknown ids). Then write to Firestore using the existing quantity helpers.
3. Default action is **add to current counts**, not replace the whole binder. Offer an explicit “set to these counts” option so a bad file cannot wipe the collection by accident.
4. Also add **export** of a variation as Limitless / OPTCGSim text, so people can take a DeckPool list elsewhere to play.
5. Optional later: a camera that looks at **one** card, reads the printed code, matches it to `data/cards.json`, and asks before adding 1. Skip art-variant matching.

---

## 2. Wins, losses, and notes per variation

**User intent:** Decks are meant to win. Log wins and losses on each variation, with notes on losses.

**Decision:** Build this soon after V1. It fits the current database. No extra server.

### Scores

| | |
|---|---|
| Feasibility | 9 / 10 |
| Timeline | 3–7 days |
| Uniqueness | 4 / 10 (match logs exist on phones; logging **per named variation on a website** is less common) |
| Fit | 9 / 10 |

### Where it already exists

- **Mugi TCG:** log result vs opponent Leader, going first or second, notes, matchup stats.
- **Logia:** deck row shows record, win rate, streak.
- **Limitless / DevilFruitTCG.gg:** public tournament results, not your locals.

Those are mostly one list per deck on a phone. DeckPool already has several full 50-card lists under one Leader. The log belongs on the variation (`Main` vs `Anti-yellow`), not only on the deck.

### Implementation list

1. Each match stores: win / loss / draw, optional opponent Leader, optional first or second, optional event type (locals, online, other), notes, date.
2. Save matches under that variation in Firestore. Same owner-only rules as the rest of the user data.
3. Builder: show the record, a “Log match” form, and a short history. Allow edit and delete.
4. Decks list: show a compact record. Pick one rule and stick to it (for example, the last-played variation, or a combined deck total). Document the rule.
5. Charts and filters by opponent color can wait until people have enough matches.

**Hard rule:** this log is for **real games the user played**. Computer practice (idea 6) never writes here.

---

## 3. Battle simulator (play against a computer)

**User intent:** Not online play against strangers. A way to play the decks you built against a computer. Existing browser options are limited (starters, or you load everything yourself). Preload current tournament decks as opponents.

**Decision:** Keep this as a long-term goal. The product idea is good. The hard part is teaching the computer the actual card game, not collecting opponent lists.

### Scores

| | |
|---|---|
| Feasibility today | 2 / 10 |
| Feasibility if we add a limited rules version in steps | 4 / 10 |
| Timeline | Months for a first limited version; years before unique card effects feel complete |
| Uniqueness | 7 / 10 for “solo vs computer, tournament lists already loaded” |
| Fit | 6 / 10 as a testing lab next to the builder |

### What already exists

| Thing | Reality |
|---|---|
| OPTCGSim | The usual way to play One Piece TCG on a computer. Play against **other people**. Closed source. We cannot embed it. We can export our lists into its format. |
| Bandai tutorial app | Teaching tool with a couple of example decks. Not a general simulator. |
| Straw Table / similar sites | Browser play vs a computer for **other** card games. One Piece is not on their live game list as of 18 August 2026. Older articles that mention it are out of date. |
| Chatbots that “simulate a game” | They write a story. They do not follow the rules. Do not present these as a simulator. |
| Unfinished open-source engines | Experimental projects exist. They need new code for each card’s unique effect. They are not ready to ship inside DeckPool. |

A full simulator is a separate product: every card effect, timing, DON!!, counters, blockers, hidden information, plus a computer that only makes legal moves. Magic’s fan engines took many years of community work.

### What is easy vs what is hard

- **Easy:** Keep a dated set of real tournament 50-card lists (same kind of snapshot work as starter-deck contents). Show them as “practice opponents.”
- **Hard:** Actually play those lists.

That matches the user’s point: starter-only practice is weak; loading meta decks is the interesting part. Loading the lists does not require a game. Playing them does.

### Build in stages (do not skip)

| Stage | What the user gets | Honest label |
|---|---|---|
| 0. Lists only (weeks) | Import/export lists. A “practice opponents” shelf of dated tournament 50s. No game. | These are real tournament lists, not a simulated match. |
| 1. Draw tester (weeks to a month) | Shuffle, mulligan, DON!! curve, “did I draw my key cards?” No combat. | Draw tester. Not a match. |
| 2. Limited game (months to a year) | Play a card for its cost, attach DON!!, attack, rest, Blocker, Rush, numeric counters. Unique effects do nothing at first, with a visible log so the user knows. | Limited rules. Useful for curve and combat. Wrong for decks that win on unique effects. |
| 3. Computer opponent (after 2) | An always-available opponent that only picks legal moves. Your variation vs a named tournament list. | Practice opponent, not a human. |
| 4. Batch games (idea 6) | See next section. | Simulated practice. |

Do not start this until V1 brewing (collection, builder, variations, import) is in good shape.

### Implementation list (when the time comes)

1. Export a variation to OPTCGSim / Limitless text (this is also part of idea 1).
2. Store practice-opponent lists as dated JSON, like starter products. Name, Leader, 50-card map, source, date.
3. New project or service for the game itself. It does not belong as a Firestore document. It needs a real game loop.
4. Unique effects start as “not implemented” with a log. Never pretend an unimplemented Imu line worked.
5. No online matchmaking. One user, their list, a computer, a chosen opponent list.

---

## 4. AI deck-building chatbot

**User intent:** A chat that looks at the Leader, the current suggestions, owned cards, budget, and preferences, and recommends changes.

**Decision:** Optional, after import. A generic “ask ChatGPT about Purple Luffy” already exists and often invents cards. The version worth building is: only suggest cards that exist in our catalog, that pass our legality checks, and that the user owns (or has on a wishlist).

### Scores

| | |
|---|---|
| Feasibility for a grounded chat (looks up real cards, then talks) | 6 / 10 |
| Feasibility for actually good strategy advice | 3 / 10, ongoing |
| Timeline | 2–4 weeks for a first chat; quality work never really finishes |
| Uniqueness | 5 / 10 generic chat, 7 / 10 if it is limited to **your** cards and our legality rules |
| Fit | 7 / 10 |

### What already exists

- Chat apps that look up One Piece cards while answering.
- A Hugging Face tool that sketches a legal 50 from a Leader and a play style (aggro / midrange / control).
- Site analyzers that score a pasted list against the meta.

V1 currently forbids a language-model API and extra backend. A chatbot is a policy change, not only a new component. Do not put a secret API key in the browser.

### Implementation list (if we green-light it)

1. Suggestions are a patch: “add 2 of this, cut 1 of that.” Never silently rewrite the variation.
2. The chat may only choose from real card ids returned by our search and collection. It must not invent names.
3. Run the existing legality check on the proposed list before showing it. Drop illegal cards and show why.
4. Give the model: Leader, current 50, owned gaps, optional budget note, optional label preferences.
5. Do not scrape Limitless live for meta. If we want meta at all, store a dated snapshot the same way we store the card catalog.

---

## 5. Wishlist

**User intent:** Mark cards you find while searching so you can track what you want.

**Decision:** Build first after V1. Easy, useful, even though every collection app has this.

### Scores

| | |
|---|---|
| Feasibility | 10 / 10 |
| Timeline | 1–3 days |
| Uniqueness | 2 / 10 |
| Fit | 8 / 10 |

Unowned copies already sitting in a deck are not a wishlist. Labels cannot cover this today: quantity 0 deletes the collection row, and cards you do not own have no labels.

### Implementation list

1. New wishlist records keyed by card number: how many you want (default 1), optional note. Same owner-only security as the collection.
2. A want button on the card detail popup (and the card grid if it stays simple). Do not reuse the owned-quantity stepper.
3. Cards page filter for wanted cards, same idea as the existing owned filter in the URL.
4. When owned quantity reaches wanted quantity, ask to clear the wishlist row (or clear it automatically). Keep owned and wanted as two separate stores until then.
5. Do not auto-add wishlist cards to decks. Adding an unowned card in the Builder stays a deliberate click.

---

## 6. Computer vs computer, N games (practice score)

**User intent:** Not fake locals stats. The user picks two decks (often theirs vs a tournament list), chooses a number of games (for example 100), and gets a sense of how the list tends to fare. Tips after the run are a bonus.

**Decision:** Same idea as idea 3, last stage. Allowed only as **simulated practice**, with the opponent list name and snapshot date on the result. Never mixed into the real win/loss log from idea 2.

### Scores

| | |
|---|---|
| Feasibility now | 1 / 10 |
| Timeline | Blocked until idea 3 can play a full game |
| Uniqueness | 8 / 10 if it is a real rules-based run and clearly labeled |
| Fit | 7 / 10 as a tester |

Public sites already publish **human** tournament matchup percentages. That is useful for “how does Rayleigh do in the field.” It is not a test of *this* user’s 50. Idea 6 is for that personal test.

Until a real game engine exists, do not have a language model invent “62 wins.” That is a story, not a test.

Two weak computer players also measure how those two programs play, not how two humans would play. That is still useful as a vibe check if the screen says so.

### Implementation list (only after idea 3 stage 3)

1. User picks: my variation, opponent list from the practice shelf (or another of my variations), number of games.
2. Result line looks like: `Simulated practice 62–38 vs OP12 Rayleigh (tournament snapshot 2026-08)`. Include first/second if we track it.
3. Do not write this into the variation’s real match history.
4. Optional tips after the run must be based on what the program actually did (for example, “this key card was in the opening hand N times”), not invented advice.
5. Honest substitutes **before** the engine exists: real match log (idea 2), draw tester (idea 3 stage 1), and links to public tournament matchup tables labeled as field data.

---

## Hard rules (do not quietly break these)

1. **V1 ships first.** This file is not a V1 scope change.
2. **Import is how scanning reaches DeckPool.** Do not start a website camera project to compete with Haki.
3. **Real matches and simulated practice stay separate.** Idea 2 is humans. Idea 6 is a tester with a label.
4. **Legality stays a normal program check**, not a chatbot opinion. If we add AI suggestions, the existing legality code must accept or reject them.
5. **Collection stays keyed by card number.** Import must merge alternate arts. We do not need per-printing inventory for these features.
6. **No live scrape of Limitless** for search or meta. Dated files we own, same as the card catalog.
7. **A playable game is a new system**, not a new Firestore collection. Do not fake a simulator with a chatbot.

---

## Suggested empty-state / UI copy (plain)

- Collection, no cards yet: “Bought a starter? Add it in one tap. Already scanned a binder in Haki or Logia? Export the list and import it here.”
- Wishlist button: “Want”
- Match log: “Log a match” with Win / Loss / Draw
- Practice shelf: “Tournament lists (snapshot date). These are real lists, not simulated results.”
- Batch run result: always include the words “Simulated practice” and the opponent list name and date.

---

*End of future-features notes.*
