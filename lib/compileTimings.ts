/**
 * Compile printed ability-window timings from effect/trigger text.
 * Used by catalog ingest and CatalogProvider hydrate; kept pure for tests.
 */

export type TimingSlug =
  | "on-play"
  | "when-attacking"
  | "on-block"
  | "on-ko"
  | "activate-main"
  | "main"
  | "counter"
  | "trigger"
  | "your-turn"
  | "opponents-turn"
  | "end-of-your-turn"
  | "on-opponents-attack";

export const TIMING_WINDOWS: { slug: TimingSlug; label: string; match: RegExp }[] =
  [
    { slug: "on-play", label: "On Play", match: /^on play$/i },
    {
      slug: "when-attacking",
      label: "When Attacking",
      match: /^when attacking$/i,
    },
    { slug: "on-block", label: "On Block", match: /^on block$/i },
    { slug: "on-ko", label: "On K.O.", match: /^on k\.?o\.?$/i },
    {
      slug: "activate-main",
      label: "Activate: Main",
      match: /^activate:\s*main$/i,
    },
    { slug: "main", label: "Main", match: /^main$/i },
    { slug: "counter", label: "Counter", match: /^counter$/i },
    { slug: "trigger", label: "Trigger", match: /^trigger$/i },
    { slug: "your-turn", label: "Your Turn", match: /^your turn$/i },
    {
      slug: "opponents-turn",
      label: "Opponent's Turn",
      match: /^opponent['’]s turn$/i,
    },
    {
      slug: "end-of-your-turn",
      label: "End of Your Turn",
      match: /^end of your turn$/i,
    },
    {
      slug: "on-opponents-attack",
      label: "On Your Opponent's Attack",
      match: /^on your opponent['’]s attack$/i,
    },
  ];

const TIMING_SLUG_SET = new Set<string>(
  TIMING_WINDOWS.map((window) => window.slug),
);

const LABEL_BY_SLUG = new Map(
  TIMING_WINDOWS.map((window) => [window.slug, window.label]),
);

const ORDER_BY_SLUG = new Map(
  TIMING_WINDOWS.map((window, index) => [window.slug, index]),
);

const BRACKET_RE = /\[([^\]]+)\]/g;

export function isTimingSlug(value: string): value is TimingSlug {
  return TIMING_SLUG_SET.has(value);
}

export function timingLabel(slug: string): string {
  return LABEL_BY_SLUG.get(slug as TimingSlug) ?? slug;
}

export function sortTimingSlugs(slugs: string[]): string[] {
  return [...slugs].sort((a, b) => {
    const orderA = ORDER_BY_SLUG.get(a as TimingSlug);
    const orderB = ORDER_BY_SLUG.get(b as TimingSlug);
    if (orderA != null && orderB != null) return orderA - orderB;
    if (orderA != null) return -1;
    if (orderB != null) return 1;
    return a.localeCompare(b);
  });
}

function slugForBracket(raw: string): TimingSlug | null {
  const text = raw.trim();
  if (!text) return null;
  for (const window of TIMING_WINDOWS) {
    if (window.match.test(text)) return window.slug;
  }
  return null;
}

export function compileTimings(
  effect: string | null,
  trigger: string | null,
): TimingSlug[] {
  const found = new Set<TimingSlug>();
  const text = `${effect ?? ""} ${trigger ?? ""}`;
  BRACKET_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = BRACKET_RE.exec(text))) {
    const slug = slugForBracket(match[1] ?? "");
    if (slug) found.add(slug);
  }
  if (trigger?.trim()) found.add("trigger");
  return sortTimingSlugs([...found]) as TimingSlug[];
}

export function withCompiledTimings<T extends { timings?: string[]; effect: string | null; trigger: string | null }>(
  card: T,
): T & { timings: string[] } {
  if (Array.isArray(card.timings) && card.timings.length > 0) {
    return { ...card, timings: card.timings };
  }
  return {
    ...card,
    timings: compileTimings(card.effect, card.trigger),
  };
}
