import type { WrappedNode } from "../types.js";
import { NodeKind } from "../tree/types.js";
import { isFrontendEventStyleAtName } from "../frontend-attribute-names.js";
import { isAsciiAlnum, isAsciiAlpha } from "../lexer/scan-primitives.js";
import { extractStyleAtRuleNameAt, isKnownStyleAtRuleName } from "./style-at-rules.js";

type RawContentContext = "style" | "script" | "generic";

function extractDirectiveName(text: string): string | null {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith("@")) return null;

  let i = 1;
  if (i >= trimmed.length) return null;

  const first = trimmed.charCodeAt(i);
  if (!isAsciiAlpha(first) && first !== 95) return null;

  while (i < trimmed.length) {
    const code = trimmed.charCodeAt(i);
    if (!isAsciiAlnum(code) && code !== 95) break;
    i++;
  }

  return trimmed.slice(1, i).toLowerCase();
}

function hasPhpLikeMarkers(text: string): boolean {
  const hasCallWithLiteralArgs = /@[A-Za-z_][A-Za-z0-9_]*\s*\(\s*['"`[]/u.test(text);
  let hasNamedArgs = false;
  const openParen = text.indexOf("(");
  const closeParen = text.lastIndexOf(")");
  if (openParen >= 0 && closeParen > openParen) {
    const args = text.slice(openParen + 1, closeParen);
    hasNamedArgs = /(^|,)\s*[A-Za-z_][A-Za-z0-9_]*\s*:/u.test(args);
  }
  return (
    text.includes("$") ||
    text.includes("->") ||
    text.includes("::") ||
    text.includes("=>") ||
    hasCallWithLiteralArgs ||
    hasNamedArgs
  );
}

function hasDirectiveCallArgs(text: string): boolean {
  return /@[A-Za-z_][A-Za-z0-9_]*\s*\(/u.test(text);
}

function isDirectiveNodeBladeLike(node: WrappedNode, context: RawContentContext): boolean {
  const text = node.source.slice(node.start, node.end);
  const name = extractDirectiveName(text);
  if (!name) return false;

  if (context === "style") {
    const styleAtRuleName = extractStyleAtRuleNameAt(node.source, node.start);
    if (styleAtRuleName && isKnownStyleAtRuleName(styleAtRuleName)) {
      const trainedDirectives = node.buildResult.directives;
      if (!trainedDirectives?.isDirective(name)) {
        return false;
      }

      return styleAtRuleName === name && (hasPhpLikeMarkers(text) || hasDirectiveCallArgs(text));
    }

    if (isFrontendEventStyleAtName(name)) {
      return hasPhpLikeMarkers(text);
    }
  } else if (isFrontendEventStyleAtName(name)) {
    return hasPhpLikeMarkers(text);
  }

  const trainedDirectives = node.buildResult.directives;
  if (trainedDirectives?.isDirective(name)) {
    return true;
  }

  // Unknown directive-like token in raw content: only treat as Blade-like
  // when it clearly carries PHP-like syntax.
  return hasPhpLikeMarkers(text);
}

export function isBladeConstructChild(
  node: WrappedNode,
  context: RawContentContext = "generic",
): boolean {
  switch (node.kind) {
    case NodeKind.Echo:
    case NodeKind.RawEcho:
    case NodeKind.TripleEcho:
    case NodeKind.PhpTag:
    case NodeKind.PhpBlock:
    case NodeKind.DirectiveBlock:
    case NodeKind.IgnoreRange:
      return true;
    case NodeKind.Directive:
      return isDirectiveNodeBladeLike(node, context);
    default:
      return false;
  }
}

function elementContent(node: WrappedNode): string {
  if (node.openTagEndOffset > 0 && node.closingTagStartOffset > node.openTagEndOffset) {
    return node.source.slice(node.openTagEndOffset, node.closingTagStartOffset);
  }

  if (node.children.length === 0) return "";
  const start = node.children[0].start;
  const end = node.children[node.children.length - 1].end;
  if (end <= start) return "";
  return node.source.slice(start, end);
}

export function parentContainsBladeSyntax(
  node: WrappedNode,
  context: RawContentContext = "generic",
): boolean {
  if (node.kind !== NodeKind.Element) return false;

  if (node.children.some((child) => isBladeConstructChild(child, context))) {
    return true;
  }

  const content = elementContent(node);
  return (
    content.includes("{{") ||
    content.includes("{!!") ||
    content.includes("{{{") ||
    content.includes("<?php")
  );
}
