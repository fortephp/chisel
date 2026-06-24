export type ScriptScanState =
  | "code"
  | "single"
  | "double"
  | "template"
  | "lineComment"
  | "blockComment"
  | "regex"
  | "regexClass";

export function isLikelyInsideScriptLiteralOrComment(
  source: string,
  contentStart: number,
  offset: number,
): boolean {
  return getScriptScanStateAtOffset(source, contentStart, offset) !== "code";
}

export function isLikelyInsideScriptComment(
  source: string,
  contentStart: number,
  offset: number,
): boolean {
  const state = getScriptScanStateAtOffset(source, contentStart, offset);
  return state === "lineComment" || state === "blockComment";
}

function getScriptScanStateAtOffset(
  source: string,
  contentStart: number,
  offset: number,
): ScriptScanState {
  let state: ScriptScanState = "code";
  const templateExpressionDepthStack: number[] = [];

  for (let i = contentStart; i < offset; i++) {
    const ch = source[i];
    const next = i + 1 < offset ? source[i + 1] : "";

    if (state === "lineComment") {
      if (ch === "\n") {
        state = "code";
      }
      continue;
    }

    if (state === "blockComment") {
      if (ch === "*" && next === "/") {
        state = "code";
        i++;
      }
      continue;
    }

    if (state === "single") {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === "'") {
        state = "code";
      }
      continue;
    }

    if (state === "double") {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === '"') {
        state = "code";
      }
      continue;
    }

    if (state === "template") {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === "$" && next === "{") {
        templateExpressionDepthStack.push(1);
        state = "code";
        i++;
        continue;
      }
      if (ch === "`") {
        state = "code";
      }
      continue;
    }

    if (state === "regex") {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === "[") {
        state = "regexClass";
        continue;
      }
      if (ch === "/") {
        state = "code";
      }
      continue;
    }

    if (state === "regexClass") {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === "]") {
        state = "regex";
      }
      continue;
    }

    // code state
    if (templateExpressionDepthStack.length > 0) {
      if (ch === "{") {
        templateExpressionDepthStack[templateExpressionDepthStack.length - 1]++;
        continue;
      }

      if (ch === "}") {
        templateExpressionDepthStack[templateExpressionDepthStack.length - 1]--;
        if (templateExpressionDepthStack[templateExpressionDepthStack.length - 1] === 0) {
          templateExpressionDepthStack.pop();
          state = "template";
        }
        continue;
      }
    }

    if (ch === "/" && next === "/") {
      state = "lineComment";
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      state = "blockComment";
      i++;
      continue;
    }
    if (
      ch === "/" &&
      next !== "/" &&
      next !== "*" &&
      isLikelyRegexLiteralStart(source, contentStart, i)
    ) {
      state = "regex";
      continue;
    }
    if (ch === "'") {
      state = "single";
      continue;
    }
    if (ch === '"') {
      state = "double";
      continue;
    }
    if (ch === "`") {
      state = "template";
    }
  }

  return state;
}

const REGEX_PREFIX_KEYWORDS = new Set([
  "return",
  "throw",
  "do",
  "case",
  "delete",
  "void",
  "typeof",
  "instanceof",
  "in",
  "of",
  "yield",
  "await",
  "else",
]);

const REGEX_AFTER_PAREN_KEYWORDS = new Set(["if", "while", "for", "with", "catch"]);
const IDENTIFIER_PART_RE = /^[$_\p{ID_Continue}]$/u;

function isIdentifierPart(ch: string): boolean {
  return IDENTIFIER_PART_RE.test(ch);
}

function previousNonWhitespaceIndex(
  source: string,
  contentStart: number,
  startExclusive: number,
): number {
  for (let i = startExclusive - 1; i >= contentStart; i--) {
    const ch = source[i];
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      continue;
    }
    return i;
  }

  return -1;
}

function getPreviousIdentifierToken(
  source: string,
  contentStart: number,
  index: number,
): { token: string; start: number } | null {
  if (index < contentStart || !isIdentifierPart(source[index])) {
    return null;
  }

  let tokenStart = index;
  while (tokenStart - 1 >= contentStart && isIdentifierPart(source[tokenStart - 1])) {
    tokenStart--;
  }

  return {
    token: source.slice(tokenStart, index + 1),
    start: tokenStart,
  };
}

function isRegexAfterConditionParen(
  source: string,
  contentStart: number,
  closeParenIndex: number,
): boolean {
  let depth = 0;
  let openParenIndex = -1;

  for (let i = closeParenIndex; i >= contentStart; i--) {
    const ch = source[i];
    if (ch === ")") {
      depth++;
      continue;
    }

    if (ch === "(") {
      depth--;
      if (depth === 0) {
        openParenIndex = i;
        break;
      }
    }
  }

  if (openParenIndex < 0) {
    return false;
  }

  let i = openParenIndex - 1;
  while (i >= contentStart) {
    const ch = source[i];
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      i--;
      continue;
    }

    const tokenInfo = getPreviousIdentifierToken(source, contentStart, i);
    if (!tokenInfo) {
      return false;
    }

    return REGEX_AFTER_PAREN_KEYWORDS.has(tokenInfo.token);
  }

  return false;
}

function isLikelyRegexLiteralStart(
  source: string,
  contentStart: number,
  slashIndex: number,
): boolean {
  for (let i = slashIndex - 1; i >= contentStart; i--) {
    const ch = source[i];
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      continue;
    }

    // A slash after a completed string/template literal is division, not regex.
    if (ch === "'" || ch === '"' || ch === "`") {
      return false;
    }

    if (isIdentifierPart(ch)) {
      const tokenInfo = getPreviousIdentifierToken(source, contentStart, i);
      return tokenInfo !== null && REGEX_PREFIX_KEYWORDS.has(tokenInfo.token);
    }

    if (ch === ")") {
      return isRegexAfterConditionParen(source, contentStart, i);
    }

    if (ch === "+" || ch === "-") {
      const beforeIndex = previousNonWhitespaceIndex(source, contentStart, i);
      if (beforeIndex >= contentStart && source[beforeIndex] === ch) {
        return false;
      }
      return true;
    }

    if (ch === "]" || ch === "}") {
      return false;
    }

    return true;
  }

  return true;
}
