import type { Doc, Options } from "prettier";
import { doc } from "prettier";
import type { WrappedNode } from "../types.js";
import { TokenType } from "../lexer/types.js";
import { NodeKind } from "../tree/types.js";
import { isScriptLikeTag } from "../node-predicates.js";
import { getEchoSpacingMode } from "./blade-options.js";
import { replaceEndOfLine } from "./doc-utils.js";
import { dedentString, fullText } from "./utils.js";

const { hardline } = doc.builders;

export function printEcho(node: WrappedNode, options: Options): Doc {
  const spacing = getEchoSpacingMode(options);
  if (spacing === "preserve") {
    const raw = isUnterminatedEchoAtEof(node)
      ? trimTrailingWhitespace(fullText(node))
      : fullText(node);
    return shouldNormalizeMultilineEchoIndent(node, options)
      ? replaceEndOfLine(normalizeMultilineEchoIndent(node, raw, options), hardline)
      : raw;
  }

  const content = getEchoContent(node);
  if (content === null) {
    return fullText(node);
  }

  const trimmed = content.trim();
  const { open, close } = getEchoDelimiters(node);

  if (trimmed.length === 0) {
    return spacing === "tight" ? `${open}${close}` : `${open} ${close}`;
  }

  if (trimmed.includes("\n")) {
    return `${open}\n${trimmed}\n${close}`;
  }

  if (spacing === "tight") {
    return `${open}${trimmed}${close}`;
  }

  return `${open} ${trimmed} ${close}`;
}

function getEchoContent(node: WrappedNode): string | null {
  const start = node.flat.tokenStart;
  const end = start + node.flat.tokenCount;
  const tokens = node.buildResult.tokens;
  const parts: string[] = [];

  for (let i = start; i < end; i++) {
    const token = tokens[i];
    if (token.type === TokenType.EchoContent) {
      parts.push(node.source.slice(token.start, token.end));
    }
  }

  if (parts.length === 0) return null;
  return parts.join("");
}

function getEchoDelimiters(node: WrappedNode): { open: string; close: string } {
  switch (node.kind) {
    case NodeKind.RawEcho:
      return { open: "{!!", close: "!!}" };
    case NodeKind.TripleEcho:
      return { open: "{{{", close: "}}}" };
    case NodeKind.Echo:
    default:
      return { open: "{{", close: "}}" };
  }
}

function shouldNormalizeMultilineEchoIndent(node: WrappedNode, options: Options): boolean {
  const raw = fullText(node);
  return (
    !!node.parent &&
    isScriptLikeTag(node.parent, options) &&
    (raw.includes("\n") || raw.includes("\r"))
  );
}

function getIndentUnit(options: Options): string {
  const raw = (options as Record<string, unknown>).tabWidth;
  const tabWidth = typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 2;
  return (options as Record<string, unknown>).useTabs === true ? "\t" : " ".repeat(tabWidth);
}

function stripBoundaryLineBreaks(value: string): string {
  let next = value;

  if (next.startsWith("\r\n")) {
    next = next.slice(2);
  } else if (next.startsWith("\n")) {
    next = next.slice(1);
  }

  if (next.endsWith("\r\n")) {
    next = next.slice(0, -2);
  } else if (next.endsWith("\n")) {
    next = next.slice(0, -1);
  }

  return next;
}

function normalizeMultilineEchoIndent(node: WrappedNode, value: string, options: Options): string {
  const normalized = value.replace(/\r\n?/gu, "\n").trim();
  const { open, close } = getEchoDelimiters(node);
  if (!normalized.startsWith(open) || !normalized.endsWith(close)) {
    return value;
  }

  const inner = stripBoundaryLineBreaks(
    normalized.slice(open.length, normalized.length - close.length),
  ).replace(/\n[^\S\r\n]*$/u, "");
  if (inner.trim().length === 0) {
    return `${open}\n${close}`;
  }

  const indentUnit = getIndentUnit(options);
  const body = dedentString(inner)
    .split("\n")
    .map((line) => (line.trim().length === 0 ? "" : `${indentUnit}${line}`))
    .join("\n");

  return `${open}\n${body}\n${close}`;
}

function isUnterminatedEchoAtEof(node: WrappedNode): boolean {
  if (node.end !== node.source.length) {
    return false;
  }

  const start = node.flat.tokenStart;
  const end = start + node.flat.tokenCount;
  const tokens = node.buildResult.tokens;
  const endType =
    node.kind === NodeKind.RawEcho
      ? TokenType.RawEchoEnd
      : node.kind === NodeKind.TripleEcho
        ? TokenType.TripleEchoEnd
        : TokenType.EchoEnd;

  for (let i = start; i < end; i++) {
    if (tokens[i].type === endType) {
      return false;
    }
  }

  return true;
}

function trimTrailingWhitespace(value: string): string {
  return value.replace(/\s+$/u, "");
}
