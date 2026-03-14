import type { Options } from "prettier";
import { format as prettierFormat } from "prettier";
import type { WrappedNode } from "../../types.js";
import { trimFinalLineBreak, normalizeLineEndingsToLf, safeSerialize } from "../../string-utils.js";
import { isEchoLike } from "../../node-predicates.js";
import { TokenType } from "../../lexer/types.js";
import {
  getDirectivePhpWrapperKinds,
  type DirectivePhpWrapperContext,
  type DirectivePhpWrapperKind,
} from "../../lexer/directives.js";
import { NodeKind } from "../../tree/types.js";
import { fullText } from "../utils.js";
import { getDirectiveArgSpacingMode, getEchoSpacingMode } from "../blade-options.js";
import { resolvePhpPlugins } from "./php-plugin.js";

type PhpFormattingMode = "off" | "safe" | "aggressive";
type PhpFormattingTarget = "directiveArgs" | "echo" | "phpBlock" | "phpTag";

const MAX_PHP_FORMAT_CACHE_SIZE = 500;
const START_MARKER_COMMENT = "/*__BLADE_PHP_FMT_START__*/";
const END_MARKER_COMMENT = "/*__BLADE_PHP_FMT_END__*/";
const DIRECTIVE_START_MARKER_COMMENT = "/*__BDS__*/";
const DIRECTIVE_END_MARKER_COMMENT = "/*__BDE__*/";
const phpFormatCache = new Map<string, string | null>();
const BROWSER_DEFAULT_PHP_VERSION = "8.4";
const PHP_INLINE_WRAPPER_PRINT_WIDTH_MARGIN = 8;

function getMode(options: Options): PhpFormattingMode {
  const rawOptions = options as Record<string, unknown>;
  const mode = rawOptions.bladePhpFormatting;
  if (mode === "safe" || mode === "aggressive") {
    return mode;
  }

  return "off";
}

function parsePhpFormattingTargets(options: Options): Set<PhpFormattingTarget> {
  const raw = (options as Record<string, unknown>).bladePhpFormattingTargets;
  const allTargets: PhpFormattingTarget[] = ["directiveArgs", "echo", "phpBlock", "phpTag"];

  if (raw === undefined || raw === null) {
    return new Set(allTargets);
  }
  if (!Array.isArray(raw)) {
    return new Set(allTargets);
  }
  if (raw.length === 0) {
    return new Set<PhpFormattingTarget>();
  }

  const normalized = raw
    .filter((item): item is string => typeof item === "string")
    .flatMap((item) => item.split(/[,\s]+/u))
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  const out = new Set<PhpFormattingTarget>();
  for (const token of normalized) {
    if (token === "all") {
      return new Set(allTargets);
    }
    if (token === "none") {
      continue;
    }
    if (token === "echo" || token === "echoes") {
      out.add("echo");
      continue;
    }
    if (token === "directiveargs" || token === "directive-args" || token === "directive_args") {
      out.add("directiveArgs");
      continue;
    }
    if (token === "phpblock" || token === "php-block" || token === "php_block") {
      out.add("phpBlock");
      continue;
    }
    if (token === "phptag" || token === "php-tag" || token === "php_tag") {
      out.add("phpTag");
      continue;
    }
  }

  return out;
}

function isPhpTargetEnabled(options: Options, target: PhpFormattingTarget): boolean {
  return parsePhpFormattingTargets(options).has(target);
}

export function isPhpFormattingEnabled(options: Options): boolean {
  return getMode(options) !== "off";
}

export function isPhpTagNode(node: WrappedNode): boolean {
  return node.kind === NodeKind.PhpTag;
}

export function isPhpBlockNode(node: WrappedNode): boolean {
  return node.kind === NodeKind.PhpBlock;
}

export const isEchoNode = isEchoLike;

export function isDirectiveWithArgsNode(node: WrappedNode): boolean {
  if (node.kind !== NodeKind.Directive) return false;
  return findFirstToken(node, TokenType.DirectiveArgs) !== null;
}

function nodeTokens(node: WrappedNode): readonly { type: number; start: number; end: number }[] {
  const start = node.flat.tokenStart;
  const end = start + node.flat.tokenCount;
  return node.buildResult.tokens.slice(start, end);
}

function findFirstToken(
  node: WrappedNode,
  type: TokenType,
): { type: number; start: number; end: number } | null {
  for (const token of nodeTokens(node)) {
    if (token.type === type) return token;
  }
  return null;
}

function getTextBetweenMarkers(
  formatted: string,
  startMarker = START_MARKER_COMMENT,
  endMarker = END_MARKER_COMMENT,
): string | null {
  const startMarkerIndex = formatted.indexOf(startMarker);
  if (startMarkerIndex < 0) return null;

  const contentStart = startMarkerIndex + startMarker.length;
  const endMarkerIndex = formatted.indexOf(endMarker, contentStart);
  if (endMarkerIndex < 0) return null;

  return formatted.slice(contentStart, endMarkerIndex);
}

function dedentMultiline(text: string): string {
  const normalized = normalizeLineEndingsToLf(text);
  if (!normalized.includes("\n")) return normalized.trim();

  const trimmed = normalized.trim();
  if (!trimmed) return "";

  const lines = trimmed.split("\n");

  function getLineIndent(line: string): number {
    return line.match(/^[\t ]*/)?.[0].length ?? 0;
  }

  function getMinIndent(input: string[]): number {
    let minIndent = Number.POSITIVE_INFINITY;
    for (const line of input) {
      if (line.trim().length === 0) continue;
      const indent = getLineIndent(line);
      if (indent < minIndent) {
        minIndent = indent;
      }
    }
    return minIndent;
  }

  function stripIndent(input: string[], amount: number): string[] {
    if (!Number.isFinite(amount) || amount <= 0) {
      return input;
    }
    return input.map((line) =>
      line.trim().length === 0 ? "" : line.slice(Math.min(amount, line.length)),
    );
  }

  function normalizeBracketWrappedContinuationIndent(input: string[]): string[] {
    if (input.length < 2) return input;

    const first = input[0].trim();
    const expectedClose = first === "[" ? "]" : first === "{" ? "}" : first === "(" ? ")" : null;
    if (!expectedClose) return input;

    let lastNonEmpty = -1;
    for (let i = input.length - 1; i >= 0; i--) {
      if (input[i].trim().length > 0) {
        lastNonEmpty = i;
        break;
      }
    }
    if (lastNonEmpty <= 0) return input;
    if (input[lastNonEmpty].trim() !== expectedClose) return input;

    const closingIndent = getLineIndent(input[lastNonEmpty]);
    if (closingIndent <= 0) return input;

    const out = [...input];
    for (let i = 1; i <= lastNonEmpty; i++) {
      const line = out[i];
      if (line.trim().length === 0) {
        out[i] = "";
        continue;
      }
      out[i] = line.slice(Math.min(closingIndent, line.length));
    }
    return out;
  }

  const dedented = stripIndent(lines, getMinIndent(lines));
  return normalizeBracketWrappedContinuationIndent(dedented).join("\n");
}

function normalizePayload(text: string): string {
  return dedentMultiline(text);
}

function normalizePhpDocBlockIndentation(payload: string): string {
  if (!payload.includes("/**")) return payload;

  const lines = payload.split("\n");
  const out = [...lines];

  for (let i = 0; i < lines.length; i++) {
    const openMatch = lines[i].match(/^(\s*)\/\*\*/u);
    if (!openMatch) continue;

    const baseIndent = openMatch[1];
    for (let j = i + 1; j < lines.length; j++) {
      const trimmed = lines[j].trim();
      if (trimmed.length === 0) {
        out[j] = "";
        continue;
      }

      if (trimmed.startsWith("*/")) {
        out[j] = `${baseIndent} ${trimmed}`;
        i = j;
        break;
      }

      if (trimmed.startsWith("*")) {
        out[j] = `${baseIndent} ${trimmed}`;
      }
    }
  }

  return out.join("\n");
}

function getIndentUnit(options: Options): string {
  const raw = (options as Record<string, unknown>).tabWidth;
  const tabWidth = typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 2;
  return (options as Record<string, unknown>).useTabs === true ? "\t" : " ".repeat(tabWidth);
}

function indentMultilinePayload(payload: string, options: Options): string {
  const indentUnit = getIndentUnit(options);
  const lines = payload.split("\n");

  return lines.map((line) => (line.trim().length === 0 ? "" : `${indentUnit}${line}`)).join("\n");
}

function getHeredocOrNowdocLabel(line: string): string | null {
  const match = line.match(/<<<[ \t]*(['"]?)([A-Za-z_\x80-\xff][A-Za-z0-9_\x80-\xff]*)\1/u);
  return match?.[2] ?? null;
}

function isHeredocOrNowdocTerminator(line: string, label: string): boolean {
  const trimmed = line.trim();
  return trimmed === label || trimmed === `${label};`;
}

function indentPhpBlockBody(payload: string, options: Options): string {
  const indentUnit = getIndentUnit(options);
  const lines = payload.split("\n");
  let heredocLabel: string | null = null;

  return lines
    .map((line) => {
      if (heredocLabel !== null) {
        const out = line;
        if (isHeredocOrNowdocTerminator(line, heredocLabel)) {
          heredocLabel = null;
        }
        return out;
      }

      if (line.trim().length === 0) {
        return "";
      }

      const startLabel = getHeredocOrNowdocLabel(line);
      const out = `${indentUnit}${line}`;
      if (startLabel) {
        heredocLabel = startLabel;
      }
      return out;
    })
    .join("\n");
}

function stripTrailingSemicolon(text: string): string {
  return text.replace(/;\s*$/u, "");
}

function hasTrailingComma(text: string): boolean {
  return /,\s*$/u.test(text);
}

function normalizeTrailingComma(text: string, shouldHaveTrailingComma: boolean): string {
  const trimmedEnd = text.replace(/\s+$/u, "");
  const suffix = text.slice(trimmedEnd.length);

  if (shouldHaveTrailingComma) {
    if (hasTrailingComma(trimmedEnd)) {
      return `${trimmedEnd}${suffix}`;
    }
    return `${trimmedEnd},${suffix}`;
  }

  return `${trimmedEnd.replace(/,\s*$/u, "")}${suffix}`;
}

function hasWrappedMultilineDirectiveArgs(rawArgs: string): boolean {
  if (!/[\r\n]/u.test(rawArgs)) return false;
  return /^\(\s*\r?\n/u.test(rawArgs);
}

function normalizeWrappedDirectiveArgsPayload(payload: string): string {
  const lines = payload.split("\n");
  if (lines.length <= 1) {
    return payload.trim();
  }

  let minIndent = Number.POSITIVE_INFINITY;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().length === 0) continue;
    const indent = line.match(/^[\t ]*/u)?.[0].length ?? 0;
    if (indent < minIndent) {
      minIndent = indent;
    }
  }

  if (!Number.isFinite(minIndent) || minIndent <= 0) {
    return payload;
  }

  return lines
    .map((line, index) => {
      if (index === 0 || line.trim().length === 0) {
        return line;
      }
      return line.slice(Math.min(minIndent, line.length));
    })
    .join("\n");
}

function tryCollapseDirectivePayloadSingleLine(payload: string): string | null {
  if (!/[\r\n]/u.test(payload)) {
    const single = payload.trim();
    return single.length > 0 ? single : null;
  }

  // Keep multiline formatting when comments/heredoc-like constructs are present.
  if (
    /\/\*/u.test(payload) ||
    /(^|[^:])\/\/+/u.test(payload) ||
    /(^|\s)#[^\n]*/u.test(payload) ||
    /<<<[ \t]*[A-Za-z_'"]/u.test(payload)
  ) {
    return null;
  }

  const collapsed = payload.replace(/\s+/gu, " ").trim();
  return collapsed.length > 0 ? collapsed : null;
}

function getPrintWidth(options: Options): number {
  const raw = (options as Record<string, unknown>).printWidth;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw);
  }
  return 80;
}

function getInlineWrapperSyntaxOverhead(snippet: string): number {
  let maxOverhead = 0;

  for (const line of snippet.split(/\r\n?|\n/u)) {
    const startMarkerIndex = line.indexOf(START_MARKER_COMMENT);
    if (startMarkerIndex < 0) continue;

    const endMarkerIndex = line.indexOf(
      END_MARKER_COMMENT,
      startMarkerIndex + START_MARKER_COMMENT.length,
    );
    if (endMarkerIndex < 0) continue;

    const prefixLength = startMarkerIndex;
    const suffixLength = line.length - (endMarkerIndex + END_MARKER_COMMENT.length);
    maxOverhead = Math.max(maxOverhead, prefixLength + suffixLength);
  }

  return maxOverhead;
}

function getCompensatedDelegatedPhpPrintWidth(snippet: string, options: Options): number {
  const basePrintWidth = getPrintWidth(options);
  const inlineWrapperOverhead = getInlineWrapperSyntaxOverhead(snippet);

  if (inlineWrapperOverhead === 0) {
    return basePrintWidth;
  }

  return basePrintWidth + inlineWrapperOverhead + PHP_INLINE_WRAPPER_PRINT_WIDTH_MARGIN;
}

function shouldPreferInlineDirectiveArgs(
  directiveName: string,
  payload: string,
  options: Options,
): boolean {
  if (directiveName === "php") {
    return true;
  }

  const printWidth = getPrintWidth(options);
  const preview = `@${directiveName} (${payload})`;
  return preview.length <= printWidth;
}

function getPhpFormatCacheKey(snippet: string, mode: PhpFormattingMode, options: Options): string {
  const opts = options as Record<string, unknown>;
  const optionsKey = safeSerialize({
    mode,
    printWidth: opts.printWidth,
    tabWidth: opts.tabWidth,
    useTabs: opts.useTabs,
    singleQuote: opts.singleQuote,
    semi: opts.semi,
    trailingComma: opts.trailingComma,
    bracketSpacing: opts.bracketSpacing,
    jsxSingleQuote: opts.jsxSingleQuote,
    quoteProps: opts.quoteProps,
    endOfLine: opts.endOfLine,
    phpVersion: opts.phpVersion,
    trailingCommaPHP: opts.trailingCommaPHP,
    braceStyle: opts.braceStyle,
  });

  return `${optionsKey}|${snippet}`;
}

function setCachedPhpFormatResult(key: string, value: string | null): void {
  if (phpFormatCache.size >= MAX_PHP_FORMAT_CACHE_SIZE) {
    phpFormatCache.clear();
  }
  phpFormatCache.set(key, value);
}

function createPhpFormatOptions(options: Options, plugins: unknown[]): Options {
  const baseOptions = {
    ...(options as Record<string, unknown>),
  };

  delete baseOptions.parser;
  delete baseOptions.parentParser;
  delete baseOptions.plugins;
  delete baseOptions.rangeStart;
  delete baseOptions.rangeEnd;
  delete baseOptions.cursorOffset;

  const runtime = globalThis as Record<string, unknown>;
  const isBrowserRuntime = typeof runtime.window === "object";
  const phpVersion = baseOptions.phpVersion;
  const needsBrowserPhpVersionFallback =
    phpVersion === undefined ||
    phpVersion === null ||
    phpVersion === "auto" ||
    phpVersion === "composer";

  // In browser bundles, @prettier/plugin-php can't always auto-detect phpVersion
  // from composer.json because fs/path are externalized. Pin a safe modern default.
  if (isBrowserRuntime && needsBrowserPhpVersionFallback) {
    baseOptions.phpVersion = BROWSER_DEFAULT_PHP_VERSION;
  }

  return {
    ...baseOptions,
    parser: "php",
    plugins,
  } as Options;
}

async function formatPhpSnippet(
  snippet: string,
  options: Options,
  mode: PhpFormattingMode,
): Promise<string | null> {
  const plugins = await resolvePhpPlugins(options);
  if (!plugins) return null;

  const cacheKey = getPhpFormatCacheKey(snippet, mode, options);
  if (phpFormatCache.has(cacheKey)) {
    return phpFormatCache.get(cacheKey) ?? null;
  }

  try {
    const formatted = await prettierFormat(snippet, createPhpFormatOptions(options, plugins));
    const normalized = normalizeLineEndingsToLf(trimFinalLineBreak(formatted));
    setCachedPhpFormatResult(cacheKey, normalized);
    return normalized;
  } catch {
    setCachedPhpFormatResult(cacheKey, null);
    return null;
  }
}

function getDirectiveName(node: WrappedNode): string | null {
  const directiveToken = findFirstToken(node, TokenType.Directive);
  if (!directiveToken) return null;

  const raw = node.source.slice(directiveToken.start, directiveToken.end);
  if (!raw.startsWith("@")) return null;
  return raw.slice(1).toLowerCase();
}

function getDirectiveWrapperContext(node: WrappedNode): DirectivePhpWrapperContext {
  const trainedDirectives = node.buildResult.directives;
  if (!trainedDirectives) return {};

  return {
    hasDirective: (name: string) =>
      trainedDirectives.isDirective(name) || trainedDirectives.hasSeenDirective(name),
    isConditionLikeDirective: (name: string) =>
      trainedDirectives.isCondition(name) || trainedDirectives.hasAdvisoryCondition(name),
  };
}

function wrapDirectiveArgs(args: string, kind: DirectivePhpWrapperKind): string {
  const payload = `${DIRECTIVE_START_MARKER_COMMENT}${args}${DIRECTIVE_END_MARKER_COMMENT}`;

  switch (kind) {
    case "for":
      return `<?php for (${payload}) {}`;
    case "foreach":
      return `<?php foreach (${payload}) {}`;
    case "while":
      return `<?php while (${payload}) {}`;
    case "switch":
      return `<?php switch (${payload}) {}`;
    case "case":
      return `<?php switch (true) { case (${payload}): break; }`;
    case "if":
      return `<?php if (${payload}) {}`;
    case "call":
    default:
      return `<?php __b(${payload});`;
  }
}

function wrapEchoExpression(expression: string): string {
  return `<?php $__prettier_blade_echo__ = (${START_MARKER_COMMENT}${expression}${END_MARKER_COMMENT});`;
}

function rebuildDirectiveWithFormattedArgs(
  node: WrappedNode,
  formattedArgs: string,
  options: Options,
): string {
  const start = node.flat.tokenStart;
  const end = start + node.flat.tokenCount;
  const tokens = node.buildResult.tokens;
  const argSpacingMode = getDirectiveArgSpacingMode(options);
  let result = "";
  let sawDirectiveToken = false;
  let sawArgsToken = false;

  for (let i = start; i < end; i++) {
    const token = tokens[i];
    const prev = i > start ? tokens[i - 1] : null;
    const next = i + 1 < end ? tokens[i + 1] : null;
    const tokenText = node.source.slice(token.start, token.end);

    if (token.type === TokenType.Directive) {
      result += tokenText;
      sawDirectiveToken = true;
      if (argSpacingMode === "space" && next?.type === TokenType.DirectiveArgs) {
        result += " ";
      }
      continue;
    }

    if (!sawDirectiveToken) {
      continue;
    }

    if (
      token.type === TokenType.Whitespace &&
      prev?.type === TokenType.Directive &&
      next?.type === TokenType.DirectiveArgs
    ) {
      if (argSpacingMode === "preserve") {
        result += tokenText;
      } else if (argSpacingMode === "space" && !result.endsWith(" ")) {
        result += " ";
      }
      continue;
    }

    if (token.type === TokenType.DirectiveArgs && !sawArgsToken) {
      result += formattedArgs;
      sawArgsToken = true;
      continue;
    }

    // Unclosed directive blocks can have opener token ranges that spill into body content.
    break;
  }

  return sawDirectiveToken ? result : "";
}

function getEchoDelimiters(node: WrappedNode): {
  open: string;
  close: string;
} {
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

function getEchoContent(node: WrappedNode): string | null {
  const tokens = nodeTokens(node);
  const parts: string[] = [];

  for (const token of tokens) {
    if (token.type === TokenType.EchoContent) {
      parts.push(node.source.slice(token.start, token.end));
    }
  }

  if (parts.length === 0) return null;
  return parts.join("");
}

function isWhitespaceTextNode(node: WrappedNode | null): boolean {
  return node?.kind === NodeKind.Text && node.rawText.trim().length === 0;
}

function isNonWhitespaceTextNode(node: WrappedNode | null): boolean {
  return node?.kind === NodeKind.Text && node.rawText.trim().length > 0;
}

function isEchoInAttributeLikeTextRun(node: WrappedNode): boolean {
  if (node.prev?.kind !== NodeKind.Text || node.next?.kind !== NodeKind.Text) {
    return false;
  }

  const prevTrimmed = node.prev.rawText.trimEnd();
  const nextTrimmed = node.next.rawText.trimStart();

  return /=\s*["']$/.test(prevTrimmed) && /^["']/.test(nextTrimmed);
}

function shouldCompensateInlineEchoPrintWidth(node: WrappedNode): boolean {
  const parent = node.parent;
  if (!parent || parent.kind !== NodeKind.Element) {
    return false;
  }

  if (parent.tagName === "style" || parent.tagName === "script") {
    return false;
  }

  // Opening-tag echoes interact with attribute layout and should keep the base width.
  if (node.start < parent.openTagEndOffset) {
    return false;
  }

  if (parent.fullName === "title") {
    return (
      (node.prev === null || isWhitespaceTextNode(node.prev)) &&
      (node.next === null || isWhitespaceTextNode(node.next))
    );
  }

  return isNonWhitespaceTextNode(node.prev) || isNonWhitespaceTextNode(node.next);
}

function withCompensatedInlineEchoPrintWidth(wrappedSnippet: string, options: Options): Options {
  return {
    ...(options as Record<string, unknown>),
    printWidth: getCompensatedDelegatedPhpPrintWidth(wrappedSnippet, options),
  } as Options;
}

export async function formatDirectiveNodeArgs(
  node: WrappedNode,
  options: Options,
): Promise<string | null> {
  const mode = getMode(options);
  if (mode === "off") return null;
  if (!isPhpTargetEnabled(options, "directiveArgs")) return null;
  if (!isDirectiveWithArgsNode(node)) return null;

  const argsToken = findFirstToken(node, TokenType.DirectiveArgs);
  if (!argsToken) return null;

  const rawArgs = node.source.slice(argsToken.start, argsToken.end);
  if (!rawArgs.startsWith("(") || !rawArgs.endsWith(")")) return null;

  const argsInner = rawArgs.slice(1, -1);
  if (argsInner.trim().length === 0) return null;
  const hasWrappedMultilineArgs = hasWrappedMultilineDirectiveArgs(rawArgs);
  const originalWasSingleLine = !/[\r\n]/u.test(argsInner);
  const originalHadTrailingComma = hasTrailingComma(argsInner.trimEnd());

  const directiveName = getDirectiveName(node) ?? "";
  const wrapperKinds = getDirectivePhpWrapperKinds(
    directiveName,
    mode,
    getDirectiveWrapperContext(node),
  );

  for (const wrapperKind of wrapperKinds) {
    const wrapped = wrapDirectiveArgs(argsInner, wrapperKind);
    const formatted = await formatPhpSnippet(wrapped, options, mode);
    if (!formatted) continue;

    const extracted = getTextBetweenMarkers(
      formatted,
      DIRECTIVE_START_MARKER_COMMENT,
      DIRECTIVE_END_MARKER_COMMENT,
    );
    if (extracted === null) continue;

    const normalizedPayload = normalizePayload(extracted);
    const payload = normalizeTrailingComma(
      normalizedPayload,
      originalHadTrailingComma || hasTrailingComma(normalizedPayload.trimEnd()),
    );
    const collapsedInlinePayload = originalWasSingleLine
      ? tryCollapseDirectivePayloadSingleLine(payload)
      : null;
    const finalPayload =
      collapsedInlinePayload &&
      shouldPreferInlineDirectiveArgs(directiveName, collapsedInlinePayload, options)
        ? collapsedInlinePayload
        : payload;
    const shouldPreserveWrappedMultilineArgs = hasWrappedMultilineArgs && wrapperKind !== "call";
    const formattedArgs = shouldPreserveWrappedMultilineArgs
      ? `(\n${indentMultilinePayload(
          normalizeWrappedDirectiveArgsPayload(dedentMultiline(finalPayload)),
          options,
        )}\n)`
      : `(${finalPayload})`;
    return rebuildDirectiveWithFormattedArgs(node, formattedArgs, options);
  }

  return null;
}

export async function formatEchoNode(node: WrappedNode, options: Options): Promise<string | null> {
  const mode = getMode(options);
  if (mode === "off") return null;
  if (!isPhpTargetEnabled(options, "echo")) return null;
  if (!isEchoNode(node)) return null;
  if (isEchoInAttributeLikeTextRun(node)) return null;

  const content = getEchoContent(node);
  if (content === null || content.trim().length === 0) return null;
  const trimmedContent = content.trim();

  const wrapped = wrapEchoExpression(trimmedContent);
  const delegatedOptions = shouldCompensateInlineEchoPrintWidth(node)
    ? withCompensatedInlineEchoPrintWidth(wrapped, options)
    : options;
  const formatted = await formatPhpSnippet(wrapped, delegatedOptions, mode);
  if (!formatted) return null;

  const extracted = getTextBetweenMarkers(formatted);
  if (extracted === null) return null;

  const expression = normalizePayload(extracted);
  const normalizedExpression = normalizePayload(stripTrailingSemicolon(expression));
  if (!normalizedExpression) return null;

  const delimiters = getEchoDelimiters(node);
  if (normalizedExpression.includes("\n")) {
    const indentedExpression = indentMultilinePayload(normalizedExpression, options);
    return `${delimiters.open}\n${indentedExpression}\n${delimiters.close}`;
  }

  const spacing = getEchoSpacingMode(options);
  if (spacing === "tight") {
    return `${delimiters.open}${normalizedExpression}${delimiters.close}`;
  }

  return `${delimiters.open} ${normalizedExpression} ${delimiters.close}`;
}

export async function formatPhpTagNode(
  node: WrappedNode,
  options: Options,
): Promise<string | null> {
  const mode = getMode(options);
  if (mode === "off") return null;
  if (!isPhpTargetEnabled(options, "phpTag")) return null;
  if (!isPhpTagNode(node)) return null;

  const raw = fullText(node);
  if (raw.trim().length === 0) return null;

  return formatPhpSnippet(raw, options, mode);
}

export async function formatPhpBlockNode(
  node: WrappedNode,
  options: Options,
): Promise<string | null> {
  const mode = getMode(options);
  if (mode === "off") return null;
  if (!isPhpTargetEnabled(options, "phpBlock")) return null;
  if (!isPhpBlockNode(node)) return null;

  const startToken = findFirstToken(node, TokenType.PhpBlockStart);
  const endToken = findFirstToken(node, TokenType.PhpBlockEnd);
  if (!startToken || !endToken) return null;

  const opener = node.source.slice(startToken.start, startToken.end);
  const closer = node.source.slice(endToken.start, endToken.end);
  const body = node.source.slice(startToken.end, endToken.start);

  const wrapped = `<?php\n${START_MARKER_COMMENT}\n${body}\n${END_MARKER_COMMENT}\n`;
  const formatted = await formatPhpSnippet(wrapped, options, mode);
  if (!formatted) return null;

  const extracted = getTextBetweenMarkers(formatted);
  if (extracted === null) return null;

  const formattedBody = normalizePhpDocBlockIndentation(dedentMultiline(extracted));
  const originalBlockText = node.source.slice(startToken.start, endToken.end);
  const originallyInline = !/[\r\n]/.test(originalBlockText);

  if (originallyInline && !formattedBody.includes("\n")) {
    if (formattedBody.length === 0) {
      return `${opener} ${closer}`;
    }
    return `${opener} ${formattedBody} ${closer}`;
  }

  if (formattedBody.length === 0) {
    return `${opener}\n${closer}`;
  }

  const indentedBody = indentPhpBlockBody(formattedBody, options);
  return `${opener}\n${indentedBody}\n${closer}`;
}
