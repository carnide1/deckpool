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
    rules: {
      // The app intentionally mirrors URL, Firebase snapshot, and modal props
      // into local interaction state. These React Compiler diagnostics are not
      // correctness errors for those subscription/synchronization boundaries.
      "react-hooks/set-state-in-effect": "off",
      // CardImage keeps event-handler state in refs so stale image events do
      // not advance the wrong fallback candidate.
      "react-hooks/refs": "off",
    },
  },
]);

export default eslintConfig;
