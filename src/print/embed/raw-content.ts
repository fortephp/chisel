import type { AstPath, Doc, Options } from "prettier";
import { doc } from "prettier";
import { format as prettierFormat } from "prettier";
import type { WrappedNode } from "../../types.js";
import {
  trimFinalLineBreak,
  normalizeLineEndingsToLf,
  trimTrailingHorizontalWhitespace,
} from "../../string-utils.js";
import { NodeKind, StructureRole } from "../../tree/types.js";
import { TokenType } from "../../lexer/types.js";
import { dedentString, fullText, getAttrMap, inferElementParser } from "../utils.js";
import {
  printClosingTag,
  printClosingTagSuffix,
  printOpeningTag,
  printOpeningTagPrefix,
} from "../tag.js";
import { printDirective } from "../directive.js";
import { printEcho } from "../echo.js";
import { replaceEndOfLine } from "../doc-utils.js";
import { isBladeConstructChild, parentContainsBladeSyntax } from "../blade-syntax.js";
import {
  formatDirectiveNodeArgs,
  formatEchoNode,
  formatPhpBlockNode,
  formatPhpTagNode,
  isPhpFormattingEnabled,
} from "./php.js";
import { resolveEmbeddedParserPlugins } from "./embedded-parser-plugins.js";

const { group, hardline, indent } = doc.builders;

type EmbedPrint = (selector?: string | number | Array<string | number> | AstPath) => Doc;

type LeafConstructNode = WrappedNode & {
  kind:
    | NodeKind.Directive
    | NodeKind.Echo
    | NodeKind.RawEcho
    | NodeKind.TripleEcho
    | NodeKind.PhpBlock
    | NodeKind.PhpTag
    | NodeKind.BladeComment
    | NodeKind.Comment
    | NodeKind.BogusComment
    | NodeKind.NonOutput;
};

type PlaceholderKind = "expr" | "stmt";

interface PlaceholderSlot {
  readonly node: LeafConstructNode;
  readonly start: number;
  readonly end: number;
  readonly marker: string;
  readonly replacementText: string;
}

interface PlaceholderCandidate {
  readonly node: LeafConstructNode;
  readonly start: number;
  readonly end: number;
  readonly kind: PlaceholderKind;
  readonly inStyleValueContext: boolean;
  readonly replacementText: string;
}

interface StyleCommentSlot {
  readonly marker: string;
  readonly text: string;
}

type TextTransform = (value: string) => string;

const EXPRESSION_DIRECTIVES = new Set(["json", "js", "entangle", "this"]);
function isLeafConstructNode(node: WrappedNode): node is LeafConstructNode {
  switch (node.kind) {
    case NodeKind.Directive:
    case NodeKind.Echo:
    case NodeKind.RawEcho:
    case NodeKind.TripleEcho:
    case NodeKind.PhpBlock:
    case NodeKind.PhpTag:
    case NodeKind.BladeComment:
    case NodeKind.Comment:
    case NodeKind.BogusComment:
    case NodeKind.NonOutput:
      return true;
    default:
      return false;
  }
}

function extractDirectiveName(node: WrappedNode): string | null {
  if (node.kind !== NodeKind.Directive) return null;
  const tokenStart = node.flat.tokenStart;
  const tokenEnd = tokenStart + node.flat.tokenCount;
  const tokens = node.buildResult.tokens;

  for (let i = tokenStart; i < tokenEnd; i++) {
    const token = tokens[i];
    if (token.type !== TokenType.Directive) continue;
    const raw = node.source.slice(token.start, token.end);
    if (!raw.startsWith("@")) return null;
    return raw.slice(1).toLowerCase();
  }

  return null;
}

function isKnownBladeDirective(node: WrappedNode): boolean {
  const name = extractDirectiveName(node);
  if (!name) {
    return false;
  }

  return node.buildResult.directives?.getDirective(name) !== undefined;
}

function getPlaceholderKind(node: LeafConstructNode): PlaceholderKind {
  switch (node.kind) {
    case NodeKind.Echo:
    case NodeKind.RawEcho:
    case NodeKind.TripleEcho:
      return "expr";
    case NodeKind.PhpTag:
    case NodeKind.PhpBlock:
      return "expr";
    case NodeKind.Directive: {
      const name = extractDirectiveName(node);
      return name && EXPRESSION_DIRECTIVES.has(name) ? "expr" : "stmt";
    }
    default:
      return "stmt";
  }
}

function isStyleParser(parser: string): boolean {
  return parser === "css" || parser === "scss" || parser === "less";
}

function getPlaceholderMarker(
  markerSessionKey: string,
  kind: PlaceholderKind,
  index: number,
  parser: string,
  inStyleValueContext = false,
): string {
  if (isStyleParser(parser)) {
    if (inStyleValueContext) {
      return `__blade_value_slot_${markerSessionKey}_${index}__`;
    }
    return kind === "expr"
      ? `/*__blade_expr_slot_${markerSessionKey}_${index}__*/`
      : `@__blade_stmt_slot_${markerSessionKey}_${index};`;
  }

  if (kind === "expr") {
    return `__blade_expr_slot_${markerSessionKey}_${index}__`;
  }
  return `/*__blade_stmt_slot_${markerSessionKey}_${index}__*/`;
}

function createMarkerSessionKey(source: string, start: number, end: number): string {
  const base = `${source.length.toString(36)}_${start.toString(36)}_${end.toString(36)}`;

  for (let attempt = 0; ; attempt++) {
    const candidate = attempt === 0 ? base : `${base}_${attempt.toString(36)}`;
    if (
      !source.includes(`__blade_expr_slot_${candidate}_`) &&
      !source.includes(`__blade_stmt_slot_${candidate}_`) &&
      !source.includes(`__blade_value_slot_${candidate}_`)
    ) {
      return candidate;
    }
  }
}

function isInCssValueContext(source: string, slotStart: number, contentStart: number): boolean {
  for (let i = slotStart - 1; i >= contentStart; i--) {
    const ch = source[i];
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      continue;
    }
    if (ch === ":") {
      return true;
    }
    if (ch === "}") {
      // Blade echo closers (e.g. "}}", "}}}") appear in CSS values and should
      // not be treated like CSS declaration/block boundaries.
      if (
        (i - 1 >= contentStart && source[i - 1] === "}") ||
        (i + 1 < slotStart && source[i + 1] === "}") ||
        (i - 1 >= contentStart && source[i - 1] === "!")
      ) {
        continue;
      }
      return false;
    }
    if (ch === "{") {
      // Blade echo openers (e.g. "{{", "{{{", "{!!") appear in CSS values.
      if (
        (i - 1 >= contentStart && source[i - 1] === "{") ||
        (i + 1 < slotStart && source[i + 1] === "{") ||
        (i + 1 < slotStart && source[i + 1] === "!")
      ) {
        continue;
      }
      return false;
    }
    if (ch === ";") {
      return false;
    }
    // Keep scanning through property/value tokens until declaration boundaries.
  }

  return false;
}

function getElementContentRange(node: WrappedNode): { start: number; end: number } {
  if (node.openTagEndOffset > 0 && node.closingTagStartOffset > node.openTagEndOffset) {
    return { start: node.openTagEndOffset, end: node.closingTagStartOffset };
  }

  if (node.children.length === 0) {
    return { start: node.start, end: node.start };
  }

  return {
    start: node.children[0].start,
    end: node.children[node.children.length - 1].end,
  };
}

function collectLeafConstructs(node: WrappedNode, start: number, end: number): LeafConstructNode[] {
  const out: LeafConstructNode[] = [];
  const stack: WrappedNode[] = [...node.children];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current.end <= start || current.start >= end) {
      continue;
    }

    if (isLeafConstructNode(current)) {
      if (current.start >= start && current.end <= end) {
        out.push(current);
      }
      if (current.kind !== NodeKind.Directive || current.children.length === 0) {
        continue;
      }
    }

    for (let i = current.children.length - 1; i >= 0; i--) {
      stack.push(current.children[i]);
    }
  }

  out.sort((a, b) => a.start - b.start || a.end - b.end);
  return out;
}

function getReplacementRange(node: LeafConstructNode): { start: number; end: number } {
  if (node.kind !== NodeKind.Directive) {
    return { start: node.start, end: node.end };
  }

  const tokenStart = node.flat.tokenStart;
  const tokenEnd = tokenStart + node.flat.tokenCount;
  if (node.flat.tokenCount <= 0) {
    return { start: node.start, end: node.end };
  }

  const first = node.buildResult.tokens[tokenStart];
  const last = node.buildResult.tokens[tokenEnd - 1];
  if (!first || !last) {
    return { start: node.start, end: node.end };
  }

  return { start: first.start, end: last.end };
}

function docToFlatString(value: Doc): string | null {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return null;

  let out = "";
  for (const part of value) {
    const rendered = docToFlatString(part);
    if (rendered === null) return null;
    out += rendered;
  }

  return out;
}

async function getConstructReplacementText(
  node: LeafConstructNode,
  options: Options,
): Promise<string> {
  switch (node.kind) {
    case NodeKind.Echo:
    case NodeKind.RawEcho:
    case NodeKind.TripleEcho: {
      const formatted = await formatEchoNode(node, options);
      if (formatted !== null) return formatted;
      const rendered = docToFlatString(printEcho(node, options));
      return rendered ?? fullText(node);
    }
    case NodeKind.Directive: {
      const formatted = await formatDirectiveNodeArgs(node, options);
      if (formatted !== null) return formatted;
      const rendered = docToFlatString(printDirective(node, options));
      return rendered ?? fullText(node);
    }
    case NodeKind.PhpTag: {
      const formatted = await formatPhpTagNode(node, options);
      return formatted ?? fullText(node);
    }
    case NodeKind.PhpBlock: {
      const formatted = await formatPhpBlockNode(node, options);
      return formatted ?? fullText(node);
    }
    default:
      return fullText(node);
  }
}

function buildMaskedSource(
  source: string,
  start: number,
  end: number,
  slots: readonly PlaceholderSlot[],
): string {
  let cursor = start;
  let out = "";

  for (const slot of slots) {
    out += source.slice(cursor, slot.start);
    out += slot.marker;
    cursor = slot.end;
  }

  out += source.slice(cursor, end);
  return out;
}

function normalizeStyleValueReplacementText(value: string): string {
  const lines = normalizeLineEndingsToLf(value).split("\n");
  if (lines.length <= 1) {
    return value;
  }

  let minIndent = Number.POSITIVE_INFINITY;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim().length === 0) {
      continue;
    }

    const indent = line.match(/^[ \t]*/u)?.[0].length ?? 0;
    if (indent < minIndent) {
      minIndent = indent;
    }
  }

  if (!Number.isFinite(minIndent) || minIndent <= 0) {
    return lines.join("\n");
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim().length === 0) {
      continue;
    }

    lines[i] = line.slice(Math.min(minIndent, line.length));
  }

  return lines.join("\n");
}

function applyMarkerReplacements(
  value: string,
  slots: readonly PlaceholderSlot[],
): { text: string; allFound: boolean } {
  let out = value;
  let allFound = true;

  for (const slot of slots) {
    const start = out.indexOf(slot.marker);
    if (start < 0) {
      allFound = false;
      continue;
    }

    const duplicate = out.indexOf(slot.marker, start + slot.marker.length) >= 0;
    if (duplicate) {
      allFound = false;
      continue;
    }

    out = `${out.slice(0, start)}${slot.replacementText}${out.slice(start + slot.marker.length)}`;
  }

  return { text: out, allFound };
}

function maskStyleDirectiveLikeComments(
  value: string,
  markerSessionKey: string,
): { text: string; slots: readonly StyleCommentSlot[] } {
  const slots: StyleCommentSlot[] = [];
  let index = 0;
  const masked = value.replace(/\/\*[^]*?\*\//gu, (match) => {
    if (!match.includes("@")) {
      return match;
    }

    const marker = `/*__blade_comment_slot_${markerSessionKey}_${index}__*/`;
    slots.push({ marker, text: match });
    index++;
    return marker;
  });

  return { text: masked, slots };
}

function applyStyleCommentReplacements(
  value: string,
  slots: readonly StyleCommentSlot[],
): { text: string; allFound: boolean } {
  let out = value;
  let allFound = true;

  for (const slot of slots) {
    const start = out.indexOf(slot.marker);
    if (start < 0) {
      allFound = false;
      continue;
    }

    const duplicate = out.indexOf(slot.marker, start + slot.marker.length) >= 0;
    if (duplicate) {
      allFound = false;
      continue;
    }

    out = `${out.slice(0, start)}${slot.text}${out.slice(start + slot.marker.length)}`;
  }

  return { text: out, allFound };
}

function getEmbeddedTextToDocOptions(node: WrappedNode, parser: string): Options {
  const textToDocOptions: Record<string, unknown> = {
    parser,
    __embeddedInHtml: true,
  };

  if (parser === "babel") {
    let sourceType = "script";
    const attrMap = getAttrMap(node);
    if (
      attrMap.type === "module" ||
      ((attrMap.type === "text/babel" || attrMap.type === "text/jsx") &&
        attrMap["data-type"] === "module")
    ) {
      sourceType = "module";
    }
    textToDocOptions.__babelSourceType = sourceType;
  }

  return textToDocOptions as Options;
}

async function createSubformatOptions(
  options: Options,
  parser: string,
  node: WrappedNode,
): Promise<Options> {
  const base = { ...(options as Record<string, unknown>) };
  delete base.parser;
  delete base.parentParser;
  delete base.plugins;
  delete base.rangeStart;
  delete base.rangeEnd;
  delete base.cursorOffset;

  const plugins = await resolveEmbeddedParserPlugins(options, parser);

  return {
    ...base,
    ...getEmbeddedTextToDocOptions(node, parser),
    plugins: plugins as Options["plugins"],
  } as Options;
}

function buildScriptLikeElementDoc(
  path: AstPath<WrappedNode>,
  node: WrappedNode,
  options: Options,
  print: EmbedPrint,
  content: Doc,
  rawValue: string,
  contentAlreadyIndented = false,
): Doc {
  const isEmpty = /^\s*$/.test(rawValue);

  return [
    printOpeningTagPrefix(node, options),
    group(printOpeningTag(path, options, print as unknown as (path: AstPath<WrappedNode>) => Doc)),
    isEmpty ? "" : contentAlreadyIndented ? [hardline, content] : indent([hardline, content]),
    isEmpty ? "" : hardline,
    printClosingTag(node, options),
    printClosingTagSuffix(node, options),
  ];
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

function trimTrailingWhitespaceOnlyLine(value: string): string {
  return value.replace(/\r?\n[^\S\r\n]*$/u, "");
}

function applyTextTransforms(value: string, transforms: readonly TextTransform[]): string {
  let next = value;

  for (const transform of transforms) {
    next = transform(next);
  }

  return next;
}

function normalizeEmbeddedRawContentFallback(value: string): string {
  return applyTextTransforms(value, [
    stripBoundaryLineBreaks,
    trimTrailingWhitespaceOnlyLine,
    dedentString,
    normalizeLineEndingsToLf,
  ]);
}

function normalizeStyleEmbeddedOutput(value: string): string {
  return applyTextTransforms(value, [
    normalizeStyleDirectiveBoundaries,
    normalizeStyleBladeValueIndentation,
    normalizeStyleStructuralDirectiveSemicolons,
    normalizeStyleDirectiveCommentChains,
    normalizeStyleDirectiveCommentSelectorLines,
    normalizeStyleDirectiveChainBlankLines,
    normalizeStyleBlankLineRuns,
    normalizeStyleStandaloneSemicolonLines,
    repairStyleBrokenCommentClosers,
    normalizeStyleCommentRunLines,
    normalizeStyleDirectiveSelectorAlignment,
    trimTrailingHorizontalWhitespace,
  ]);
}

function normalizeEmbeddedOutput(value: string, tagName: string): string {
  const normalized = tagName === "style" ? normalizeStyleEmbeddedOutput(value) : value;

  return applyTextTransforms(normalized, [
    normalizeLineEndingsToLf,
    trimTrailingWhitespaceOnlyLine,
    trimFinalLineBreak,
  ]);
}

function normalizeStyleDirectiveBoundaries(value: string): string {
  type ScanState = "code" | "single" | "double" | "lineComment" | "blockComment";
  const directivePattern = /^@[A-Za-z_][A-Za-z0-9_]*(?:\s*\([^)]*\))?/u;
  let state: ScanState = "code";
  let out = "";

  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    const next = i + 1 < value.length ? value[i + 1] : "";

    if (state === "lineComment") {
      out += ch;
      if (ch === "\n") {
        state = "code";
      }
      continue;
    }

    if (state === "blockComment") {
      out += ch;
      if (ch === "*" && next === "/") {
        out += "/";
        i++;
        state = "code";
      }
      continue;
    }

    if (state === "single") {
      out += ch;
      if (ch === "\\") {
        if (i + 1 < value.length) {
          out += value[i + 1];
          i++;
        }
        continue;
      }
      if (ch === "'") {
        state = "code";
      }
      continue;
    }

    if (state === "double") {
      out += ch;
      if (ch === "\\") {
        if (i + 1 < value.length) {
          out += value[i + 1];
          i++;
        }
        continue;
      }
      if (ch === '"') {
        state = "code";
      }
      continue;
    }

    if (ch === "/" && next === "*") {
      out += "/*";
      i++;
      state = "blockComment";
      continue;
    }

    if (ch === "/" && next === "/" && shouldTreatAsStyleLineComment(value, 0, i)) {
      out += "//";
      i++;
      state = "lineComment";
      continue;
    }

    if (ch === "'") {
      out += ch;
      state = "single";
      continue;
    }

    if (ch === '"') {
      out += ch;
      state = "double";
      continue;
    }

    if (ch === "}" && value[i - 1] !== "{" && next !== "}") {
      let j = i + 1;
      while (j < value.length) {
        const ws = value[j];
        if (ws === " " || ws === "\t" || ws === "\r" || ws === "\n") {
          j++;
          continue;
        }
        break;
      }

      if (j > i + 1 && directivePattern.test(value.slice(j))) {
        out += "}\n";
        i = j - 1;
        continue;
      }
    }

    out += ch;
  }

  return out;
}

const STYLE_DIRECTIVE_BLOCK_OPENERS = new Set([
  "if",
  "unless",
  "isset",
  "empty",
  "for",
  "foreach",
  "forelse",
  "while",
  "switch",
  "php",
  "verbatim",
]);

const STYLE_DIRECTIVE_BLOCK_CLOSERS = new Set([
  "endif",
  "endunless",
  "endisset",
  "endempty",
  "endfor",
  "endforeach",
  "endforelse",
  "endwhile",
  "endswitch",
  "endphp",
  "endverbatim",
]);

const STYLE_DIRECTIVE_BRANCHES = new Set(["else", "elseif", "empty", "case", "default"]);
const STYLE_RAW_BLADE_FALLBACK_RE =
  /(?:\{\{|\{!!|@(?:elseif|endif|endunless|endisset|endempty|endfor|endforeach|endforelse|endwhile|endswitch|endphp|endverbatim|foreach|forelse|case|default)\b)/u;

const LARGE_STYLE_EMBED_CHAR_THRESHOLD = 20_000;
const LARGE_STYLE_EMBED_LINE_THRESHOLD = 300;
const UNSTABLE_STYLE_ESCAPED_SLASH_LITERAL = /\/[^\r\n;{}]*\\\s*\/\s*\//u;

function getDirectiveNameFromLine(trimmedLine: string): string | null {
  const match = trimmedLine.match(/^@([A-Za-z_][A-Za-z0-9_]*)/u);
  return match ? match[1].toLowerCase() : null;
}

function isStyleCommentLine(trimmedLine: string): boolean {
  return (
    (trimmedLine.startsWith("/*") && trimmedLine.endsWith("*/")) || trimmedLine.startsWith("//")
  );
}

function normalizeStyleDirectiveLineArgSpacing(line: string): string {
  const match = line.match(/^([ \t]*)@([A-Za-z_][A-Za-z0-9_]*)\s*\(/u);
  if (!match) {
    return line;
  }

  const indent = match[1];
  const name = match[2].toLowerCase();
  if (
    !STYLE_DIRECTIVE_BLOCK_OPENERS.has(name) &&
    !STYLE_DIRECTIVE_BRANCHES.has(name) &&
    !STYLE_DIRECTIVE_BLOCK_CLOSERS.has(name) &&
    !EXPRESSION_DIRECTIVES.has(name)
  ) {
    return line;
  }

  return line.replace(/^([ \t]*)@([A-Za-z_][A-Za-z0-9_]*)\s*\(/u, `${indent}@$2 (`);
}

function isBladeValueLine(trimmedLine: string): boolean {
  return (
    trimmedLine.startsWith("@") ||
    trimmedLine.startsWith("{{") ||
    trimmedLine.startsWith("{!!") ||
    trimmedLine.startsWith("<?php")
  );
}

function splitStyleBladeValueChunks(trimmedLine: string): string[] {
  const directivePattern = /(?:^|\s)(@[A-Za-z_][A-Za-z0-9_]*(?:\s*\([^)]*\))?)(?=\s|$)/gu;
  const chunks: string[] = [];
  let cursor = 0;

  for (const match of trimmedLine.matchAll(directivePattern)) {
    const directive = match[1];
    if (!directive) {
      continue;
    }

    const fullMatch = match[0];
    const fullStart = match.index ?? 0;
    const directiveStart = fullStart + fullMatch.lastIndexOf(directive);

    const before = trimmedLine.slice(cursor, directiveStart).trim();
    if (before.length > 0) {
      chunks.push(before);
    }

    chunks.push(directive);
    cursor = directiveStart + directive.length;
  }

  const tail = trimmedLine.slice(cursor).trim();
  if (tail.length > 0) {
    chunks.push(tail);
  }

  if (chunks.length === 0 && trimmedLine.length > 0) {
    chunks.push(trimmedLine);
  }

  return chunks;
}

function normalizeStyleBladeValueIndentation(value: string): string {
  const lines = value.split(/\r?\n/u);

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    if (!/:\s*$/u.test(current)) continue;

    const baseIndent = current.match(/^\s*/u)?.[0] ?? "";
    const firstContent = i + 1;
    if (firstContent >= lines.length) continue;

    let semicolonIndex = -1;
    let sawBladeValueContent = false;
    const valueChunks: string[] = [];

    for (let j = firstContent; j < lines.length; j++) {
      const trimmed = lines[j].trim();
      if (trimmed.length === 0) continue;

      let lineBody = trimmed;
      let sawTrailingSemicolon = false;

      if (lineBody === ";") {
        semicolonIndex = j;
        break;
      }

      if (lineBody.endsWith(";")) {
        sawTrailingSemicolon = true;
        semicolonIndex = j;
        lineBody = lineBody.slice(0, -1).trimEnd();
      }

      if (lineBody.length > 0) {
        const chunks = splitStyleBladeValueChunks(lineBody);
        valueChunks.push(...chunks);

        if (chunks.some((chunk) => isBladeValueLine(chunk))) {
          sawBladeValueContent = true;
        }
      }

      if (sawTrailingSemicolon) {
        break;
      }
    }

    if (!sawBladeValueContent || semicolonIndex < 0 || valueChunks.length === 0) continue;

    let depth = 0;
    const replacementLines: string[] = [];
    for (const chunk of valueChunks) {
      const trimmed = chunk.trim();
      if (trimmed.length === 0) continue;

      const directiveName = getDirectiveNameFromLine(trimmed);
      if (
        directiveName &&
        (STYLE_DIRECTIVE_BLOCK_CLOSERS.has(directiveName) ||
          STYLE_DIRECTIVE_BRANCHES.has(directiveName))
      ) {
        depth = Math.max(0, depth - 1);
      }

      const lineIndent = `${baseIndent}  ${"  ".repeat(depth)}`;
      replacementLines.push(`${lineIndent}${trimmed}`);

      if (
        directiveName &&
        (STYLE_DIRECTIVE_BLOCK_OPENERS.has(directiveName) ||
          STYLE_DIRECTIVE_BRANCHES.has(directiveName))
      ) {
        depth++;
      }
    }

    replacementLines.push(`${baseIndent}  ;`);
    lines.splice(firstContent, semicolonIndex - firstContent + 1, ...replacementLines);
    i = firstContent + replacementLines.length - 1;
  }

  return lines.join("\n");
}

function normalizeStyleStructuralDirectiveSemicolons(value: string): string {
  type ScanState = "code" | "single" | "double" | "lineComment" | "blockComment";
  let state: ScanState = "code";
  let out = "";
  let lineCode = "";

  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    const next = i + 1 < value.length ? value[i + 1] : "";

    if (state === "lineComment") {
      out += ch;
      if (ch === "\n") {
        state = "code";
        lineCode = "";
      }
      continue;
    }

    if (state === "blockComment") {
      out += ch;
      if (ch === "\n") {
        lineCode = "";
      }
      if (ch === "*" && next === "/") {
        out += "/";
        i++;
        state = "code";
      }
      continue;
    }

    if (state === "single") {
      out += ch;
      if (ch === "\\") {
        if (i + 1 < value.length) {
          out += value[i + 1];
          i++;
        }
        continue;
      }
      if (ch === "'") {
        state = "code";
      }
      if (ch === "\n") {
        lineCode = "";
      }
      continue;
    }

    if (state === "double") {
      out += ch;
      if (ch === "\\") {
        if (i + 1 < value.length) {
          out += value[i + 1];
          i++;
        }
        continue;
      }
      if (ch === '"') {
        state = "code";
      }
      if (ch === "\n") {
        lineCode = "";
      }
      continue;
    }

    if (ch === "/" && next === "*") {
      out += "/*";
      i++;
      state = "blockComment";
      continue;
    }

    if (ch === "/" && next === "/" && shouldTreatAsStyleLineComment(value, 0, i)) {
      out += "//";
      i++;
      state = "lineComment";
      continue;
    }

    if (ch === "'") {
      out += ch;
      lineCode += ch;
      state = "single";
      continue;
    }

    if (ch === '"') {
      out += ch;
      lineCode += ch;
      state = "double";
      continue;
    }

    if (ch === ";") {
      const directiveMatch = lineCode.match(/@([A-Za-z_][A-Za-z0-9_]*)(?:\s*\([^)]*\))?\s*$/u);
      if (directiveMatch) {
        const name = directiveMatch[1].toLowerCase();
        if (
          STYLE_DIRECTIVE_BLOCK_OPENERS.has(name) ||
          STYLE_DIRECTIVE_BRANCHES.has(name) ||
          STYLE_DIRECTIVE_BLOCK_CLOSERS.has(name)
        ) {
          let j = i + 1;
          while (j < value.length) {
            const ws = value[j];
            if (ws === " " || ws === "\t" || ws === "\r") {
              j++;
              continue;
            }
            break;
          }

          const nextCh = j < value.length ? value[j] : "";
          const nextNextCh = j + 1 < value.length ? value[j + 1] : "";
          if (
            nextCh === "" ||
            nextCh === "\n" ||
            (nextCh === "/" && nextNextCh === "*") ||
            (nextCh === "/" && nextNextCh === "/")
          ) {
            continue;
          }
        }
      }
    }

    out += ch;
    if (ch === "\n") {
      lineCode = "";
    } else {
      lineCode += ch;
    }
  }

  return out;
}

function normalizeStyleDirectiveCommentChains(value: string): string {
  const lines = value.split(/\r?\n/u);
  const out: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || !trimmed.includes("@")) {
      out.push(line);
      continue;
    }

    const indent = line.match(/^\s*/u)?.[0] ?? "";
    const tokenRe = /@[A-Za-z_][A-Za-z0-9_]*(?:\s*\([^)]*\))?|\/\*[^]*?\*\//gu;
    const tokens = Array.from(trimmed.matchAll(tokenRe), (match) => match[0].trim());
    if (tokens.length <= 1) {
      out.push(line);
      continue;
    }

    const remainder = trimmed
      .replace(/@[A-Za-z_][A-Za-z0-9_]*(?:\s*\([^)]*\))?|\/\*[^]*?\*\//gu, "")
      .trim();
    if (remainder.length > 0) {
      out.push(line);
      continue;
    }

    if (
      !tokens.some((token) => token.startsWith("@")) ||
      !tokens.every((token) => token.startsWith("@") || token.startsWith("/*"))
    ) {
      out.push(line);
      continue;
    }

    for (const token of tokens) {
      if (token.startsWith("@")) {
        out.push(normalizeStyleDirectiveLineArgSpacing(`${indent}${token}`));
      } else {
        out.push(`${indent}${token}`);
      }
    }
  }

  return out.join("\n");
}

function normalizeStyleDirectiveCommentSelectorLines(value: string): string {
  const lines = value.split(/\r?\n/u);
  const out: string[] = [];
  const selectorLikeStartRe = /^([.#:[*]|[A-Za-z_]).*\{/u;

  for (const line of lines) {
    const indent = line.match(/^\s*/u)?.[0] ?? "";
    const trimmed = line.trim();
    const directiveMatch = trimmed.match(/^@[A-Za-z_][A-Za-z0-9_]*(?:\s*\([^)]*\))?/u);
    if (!directiveMatch) {
      out.push(line);
      continue;
    }

    const directiveName = getDirectiveNameFromLine(directiveMatch[0]);
    if (
      !directiveName ||
      (!STYLE_DIRECTIVE_BLOCK_OPENERS.has(directiveName) &&
        !STYLE_DIRECTIVE_BRANCHES.has(directiveName) &&
        !STYLE_DIRECTIVE_BLOCK_CLOSERS.has(directiveName))
    ) {
      out.push(line);
      continue;
    }

    let cursor = directiveMatch[0].length;
    const comments: string[] = [];
    for (;;) {
      const rest = trimmed.slice(cursor).trimStart();
      if (!rest.startsWith("/*")) {
        break;
      }

      const commentEnd = rest.indexOf("*/");
      if (commentEnd < 0) {
        break;
      }

      comments.push(rest.slice(0, commentEnd + 2));
      cursor = trimmed.length - rest.length + commentEnd + 2;
    }

    const tail = trimmed.slice(cursor).trimStart();
    if (comments.length === 0 || tail.length === 0 || !selectorLikeStartRe.test(tail)) {
      out.push(line);
      continue;
    }

    out.push(normalizeStyleDirectiveLineArgSpacing(`${indent}${directiveMatch[0]}`));
    for (const comment of comments) {
      out.push(`${indent}${comment}`);
    }
    out.push(`${indent}${tail}`);
  }

  return out.join("\n");
}

function classifyStyleDirectiveChainLine(
  line: string,
): "structuralDirective" | "directiveComment" | "genericComment" | "other" {
  const trimmed = line.trim();
  if (trimmed.length === 0) {
    return "other";
  }

  const directiveName = getDirectiveNameFromLine(trimmed);
  if (
    directiveName &&
    (STYLE_DIRECTIVE_BLOCK_OPENERS.has(directiveName) ||
      STYLE_DIRECTIVE_BRANCHES.has(directiveName) ||
      STYLE_DIRECTIVE_BLOCK_CLOSERS.has(directiveName))
  ) {
    return "structuralDirective";
  }

  if (isStyleCommentLine(trimmed)) {
    if (/^\/\*\s*@/u.test(trimmed) || /^\/\/\s*@/u.test(trimmed)) {
      return "directiveComment";
    }

    return "genericComment";
  }

  return "other";
}

function normalizeStyleDirectiveChainBlankLines(value: string): string {
  const lines = value.split(/\r?\n/u);
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    if (current.trim().length > 0) {
      out.push(current);
      continue;
    }

    let prevIndex = out.length - 1;
    while (prevIndex >= 0 && out[prevIndex].trim().length === 0) {
      prevIndex--;
    }

    let nextIndex = i + 1;
    while (nextIndex < lines.length && lines[nextIndex].trim().length === 0) {
      nextIndex++;
    }

    if (prevIndex < 0 || nextIndex >= lines.length) {
      out.push(current);
      continue;
    }

    const prevKind = classifyStyleDirectiveChainLine(out[prevIndex]);
    const nextKind = classifyStyleDirectiveChainLine(lines[nextIndex]);
    const shouldDrop =
      (prevKind === "structuralDirective" && nextKind === "structuralDirective") ||
      (prevKind === "structuralDirective" && nextKind === "genericComment") ||
      (prevKind === "genericComment" && nextKind === "structuralDirective") ||
      (prevKind === "directiveComment" && nextKind === "structuralDirective") ||
      (prevKind === "structuralDirective" && nextKind === "directiveComment") ||
      (prevKind === "directiveComment" && nextKind === "genericComment") ||
      (prevKind === "genericComment" && nextKind === "directiveComment");

    if (!shouldDrop) {
      out.push(current);
    }
  }

  return out.join("\n");
}

function normalizeStyleBlankLineRuns(value: string): string {
  const lines = value.split(/\r?\n/u);
  const out: string[] = [];
  let blankRun = 0;

  for (const line of lines) {
    if (line.trim().length === 0) {
      blankRun++;
      if (blankRun <= 1) {
        out.push("");
      }
      continue;
    }

    blankRun = 0;
    out.push(line);
  }

  return out.join("\n");
}

function normalizeStyleStandaloneSemicolonLines(value: string): string {
  const lines = value.split(/\r?\n/u);
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed !== ";") {
      out.push(lines[i]);
      continue;
    }

    let prevIndex = out.length - 1;
    while (prevIndex >= 0 && out[prevIndex].trim().length === 0) {
      prevIndex--;
    }
    if (prevIndex < 0) {
      out.push(lines[i]);
      continue;
    }

    const previousDirective = getDirectiveNameFromLine(out[prevIndex].trim());
    const isStructuralDirective =
      previousDirective !== null &&
      (STYLE_DIRECTIVE_BLOCK_OPENERS.has(previousDirective) ||
        STYLE_DIRECTIVE_BRANCHES.has(previousDirective) ||
        STYLE_DIRECTIVE_BLOCK_CLOSERS.has(previousDirective));

    if (isStructuralDirective) {
      let inValueContext = false;
      for (let j = prevIndex - 1; j >= 0; j--) {
        const candidate = out[j].trim();
        if (candidate.length === 0) {
          continue;
        }

        if (
          getDirectiveNameFromLine(candidate) !== null ||
          isStyleCommentLine(candidate) ||
          isBladeValueLine(candidate)
        ) {
          continue;
        }

        if (candidate.endsWith(":")) {
          inValueContext = true;
        }
        break;
      }

      if (inValueContext) {
        out.push(lines[i]);
        continue;
      }
    }

    if (!isStructuralDirective) {
      out.push(lines[i]);
    }
  }

  return out.join("\n");
}

function repairStyleBrokenCommentClosers(value: string): string {
  const lines = value.split(/\r?\n/u);
  const out = lines.map((line) => {
    const trimmedStart = line.trimStart();
    if (!trimmedStart.startsWith("/*")) {
      return line;
    }

    const trimmedEnd = line.trimEnd();
    if (trimmedEnd.endsWith("*/")) {
      return line;
    }

    if (trimmedEnd.endsWith("*;")) {
      return line.replace(/\*;$/u, "*/");
    }

    if (trimmedEnd.endsWith("*")) {
      return `${line}/`;
    }

    return line;
  });

  return out.join("\n");
}

function normalizeStyleCommentRunLines(value: string): string {
  const lines = value.split(/\r?\n/u);
  const out: string[] = [];
  const selectorLikeStartRe = /^([.#:[*]|[A-Za-z_]).*\{/u;

  for (const line of lines) {
    const indent = line.match(/^\s*/u)?.[0] ?? "";
    const trimmed = line.trim();
    if (!trimmed.startsWith("/*")) {
      out.push(line);
      continue;
    }

    const comments: string[] = [];
    let cursor = 0;
    let parseFailed = false;

    for (;;) {
      const rest = trimmed.slice(cursor).trimStart();
      if (!rest.startsWith("/*")) {
        break;
      }

      const commentEnd = rest.indexOf("*/");
      if (commentEnd < 0) {
        parseFailed = true;
        break;
      }

      comments.push(rest.slice(0, commentEnd + 2));
      cursor = trimmed.length - rest.length + commentEnd + 2;
    }

    if (parseFailed || comments.length === 0) {
      out.push(line);
      continue;
    }

    const tail = trimmed.slice(cursor).trimStart();
    const shouldSplit =
      comments.length >= 2 ||
      (tail.length > 0 &&
        (selectorLikeStartRe.test(tail) || tail.startsWith("@") || tail.startsWith("/*")));
    if (!shouldSplit) {
      out.push(line);
      continue;
    }

    for (const comment of comments) {
      out.push(`${indent}${comment}`);
    }
    if (tail.length > 0) {
      out.push(`${indent}${tail}`);
    }
  }

  return out.join("\n");
}

function normalizeStyleDirectiveSelectorAlignment(value: string): string {
  const lines = value.split(/\r?\n/u);
  const selectorLikeStartRe = /^([.#:[*]|[A-Za-z_]).*\{\s*$/u;
  for (let iteration = 0; iteration < 4; iteration++) {
    let changed = false;

    for (let i = 0; i < lines.length; i++) {
      const normalized = normalizeStyleDirectiveLineArgSpacing(lines[i]);
      if (normalized !== lines[i]) {
        lines[i] = normalized;
        changed = true;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const currentTrimmed = lines[i].trim();
      if (currentTrimmed.length === 0) {
        continue;
      }

      let prevIndex = i - 1;
      while (prevIndex >= 0 && lines[prevIndex].trim().length === 0) {
        prevIndex--;
      }
      if (prevIndex < 0) {
        continue;
      }

      const previousTrimmed = lines[prevIndex].trim();
      const directiveName = getDirectiveNameFromLine(previousTrimmed);
      if (
        !directiveName ||
        (!STYLE_DIRECTIVE_BLOCK_OPENERS.has(directiveName) &&
          !STYLE_DIRECTIVE_BRANCHES.has(directiveName) &&
          !STYLE_DIRECTIVE_BLOCK_CLOSERS.has(directiveName))
      ) {
        continue;
      }

      if (!currentTrimmed.endsWith("{") || getDirectiveNameFromLine(currentTrimmed) !== null) {
        continue;
      }

      const previousIndent = lines[prevIndex].match(/^\s*/u)?.[0] ?? "";
      const currentIndent = lines[i].match(/^\s*/u)?.[0] ?? "";
      if (currentIndent.length <= previousIndent.length) {
        continue;
      }

      const nextLine = `${previousIndent}${currentTrimmed}`;
      if (nextLine !== lines[i]) {
        lines[i] = nextLine;
        changed = true;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const currentTrimmed = lines[i].trim();
      if (
        !isStyleCommentLine(currentTrimmed) ||
        (!/^\/\*\s*@/u.test(currentTrimmed) && !/^\/\/\s*@/u.test(currentTrimmed))
      ) {
        continue;
      }

      let prevIndex = i - 1;
      while (prevIndex >= 0 && lines[prevIndex].trim().length === 0) {
        prevIndex--;
      }
      if (prevIndex < 0) {
        continue;
      }

      const previousTrimmed = lines[prevIndex].trim();
      let previousIndent = lines[prevIndex].match(/^\s*/u)?.[0] ?? "";
      let previousDirective = getDirectiveNameFromLine(previousTrimmed);
      if (
        !previousDirective ||
        (!STYLE_DIRECTIVE_BLOCK_OPENERS.has(previousDirective) &&
          !STYLE_DIRECTIVE_BRANCHES.has(previousDirective) &&
          !STYLE_DIRECTIVE_BLOCK_CLOSERS.has(previousDirective))
      ) {
        let anchorIndex = prevIndex - 1;
        while (anchorIndex >= 0) {
          const anchorTrimmed = lines[anchorIndex].trim();
          if (anchorTrimmed.length === 0 || isStyleCommentLine(anchorTrimmed)) {
            anchorIndex--;
            continue;
          }

          const anchorDirective = getDirectiveNameFromLine(anchorTrimmed);
          if (
            anchorDirective &&
            (STYLE_DIRECTIVE_BLOCK_OPENERS.has(anchorDirective) ||
              STYLE_DIRECTIVE_BRANCHES.has(anchorDirective) ||
              STYLE_DIRECTIVE_BLOCK_CLOSERS.has(anchorDirective))
          ) {
            previousDirective = anchorDirective;
            previousIndent = lines[anchorIndex].match(/^\s*/u)?.[0] ?? "";
          }
          break;
        }
      }

      if (
        !previousDirective ||
        (!STYLE_DIRECTIVE_BLOCK_OPENERS.has(previousDirective) &&
          !STYLE_DIRECTIVE_BRANCHES.has(previousDirective) &&
          !STYLE_DIRECTIVE_BLOCK_CLOSERS.has(previousDirective))
      ) {
        continue;
      }

      const currentIndent = lines[i].match(/^\s*/u)?.[0] ?? "";
      if (currentIndent.length <= previousIndent.length) {
        continue;
      }

      const nextLine = `${previousIndent}${currentTrimmed}`;
      if (nextLine !== lines[i]) {
        lines[i] = nextLine;
        changed = true;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const currentTrimmed = lines[i].trim();
      const currentDirective = getDirectiveNameFromLine(currentTrimmed);
      if (
        !currentDirective ||
        (!STYLE_DIRECTIVE_BLOCK_OPENERS.has(currentDirective) &&
          !STYLE_DIRECTIVE_BRANCHES.has(currentDirective) &&
          !STYLE_DIRECTIVE_BLOCK_CLOSERS.has(currentDirective))
      ) {
        continue;
      }

      let prevIndex = i - 1;
      while (prevIndex >= 0 && lines[prevIndex].trim().length === 0) {
        prevIndex--;
      }
      if (prevIndex < 0) {
        continue;
      }

      const previousTrimmed = lines[prevIndex].trim();
      const previousIndent = lines[prevIndex].match(/^\s*/u)?.[0] ?? "";
      const currentIndent = lines[i].match(/^\s*/u)?.[0] ?? "";

      if (
        (STYLE_DIRECTIVE_BRANCHES.has(currentDirective) ||
          STYLE_DIRECTIVE_BLOCK_CLOSERS.has(currentDirective) ||
          STYLE_DIRECTIVE_BLOCK_OPENERS.has(currentDirective)) &&
        isStyleCommentLine(previousTrimmed) &&
        currentIndent.length > previousIndent.length
      ) {
        const nextLine = `${previousIndent}${currentTrimmed}`;
        if (nextLine !== lines[i]) {
          lines[i] = nextLine;
          changed = true;
        }
        continue;
      }

      const previousDirective = getDirectiveNameFromLine(previousTrimmed);
      if (
        !previousDirective ||
        (!STYLE_DIRECTIVE_BLOCK_OPENERS.has(previousDirective) &&
          !STYLE_DIRECTIVE_BRANCHES.has(previousDirective) &&
          !STYLE_DIRECTIVE_BLOCK_CLOSERS.has(previousDirective))
      ) {
        continue;
      }

      if (currentIndent.length <= previousIndent.length) {
        continue;
      }

      const shouldAlign =
        STYLE_DIRECTIVE_BRANCHES.has(currentDirective) ||
        STYLE_DIRECTIVE_BLOCK_CLOSERS.has(currentDirective) ||
        STYLE_DIRECTIVE_BRANCHES.has(previousDirective) ||
        STYLE_DIRECTIVE_BLOCK_CLOSERS.has(previousDirective);
      if (shouldAlign) {
        const nextLine = `${previousIndent}${currentTrimmed}`;
        if (nextLine !== lines[i]) {
          lines[i] = nextLine;
          changed = true;
        }
        continue;
      }

      // Malformed style chains like:
      // @if (...)
      //   @if (...) :root { ... }
      // can receive one-pass extra indent before converging. Stabilize opener
      // alignment only when the current opener is immediately followed by a
      // selector-like line.
      if (
        STYLE_DIRECTIVE_BLOCK_OPENERS.has(currentDirective) &&
        STYLE_DIRECTIVE_BLOCK_OPENERS.has(previousDirective)
      ) {
        let nextIndex = i + 1;
        let chainLeadsToSelector = false;

        while (nextIndex < lines.length) {
          const nextTrimmed = lines[nextIndex].trim();
          if (nextTrimmed.length === 0) {
            nextIndex++;
            continue;
          }

          if (nextTrimmed === currentTrimmed) {
            nextIndex++;
            continue;
          }

          if (isStyleCommentLine(nextTrimmed)) {
            nextIndex++;
            continue;
          }

          const nextDirective = getDirectiveNameFromLine(nextTrimmed);
          if (nextDirective && STYLE_DIRECTIVE_BLOCK_OPENERS.has(nextDirective)) {
            nextIndex++;
            continue;
          }
          if (
            nextDirective &&
            (STYLE_DIRECTIVE_BRANCHES.has(nextDirective) ||
              STYLE_DIRECTIVE_BLOCK_CLOSERS.has(nextDirective))
          ) {
            nextIndex++;
            continue;
          }

          if (selectorLikeStartRe.test(nextTrimmed)) {
            chainLeadsToSelector = true;
          }
          break;
        }

        if (chainLeadsToSelector) {
          const nextLine = `${previousIndent}${currentTrimmed}`;
          if (nextLine !== lines[i]) {
            lines[i] = nextLine;
            changed = true;
          }
        }
      }
    }

    if (!changed) {
      break;
    }
  }

  const lineAdjusted = lines.join("\n");
  const directiveAligned = lineAdjusted.replace(
    /((?:^|\n)([ \t]*)@(?:else|elseif|case|default|endif|endunless|endisset|endempty|endfor|endforeach|endforelse|endwhile|endswitch|endphp|endverbatim)[^\n]*\n)[ \t]+(@(?:if|unless|isset|empty|for|foreach|forelse|while|switch|php|verbatim|else|elseif|case|default|endif|endunless|endisset|endempty|endfor|endforeach|endforelse|endwhile|endswitch|endphp|endverbatim)[^\n]*)(?=\n|$)/gu,
    (_match, prefix: string, indent: string, directiveLine: string) =>
      `${prefix}${indent}${directiveLine.trimStart()}`,
  );

  return directiveAligned.replace(
    /((?:^|\n)([ \t]*)@(?:if|unless|isset|empty|for|foreach|forelse|while|switch|php|verbatim|else|elseif|case|default|endif|endunless|endisset|endempty|endfor|endforeach|endforelse|endwhile|endswitch|endphp|endverbatim)[^\n]*\n)[ \t]+(([.#:[*]|[A-Za-z_])[^\n]*\{[ \t]*)(?=\n|$)/gu,
    (_match, prefix: string, indent: string, selectorStart: string) =>
      `${prefix}${indent}${selectorStart}`,
  );
}

export function shouldUseMixedRawContentEmbedding(node: WrappedNode, options: Options): boolean {
  if (shouldBypassStyleParserEmbedding(node, options)) {
    return false;
  }

  const parser = inferElementParser(node, options);
  if (!parser) return false;

  if (!isPhpFormattingEnabled(options) && node.tagName === "script") {
    const range = getElementContentRange(node);
    const constructs = collectLeafConstructs(node, range.start, range.end);
    if (constructs.length === 0) {
      return false;
    }

    if (
      constructs.some(
        (child) =>
          child.kind === NodeKind.PhpBlock ||
          child.kind === NodeKind.PhpTag ||
          (child.kind === NodeKind.Directive &&
            !isDirectiveInsideScriptLiteralOrComment(child, node.source, range.start, range.end) &&
            (isStructuralScriptDirective(child) ||
              isExpressionScriptDirective(child) ||
              isInlineScriptDirectiveExpression(child, node.source, range.start, range.end) ||
              isStandaloneScriptDirective(child, node.source, range.start, range.end))),
      )
    ) {
      return true;
    }

    return constructs.some(
      (child) =>
        child.kind === NodeKind.Directive &&
        isKnownBladeDirective(child) &&
        isDirectiveInsideScriptLiteralOrComment(child, node.source, range.start, range.end),
    );
  }

  if (node.tagName === "script") {
    const range = getElementContentRange(node);
    const constructs = collectLeafConstructs(node, range.start, range.end);
    if (constructs.length === 0) {
      return false;
    }

    if (
      constructs.some((child) => {
        if (
          child.kind === NodeKind.Directive &&
          isDirectiveInsideScriptLiteralOrComment(child, node.source, range.start, range.end)
        ) {
          return false;
        }

        return isBladeConstructChild(child, "script");
      })
    ) {
      return true;
    }

    if (
      constructs.some(
        (child) =>
          child.kind === NodeKind.Directive &&
          isKnownBladeDirective(child) &&
          isDirectiveInsideScriptLiteralOrComment(child, node.source, range.start, range.end),
      )
    ) {
      return true;
    }

    return parentContainsBladeSyntax(node, "script");
  }

  if (node.children.length > 0) {
    if (node.children.some((child) => isBladeConstructChild(child, "style"))) {
      return true;
    }
  }

  const range = getElementContentRange(node);
  const constructs = collectLeafConstructs(node, range.start, range.end);
  if (
    constructs.some(
      (child) =>
        child.kind === NodeKind.Directive &&
        isKnownBladeDirective(child) &&
        isDirectiveInsideStyleLiteralOrComment(child, node.source, range.start, range.end),
    )
  ) {
    return true;
  }

  const rawValue = node.source.slice(range.start, range.end);
  if (STYLE_RAW_BLADE_FALLBACK_RE.test(rawValue)) {
    return true;
  }

  return parentContainsBladeSyntax(node, "style");
}

function isStructuralScriptDirective(node: WrappedNode): boolean {
  if (node.kind !== NodeKind.Directive) {
    return false;
  }

  if (node.children.length > 0) {
    return true;
  }

  const name = extractDirectiveName(node);
  if (!name) {
    return false;
  }

  const directive = node.buildResult.directives?.getDirective(name);
  if (!directive) {
    return false;
  }

  return (
    directive.role !== StructureRole.None ||
    directive.isCondition ||
    directive.isSwitch ||
    directive.isSwitchBranch ||
    directive.isSwitchTerminator ||
    directive.isConditionalPair ||
    directive.isConditionalClose ||
    directive.hasConditionLikeBranches ||
    directive.terminators.length > 0
  );
}

function isExpressionScriptDirective(node: WrappedNode): boolean {
  if (node.kind !== NodeKind.Directive) {
    return false;
  }

  const name = extractDirectiveName(node);
  return name !== null && EXPRESSION_DIRECTIVES.has(name);
}

function isStandaloneScriptDirective(
  node: LeafConstructNode,
  source: string,
  contentStart: number,
  contentEnd: number,
): boolean {
  if (node.kind !== NodeKind.Directive) {
    return false;
  }

  const replacementRange = getReplacementRange(node);
  if (replacementRange.start < contentStart || replacementRange.end > contentEnd) {
    return false;
  }

  if (isLikelyInsideScriptLiteralOrComment(source, contentStart, replacementRange.start)) {
    return false;
  }

  const lineStart = Math.max(
    contentStart,
    source.lastIndexOf("\n", Math.max(contentStart, replacementRange.start) - 1) + 1,
  );
  let lineEnd = source.indexOf("\n", replacementRange.end);
  if (lineEnd < 0 || lineEnd > contentEnd) {
    lineEnd = contentEnd;
  }

  const before = source.slice(lineStart, replacementRange.start);
  const after = source.slice(replacementRange.end, lineEnd);
  return before.trim().length === 0 && after.trim().length === 0;
}

function isDirectiveInsideScriptLiteralOrComment(
  node: LeafConstructNode,
  source: string,
  contentStart: number,
  contentEnd: number,
): boolean {
  if (node.kind !== NodeKind.Directive) {
    return false;
  }

  const replacementRange = getReplacementRange(node);
  if (replacementRange.start < contentStart || replacementRange.end > contentEnd) {
    return false;
  }

  return isLikelyInsideScriptLiteralOrComment(source, contentStart, replacementRange.start);
}

function isDirectiveInsideStyleLiteralOrComment(
  node: LeafConstructNode,
  source: string,
  contentStart: number,
  contentEnd: number,
): boolean {
  if (node.kind !== NodeKind.Directive) {
    return false;
  }

  const replacementRange = getReplacementRange(node);
  if (replacementRange.start < contentStart || replacementRange.end > contentEnd) {
    return false;
  }

  if (isInsideStyleCommentByLineHeuristic(source, contentStart, replacementRange.start)) {
    return true;
  }

  if (
    isLikelySlashDelimitedStyleLiteralToken(
      source,
      replacementRange.start,
      replacementRange.end,
      contentStart,
      contentEnd,
    )
  ) {
    return true;
  }

  return isLikelyInsideStyleLiteralOrComment(source, contentStart, replacementRange.start);
}

function isInsideStyleCommentByLineHeuristic(
  source: string,
  contentStart: number,
  offset: number,
): boolean {
  const lineStart = Math.max(
    contentStart,
    source.lastIndexOf("\n", Math.max(contentStart, offset) - 1) + 1,
  );
  const prefix = source.slice(lineStart, offset);

  const blockOpen = prefix.lastIndexOf("/*");
  const blockClose = prefix.lastIndexOf("*/");
  if (blockOpen > blockClose) {
    return true;
  }

  const lineComment = prefix.lastIndexOf("//");
  if (
    lineComment >= 0 &&
    shouldTreatAsStyleLineComment(source, contentStart, lineStart + lineComment)
  ) {
    return true;
  }

  return false;
}

function previousNonWhitespaceChar(
  source: string,
  startExclusive: number,
  contentStart: number,
): string | null {
  for (let i = startExclusive - 1; i >= contentStart; i--) {
    const ch = source[i];
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      continue;
    }

    return ch;
  }

  return null;
}

function isLikelySlashDelimitedStyleLiteralToken(
  source: string,
  tokenStart: number,
  tokenEnd: number,
  contentStart: number,
  contentEnd: number,
): boolean {
  const prev = previousNonWhitespaceChar(source, tokenStart, contentStart);
  if (prev !== "/") {
    return false;
  }

  for (let i = tokenEnd; i < contentEnd; i++) {
    const ch = source[i];
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      continue;
    }

    if (ch === "\\") {
      i++;
      continue;
    }

    if (ch === "/") {
      return true;
    }

    if (ch === ";" || ch === "{" || ch === "}") {
      return false;
    }
  }

  return false;
}

function isInlineScriptDirectiveExpression(
  node: LeafConstructNode,
  source: string,
  contentStart: number,
  contentEnd: number,
): boolean {
  if (node.kind !== NodeKind.Directive) {
    return false;
  }

  if (node.children.length > 0 || isStructuralScriptDirective(node)) {
    return false;
  }

  if (isDirectiveInsideScriptLiteralOrComment(node, source, contentStart, contentEnd)) {
    return false;
  }

  const replacementRange = getReplacementRange(node);
  const lineStart = Math.max(
    contentStart,
    source.lastIndexOf("\n", Math.max(contentStart, replacementRange.start) - 1) + 1,
  );
  let lineEnd = source.indexOf("\n", replacementRange.end);
  if (lineEnd < 0 || lineEnd > contentEnd) {
    lineEnd = contentEnd;
  }

  const before = source.slice(lineStart, replacementRange.start);
  const after = source.slice(replacementRange.end, lineEnd);
  return before.trim().length > 0 || after.trim().length > 0;
}

function isInlineStyleDirectiveExpression(
  node: LeafConstructNode,
  source: string,
  contentStart: number,
  contentEnd: number,
): boolean {
  if (node.kind !== NodeKind.Directive) {
    return false;
  }

  if (node.children.length > 0 || isStructuralScriptDirective(node)) {
    return false;
  }

  if (isDirectiveInsideStyleLiteralOrComment(node, source, contentStart, contentEnd)) {
    return false;
  }

  const replacementRange = getReplacementRange(node);
  const lineStart = Math.max(
    contentStart,
    source.lastIndexOf("\n", Math.max(contentStart, replacementRange.start) - 1) + 1,
  );
  let lineEnd = source.indexOf("\n", replacementRange.end);
  if (lineEnd < 0 || lineEnd > contentEnd) {
    lineEnd = contentEnd;
  }

  const before = source.slice(lineStart, replacementRange.start);
  const after = source.slice(replacementRange.end, lineEnd);
  return before.trim().length > 0 || after.trim().length > 0;
}

function isLikelyInsideScriptLiteralOrComment(
  source: string,
  contentStart: number,
  offset: number,
): boolean {
  type ScanState =
    | "code"
    | "single"
    | "double"
    | "template"
    | "lineComment"
    | "blockComment"
    | "regex"
    | "regexClass";
  let state: ScanState = "code";
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

  return state !== "code";
}

function isLikelyInsideStyleLiteralOrComment(
  source: string,
  contentStart: number,
  offset: number,
): boolean {
  type ScanState = "code" | "single" | "double" | "lineComment" | "blockComment";
  let state: ScanState = "code";

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

    if (ch === "/" && next === "*") {
      state = "blockComment";
      i++;
      continue;
    }
    if (ch === "/" && next === "/" && shouldTreatAsStyleLineComment(source, contentStart, i)) {
      state = "lineComment";
      i++;
      continue;
    }
    if (ch === "'") {
      state = "single";
      continue;
    }
    if (ch === '"') {
      state = "double";
    }
  }

  return state !== "code";
}

function shouldTreatAsStyleLineComment(
  source: string,
  contentStart: number,
  slashIndex: number,
): boolean {
  for (let i = slashIndex - 1; i >= contentStart; i--) {
    const ch = source[i];
    if (ch === " " || ch === "\t" || ch === "\r") {
      continue;
    }

    return ch === "\n" || ch === ";" || ch === "{" || ch === "}";
  }

  return true;
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

export function shouldBypassStyleParserEmbedding(node: WrappedNode, options: Options): boolean {
  if (node.kind !== NodeKind.Element || node.tagName !== "style") {
    return false;
  }

  const parser = inferElementParser(node, options);
  if (!parser || !isStyleParser(parser)) {
    return false;
  }

  const range = getElementContentRange(node);
  if (range.end <= range.start) {
    return false;
  }

  const rawValue = node.source.slice(range.start, range.end);

  if (UNSTABLE_STYLE_ESCAPED_SLASH_LITERAL.test(rawValue)) {
    return true;
  }

  if (rawValue.length >= LARGE_STYLE_EMBED_CHAR_THRESHOLD) {
    return true;
  }

  let lineCount = 1;
  for (let i = 0; i < rawValue.length; i++) {
    if (rawValue[i] === "\n") {
      lineCount++;
      if (lineCount > LARGE_STYLE_EMBED_LINE_THRESHOLD) {
        return true;
      }
    }
  }

  return false;
}

export async function embedMixedRawContentElement(
  path: AstPath<WrappedNode>,
  options: Options,
  _textToDoc: (text: string, options: Options) => Promise<Doc>,
  print: EmbedPrint,
): Promise<Doc | null> {
  const node = path.node;
  const parser = inferElementParser(node, options);
  if (!parser) return null;

  const range = getElementContentRange(node);
  const rawValue = node.source.slice(range.start, range.end);
  const rawConstructs = collectLeafConstructs(node, range.start, range.end);
  const constructs = rawConstructs.filter((child) => {
    if (child.kind !== NodeKind.Directive) {
      return true;
    }

    if (
      node.tagName === "script" &&
      isDirectiveInsideScriptLiteralOrComment(child, node.source, range.start, range.end)
    ) {
      return false;
    }

    if (
      node.tagName === "style" &&
      isDirectiveInsideStyleLiteralOrComment(child, node.source, range.start, range.end)
    ) {
      return false;
    }

    return true;
  });
  const markerSessionKey = createMarkerSessionKey(node.source, range.start, range.end);

  const replacements = await Promise.all(
    constructs.map((child) => getConstructReplacementText(child, options)),
  );

  const candidates: PlaceholderCandidate[] = constructs.map((child, index) => {
    const replacementRange = getReplacementRange(child);
    let kind = getPlaceholderKind(child);
    if (
      node.tagName === "script" &&
      kind === "stmt" &&
      child.kind === NodeKind.Directive &&
      isInlineScriptDirectiveExpression(child, node.source, range.start, range.end)
    ) {
      kind = "expr";
    }
    if (
      node.tagName === "style" &&
      kind === "stmt" &&
      child.kind === NodeKind.Directive &&
      isInlineStyleDirectiveExpression(child, node.source, range.start, range.end)
    ) {
      kind = "expr";
    }
    const inStyleValueContext =
      isStyleParser(parser) &&
      isInCssValueContext(node.source, replacementRange.start, range.start);
    const replacementText =
      isStyleParser(parser) && inStyleValueContext
        ? normalizeStyleValueReplacementText(replacements[index])
        : replacements[index];

    return {
      node: child,
      start: replacementRange.start,
      end: replacementRange.end,
      kind,
      inStyleValueContext,
      replacementText,
    };
  });

  const slots: PlaceholderSlot[] = [];
  for (let i = 0; i < candidates.length; ) {
    const candidate = candidates[i];

    if (isStyleParser(parser) && candidate.inStyleValueContext) {
      let groupedStart = candidate.start;
      let groupedEnd = candidate.end;
      let groupedReplacement = candidate.replacementText;
      let groupedNode = candidate.node;
      let groupHasStatement = candidate.kind === "stmt";
      let j = i + 1;

      while (j < candidates.length) {
        const nextCandidate = candidates[j];
        if (!nextCandidate.inStyleValueContext) break;

        const between = node.source.slice(groupedEnd, nextCandidate.start);
        if (between.trim().length > 0) break;

        groupedReplacement += `\n${nextCandidate.replacementText}`;
        groupedEnd = nextCandidate.end;
        groupHasStatement = groupHasStatement || nextCandidate.kind === "stmt";
        j++;
      }

      if (groupHasStatement) {
        const lines = groupedReplacement
          .split(/\r?\n/u)
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        groupedReplacement = `\n${lines.map((line) => `  ${line}`).join("\n")}\n  `;
      }

      slots.push({
        node: groupedNode,
        start: groupedStart,
        end: groupedEnd,
        marker: getPlaceholderMarker(markerSessionKey, "expr", slots.length, parser, true),
        replacementText: groupedReplacement,
      });
      i = j;
      continue;
    }

    slots.push({
      node: candidate.node,
      start: candidate.start,
      end: candidate.end,
      marker: getPlaceholderMarker(
        markerSessionKey,
        candidate.kind,
        slots.length,
        parser,
        candidate.inStyleValueContext,
      ),
      replacementText: candidate.replacementText,
    });
    i++;
  }

  const maskedRaw = buildMaskedSource(node.source, range.start, range.end, slots);
  const styleCommentMask =
    node.tagName === "style" ? maskStyleDirectiveLikeComments(maskedRaw, markerSessionKey) : null;
  const maskedForFormatting = styleCommentMask ? styleCommentMask.text : maskedRaw;
  const normalizedMasked = dedentString(stripBoundaryLineBreaks(maskedForFormatting));
  const maskedValue =
    parser === "markdown"
      ? dedentString(normalizedMasked.replace(/^[^\S\n]*\n/, ""))
      : normalizedMasked;

  let formattedMasked: string;
  try {
    formattedMasked = await prettierFormat(
      maskedValue,
      await createSubformatOptions(options, parser, node),
    );
  } catch {
    const fallback = normalizeEmbeddedRawContentFallback(rawValue);
    return buildScriptLikeElementDoc(
      path,
      node,
      options,
      print,
      replaceEndOfLine(fallback, hardline),
      rawValue,
    );
  }

  const unmasked = applyMarkerReplacements(formattedMasked, slots);
  if (!unmasked.allFound) {
    const fallback = normalizeEmbeddedRawContentFallback(rawValue);
    return buildScriptLikeElementDoc(
      path,
      node,
      options,
      print,
      replaceEndOfLine(fallback, hardline),
      rawValue,
    );
  }

  let restoredText = unmasked.text;
  if (styleCommentMask && styleCommentMask.slots.length > 0) {
    const restored = applyStyleCommentReplacements(restoredText, styleCommentMask.slots);
    if (!restored.allFound) {
      const fallback = normalizeEmbeddedRawContentFallback(rawValue);
      return buildScriptLikeElementDoc(
        path,
        node,
        options,
        print,
        replaceEndOfLine(fallback, hardline),
        rawValue,
      );
    }

    restoredText = restored.text;
  }

  const normalizedOutput = normalizeEmbeddedOutput(restoredText, node.tagName);

  return buildScriptLikeElementDoc(
    path,
    node,
    options,
    print,
    replaceEndOfLine(normalizedOutput, hardline),
    rawValue,
  );
}
