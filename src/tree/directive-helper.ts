import { TokenType, type Token } from "../lexer/types.js";
import type { Directives } from "./directives.js";

export function extractDirectiveName(token: Token, source: string): string {
  let text = source.slice(token.start, token.end);
  if (text.startsWith("@")) text = text.slice(1);
  return text.toLowerCase();
}

export function getTerminatorName(directiveName: string, directives: Directives | null): string {
  if (directives !== null) {
    return directives.getTerminator(directiveName);
  }
  return "end" + directiveName;
}

export function getTerminatorNames(directiveName: string, directives: Directives | null): string[] {
  if (directives !== null) {
    const directive = directives.getDirective(directiveName);
    if (directive !== null && directive.terminators.length > 0) {
      return [...directive.terminators];
    }
  }
  return ["end" + directiveName];
}

/**
 * Check for DirectiveArgs token following a directive.
 *
 * Handles optional whitespace between directive and args:
 *   `@if ($x)`  - whitespace then DirectiveArgs
 *   `@if($x)`   - DirectiveArgs immediately
 */
export function checkDirectiveArgs(
  tokens: readonly Token[],
  source: string,
  startIdx: number,
  endIdx: number,
): { hasArgs: boolean; argsContent: string | null; consumed: number } {
  const fast = checkDirectiveArgsFast(tokens, startIdx, endIdx);
  if (!fast.hasArgs || fast.argsTokenIndex === -1) {
    return { hasArgs: false, argsContent: null, consumed: fast.consumed };
  }
  const argsToken = tokens[fast.argsTokenIndex];
  return {
    hasArgs: true,
    argsContent: source.slice(argsToken.start, argsToken.end),
    consumed: fast.consumed,
  };
}

export function checkDirectiveArgsFast(
  tokens: readonly Token[],
  startIdx: number,
  endIdx: number,
): { hasArgs: boolean; argsTokenIndex: number; consumed: number } {
  let consumed = 0;
  let checkIdx = startIdx;

  // Skip optional whitespace before args.
  if (checkIdx < endIdx && tokens[checkIdx].type === TokenType.Whitespace) {
    if (checkIdx + 1 < endIdx && tokens[checkIdx + 1].type === TokenType.DirectiveArgs) {
      consumed++;
      checkIdx++;
    }
  }

  if (checkIdx < endIdx && tokens[checkIdx].type === TokenType.DirectiveArgs) {
    consumed++;
    return { hasArgs: true, argsTokenIndex: checkIdx, consumed };
  }

  return { hasArgs: false, argsTokenIndex: -1, consumed };
}

/**
 * Find a matching terminator for a directive (nesting-aware).
 *
 * Scans forward through tokens, tracking nesting depth of the same
 * directive name, and returns the token index of the matching terminator.
 */
export function findMatchingTerminator(
  directiveName: string,
  tokens: readonly Token[],
  source: string,
  startIdx: number,
  endIdx: number,
  directives: Directives | null,
  maxLookahead = Infinity,
): number | null {
  const terminators = getTerminatorNames(directiveName, directives);
  const primaryTerminator = getTerminatorName(directiveName, directives);
  const needle = directiveName.toLowerCase();

  let nesting = 0;
  let checked = 0;
  const limit = Math.min(endIdx, tokens.length);

  for (let i = startIdx; i < limit; i++) {
    if (tokens[i].type !== TokenType.Directive) continue;

    checked++;
    if (checked > maxLookahead) break;

    const name = extractDirectiveName(tokens[i], source);

    if (name === needle) {
      nesting++;
      continue;
    }

    if (terminators.includes(name) || name === primaryTerminator) {
      if (nesting === 0) return i;
      nesting--;
    }
  }

  return null;
}
