# DeckPool — Battle sim truth engine: step-by-step plan

**Status:** Pre-implementation plan (no code until this plan is accepted and a branch is cut)  
**Last updated:** 2026-09-11 (full review: contradictions fixed; shell ingest earlier; keyword/vanilla/continuous clarified; Phase deps ordered)  
**Parent:** `DECKPOOL_BATTLE_SIM.md`  
**Multi-agent handoff / progress:** `DECKPOOL_BATTLE_SIM_AGENTS.md` (start here when executing across sessions)  
**Scope of this document:** Steps to build a **complete rules-capable** truth engine (pure TypeScript), implement **every current English catalog card** with **automated proofs**, then hand off UI / stronger AI / PvP.

Check progress in `DECKPOOL_BATTLE_SIM_AGENTS.md` when executing. Keep this file accurate if procedure changes.

---

## Core principle (read this first)

**There is no “rules out of scope” for the engine.**

Triggers, On Play, When Attacking, Activate: Main, Leader abilities, Counter *effects* (not only the number), On K.O., Once Per Turn, DON!! xN conditions, search/look-at, and the rest of official timing are **core OPTCG**. A sim that only pays cost and swings is not an accurate battle sim.

What *does* grow over time is **card coverage**: how many printed cards have a correct executable ability. The engine architecture must be able to express **all** of those ability kinds from early on. An unimplemented card is a **coverage gap**, not a product decision to ignore that class of rule.

| Layer | Requirement |
|---|---|
| **Rules / timings / zones / combat / keywords** | Must be designed and implemented as a complete framework |
| **Effect primitives** (draw, rest, KO, search top N, attach DON!!, power buffs, …) | Must exist so abilities are composed, not one-off hacks |
| **Per-card (or per-pattern) ability scripts + proofs** | Required for **every** current catalog card before plan-close; status computed from shells ∪ scripts ∪ passing tests |
| **UI / PvP / ML** | Still deferred — not game rules |

**Wrong framing (rejected):** “v0 = combat only; unique text later / out of scope.”  
**Right framing:** “Build the full rules machine first (including the effect/timing system), prove it with real ability kinds on fixtures, then fill the catalog until coverage is complete.”

---

## Definition of done — after this engine plan is complete

This section is the explicit finish line for **this document**. If a bullet is not listed under “Accomplished,” it is **not** delivered by finishing this plan.

**Product bar you asked for:** when this plan is done, you can play with **all current English catalog cards** in the sim (not only one starter matchup). That is in scope for this plan. It is also the **largest** part of the work (thousands of card texts), after the rules machine exists.

### Accomplished (you have this)

| Deliverable | What it means in practice |
|---|---|
| **Rules-complete truth engine** | Pure TypeScript under `lib/sim/`: setup, mulligan, turns, DON!!, play, activate, combat, win/lose — with an effect queue, nested choices, and modifiers. |
| **All core ability timings expressible** | On Play, Trigger, When Attacking, Activate: Main / Main, On K.O., Counter (number + effect), On Block, Once Per Turn, DON!! xN, end-of-turn / turn-conditional windows, keywords (Rush, Blocker, etc.), search/look-at-style ops — proven with fixtures and tests. |
| **Ops + DSL + custom TS escape hatch** | Shared primitives and an authoring path so card texts are implemented without rewriting the engine. |
| **Ingest ability shells** | `data/sim-ability-shells.json`; routes *when* + raw clauses (incl. static); report must be empty of gaps at plan end |
| **Every current English catalog card playable** | Every card in committed `data/cards.json` is `vanilla` or **done** under the proof bar (shell + script + **passing automated scenario test**). Any two legal lists can start in strict mode. |
| **Automated proof suite** | You do not hand-test every card; `npm test` + catalog closure + shell parity enforce correctness. See **Card effects: ingest + proof**. |
| **Milestones along the way** | Fixtures first, then priority decks so real games exist **before** the full catalog is finished — but the plan is **not** closed until the full catalog is **proven** done. |
| **Headless runner + random-legal agent** | `runGame` can play out games; agents use the same Action API (including choice windows). |
| **Trajectory log schema** | Game steps recordable for later training (format exists; training itself is not done). |
| **Engine docs updated** | This plan’s checklist + battle-sim outline reflect what the code actually does. |

**In one sentence:** after this plan, DeckPool has a real OPTCG rules engine and **every current English card in the catalog can be played accurately** in headless (and later UI) games.

### Still needs to be done (not part of finishing this plan)

| Remaining work | Why it’s separate |
|---|---|
| **Hotseat / battle UI** | Board, animations, choice UX — product layer on top of the engine. |
| **Wire sim into the Next.js app** | Routes, login shell, load your decks from the account into a game, nav entry. |
| **Stronger opponents** | Smarter than random (scripted → heuristic → search). |
| **Trained AI model** | Train and run a learned opponent — uses game logs; not built in this plan. |
| **New sets after plan-close** | When Bandai releases new cards, ingest + author those new cards (ongoing maintenance, same pipeline). |
| **Practice-opponent shelf / import-export** | List/library product work; useful with the sim but not the engine itself. |
| **Online play vs other people** | Networking; explicitly deferred. |
| **Hosted GPU inference** | Only if a model outgrows the browser. |
| **Draw tester as a separate lightweight tool** | Optional. |
| **Batch “sim N games” product UI** | Uses the headless runner; shipping that screen in the app is later. |

**In one sentence:** finishing this plan means **all current cards play in the engine**; it still does **not** mean a polished website battle screen, a smart/AI opponent, or online multiplayer.

### Honest scale note

- Vanillas (no real battle text) are quick.
- Shared patterns (many “On Play: draw 1”) batch well via the shared ops/DSL.
- Leaders and weird Events still take care.
- Expect **full-catalog playability** to dominate calendar time versus building the rules machine itself. The plan orders work so you get **playable games early** (your decks first), then keep going until **nothing in the current catalog is left**.

### Required vs not to close this plan

| Item | Required to close this plan? |
|---|---|
| **All current English cards in `data/cards.json` playable + proven** | **Yes** (shell + script/keyword path + passing proofs; closure green) |
| Shell ingest with **0** `unparsedRemainder` | **Yes** |
| Catalog closure test + coverage report 0 gaps | **Yes** |
| Strict runtime throw on missing script | **Yes** |
| Random agent + headless runner + log format | **Yes** |
| Ability-accurate fixtures + early real-deck games | **Yes** (milestone, not the finish) |
| Hotseat UI in the website | **No** — next plan |
| Heuristic / neural opponent | **No** — next plan |
| Online PvP | **No** — later |
| Future sets not yet in the catalog | **No** — maintenance after |

*(Proof-bar checkboxes formerly duplicated here are folded into this table.)*

---

## Card effects: ingest + proof (read carefully)

You will **not** be expected to hand-play every card in the browser to know the sim is correct. Correctness is enforced by an **automated pipeline**. This section locks that pipeline so there is no ambiguity.

### Plain-English answer

| Question | Answer |
|---|---|
| Does ingest alone make effects “work”? | **No.** Ingest only copies Bandai text and extracts **structure** (when an ability exists, keywords, etc.). |
| What makes an effect actually run in a game? | A **script** for that card (shared pattern or custom), written against the engine’s ops. |
| How do we know the script is right without you testing each card? | Every card gets an **automated scenario test** (or inherits a shared pattern test plus a binding check). `npm test` must pass. Plan is not closed if any card lacks a passing proof. |
| Can an AI/LLM silently invent scripts from English? | **Not as source of truth.** Drafts are allowed only if a human (or you in review) accepts them **and** the scenario test passes against the printed text. |

### Three layers (do not collapse them)

```text
① Catalog text (Bandai via punk-records)
        ↓  ingest (deterministic)
② Ability SHELLS  — “this card has [On Play] … raw clause …”
        ↓  authoring (human/agent + review)
③ Ability SCRIPTS — executable ops / custom TS
        ↓  automated tests (required)
④ PROOF  — scenario asserts expected board changes
```

| Layer | File(s) (planned) | Job | Proves correctness? |
|---|---|---|---|
| ① Catalog | `data/cards.json` | Stats + full `effect` / `trigger` strings | No — data only |
| ② Shells | `data/sim-ability-shells.json` | Split timings, flags (`oncePerTurn`, `donX`), raw clause text per ability | **Partial** — proves we didn’t *miss* a timing tag; does **not** prove behavior |
| ③ Scripts | `data/sim-abilities/` (DSL) + `lib/sim/abilities/custom/` | What the card does | Only with ④ |
| ④ Proofs | `lib/sim/proofs/**/*.test.ts` (+ shared pattern suites) | Given setup → fire ability → assert zones/power/life/hand | **Yes** — this is the quality bar |

### What ingest does (precise)

Extend catalog ingest (or add `scripts/ingest-sim-shells.ts` run in the same maintainer workflow) to, for **every** card:

1. Read `effect` and `trigger` from the catalog card.
2. Split on official bracket timings into **clauses** (On Play, Trigger, When Attacking, …).
3. Detect structured flags on each clause: `oncePerTurn`, `donX` (1/2/…), known keywords already in `compileHas`.
4. Write one shell record per clause:
   - `cardId`
   - `clauseId` (stable, e.g. `OP01-016:onPlay:0`)
   - `timing`
   - `rawText` (exact clause string after the tag)
   - `flags`
   - `sourceField` (`effect` | `trigger`)
5. Classify each card (mutually exclusive status used by closure):
   - `vanilla` — no `effect`, no `trigger`, and no battle keywords that need engine keyword rules beyond stats (rare; most “simple” cards still have Blocker/etc.)
   - `keywordOnly` — no scriptable clauses, but `has` keywords (Blocker, Rush, …) fully handled by **engine keyword rules** + keyword proofs (not per-card DSL)
   - `needsScript` — one or more clauses (including **untagged continuous / static** prose — see below) require a script
6. **Fail the ingest script** if bracket parsing is ambiguous (unclosed tag, unknown critical structure) — do not silently drop text.
7. Emit a **shell completeness report**: every non-empty `effect`/`trigger` character must belong to some clause or an explicit `unparsedRemainder` bucket that **blocks plan-close** until resolved.
8. **Untagged continuous text:** Many Leaders/Characters have static sentences *without* a `[Tag]` (e.g. “All of your {X} Characters gain …”). Ingest must emit a clause with `timing: "static"` (or `continuous`) covering that remainder — **not** leave it as invisible free text. Those clauses are `needsScript`.

Re-run ingest when the English catalog updates. Commit JSON outputs like today’s `cards.json`.

**Resolved file layout:** shells live in **`data/sim-ability-shells.json`** (do not bloat `cards.json`). Scripts in `data/sim-abilities/`; custom TS under `lib/sim/abilities/custom/`. Coverage is **computed in code**, not a hand-edited `sim-coverage.json`.

### What ingest does **not** do

- Does not decide “draw 1” vs “draw 2.”
- Does not invent targets, costs, or exceptions.
- Does not mark a card “working.”
- Does not replace the official rules manual for timing order.

### How a card becomes “done” (definition — no wiggle room)

A card is **done** only if its closure status is one of:

**A. `vanilla`** — ingest classification + automated assert that effect/trigger/keywords still match vanilla rules.

**B. `keywordOnly`** — ingest says no scriptable clauses; all `has` keywords are in the engine’s supported keyword set; **engine-level** keyword proofs exist (one suite per keyword, not one duel per card).

**C. `needsScript` → fully proven** — **all** of:

1. **Shell link:** Every clause (including `static` / untagged continuous) has a script bound to that `clauseId`. (`intentionallyUnsupported` forbidden at plan-close.)
2. **Script exists:** DSL or custom TS for that clause.
3. **Proof exists:** Automated scenario that fires the timing, injects choices, asserts postconditions, and cites printed `rawText`.
4. **Parity:** Shell ↔ script ↔ proof ids align.
5. **Runtime:** Missing script **throws** in strict mode.

**Catalog closure** iterates every `cardId` in `data/cards.json` and fails unless status is vanilla, keywordOnly, or needsScript-with-all-proofs.

### How you avoid testing every card by hand

| Mechanism | What it does for you |
|---|---|
| **Per-clause / pattern scenario tests** | Machine checks outcomes; you run `npm test`. |
| **Shared pattern packs** | Identical normalized `rawText` → one parameterized suite × many `cardId`s. |
| **Keyword engine suites** | One Blocker proof covers all `keywordOnly` / keyword uses; no 376 duplicate blocker tests. |
| **Op-level tests** | Card scripts compose trusted ops. |
| **Catalog closure + shell parity** | CI fails on gaps or unbound clauses. |
| **Random stress (secondary)** | Catches wiring holes, not full oracle correctness. |
| **Golden replays** | Complex Leaders: seed + actions → snapshot. |

**Your role:** spot-check failures and feel — not primary QA for every card.

### Authoring workflow (every card, same steps)

1. Ingest/update shells for `cardId` (including `static` clauses).
2. If `keywordOnly` / `vanilla` → nothing to author beyond ensuring keyword/vanilla gates pass.
3. Else group `needsScript` clauses by normalized `rawText`.
4. New pattern: ops if needed → DSL template → **one** parameterized proof → bind all matching `clauseId`s.
5. Unique text: custom TS or one-off DSL → dedicated proof.
6. Run `npm test`. Status is **computed** from shells ∪ bindings ∪ registered proofs — **do not** hand-edit a “done” checkbox file.

### Precision rules (errors we refuse)

| Rule | Why |
|---|---|
| No silent LLM codegen without proof | Wrong effects look playable |
| No “done” without proof / keyword gate | Checkboxes lie |
| No plan-close with `unparsedRemainder` or unbound shells | Hidden text = lying sim |
| Untagged continuous prose must become `static` clauses | Otherwise Leaders silently lose auras |
| Pattern batching only when normalized `rawText` equal (document normalize rules) | Similar English ≠ same rules |
| Counter **number** from catalog; Counter **effect** from script | Don’t assume number-only |
| Construction-only deckbuilding text ≠ battle script unless it also has battle timings | Don’t double-apply brew rules |
| Keywords via engine + `has`; don’t duplicate keyword logic inside every card script | Inefficient and drift-prone |

### New CI / npm commands (to add when coding)

| Command | Purpose |
|---|---|
| `npm test` | Existing + all `lib/sim/**/*.test.ts` including proofs + catalog closure |
| `npm run ingest-catalog` | Existing cards/packs/rules/has |
| `npm run ingest-sim-shells` | Build/refresh `sim-ability-shells.json` (+ fail on unparsed) |
| `npm run sim-coverage-report` | done / needsScript / keywordOnly / vanilla counts; list gaps |

Plan-close: coverage report **0 gaps** + catalog closure green.

---

## How to read this plan

Each step has: **Summary**, **Why**, **Code changes**, **Why this shape**, **Leverage**, **Do not touch**, **Done when**, **Depends on**.

**Global rules for every step**

- Engine code is **pure TypeScript**: no React, no Firebase, no `fetch`, no DOM.
- Tests: `tsx --test` + `node:test` + `node:assert/strict` (same as `lib/compileHas.test.ts`).
- Prefer immutable/cloned updates inside `applyAction`.
- Every timing and primitive gets tests. Every authored card ability gets tests.
- Never silently invent an effect. Missing scripts **throw** in strict mode (and in proofs). Dev fixtures may use undoned cards only if tests expect the throw or supply scripts.
- Do **not** auto-translate free English into code with an LLM as source of truth. Ingest structures shells; scripts + proofs are the authority for behavior.

---

## Rules pillars (all in scope)

These pillars define “the engine is rules-complete.” Card coverage is separate.

### A. Match setup

- Two seats, Leader + 50 (no Don in main — catalog already strips Don).
- Life = Leader life (catalog `cost` on Leaders).
- Opening hand, mulligan, who goes first, DON!! deck size — per official rules we document against the manual.
- Zones: deck, hand, trash, life, character area (**respect official character limit if any**), stage area (**official stage rules**), Leader, DON!! (available / rested / attached), banish if used, tokens if needed later.

### B. Turn structure

- Refresh (active characters, Leader, DON!! as rules require).
- Draw.
- DON!! gain.
- Main (play, activate, attach, attack, …).
- End of turn windows (`[End of Your Turn]`, clear “until end of turn” / “until your next turn” buffers correctly).

### C. Priority, choices, and an effect queue

- When multiple abilities trigger, order and choice windows follow OPTCG rules (document the manual sections we implement).
- Player decisions that are part of an effect (targets, “up to N”, order of cards to bottom) are **Actions** in a nested window — same API as playing a card.
- Continuous effects and lasting buffs live in a modifier layer (power, counter, cost changes, “cannot be K.O.’d”, etc.).

### D. Paying costs and playing cards

- Play Character / Stage / Event for cost with active DON!!.
- Color identity / Leader forbid as safety checks (lists should already be legal).
- Playing a card **must** open the correct ability windows (On Play, etc.).

### E. Combat

- Declare attack; `[When Attacking]` / Leader attack abilities; `[On Your Opponent's Attack]`; Blocker; `[On Block]`; Counter number **and** `[Counter]` effects; power math with DON!! and modifiers; KO; life loss; Double Attack; Banish; Unblockable; Rush (including Rush: Character if distinct).

### F. Ability timings (from catalog — must all be expressible)

Approximate frequencies in current `data/cards.json` (bracket tags; for planning only):

| Tag / kind | ~Count | Engine must support |
|---|---|---|
| On Play | 942 | Yes |
| Trigger | 541 | Yes (life card → hand window) |
| Blocker | 376 | Yes (keyword) |
| Activate: Main | 376 | Yes |
| Main | 341 | Yes (often Event/Character activate text) |
| Once Per Turn | 314 | Yes (usage flags) |
| When Attacking | 257 | Yes |
| Counter | 207 | Yes (effect + number) |
| DON!! x1 / x2 / … | 177+ | Yes (cost condition on abilities) |
| On K.O. | 170 | Yes |
| Your Turn / Opponent's Turn | 107+ | Yes (conditional continuous / activate) |
| Rush | 93 | Yes |
| On Your Opponent's Attack | 58 | Yes |
| End of Your Turn | 52 | Yes |
| Double Attack / Banish / Unblockable / On Block | fewer | Yes |
| Leader-named markers in text | various | Route via cardId scripts |

Also: continuous Leader skills (“all your X gain …”), replacement effects, and search/look-at/reveal/bottom/top patterns that appear inside the timings above.

### G. Keywords

All official keywords we care about for play — driven by `has` and/or ability scripts, not ignored.

### H. Winning

Life to 0, and any other official loss conditions we document (deckout, etc.).

---

## Coverage vs rules (honest metric)

| Term | Meaning |
|---|---|
| **Rules-complete engine** | Pillars A–H exist; any ability *kind* can be expressed |
| **Card done** | Closure status vanilla, keywordOnly, or needsScript with all clause proofs green |
| **Deck ready** | Every cardId in both lists is done (required to start strict games) |
| **Catalog complete** | Every id in committed `data/cards.json` is done — **required to close this plan** |

Ship modes:

- **Strict:** cannot start if any card in either list is not done.
- **Dev (mid-authoring only):** may allow undoned cards in fixtures; any fire of a missing script **throws** (never silent no-op).

**Plan goal:** catalog complete (all current English cards proven). Priority decks are an **early milestone**, not the finish line.

---

## Phase 0 — Prep

### Step 0.1 — Cut the feature branch

| | |
|---|---|
| **Summary** | Create and check out `battle-sim` from `main`. |
| **Why** | Isolate long-running engine work from the live deckbuilder. |
| **Code changes** | Git only. |
| **Why this shape** | `main` stays shippable. |
| **Leverage** | Existing `origin` / PR flow. |
| **Do not touch** | Prod env, Firestore rules, Vercel. |
| **Done when** | Branch exists. |
| **Depends on** | None. |

### Step 0.2 — Confirm package layout

| | |
|---|---|
| **Summary** | Engine at `lib/sim/`, shared types at `types/sim.ts`, tests `lib/sim/**/*.test.ts`, abilities under `lib/sim/abilities/`. No `/sim` route until a rules slice is green. |
| **Why** | Existing `npm test` glob picks up `lib/**/*.test.ts` with no tooling change. |
| **Code changes** | Doc agreement only. |
| **Leverage** | `@/*` alias; `package.json` test script. |
| **Do not touch** | App routes. |
| **Done when** | Paths recorded. |
| **Depends on** | 0.1. |

### Step 0.3 — Freeze the **rules pillars** checklist (not a “cut down the game” list)

| | |
|---|---|
| **Summary** | Accept the pillars A–H above as the definition of engine completeness. Optionally pin an official rules version / date we implement against. |
| **Why** | Stops re-litigating whether Triggers “count.” They do. |
| **Code changes** | This doc + `DECKPOOL_BATTLE_SIM.md` locked decisions. |
| **Why this shape** | Sequencing below is **build order for a full rules engine**, not permission to ship without abilities. |
| **Leverage** | Bandai rule manual + catalog bracket tags. |
| **Do not touch** | Declaring On Play / Trigger “out of scope.” |
| **Done when** | Pillars accepted. |
| **Depends on** | 0.2. |

### Step 0.4 — Ability authoring format (**locked: hybrid**)

| | |
|---|---|
| **Summary** | **Decision: hybrid.** DSL/JSON ops for common clauses; TypeScript escape hatch for awkward Leaders/Events. |
| **Why** | ~900 On Plays; pure one-file-per-card won’t scale; pure English parse will be wrong. |
| **Code changes** | Stub `data/sim-abilities/`, `lib/sim/ops/`, `lib/sim/abilities/custom/`. |
| **Why this shape** | Shared ops + pattern proofs; custom only when DSL is a bad fit. |
| **Leverage** | Construction-rules pattern as precedent for data-driven exceptions. |
| **Do not touch** | LLM as silent codegen in CI. |
| **Done when** | Folders reserved; this decision stays locked unless explicitly revisited. |
| **Depends on** | 0.3. |

---

## Phase 1 — Skeleton (types, RNG, API)

### Step 1.1 — Core types

| | |
|---|---|
| **Summary** | `SeatId`, phases, `CardInstance`, zones, `GameState`, `Action`, `GameEvent`, `StepResult`, `SeatObservation`, plus **effect-system types**: `AbilityWindow`, `QueuedAbility`, `Modifier`, `ChoiceRequest`. |
| **Why** | If choice/queue types are bolted on later, combat and On Play get rewritten. Put them in the type model now. |
| **Code changes** | `types/sim.ts`. |
| **Why this shape** | Instance ids ≠ `cardId`. Variation maps expand at setup. |
| **Leverage** | `types/catalog.ts`. |
| **Do not touch** | Firestore types; do not require new catalog fields yet. |
| **Done when** | Types compile. |
| **Depends on** | 0.2. |

### Step 1.2 — Seeded RNG

| | |
|---|---|
| **Summary** | Deterministic PRNG owned by `GameState` (`next`, `shuffle`). |
| **Why** | Replays, tests, self-play. |
| **Code changes** | `lib/sim/rng.ts` + tests. |
| **Why this shape** | No `Math.random()` in the engine. |
| **Leverage** | Existing test style. |
| **Done when** | Same seed ⇒ same shuffle. |
| **Depends on** | 1.1. |

### Step 1.3 — Public API surface

| | |
|---|---|
| **Summary** | `createGame`, `legalActions`, `applyAction`, `observe`, `isTerminal`, plus `getCoverageReport(lists)` (can stub). |
| **Why** | UI and AI share one contract; coverage gate is part of “accurate sim.” |
| **Code changes** | `lib/sim/engine.ts`, `lib/sim/index.ts`. |
| **Leverage** | Pure-function style of `lib/legality.ts`. |
| **Done when** | Imports work; stubs typed. |
| **Depends on** | 1.1–1.2. |

---

## Phase 2 — Setup and privacy

### Step 2.1 — Catalog injection

| | |
|---|---|
| **Summary** | `cardsById: Map<string, DeckPoolCard>` passed into `createGame`; fixtures for tests. |
| **Why** | Stats and ability text stay catalog-sourced. |
| **Code changes** | `lib/sim/catalog.ts`. |
| **Leverage** | `DeckPoolCard`; `isMainDeckCategory` (`lib/builder.ts`). |
| **Done when** | Fixture map works. |
| **Depends on** | 1.3. |

### Step 2.2 — Expand count maps → instances

| | |
|---|---|
| **Summary** | `expandDeckList(leaderId, cards)` → 50 instances + Leader instance. |
| **Why** | DeckPool stores quantities; engine needs instances. |
| **Code changes** | `lib/sim/deckExpand.ts` + tests. |
| **Leverage** | `cleanCardsMap`, `mainDeckCount`, `validateVariation`. |
| **Done when** | Qty maps expand correctly; Leader not in the 50. |
| **Depends on** | 2.1. |

### Step 2.3 — Full setup per rules

| | |
|---|---|
| **Summary** | Shuffle, life pile, opening hand, DON!! deck, first player — **match documented official setup**. |
| **Why** | Wrong setup invalidates every later ability test. |
| **Code changes** | `lib/sim/setup.ts` + tests. |
| **Leverage** | Leader `cost` as life. |
| **Done when** | Setup tests locked to the documented rules. |
| **Depends on** | 1.2, 2.2. |

### Step 2.4 — Mulligan as real actions

| | |
|---|---|
| **Summary** | Implement mulligan/keep windows as Actions (not skipped). |
| **Why** | Core setup rule; AI will need it. |
| **Code changes** | Setup phase actions. |
| **Done when** | Mulligan tests pass. |
| **Depends on** | 2.3. |

### Step 2.5 — `observe` privacy

| | |
|---|---|
| **Summary** | Hide opponent hand/deck order/face-down life as rules require; expose choice UI data for the acting seat. |
| **Why** | AI-ready; correct hidden info for Triggers face-down, etc. |
| **Code changes** | `lib/sim/observe.ts` + privacy tests. |
| **Done when** | Privacy tests pass. |
| **Depends on** | 2.3. |

---

## Phase 3 — Turn structure + effect queue (before “vanilla combat only”)

### Step 3.1 — Phases and turn advance

| | |
|---|---|
| **Summary** | Refresh → draw → DON!! → main → end, with correct automatic steps and end-of-turn ability checks. |
| **Why** | Abilities are phase-gated (`Activate: Main`, `End of Your Turn`, …). |
| **Code changes** | `lib/sim/phases.ts`. |
| **Done when** | Empty-board turn cycle works; events emit. |
| **Depends on** | 2.3. |

### Step 3.2 — Effect queue / stack / nested choice windows

| | |
|---|---|
| **Summary** | Implement a queue: enqueue abilities → resolve one → if it needs a target/order choice, pause for Actions → continue. Support multiple triggers waiting. |
| **Why** | **This is the heart of an accurate OPTCG engine.** On Play, Trigger, On K.O., and Counter effects all need it. Building combat without this forces a rewrite. |
| **Code changes** | `lib/sim/queue.ts`, `lib/sim/choices.ts`. |
| **Why this shape** | Same `legalActions`/`applyAction` loop; “choose target” is just another Action. |
| **Leverage** | None in repo — new. |
| **Done when** | Unit test: enqueue two fake abilities that each need a target; resolution order + choices work. |
| **Depends on** | 1.1, 3.1. |

### Step 3.3 — Modifier / continuous-effect layer

| | |
|---|---|
| **Summary** | Power/cost/counter/keyword grants with durations (`until end of turn`, `until your next turn`, `while this is in play`, static Leader auras). |
| **Why** | Huge fraction of Leader and Character text is continuous or temporary modifiers. |
| **Code changes** | `lib/sim/modifiers.ts` + tests. |
| **Done when** | Apply/remove modifier changes computed power; expires on correct phase. |
| **Depends on** | 3.1. |

### Step 3.4 — Once Per Turn + DON!! xN checks

| | |
|---|---|
| **Summary** | Per-card/per-ability usage flags; ability activation checks attached/active DON!! counts. |
| **Why** | Extremely common tags in the catalog. |
| **Code changes** | Part of ability gate helpers. |
| **Leverage** | Shell flags once shells exist; until then hardcode in fixtures. |
| **Done when** | Second activation in one turn rejected; DON!! x1 gate works with stubbed DON!! counts. |
| **Depends on** | 3.2. *(Full DON!! economy is Step 4.1 — stub counts here to avoid a circular wait.)* |

---

## Phase 4 — Resources, play, and **On Play as a first-class path**

### Step 4.0 — Minimal ops bootstrap (same modules Phase 6 expands)

| | |
|---|---|
| **Summary** | Create `lib/sim/ops/` with the small set needed for On Play fixtures: `draw`, `restDon`/`activeDon`, `powerMod`, `ko` (cost-capped). **Do not invent a second ops system in Phase 6 — only grow this folder.** |
| **Why** | Phase 4–5 need real scripts before the full op catalog; avoiding a throwaway API saves a rewrite. |
| **Code changes** | `lib/sim/ops/*.ts` + tests for each bootstrap op. |
| **Done when** | Fixture On Plays call these ops. |
| **Depends on** | 3.2. |

### Step 4.1 — DON!! model

| | |
|---|---|
| **Summary** | Available / rested / attached; refresh; gain; paying play cost; attach for +1000. Match official rules. Replace Step 3.4 stubs with real counts. |
| **Code changes** | `lib/sim/don.ts`. |
| **Done when** | Resource tests pass; 3.4 gates use real DON!!. |
| **Depends on** | 3.1, 4.0. |

### Step 4.2 — Play Character / Stage / Event

| | |
|---|---|
| **Summary** | Pay cost, move zones, then **enqueue On Play** (and related) abilities — not “skip text.” |
| **Why** | Playing cards without On Play is incorrect rules. |
| **Code changes** | `lib/sim/play.ts`. |
| **Leverage** | `isMainDeckCategory`, colors; missing script throws in strict/fixture mode. |
| **Done when** | Playing a fixture card with On Play runs the queue (see 4.3). |
| **Depends on** | 3.2, 4.1. |

### Step 4.3 — First real On Play scripts (fixtures)

| | |
|---|---|
| **Summary** | Implement 3–5 fixture On Plays using bootstrap ops from 4.0. |
| **Why** | Proves pillar F for On Play before expanding combat. |
| **Code changes** | `lib/sim/abilities/fixtures/…` calling `lib/sim/ops`. |
| **Done when** | Tests assert board/hand after each On Play. |
| **Depends on** | 4.2, 4.0, 3.2. |

### Step 4.4 — Activate: Main + `[Main]` activates

| | |
|---|---|
| **Summary** | Actions to activate in-play / hand abilities that are legal in Main; pay any DON!! xN; enqueue effects. |
| **Why** | Core Leader/Character pattern (~376 Activate: Main tags). |
| **Code changes** | `lib/sim/activate.ts` + ability gates. |
| **Done when** | Fixture Leader Activate: Main works once per turn. |
| **Depends on** | 3.4, 4.1, 3.2. |

---

## Phase 5 — Combat **with** attack triggers and full windows

### Step 5.1 — Declare attack + When Attacking

| | |
|---|---|
| **Summary** | Rest attacker, declare target, **enqueue `[When Attacking]`** (and Leader equivalents) before block/counter as rules order requires. |
| **Why** | When Attacking is core (~257 tags), not optional polish. |
| **Code changes** | `lib/sim/combat.ts`. |
| **Done when** | Fixture When Attacking (e.g. +power or draw) resolves in the correct window. |
| **Depends on** | 3.2, 4.1, 4.2. |

### Step 5.2 — On Your Opponent's Attack / defensive activates

| | |
|---|---|
| **Summary** | Defender windows for those timings where the manual allows. |
| **Why** | Present in catalog; missing them breaks many decks. |
| **Code changes** | Combat windows. |
| **Done when** | Fixture test passes. |
| **Depends on** | 5.1. |

### Step 5.3 — Blocker + On Block

| | |
|---|---|
| **Summary** | Blocker keyword from `has`; enqueue `[On Block]` if present. |
| **Leverage** | `compileHas` / `card.has`. |
| **Done when** | Block redirect + On Block fixture work. |
| **Depends on** | 5.1. |

### Step 5.4 — Counter number **and** Counter effects

| | |
|---|---|
| **Summary** | Play counter from hand: add `counter` value; enqueue `[Counter]` ability text scripts (draw, play from top, etc. via ops). |
| **Why** | Numeric-only counters are incomplete rules. |
| **Leverage** | `DeckPoolCard.counter`; effect scripts for the rest. |
| **Done when** | One numeric-only and one Counter-effect fixture both pass. |
| **Depends on** | 5.1, 3.2, **4.0** (bootstrap ops; Phase 6 only expands the same ops). |

### Step 5.5 — Resolve, KO, On K.O., life, Trigger

| | |
|---|---|
| **Summary** | KO → trash/banish → enqueue `[On K.O.]`. Life loss → take life card → **Trigger window** (play as Event-like / ability per rules) with full choice support. |
| **Why** | Trigger (~541) and On K.O. (~170) are among the most common ability kinds. Without them the sim is wrong. |
| **Code changes** | `lib/sim/combat.ts`, `lib/sim/trigger.ts`, ability hooks. |
| **Done when** | Fixture: life taken → Trigger draws or plays as scripted; KO → On K.O. runs. |
| **Depends on** | 5.4, 3.2. |

### Step 5.6 — Rush, Double Attack, Banish, Unblockable

| | |
|---|---|
| **Summary** | Keyword rules fully wired. |
| **Leverage** | `card.has`. |
| **Done when** | One test each. |
| **Depends on** | 5.5. |

### Step 5.7 — Win/lose

| | |
|---|---|
| **Summary** | Official loss conditions. |
| **Done when** | Terminal detection tested. |
| **Depends on** | 5.5. |

---

## Phase 6 — Effect ops library (expand Step 4.0 — do not replace)

### Step 6.1 — Grow primitive ops catalog

| | |
|---|---|
| **Summary** | Expand `lib/sim/ops/` with remaining primitives: mill, attachDon/returnDon, trash, banish, costMod, searchDeck (look at N, reveal, add to hand, bottom in order), may/upTo, selectTarget, dealToLife, etc. |
| **Why** | Most cards are compositions of these. |
| **Code changes** | Same `lib/sim/ops/*.ts` + tests — **no parallel ops API**. |
| **Done when** | Each new op has tests; search choice window works end-to-end. |
| **Depends on** | 3.2, 4.0. |

### Step 6.2 — DSL / JSON ability schema

| | |
|---|---|
| **Summary** | Define schema for an ability: `timing`, `conditions` (DON!! xN, once per turn, type checks), `ops[]`. Load from `data/sim-abilities/*.json` or embedded TS const. |
| **Why** | Lets ingest helpers and humans author common cards without bespoke code every time. |
| **Code changes** | `types/simAbility.ts`, loader, validator. |
| **Done when** | A JSON On Play “draw 1” matches the TS fixture behavior. |
| **Depends on** | 6.1. |

### Step 6.3 — TS escape hatch for complex Leaders

| | |
|---|---|
| **Summary** | Registry `cardId → handler` for abilities that are awkward in DSL. |
| **Why** | Some Leaders/Events are genuinely special. |
| **Code changes** | `lib/sim/abilities/custom/*.ts`. |
| **Done when** | One custom Leader ability works beside DSL cards. |
| **Depends on** | 3.2, 6.1. |

---

## Phase 7 — Catalog / ingest enrichment + proof plumbing

### Step 7.1 — Extract structured **ability shells** at ingest

| | |
|---|---|
| **Summary** | Implement shell ingest exactly as specified in **Card effects: ingest + proof**: clause split, flags, `clauseId`, `unparsedRemainder` fail, vanilla vs needsScript. |
| **Why** | Runtime must not regex prose ad hoc; missing text must be visible. |
| **Code changes** | `lib/compileAbilityShells.ts` + `scripts/ingest-sim-shells.ts` + `data/sim-ability-shells.json` + shell unit tests (golden strings from real cards). |
| **Why this shape** | Shells = *when* + raw text; never claim shells execute. |
| **Leverage** | `scripts/ingest-catalog.ts`, `lib/compileHas.ts`. |
| **Do not touch** | Treating shells as finished abilities. |
| **Done when** | Ingest fails on ambiguous parse; completeness report has a defined empty-remainder gate; spot golden cards match expected clauses. |
| **Depends on** | 0.4; can parallelize after Phase 1. |

### Step 7.2 — Keep / extend `has` keywords

| | |
|---|---|
| **Summary** | Continue `compileHas` for Blocker, Rush, etc.; fix gaps if keywords are missed. |
| **Why** | Keywords stay fast flags; proofs still assert keyword behavior. |
| **Leverage** | Existing `compileHas`. |
| **Done when** | Keyword flags match tests. |
| **Depends on** | — |

### Step 7.3 — Derived coverage registry + catalog closure test

| | |
|---|---|
| **Summary** | Compute status from shells ∪ script bindings ∪ proof registration. Add `lib/sim/proofs/catalogClosure.test.ts` that fails if any `cards.json` id is not vanilla/done. Add `npm run sim-coverage-report`. |
| **Why** | Hand-edited “done” flags drift; closure test is the plan-close gate. |
| **Code changes** | `lib/sim/coverage.ts`, report script, closure test. |
| **Done when** | Deliberately omitting one binding fails CI. |
| **Depends on** | 7.1, 6.2. |

### Step 7.4 — Proof harness + pattern batching

| | |
|---|---|
| **Summary** | Build `withProofHarness()` helpers: seed game, put card in hand/life/board, fire timing, inject choices, assert. Support parameterized tables: same proof × many `cardId`s that share normalized `rawText`. |
| **Why** | This is how thousands of cards get verified without manual play. |
| **Code changes** | `lib/sim/proofs/harness.ts`, `lib/sim/proofs/patterns/*.ts`. |
| **Done when** | One pattern (“On Play draw 1”) covers N real cards in one suite; unique card has its own proof file. |
| **Depends on** | 6.1, 4.3, 7.1. |

### Step 7.5 — Authoring workflow (locked)

| | |
|---|---|
| **Summary** | Follow the six steps in **Card effects: ingest + proof** for every clause until closure is green. Document in-repo (`DECKPOOL_BATTLE_SIM.md` or short `lib/sim/README`). |
| **Why** | No ad-hoc “I think this card works.” |
| **Done when** | Doc committed; first 20 real cards done under the proof bar; closure test lists only the remaining gaps. |
| **Depends on** | 7.3, 7.4. |

---

## Phase 8 — Remaining timing pillars (explicitly scheduled)

Each step: fixture + at least one **real** catalog card script + tests.

### Step 8.1 — `[Your Turn]` / `[Opponent's Turn]` conditionals  
### Step 8.2 — `[End of Your Turn]`  
### Step 8.3 — Static / continuous Leader and Character auras  
### Step 8.4 — Replacement effects / “cannot be K.O.’d” style rules as modifiers  
### Step 8.5 — Attachments / mid-combat mid-main edge cases per manual  

| | |
|---|---|
| **Summary** | Close remaining pillar-F timings so the engine is rules-complete even if many cards are still uncovered. |
| **Why** | User requirement: no rules class left undefined. |
| **Done when** | Checklist of timings in pillars F all have engine support + a fixture proof. |
| **Depends on** | Phases 3–6 (**before** mass catalog authoring in 9.3). |

---

## Phase 9 — Integration, DeckPool lists, strict coverage

### Step 9.1 — Vertical slice: **ability-accurate** combat game

| | |
|---|---|
| **Summary** | Headless game using fixture (or fully covered mini-lists) that exercises On Play, When Attacking, Blocker, Counter effect, life Trigger, On K.O. in one flow. |
| **Why** | Definition of “truth engine working.” |
| **Done when** | Integration test green. |
| **Depends on** | 5.x, 4.3, 6.x. |

### Step 9.2 — `createGameFromLists` + strict coverage gate

| | |
|---|---|
| **Summary** | Build from DeckPool variation maps; **strict mode** refuses uncovered cardIds. |
| **Leverage** | `types/deck.ts`, `validateVariation`. |
| **Done when** | Covered lists start; uncovered lists error clearly. |
| **Depends on** | 7.3, 9.1. |

### Step 9.3 — Expand real-card coverage toward the full catalog

| | |
|---|---|
| **Summary** | Author scripts + **proofs** until catalog closure is green (every card vanilla or done). Use pattern batches wherever `rawText` normalizes equal. |
| **Why** | Plan finish line: all current cards playable **and** machine-proven. |
| **Done when** | `npm test` closure green; `sim-coverage-report` shows 0 gaps; 0 `unparsedRemainder`. |
| **Depends on** | 7.5, 8.x, 9.2. |

### Step 9.4 — Random stress + complex golden replays

| | |
|---|---|
| **Summary** | Nightly/CI job: N random games from random covered lists; fail on throw. Add golden replays for top complex Leaders. |
| **Why** | Secondary net for wiring bugs; not a substitute for per-clause proofs. |
| **Done when** | Stress job exists; at least several Leader goldens committed. |
| **Depends on** | 9.3 (or parallel once enough cards done). |

---

## Phase 10 — Agents (after rules machine exists)

### Step 10.1 — Random legal agent (respects choice windows)  
### Step 10.2 — `runGame` headless loop  
### Step 10.3 — Trajectory log schema (observations must not leak hidden info)  

| | |
|---|---|
| **Why** | Training later needs full rules + choices; agents that ignore Trigger windows are useless. |
| **Depends on** | 9.1. *(May land in parallel with 9.3 authoring; does not wait for full catalog.)* |

---

## Phase 11 — Docs / merge policy

### Step 11.1 — Update `DECKPOOL_BATTLE_SIM.md` + `DECKPOOL_CODEBASE.md` when routes/behavior exist  
### Step 11.2 — UI accuracy copy  

During mid-dev: never claim accuracy for lists with undoned cards.  
**After this plan closes** (catalog complete): UI may state that current English catalog cards are supported; still label batch results as simulated practice; new sets remain unsupported until authored.

---

## Later handoffs (not rules)

| Handoff | Notes |
|---|---|
| Hotseat UI | Renders observations + choice windows |
| Heuristic / search / neural agents | Same Action API |
| Practice opponent shelf | Lists only; after plan-close, current-catalog lists are playable |
| PvP | Infra only after solo accuracy |
| ML training | Headless self-play; full catalog pool available after plan-close |

---

## Existing code leverage map

| Module | Role |
|---|---|
| `types/catalog.ts` / `data/cards.json` | Stats, prose, images |
| `lib/compileHas.ts` | Keywords |
| New `compileAbilityShells` | Timing + static shells at ingest |
| `lib/builder.ts` / `lib/construction.ts` / `lib/legality.ts` | Pre-game list sanity |
| `types/deck.ts` / `cleanCardsMap` | List → instances |
| `lib/*.test.ts` | Test patterns |
| CatalogProvider (later) | Inject `cardsById` into UI |

---

## Explicit non-goals (product / infra — **not** game rules)

- Online matchmaking / PvP sync  
- React UI before the rules machine + proofs are real  
- Chatbot-as-rules  
- Firestore per-frame game state as the engine  
- Silent LLM effect codegen as authority  
- Hand-edited coverage honor files  

---

## Suggested commit sequence (efficient order)

1. Branch + types (queue/choice/modifier) + RNG  
2. Setup + mulligan + observe  
3. Phases + **effect queue + choices + modifiers**  
4. **Shell ingest early** (7.1) so pattern frequency guides which ops to build next  
5. Bootstrap ops (4.0) + DON!! + play + On Play fixtures  
6. Activate: Main  
7. Combat with When Attacking, Block, Counter effects, KO, Trigger + keyword suites  
8. Expand ops (6.x) + DSL schema + custom escape hatch  
9. Proof harness + catalog closure (7.3–7.4)  
10. Remaining timings (8.x)  
11. Strict `fromDeckPool` + priority decks proven  
12. Full catalog authoring until closure green + stress/goldens  
13. Random agent + runGame + trajectories (can start after step 11)  
14. Docs  

---

## Immediate next action (when you say go)

Open **`DECKPOOL_BATTLE_SIM_AGENTS.md`**, set STATUS to W0 `in_progress`, and execute waves in order. This engine plan is the procedure manual; the agents file is the handoff board.

**Steps 0.1 → 1.3** map to waves **W0–W1**. Prefer **W3 (queue)** and **W4 (shells)** early. First vertical slice = **W11**. Plan does not close until **W13** closure is green.

---

## Review log (2026-09-11)

Issues found and fixed in this pass:

| Issue | Fix |
|---|---|
| “Coverage vs rules” still said finish = one deck | Aligned to **catalog complete** |
| Authoring step “mark done” vs computed coverage | Removed hand checkbox; status computed only |
| Keyword-only cards would force thousands of duplicate proofs | Added `keywordOnly` + engine keyword suites |
| Untagged Leader continuous text could be dropped | Ingest must emit `static` clauses |
| Phase 5 depended on “ops library” before Phase 6 | Added **4.0 bootstrap ops**; Phase 6 only expands |
| Risk of two ops APIs | Explicit “same folder, do not replace” |
| Shell ingest scheduled too late for efficiency | Commit sequence runs **7.1 early** |
| `sim-coverage.json` implied hand file | Locked: **no** hand coverage file; compute in code |
| Open question shells-in-cards vs separate file | Locked: `data/sim-ability-shells.json` |
| Hybrid format still “recommendation” | Locked hybrid |
| Phase 9.3 didn’t depend on Phase 8 timings | Depends on **8.x** |
| Phase 10 blocked on full catalog | Parallel after 9.1 |
| Duplicate proof-bar checklists | Merged into required table |
