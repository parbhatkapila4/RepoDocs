export type TokenType =
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "identifier"
  | "punctuation"
  | "whitespace";

export interface Token {
  type: TokenType;
  text: string;
}

const KEYWORDS = new Set([
  "import", "export", "default", "from", "as",
  "const", "let", "var",
  "function", "return", "async", "await", "yield",
  "if", "else", "for", "while", "do", "switch", "case", "break", "continue",
  "type", "interface", "class", "extends", "implements", "enum", "namespace",
  "true", "false", "null", "undefined", "new", "this", "typeof", "instanceof", "in", "of",
  "try", "catch", "finally", "throw",
  "public", "private", "protected", "readonly", "static",
  "void", "any", "never", "unknown", "string", "number", "boolean",
]);

const PATTERNS: [RegExp, TokenType][] = [
  [/^\/\*[\s\S]*?\*\//, "comment"],
  [/^\/\/.*/, "comment"],
  [/^"(?:[^"\\\n]|\\.)*"/, "string"],
  [/^'(?:[^'\\\n]|\\.)*'/, "string"],
  [/^`(?:[^`\\]|\\.)*`/, "string"],
  [/^0[xX][0-9a-fA-F]+/, "number"],
  [/^\d+(?:\.\d+)?/, "number"],
  [/^[A-Za-z_$][A-Za-z0-9_$]*/, "identifier"],
  [/^\s+/, "whitespace"],
];

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const slice = source.slice(i);
    let matched = false;
    for (const [re, type] of PATTERNS) {
      const m = re.exec(slice);
      if (m) {
        const text = m[0];
        if (type === "identifier" && KEYWORDS.has(text)) {
          tokens.push({ type: "keyword", text });
        } else {
          tokens.push({ type, text });
        }
        i += text.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push({ type: "punctuation", text: source[i] });
      i += 1;
    }
  }
  return tokens;
}

export function tokenizeLines(source: string): Token[][] {
  return source.split("\n").map((line) => tokenize(line));
}
