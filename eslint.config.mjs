import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: [
      "app/(app)/cards/page.tsx",
      "app/(app)/collection/page.tsx",
      "components/CardImage.tsx",
      "components/builder/BuilderView.tsx",
      "components/builder/ChangeLeaderModal.tsx",
      "components/builder/CompareVariationsModal.tsx",
      "components/builder/DeckView.tsx",
      "components/builder/VariationModals.tsx",
      "components/collection/AddStarterDeckModal.tsx",
      "components/decks/RenameDeckModal.tsx",
      "components/wanted/WantedBoard.tsx",
      "contexts/CardPrefsContext.tsx",
      "contexts/CollectionContext.tsx",
      "contexts/DecksContext.tsx",
      "contexts/WantedContext.tsx",
    ],
    rules: {
      // These components intentionally mirror URL, Firebase snapshot, or modal
      // props into local interaction state at synchronization boundaries.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["components/CardImage.tsx"],
    rules: {
      // CardImage keeps event-handler state in refs so stale image events do
      // not advance the wrong fallback candidate.
      "react-hooks/refs": "off",
    },
  },
]);

export default eslintConfig;
