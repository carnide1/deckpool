/**
 * Compile DeckPool `has` flags from card effect/trigger/counter.
 * Used by catalog ingest; kept pure so unit tests can lock regex behavior.
 */

const KEYWORD_FLAGS: { re: RegExp; flag: string }[] = [
  { re: /\[Blocker\]/i, flag: "blocker" },
  { re: /\[Rush\]/i, flag: "rush" },
  { re: /\[Banish\]/i, flag: "banish" },
  { re: /\[Double Attack\]/i, flag: "double-attack" },
  { re: /\[Unblockable\]/i, flag: "unblockable" },
];

/** Community “searcher”: look at top of deck and add card(s) to hand. */
const LOOK_AT_TOP_DECK_RE =
  /look at \d+ cards? from the top of your deck/i;
const ADD_TO_HAND_RE =
  /add (?:it|them|up to \d+[^.]*?) to your hand/i;

export function isSearcherText(text: string): boolean {
  return LOOK_AT_TOP_DECK_RE.test(text) && ADD_TO_HAND_RE.test(text);
}

export function compileHas(
  effect: string | null,
  trigger: string | null,
  counter: number | null,
): string[] {
  const flags = new Set<string>();
  const text = `${effect ?? ""} ${trigger ?? ""}`;
  for (const { re, flag } of KEYWORD_FLAGS) {
    if (re.test(text)) flags.add(flag);
  }
  if (isSearcherText(text)) flags.add("searcher");
  if (trigger) flags.add("trigger");
  if (counter != null) flags.add("counter");
  if (effect) flags.add("effect");
  return [...flags];
}
