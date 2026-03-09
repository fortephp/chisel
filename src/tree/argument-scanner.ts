function isWhitespace(ch: string): boolean {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

function skipWhitespace(str: string, pos: number): number {
  while (pos < str.length && isWhitespace(str[pos])) pos++;
  return pos;
}

function skipQuotedString(str: string, pos: number, quote: string): number {
  while (pos < str.length) {
    if (str[pos] === "\\") {
      pos += 2;
      continue;
    }
    if (str[pos] === quote) {
      pos++;
      return pos;
    }
    pos++;
  }
  return pos;
}

function isHeredocStart(str: string, pos: number): boolean {
  return pos + 2 < str.length && str[pos] === "<" && str[pos + 1] === "<" && str[pos + 2] === "<";
}

function skipHeredoc(str: string, pos: number): number {
  // Skip past the identifier and newline, then scan for matching end
  let identStart = pos;
  while (identStart < str.length && isWhitespace(str[identStart])) identStart++;

  const isNowdoc = identStart < str.length && str[identStart] === "'";
  if (isNowdoc) identStart++;

  let identEnd = identStart;
  while (identEnd < str.length && /[a-zA-Z0-9_]/.test(str[identEnd])) identEnd++;

  const ident = str.slice(identStart, identEnd);
  if (ident.length === 0) return pos;

  // Skip to end of line
  pos = identEnd;
  if (isNowdoc && pos < str.length && str[pos] === "'") pos++;
  while (pos < str.length && str[pos] !== "\n") pos++;
  if (pos < str.length) pos++; // skip newline

  // Scan for identifier at start of line
  while (pos < str.length) {
    const lineStart = pos;
    let checkPos = lineStart;
    while (checkPos < str.length && (str[checkPos] === " " || str[checkPos] === "\t")) checkPos++;

    if (str.startsWith(ident, checkPos)) {
      const afterIdent = checkPos + ident.length;
      if (afterIdent >= str.length || str[afterIdent] === ";" || str[afterIdent] === "\n") {
        return afterIdent < str.length ? afterIdent + 1 : afterIdent;
      }
    }

    // Skip to next line
    while (pos < str.length && str[pos] !== "\n") pos++;
    if (pos < str.length) pos++;
  }

  return pos;
}

/**
 * Count top-level arguments in a directive argument string.
 * The string should not include outer parentheses.
 */
export function countArguments(args: string): number {
  const len = args.length;
  if (len === 0) return 0;

  let pos = skipWhitespace(args, 0);
  if (pos >= len) return 0;

  let count = 1;
  let depth = 0;

  while (pos < len) {
    const ch = args[pos];

    if (ch === '"' || ch === "'") {
      pos = skipQuotedString(args, pos + 1, ch);
      continue;
    }

    if (isHeredocStart(args, pos)) {
      pos = skipHeredoc(args, pos + 3);
      continue;
    }

    if (ch === "(" || ch === "[" || ch === "{") {
      depth++;
      pos++;
      continue;
    }

    if (ch === ")" || ch === "]" || ch === "}") {
      depth--;
      pos++;
      continue;
    }

    if (ch === "," && depth === 0) {
      count++;
    }

    pos++;
  }

  return count;
}

export function startsWithArray(args: string): boolean {
  const pos = skipWhitespace(args, 0);
  return pos < args.length && args[pos] === "[";
}

export function isSimpleString(args: string): boolean {
  let pos = skipWhitespace(args, 0);
  if (pos >= args.length) return false;

  const ch = args[pos];
  if (ch !== '"' && ch !== "'") return false;

  pos = skipQuotedString(args, pos + 1, ch);
  pos = skipWhitespace(args, pos);

  return pos >= args.length;
}

export function unwrapParentheses(args: string): string {
  const trimmed = args.trim();
  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
