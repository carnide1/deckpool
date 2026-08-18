import {
  CARD_ID_RE,
  normalizeField,
} from "@/lib/search/keywords";

export type CompareOp = "=" | "!=" | "<" | "<=" | ">" | ">=";

export type FieldTerm = {
  kind: "field";
  field: string;
  value: string;
  op?: CompareOp;
};

export type BareTerm = { kind: "bare"; value: string };
export type IdTerm = { kind: "id"; value: string };

export type Term = FieldTerm | BareTerm | IdTerm;

export type QueryExpr =
  | { type: "all"; terms: QueryExpr[] }
  | { type: "any"; terms: QueryExpr[] }
  | { type: "not"; term: QueryExpr }
  | { type: "term"; term: Term };

const NUMERIC_FIELDS = new Set([
  "cost",
  "life",
  "power",
  "counter",
]);

const COMPARE_OPS: CompareOp[] = ["<=", ">=", "!=", "<", ">", "="];

type Token =
  | { type: "word"; value: string }
  | { type: "or" }
  | { type: "lparen" }
  | { type: "rparen" };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "lparen" });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen" });
      i++;
      continue;
    }

    let word = "";
    while (i < input.length) {
      const current = input[i];
      if (current === "(" || current === ")") break;
      if (/\s/.test(current)) break;
      if (current === '"') {
        word += current;
        i++;
        while (i < input.length && input[i] !== '"') {
          word += input[i];
          i++;
        }
        if (i < input.length) {
          word += input[i];
          i++;
        }
        continue;
      }
      word += current;
      i++;
    }

    if (word.toLowerCase() === "or") {
      tokens.push({ type: "or" });
    } else if (word) {
      tokens.push({ type: "word", value: word });
    }
  }

  return tokens;
}

function parseFieldRaw(raw: string): Term {
  const numeric = raw.match(
    /^(cost|life|power|counter|pow)(<=|>=|!=|<|>|=)(.+)$/i,
  );
  if (numeric) {
    return {
      kind: "field",
      field: normalizeField(numeric[1]),
      op: numeric[2] as CompareOp,
      value: numeric[3],
    };
  }

  const colon = raw.indexOf(":");
  if (colon === -1) {
    if (CARD_ID_RE.test(raw)) return { kind: "id", value: raw };
    return { kind: "bare", value: raw };
  }

  const field = normalizeField(raw.slice(0, colon));
  let valuePart = raw.slice(colon + 1);

  if (valuePart.startsWith('"') && valuePart.endsWith('"')) {
    valuePart = valuePart.slice(1, -1);
    return { kind: "field", field, value: valuePart };
  }

  if (NUMERIC_FIELDS.has(field)) {
    for (const op of COMPARE_OPS) {
      if (valuePart.startsWith(op)) {
        return {
          kind: "field",
          field,
          op,
          value: valuePart.slice(op.length),
        };
      }
    }
  }

  return { kind: "field", field, value: valuePart };
}

function parseWordToken(raw: string): QueryExpr {
  const not = raw.startsWith("-") && raw.length > 1;
  const body = not ? raw.slice(1) : raw;
  const term: QueryExpr = { type: "term", term: parseFieldRaw(body) };
  return not ? { type: "not", term } : term;
}

class Parser {
  private tokens: Token[];
  private index = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): QueryExpr {
    if (this.tokens.length === 0) {
      return { type: "all", terms: [] };
    }
    const expr = this.parseOr();
    return expr;
  }

  private peek(): Token | undefined {
    return this.tokens[this.index];
  }

  private consume(): Token | undefined {
    return this.tokens[this.index++];
  }

  private parseOr(): QueryExpr {
    const parts = [this.parseAnd()];
    while (this.peek()?.type === "or") {
      this.consume();
      parts.push(this.parseAnd());
    }
    return parts.length === 1 ? parts[0] : { type: "any", terms: parts };
  }

  private parseAnd(): QueryExpr {
    const parts: QueryExpr[] = [];
    while (true) {
      const next = this.peek();
      if (!next || next.type === "or" || next.type === "rparen") break;
      parts.push(this.parseAtom());
    }
    if (parts.length === 0) return { type: "all", terms: [] };
    return parts.length === 1 ? parts[0] : { type: "all", terms: parts };
  }

  private parseAtom(): QueryExpr {
    const next = this.peek();
    if (next?.type === "lparen") {
      this.consume();
      const inner = this.parseOr();
      if (this.peek()?.type === "rparen") this.consume();
      return inner;
    }
    const word = this.consume();
    if (!word || word.type !== "word") {
      return { type: "all", terms: [] };
    }
    return parseWordToken(word.value);
  }
}

export function parseQuery(input: string): QueryExpr {
  const trimmed = input.trim();
  if (!trimmed) return { type: "all", terms: [] };
  return new Parser(tokenize(trimmed)).parse();
}
