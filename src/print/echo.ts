import type { Doc, Options } from "prettier";
import { doc } from "prettier";
import type { WrappedNode } from "../types.js";
import { TokenType } from "../lexer/types.js";
import { NodeKind } from "../tree/types.js";
import { isScriptLikeTag } from "../node-predicates.js";
import { getEchoSpacingMode } from "./blade-options.js";
import { replaceEndOfLine } from "./doc-utils.js";
import { getEchoDelimiters, normalizeMultilineEchoIndentText } from "./echo-normalization.js";
import { fullText } from "./utils.js";

const { hardline } = doc.builders;

export function printEcho(node: WrappedNode, options: Options): Doc {
  const spacing = getEchoSpacingMode(options);
  if (spacing === "preserve") {
    const raw = isUnterminatedEchoAtEof(node)
      ? trimTrailingWhitespace(fullText(node))
      : fullText(node);
    return shouldNormalizeMultilineEchoIndent(node, options)
      ? replaceEndOfLine(normalizeMultilineEchoIndentText(node, raw, options), hardline)
      : raw;
  }

  const content = getEchoContent(node);
  if (content === null) {
    return fullText(node);
  }

  const trimmed = content.trim();
  const { open, close } = getEchoDelimiters(node) ?? { open: "{{", close: "}}" };

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

function shouldNormalizeMultilineEchoIndent(node: WrappedNode, options: Options): boolean {
  const raw = fullText(node);
  return (
    !!node.parent &&
    isScriptLikeTag(node.parent, options) &&
    (raw.includes("\n") || raw.includes("\r"))
  );
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
