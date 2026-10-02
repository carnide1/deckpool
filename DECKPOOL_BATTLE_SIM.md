# DeckPool — Battle sim outline

**Status:** Planning / decision record (not implemented)  
**Last updated:** 2026-09-11 (aligned with engine-plan full review)  
**Product:** A custom One Piece Card Game battle simulator that feels excellent to play, starts solo, and is built so a trained model can eventually sit in the opponent seat.

This file is the living outline for the battle sim. It extends (and does not replace) idea 3 / idea 6 in `DECKPOOL_FUTURE_FEATURES.md`. If this file and that one disagree on **battle-sim decisions after 2026-09-11**, trust this file. For unrelated future features, trust `DECKPOOL_FUTURE_FEATURES.md`. For how the live app works today, trust `DECKPOOL_CODEBASE.md`.

**Step-by-step truth-engine plan:** `DECKPOOL_BATTLE_SIM_ENGINE_PLAN.md` (full rules; ingest → script → automated proofs; catalog complete to close).

**Multi-agent execution / handoff:** `DECKPOOL_BATTLE_SIM_AGENTS.md` — waves W0–W16, STATUS block at top, progress checklists. New agents start there.

**Finish line for that plan:** see **“Definition of done”** + **“Card effects: ingest + proof”** + **Review log** — all current English cards playable and machine-proven. Still left after that: UI, stronger/AI opponents, new sets, PvP, etc.

**Do not implement this unless the user asks.** V1 deckbuilding stays separate.

---

## Goals

1. **Smooth solo battle experience** — a sim that looks good and is optimal for how we want to play OP-TCG, not a clone of the common unrefined tools.
2. **Practice first** — use DeckPool lists (and later tournament “practice opponent” lists) in real games against something that always makes legal moves.
3. **Path to a real AI opponent** — not a chatbot that narrates a game; a model that chooses legal actions from the same engine humans use.
4. **Cost-aware growth** — start local/client-side; only add hosted infra when hotseat + weak bots are no longer enough.

## Non-goals (for now)

- Online matchmaking / stranger PvP (explicitly deferred).
- Treating chatbot prose as a rules engine.
- Mixing simulated practice into a real win/loss log (if/when match history exists).
- Shipping the sim as a Firestore-shaped “fake game.” The game needs a real engine and loop.
- Calling a match “accurate” in the UI when either list still has **uncovered** card abilities.

**Not a non-goal:** Triggers, On Play, When Attacking, Leader abilities, Counter effects, On K.O., search/look-at, static/continuous text, and other official timings. Those are **in scope**. Mid-plan, individual cards may still be undoned; **plan-close requires the whole current catalog proven.**

---

## Locked decisions

| Topic | Decision |
|---|---|
| Product posture | Solo practice sim first. Perfect the play feel before multiplayer. |
| First opponent | **Hotseat / play both seats** (you control both sides). Not a stopgap — the correct first opponent. |
| Next opponents | Scripted seat → heuristic bot → search (e.g. MCTS) → trained model. Online humans last. |
| Architecture | **Pure rules engine owns truth.** UI and AI are two clients of the same action API. |
| Rules scope | **Full OPTCG rules capability.** Timings and ability kinds are first-class (effect queue, choices, modifiers). No “combat-only ruleset” product. |
| Card coverage | **All current English cards in `data/cards.json` must be playable before this engine plan is closed.** Ship playable priority decks early as milestones; do not stop at one matchup. New sets after close are maintenance. |
| Effect authoring | **Hybrid:** shared ops + DSL for common lines; TypeScript for complex cards. Ingest builds **shells** only. A card is done only with shell + script + **passing scenario proof**. Coverage status is **computed**, not a hand-edited honor system. |
| Ingest | Re-ingest/parallel script emits ability shells (`clauseId`, timing, raw text, flags). Fail on unparsed remainder. Keywords via `compileHas`. Shells do **not** execute effects. |
| Verification | Catalog closure test + per-clause/pattern proofs + strict runtime throw on missing script. You run `npm test` / coverage report — you do not manually verify every card in a live duel. |
| Hosting v0 | **Client / local TypeScript engine** is enough for hotseat + weak bots. No new paid game host required to start. |
| Training | Outside the website. After plan-close, self-play can use the full current catalog. Episodic cost. |
| PvP / heavy inference | Only after solo accuracy is real. |
| DeckPool fit | Sim consumes deck/variation lists from DeckPool. New system beside the builder. |
| Honesty | Batch results = **simulated practice**. UI must not claim full accuracy for uncovered lists. |
| Git | Long-lived `battle-sim` branch; keep `main` shippable. |

---

## Truth engine — how it works

The engine is a **pure state machine**. No React, no Firestore, no network.

```text
createGame(deckA, deckB, seed)  // strict: both lists deck-covered
        ↓
   GameState  (zones, modifiers, effect queue, RNG)
        ↓
legalActions(state, seat)  →  Action[]   // includes nested choices
        ↓
applyAction(state, action) →  { state', events[], terminal? }
        ↓
   (queue may open On Play / Trigger / When Attacking / … windows)
        ↓
   (repeat until winner / draw)
```

| Piece | Job |
|---|---|
| `GameState` | Boards, hands, decks, life, DON!!, phase, turn, pending combat, **effect queue**, **modifiers**, RNG |
| `Action` | Player choice: play, activate, attack, block, counter, **effect targets / search order**, end phase, … |
| `legalActions` | What the seat that must act may do (including inside ability windows) |
| `applyAction` | Mutate state; resolve/enqueue abilities; emit events |
| `observe(state, seat)` | Rules-legal view for UI/AI (no god-view leaks) |
| Ability scripts / DSL | Executable meaning of printed text, keyed by `cardId` + timing |
| Coverage report | Which cardIds in a list still lack scripts |

**UI and bots never change state directly.** They only propose an `Action`.

### Beginning of the process

Do **not** start by authoring all 2785 cards — start by building the **full rules machine**, with abilities proven on fixtures:

1. Types (including queue, choices, modifiers) + `lib/sim/` + seeded RNG  
2. Setup + mulligan per official rules  
3. **Effect queue + nested choices + modifiers**  
4. **Shell ingest early** (pattern frequencies guide ops)  
5. Bootstrap ops + DON!! + play → **On Play** fixtures  
6. Activate: Main, combat windows, Trigger, On K.O., keyword suites  
7. Expand ops + DSL; proof harness; catalog closure test  
8. Remaining timings; priority decks proven; **then full catalog until closure green**  
9. Random agent / trajectories; UI is **after** this engine plan  

Hotseat UI comes after an **ability-accurate** headless slice (plan Step 9.1), and the engine plan itself closes only when **catalog closure** is green (Step 9.3).

---

## Unique abilities — how we account for them

Printed text is core. The engine does **not** “skip” On Play / Trigger / Leader skills as a rules cut.

| Layer | What it covers | How it gets into the sim |
|---|---|---|
| **1. Card stats** | Cost, power, counter, colors, category | `data/cards.json` |
| **2. Keyword flags** | `[Blocker]`, `[Rush]`, … | `compileHas` → `card.has` |
| **3. Ability shells** | Timings / DON!! xN / once-per-turn / raw clauses | New ingest → `data/sim-ability-shells.json` (or similar) |
| **4. Core rules + queue** | Phases, combat windows, priority/choices | Hand-written engine |
| **5. Ops + DSL / custom TS** | Executable ability bodies | `lib/sim/ops`, `data/sim-abilities`, `lib/sim/abilities/custom` |
| **6. Coverage** | Card done or not | **Computed** from shells ∪ scripts ∪ proofs (no hand-edited coverage JSON) |

**Wrong approach:** Auto-translate all English with an LLM and trust it.  
**Wrong approach:** Ship forever with unique text no-op’d and call it the battle sim.  
**Right approach:** Full timing framework + shared ops + proofs until **every current catalog card** is done (priority decks first as a milestone).

---

## Catalog / ingest — what to do when

| Need | Action |
|---|---|
| Start types / RNG / queue | Existing `cards.json` is enough for fixtures |
| Route timings at scale | **Re-ingest or parallel script** for ability shells |
| Keywords | Keep extending `compileHas` as needed |
| Semantics | Human-validated DSL/TS — shells alone are not enough |
---

## Branching

| Practice | Why |
|---|---|
| Branch `battle-sim` (or `feat/battle-sim`) off current `main` | Isolates large, unfinished engine work from the live deckbuilder |
| Small PRs into that branch (or stacked PRs) | Types → queue/choices → play/On Play → combat+Trigger → ops/DSL → ingest shells → coverage |
| Do not merge to `main` until | Tests pass, outline/checklist updated, no half-broken `/sim` route on production |
| Keep engine pure under `lib/sim/` (or package) | UI can lag; headless **ability-accurate** tests prove truth |

Local experiments on the branch are fine. Avoid committing secrets or training blobs.

---

## Build order (do not skip)

Build **full rules engine → prove priority decks → prove entire current catalog → (then separate plans) UI → stronger agents → model → optional PvP**.

| Step | Layer | What you get | Why this order |
|---|---|---|---|
| A | **Rules engine** | State, queue, choices, modifiers, combat, all timing kinds | Accuracy requires this |
| A2 | **Ops + DSL + shells + proofs** | Scale path + CI gates | Without this, “all cards” is wishful |
| A3 | **Catalog complete** | Every current English card done | Engine-plan finish line |
| B | **Human UI** | Board + choice UX | After truth (next plan) |
| C–G | Agents → self-play → model → PvP | As in the engine plan handoffs | After A3 |

### Earlier product stages (lists / draw) still apply

From `DECKPOOL_FUTURE_FEATURES.md`, lists/export and draw tools remain useful **beside** the sim. **Supersede** that doc’s “limited game / unique effects do nothing” stage for DeckPool’s own sim: our engine plan requires full ability kinds. Treat FUTURE_FEATURES stage 2 wording as outdated relative to this file.

| Stage | User gets | Label |
|---|---|---|
| 0. Lists only | Practice-opponent shelf; import/export | Real lists, not a match |
| 1. Draw tester | Shuffle, mulligan, DON!! curve | Draw tester, not a match |
| 2. Rules engine + **all current cards** | Accurate play for any legal lists from the catalog | Battle sim (strict) |
| 3. Computer opponent | Legal-move seat on covered pools | Practice opponent |
| 4. Batch games | N games, score line | Simulated practice |

---

## Opponent ladder (solo)

| Tier | Opponent | Role |
|---|---|---|
| 0 | **Hotseat** | You play both seats. Best for debugging rules and UI feel. |
| 1 | **Scripted second seat** | Fixed habits (“block if able,” “attach DON to attacker”). |
| 2 | **Heuristic bot** | Scores legal moves with hand-written priorities. |
| 3 | **Search bot** (MCTS / shallow tree) | Stronger, still no neural net; CPU-heavy; can stay local. |
| 4 | **Learned model** | Trained on self-play from *this* engine. |
| 5 | **Human PvP** | Optional, after solo is excellent. |

Practice **lists** (tournament snapshots) can exist at any tier; they are deck data, not an opponent brain. Lists still need **ability coverage** to play accurately.

---

## Architecture (AI-ready from day one)

```text
Deck lists (DeckPool variations / practice shelf)
        ↓
   Rules engine  ←── Human UI
   (queue, ops, DSL/custom abilities)
        ↑
        ├── Agent (scripted → heuristic → search → neural net)
        └── Self-play runner → trajectory logs → training → model weights → Agent
```

### Engineering contracts (required)

1. **Deterministic engine + seed** — same seed + same actions ⇒ same game.
2. **Single action space** — clicks and effect choices share Action types.
3. **Observation ≠ full state** — no god-view training leaks.
4. **Legal-action mask** — UI and model only choose among legal actions.
5. **Trajectory log** — observation, action, events, terminal.
6. **Full timing + ability system** — On Play / Trigger / When Attacking / Activate / etc. are engine features; card scripts fill coverage. Do not bury rules in React.
7. **Strict coverage for “accurate” play** — uncovered cards cannot silently no-op in strict mode.
8. **UI never owns rules** — React animates; engine decides.

### What “trained model” means here

- Not a language model inventing card text.
- A policy that picks legal actions (including search/target choices) to maximize win rate.
- Train on covered pools first so self-play isn’t learning “empty On Play” nonsense.
- Strong human-level OP AI remains research-hard; product goal is excellent accurate practice.

---

## Infrastructure and cost

| Bucket | When | Where it runs | Cost shape |
|---|---|---|---|
| **1. Local / client sim** | Now → long time | Browser TypeScript engine; decks from existing Firestore | ~$0 extra on current DeckPool hosting |
| **2. Training / self-play** | After engine + enough coverage | Headless on a PC or rented GPU | **Episodic** |
| **3. Online games / heavy inference** | Only if needed | Realtime rooms and/or hosted model | **Ongoing** |

### Guidance

- Prefer **ONNX/WASM in the browser** for early model inference.
- Prefer **CLI / local batch** for “sim 100 games” until that is too slow.
- Do not put training inside Vercel serverless.
- Expand stack only with a clear reason (PvP sync, or a model too large for the client).

---

## DeckPool integration (when built)

- Input: owner’s variation, and/or a practice-opponent list (Leader + 50-card map + source + date).
- **Coverage check** before start in strict mode.
- Output of batch runs: labeled **simulated practice** only. Never write into a real match-history log.
- Export to OPTCGSim / Limitless text remains useful so lists can leave DeckPool even before our sim exists.
- Auth/shell: sim routes authenticated unless a future public mode is designed.
- Firestore stores **lists and settings**, not per-frame game physics.

---

## Implementation checklist

Use this as the working list. Detail lives in `DECKPOOL_BATTLE_SIM_ENGINE_PLAN.md`.

### Foundations

- [ ] `lib/sim/` + `types/sim.ts` (state, actions, **queue**, **choices**, **modifiers**)
- [ ] Seeded RNG + replay helper
- [ ] `createGame` / `legalActions` / `applyAction` / `observe` / coverage report
- [ ] Trajectory log format

### Full rules machine

- [ ] Setup + mulligan per documented official rules
- [ ] Phases + end-of-turn windows
- [ ] Effect queue + nested choice Actions
- [ ] Modifier / continuous / duration layer
- [ ] DON!! resources + attach
- [ ] Play Character / Stage / Event → On Play
- [ ] Activate: Main / Main activates + Once Per Turn + DON!! xN
- [ ] Combat: When Attacking, opponent-attack windows, Blocker, On Block
- [ ] Counter number **and** Counter effects
- [ ] KO / On K.O. / life loss / **Trigger**
- [ ] Rush, Double Attack, Banish, Unblockable
- [ ] Search / look-at / reveal / bottom ops
- [ ] Remaining timings (Your/Opponent’s Turn, End of Your Turn, auras, …)
- [ ] Win / lose conditions

### Coverage pipeline

- [ ] Ability shell ingest + 0 unparsed remainder
- [ ] Ops library + DSL schema + custom TS escape hatch
- [ ] Proof harness + pattern-batched scenario tests
- [ ] Derived coverage + **catalog closure test** (vanilla / keywordOnly / needsScript+proofs)
- [ ] Keyword engine suites (Blocker, Rush, …) — not one duel test per keyword card
- [ ] Strict runtime throw on missing script
- [ ] Author: priority decks first, then entire catalog until closure green
- [ ] Random stress + complex Leader golden replays

### After this engine plan (not required to close it)

- [ ] Hotseat UI (incl. choice windows)
- [ ] App route + load DeckPool variations
- [ ] Scripted → heuristic agents (beyond random)
- [ ] (Later) MCTS / neural policy
- [ ] (Deferred) PvP, hosted inference

### Included in engine plan (agents/logs)

- [ ] Random-legal agent + headless `runGame` + trajectory schema

---

## Honest limitations

- **Mid-plan** you will not have every card done yet; **plan-close** requires all current catalog cards proven. Authoring dominates calendar time.
- **Strict mode** refuses undoned cards so the sim cannot silently lie.
- Automated proofs catch functional wrongness for scripted scenarios; they do not replace occasional human feel-testing of the future UI.
- Strong human-level AI remains research-hard and is outside this engine plan.

---

## Open questions (resolve when implementation starts)

1. Pin which official rules version / clarifications we implement first.
2. **Resolved:** engine in-repo as `lib/sim/`.
3. **Resolved:** hybrid DSL + custom TS.
4. **Resolved:** shells in `data/sim-ability-shells.json` (not fields on every card in `cards.json`).
5. **Resolved:** coverage status computed (no hand-edited coverage file).
6. Practice-opponent shelf vs draw tester vs engine-first priority for *product* work outside this plan?
7. First playable UI: desktop-only vs mobile-capable from day one?
8. When (if ever) PvP is worth the ongoing cost?

## Related docs

| File | Use for |
|---|---|
| **This file** | Battle sim decisions, architecture, checklist |
| `DECKPOOL_BATTLE_SIM_ENGINE_PLAN.md` | Comprehensive step-by-step plan to build the truth engine |
| `DECKPOOL_BATTLE_SIM_AGENTS.md` | Multi-agent waves, STATUS handoff, progress checklists |
| `DECKPOOL_FUTURE_FEATURES.md` | Broader post-V1 ideas (import, match log, wishlist history, batch practice framing) |
| `DECKPOOL_CODEBASE.md` | As-built app today |
| `DECKPOOL_V1_BLUEPRINT.md` | Locked V1 product rules (deckbuilding, not the sim) |

---

*If you change battle-sim product direction, update this file in the same commit as any related code or decision change.*
