# DeckPool — agent instructions

Before exploring the repo, read **`DECKPOOL_CODEBASE.md`**. That file is the as-built snapshot (routes, Firebase, search, deploy). Do not start with a full-codebase review unless that file is missing or obviously wrong.

**Keep `DECKPOOL_CODEBASE.md` current.** If you change routes, data, behavior, env, or deploy setup, update that file in the same commit and set its “Last updated” date. Describe what the code does now, in plain language.

Other docs:

- `DECKPOOL_V1_BLUEPRINT.md` — V1 product rules (color identity, 50 cards, variations). Not always identical to the live UI.
- `DECKPOOL_FUTURE_FEATURES.md` — later feature decisions. Do not implement those unless asked.
- `DECKPOOL_V1_IMPLEMENTATION_GUIDE.md` — human Firebase/Vercel setup.
- `DECKPOOL_BATTLE_SIM.md` / `DECKPOOL_BATTLE_SIM_ENGINE_PLAN.md` — battle sim product + procedure (do not implement unless asked).
- `DECKPOOL_BATTLE_SIM_AGENTS.md` — multi-agent waves + STATUS handoff when executing the battle sim engine plan.
- `DECKPOOL_FRIENDS.md` — friends feature decisions, design, and manual two-account test checklist (implemented; see the snapshot for as-built behavior).

If the snapshot and the blueprint disagree about **how the app works today**, trust the snapshot.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
