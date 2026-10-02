# DeckPool — Battle sim multi-agent handoff

**Purpose:** Split the truth-engine plan into **waves** so a fresh agent can pick up cleanly when context is full.  
**Detail / how-to:** `DECKPOOL_BATTLE_SIM_ENGINE_PLAN.md`  
**Product decisions:** `DECKPOOL_BATTLE_SIM.md`  
**As-built app (do not break):** `DECKPOOL_CODEBASE.md`

**Do not implement unless the user asked to execute.** When executing, update **this file’s status block** every handoff.

---

## STATUS (update every handoff — keep at top)

| Field | Value |
|---|---|
| **Branch** | _(none yet — cut `battle-sim` in Wave 0)_ |
| **Active wave** | `W0` |
| **Wave status** | `not_started` |
| **Last agent note** | Planning only. No code yet. Next: user says execute → start W0. |
| **Blocked on** | _(none)_ |
| **Last updated** | 2026-09-11 |

**Wave status values:** `not_started` | `in_progress` | `blocked` | `done`

**When ending a session / switching agents, the outgoing agent MUST:**

1. Set **Active wave** + **Wave status**
2. Check off completed items in that wave’s checklist below
3. Write **Last agent note** (5–15 lines max): what landed, what’s next, any landmines
4. Set **Blocked on** if the next agent cannot proceed without the user
5. Leave `npm test` green for everything already claimed `done` (or note exactly what’s red)

---

## New agent — start here (≤5 minutes)

1. Read **STATUS** above.
2. Read this file’s **Agent rules**.
3. Open the **Active wave** section only (do not re-read the whole engine plan unless the wave says to).
4. Skim `DECKPOOL_BATTLE_SIM.md` locked decisions if the wave touches product/rules scope.
5. Run `git status` + `git branch` + `npm test` (once code exists).
6. Continue the active wave until its **Exit criteria** are met, then advance STATUS to the next wave and stop or continue if context allows.

**Do not** start Wave N+1 until Wave N’s exit criteria are checked off.  
**Do not** invent time estimates in STATUS notes.

### Read map (when you need depth)

| Need | File / section |
|---|---|
| Finish line / what “done” means | `DECKPOOL_BATTLE_SIM_ENGINE_PLAN.md` → Definition of done |
| Ingest + proofs (no hand-QA every card) | Same → Card effects: ingest + proof |
| Step-level how | Same → Phase matching this wave |
| Product locked decisions | `DECKPOOL_BATTLE_SIM.md` |
| Live DeckPool behavior | `DECKPOOL_CODEBASE.md` |

---

## Agent rules

1. **One active wave** in STATUS. Finish or block it; don’t shadow-work three waves.
2. **Pure engine only** until later handoffs: `lib/sim/`, `types/sim*.ts`, `data/sim-*`, scripts for sim ingest/report. No `/sim` UI route unless a future wave says so.
3. **Tests gate progress.** A checklist item is not done until its tests pass.
4. **Proof bar** for cards: shell + script (or keywordOnly/vanilla path) + passing proof. Coverage is **computed**, never a hand-edited honor file.
5. **No silent LLM card codegen** without a proof.
6. **Update this STATUS block** before you stop.
7. Prefer small commits on `battle-sim` when the user wants commits; never push unless asked.
8. If confused, trust: engine plan for procedure, this file for sequencing, codebase snapshot for the live app.

---

## Wave board (checklist)

Mark `[x]` when the wave’s **exit criteria** are fully met.

- [ ] **W0** — Branch + conventions
- [ ] **W1** — Types, RNG, public API stubs
- [ ] **W2** — Setup, mulligan, observe privacy
- [ ] **W3** — Phases, effect queue, choices, modifiers
- [ ] **W4** — Shell ingest (early)
- [ ] **W5** — Bootstrap ops, DON!!, play, On Play fixtures
- [ ] **W6** — Activate: Main
- [ ] **W7** — Combat + Trigger + keywords
- [ ] **W8** — Expand ops + DSL + custom escape hatch
- [ ] **W9** — Proof harness + catalog closure (may be red until catalog waves finish)
- [ ] **W10** — Remaining timings (static auras, end of turn, etc.)
- [ ] **W11** — `fromDeckPool` + strict mode + ability-accurate vertical slice
- [ ] **W12** — Priority decks proven (user’s lists — ask which)
- [ ] **W13** — Catalog authoring loop (repeat until closure green) — see sub-board
- [ ] **W14** — Stress + Leader goldens
- [ ] **W15** — Random agent + `runGame` + trajectories
- [ ] **W16** — Docs sync (outline + codebase snapshot as needed)

**Engine plan is closed when W13 closure is green and W0–W16 exit criteria that apply are done.** UI / smart AI / PvP are **not** in these waves.

---

## Waves (entry → work → exit)

### W0 — Branch + conventions

| | |
|---|---|
| **Maps to** | Engine plan 0.1–0.4 |
| **Entry** | User asked to execute; STATUS shows W0 |
| **Exit** | Branch `battle-sim` exists; hybrid authoring locked (already in docs); empty `lib/sim/` + stub dirs ok; STATUS updated |

**Checklist**

- [ ] Create/checkout `battle-sim` from current `main`
- [ ] Confirm layout: `lib/sim/`, `types/sim.ts`, `lib/sim/abilities/`, `lib/sim/ops/`, `lib/sim/proofs/`, `data/sim-abilities/` (stubs fine)
- [ ] STATUS: Active wave → W1 (or stay W0 if blocked)

**Handoff note template:** branch name, any clone issues.

---

### W1 — Types, RNG, API stubs

| | |
|---|---|
| **Maps to** | Engine plan Phase 1 |
| **Entry** | W0 done |
| **Exit** | Types compile; RNG tests pass; `createGame` / `legalActions` / `applyAction` / `observe` / `isTerminal` / coverage stub export |

**Checklist**

- [ ] `types/sim.ts` includes queue/choice/modifier types
- [ ] `lib/sim/rng.ts` + tests
- [ ] `lib/sim/engine.ts` + `lib/sim/index.ts` stubs
- [ ] `npm test` green

---

### W2 — Setup, mulligan, observe

| | |
|---|---|
| **Maps to** | Engine plan Phase 2 |
| **Entry** | W1 done |
| **Exit** | Seeded setup + mulligan actions + privacy tests green |

**Checklist**

- [ ] Catalog injection + fixtures
- [ ] Expand qty maps → instances
- [ ] Setup per documented rules
- [ ] Mulligan actions
- [ ] `observe` privacy tests

---

### W3 — Phases, queue, choices, modifiers

| | |
|---|---|
| **Maps to** | Engine plan Phase 3 |
| **Entry** | W2 done |
| **Exit** | Empty turn cycle works; queue + nested choices tested; modifiers expire correctly; OPT flags stubbable |

**Checklist**

- [ ] Phases + auto refresh/draw/DON!! gain hooks
- [ ] Effect queue + choice Actions
- [ ] Modifier layer
- [ ] Once-per-turn + DON!! xN gates (stub DON!! ok)

---

### W4 — Shell ingest (run early)

| | |
|---|---|
| **Maps to** | Engine plan 7.1–7.2 |
| **Entry** | W1 done (can parallel after W1; should finish before mass authoring) |
| **Exit** | `data/sim-ability-shells.json` committed; ingest script fails on bad parse; static/untagged continuous → `static` clauses; `has` keywords still work |

**Checklist**

- [ ] `lib/compileAbilityShells.ts` + tests (golden real cards)
- [ ] `npm run ingest-sim-shells` (add script)
- [ ] Shells include bracket timings + `static` remainders
- [ ] `unparsedRemainder` reporting defined
- [ ] Note top pattern frequencies in STATUS note for later ops priority

---

### W5 — Bootstrap ops, DON!!, play, On Play

| | |
|---|---|
| **Maps to** | Engine plan 4.0–4.3 |
| **Entry** | W3 done |
| **Exit** | Bootstrap ops exist; DON!! real; play enqueues On Play; fixture On Plays pass |

**Checklist**

- [ ] `lib/sim/ops/` bootstrap (`draw`, don rest/active, `powerMod`, capped `ko`) — **this folder is permanent**
- [ ] `lib/sim/don.ts`
- [ ] `lib/sim/play.ts`
- [ ] Fixture On Play scripts + tests

---

### W6 — Activate: Main

| | |
|---|---|
| **Maps to** | Engine plan 4.4 |
| **Entry** | W5 done |
| **Exit** | Fixture Leader Activate: Main + once-per-turn + DON!! xN |

**Checklist**

- [ ] `lib/sim/activate.ts`
- [ ] Tests green

---

### W7 — Combat + Trigger + keywords

| | |
|---|---|
| **Maps to** | Engine plan Phase 5 |
| **Entry** | W5 done (W6 preferred first) |
| **Exit** | Attack → When Attacking → block/On Block → counter number+effect → KO/On K.O. → life Trigger; keyword suites for Rush/Blocker/etc. |

**Checklist**

- [ ] Declare attack + When Attacking
- [ ] Opponent-attack windows
- [ ] Blocker + On Block
- [ ] Counter number + Counter effect fixtures
- [ ] KO / On K.O. / Trigger
- [ ] Rush, Double Attack, Banish, Unblockable
- [ ] Win/lose
- [ ] Engine-level keyword proof suites (not per-card duels)

---

### W8 — Expand ops + DSL + custom TS

| | |
|---|---|
| **Maps to** | Engine plan Phase 6 |
| **Entry** | W5 done (W7 preferred) |
| **Exit** | Ops expanded in **same** `lib/sim/ops/`; DSL loads; one custom Leader escape hatch works |

**Checklist**

- [ ] Search / may / upTo / selectTarget / mill / banish / etc.
- [ ] DSL schema + loader + validator
- [ ] Custom registry path
- [ ] DSL “draw 1” matches fixture behavior

---

### W9 — Proof harness + catalog closure wiring

| | |
|---|---|
| **Maps to** | Engine plan 7.3–7.4 |
| **Entry** | W4 + W8 done |
| **Exit** | Harness exists; closure test exists; report script exists. Closure may fail until W13 finishes — that is expected; document in STATUS |

**Checklist**

- [ ] `lib/sim/proofs/harness.ts`
- [ ] Pattern-batch proof helper
- [ ] `lib/sim/coverage.ts` (computed status)
- [ ] `catalogClosure.test.ts` (will go green in W13)
- [ ] `npm run sim-coverage-report`
- [ ] Deliberate missing-binding smoke shows failure mode works

---

### W10 — Remaining timings

| | |
|---|---|
| **Maps to** | Engine plan Phase 8 |
| **Entry** | W7 + W8 done |
| **Exit** | Your Turn / Opponent’s Turn / End of Your Turn / static auras / replacement-style modifiers have fixture proofs |

**Checklist**

- [ ] 8.1–8.5 style timings supported + fixture proof each

---

### W11 — Vertical slice + fromDeckPool + strict

| | |
|---|---|
| **Maps to** | Engine plan 9.1–9.2 |
| **Entry** | W7 + W9 harness exists |
| **Exit** | Integration test: On Play + When Attacking + Blocker + Counter effect + Trigger + On K.O. in one flow; strict refuse undoned lists |

**Checklist**

- [ ] Ability-accurate integration test green
- [ ] `createGameFromLists` / DeckPool map loader
- [ ] Strict mode refuses undoned cardIds

---

### W12 — Priority decks proven

| | |
|---|---|
| **Maps to** | Early milestone before full catalog |
| **Entry** | W11 done; **ask user which Leader/lists** if unknown |
| **Exit** | Those cardIds all `done`; a strict game can start with those two lists |

**Checklist**

- [ ] User priority lists recorded in STATUS note
- [ ] All clauses for those cardIds scripted + proven
- [ ] Strict createGame succeeds for that matchup

---

### W13 — Catalog authoring loop (multi-agent sub-waves)

This wave is **designed to be split across many agents**. Each agent takes one **slice**, updates the sub-board, leaves STATUS on W13 until closure is green.

#### W13 STATUS (sub)

| Field | Value |
|---|---|
| **Closure** | `red` (green only when report shows 0 gaps) |
| **Next slice** | _(e.g. pattern: On Play draw 1 / set OP09 / Leaders batch A)_ |
| **Sub-note** | Not started |

#### How to run one catalog slice (every agent the same)

1. Run `npm run sim-coverage-report` (or equivalent) → pick a slice of undoned `needsScript` clauses (prefer largest identical `rawText` pattern).
2. Implement DSL/custom scripts for that slice.
3. Add/extend **parameterized proofs**.
4. `npm test` green for new proofs.
5. Re-run coverage report; check off the slice below (add rows as you invent slice names).
6. Update W13 STATUS sub-note + top STATUS.
7. **Stop** if context is heavy; next agent continues W13.

#### Catalog slice board (add rows freely; mark when proven)

- [ ] _(example)_ Pattern: On Play — draw 1
- [ ] _(example)_ Pattern: When Attacking — +1000 power
- [ ] _(example)_ KeywordOnly audit (all keywordOnly cards classified)
- [ ] _(example)_ Vanilla audit
- [ ] Leaders batch …
- [ ] Events / Triggers batch …
- [ ] **Closure green** — `sim-coverage-report` 0 gaps + catalogClosure test green + 0 `unparsedRemainder`

**Exit for W13:** Closure green row checked.

---

### W14 — Stress + Leader goldens

| | |
|---|---|
| **Maps to** | Engine plan 9.4 |
| **Entry** | W13 closure green (or large subset if user allows partial — default wait for green) |
| **Exit** | Random stress job/tests exist; several complex Leader golden replays committed |

**Checklist**

- [ ] Random legal games fail on throw
- [ ] Golden replays for priority complex Leaders

---

### W15 — Random agent + runGame + trajectories

| | |
|---|---|
| **Maps to** | Engine plan Phase 10 |
| **Entry** | W11 done (may parallel W12–W13) |
| **Exit** | Random agent respects choice windows; `runGame` loop; trajectory schema + round-trip test |

**Checklist**

- [ ] `lib/sim/agents/random.ts`
- [ ] `lib/sim/runGame.ts`
- [ ] `lib/sim/trajectory.ts` + test

---

### W16 — Docs sync

| | |
|---|---|
| **Maps to** | Engine plan Phase 11 |
| **Entry** | W13 green + W15 done (adjust if user merges earlier) |
| **Exit** | `DECKPOOL_BATTLE_SIM.md` checklist matches reality; `DECKPOOL_CODEBASE.md` updated if anything shipped to app behavior; this STATUS shows plan closed |

**Checklist**

- [ ] Outline / engine plan checklists reconciled
- [ ] Codebase snapshot updated only if as-built app changed
- [ ] STATUS: Active wave `CLOSED` / note “engine plan complete”

---

## Out of scope for these waves (do not start here)

- Hotseat / battle UI / app routes  
- Heuristic / MCTS / neural opponents (beyond random)  
- Online PvP  
- New sets after the catalog snapshot used at W13 close  

Track those later as new wave docs if needed.

---

## Quick commands (once scripts exist)

```text
npm test
npm run ingest-sim-shells
npm run sim-coverage-report
```

---

## Copy-paste handoff blurb (outgoing agent → chat)

```text
Handoff ready.
Read DECKPOOL_BATTLE_SIM_AGENTS.md STATUS first.
Active wave: W…
Wave status: …
Branch: …
Blocked on: …
Note: …
Next concrete action: …
```
