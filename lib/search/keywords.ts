export const FIELD_ALIASES: Record<string, string> = {
  name: "name",
  id: "id",
  color: "color",
  c: "color",
  type: "type",
  feature: "type",
  label: "label",
  tag: "label",
  category: "category",
  t: "category",
  attribute: "attribute",
  a: "attribute",
  attr: "attribute",
  text: "text",
  o: "text",
  trigger: "trigger",
  tr: "trigger",
  cost: "cost",
  life: "life",
  power: "power",
  pow: "power",
  counter: "counter",
  rarity: "rarity",
  r: "rarity",
  set: "set",
  s: "set",
  series: "series",
  has: "has",
};

export const COLOR_NAMES = [
  "red",
  "green",
  "blue",
  "purple",
  "black",
  "yellow",
] as const;

export const KEYWORD_SUGGESTIONS = [
  "color:",
  "type:",
  "label:",
  "category:",
  "attribute:",
  "text:",
  "trigger:",
  "cost:",
  "life:",
  "power:",
  "counter:",
  "rarity:",
  "set:",
  "series:",
  "has:",
  "id:",
  "name:",
] as const;

export function normalizeField(raw: string): string {
  return FIELD_ALIASES[raw.toLowerCase()] ?? raw.toLowerCase();
}

export function normalizeColor(raw: string): string {
  const lower = raw.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export const CARD_ID_RE =
  /^(?:OP|ST|EB|PRB|P)-?\d{2}-?\d{3}$/i;
