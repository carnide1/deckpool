# DeckPool — agent instructions

Before exploring the repo, read **`DECKPOOL_CODEBASE.md`**. That file is the as-built snapshot (routes, Firebase, search, deploy). Do not start with a full-codebase review unless that file is missing or obviously wrong.

**Keep `DECKPOOL_CODEBASE.md` current.** If you change routes, data, behavior, env, or deploy setup, update that file in the same commit and set its “Last updated” date. Describe what the code does now, in plain language.

Other docs:

- `DECKPOOL_V1_BLUEPRINT.md` — V1 product rules (color identity, 50 cards, variations). Not always identical to the live UI.
- `DECKPOOL_FUTURE_FEATURES.md` — later feature decisions. Do not implement those unless asked.
- `DECKPOOL_V1_IMPLEMENTATION_GUIDE.md` — human Firebase/Vercel setup.

If the snapshot and the blueprint disagree about **how the app works today**, trust the snapshot.
