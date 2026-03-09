import type { Options } from "prettier";
import type { WrappedNode } from "../types.js";
import { NodeKind } from "../tree/types.js";
import { TokenType } from "../lexer/types.js";
import { HTML_ELEMENT_ATTRIBUTES } from "../html-data.js";
import { hasFrontMatterMark } from "../front-matter.js";
import { parentContainsBladeSyntax } from "./blade-syntax.js";
import { isEchoLike, isScriptLikeTag, isVueNonHtmlBlock } from "../node-predicates.js";

export type AttributeValueKind = "none" | "static_text" | "pure_construct" | "mixed_structured";

export type AttributeNamePartKind =
  | "text"
  | "echo"
  | "raw_echo"
  | "triple_echo"
  | "directive"
  | "php_tag"
  | "php_block";

export interface AttributeNamePart {
  kind: AttributeNamePartKind;
  text: string;
}

const VALUE_CONSTRUCT_END: Readonly<Record<number, number>> = {
  [TokenType.EchoStart]: TokenType.EchoEnd,
  [TokenType.RawEchoStart]: TokenType.RawEchoEnd,
  [TokenType.TripleEchoStart]: TokenType.TripleEchoEnd,
  [TokenType.PhpTagStart]: TokenType.PhpTagEnd,
  [TokenType.PhpBlockStart]: TokenType.PhpBlockEnd,
};

type AttributeValueRange = {
  hasValue: boolean;
  start: number;
  end: number;
  quoted: boolean;
  quote: string | null;
};

export function fullText(node: WrappedNode): string {
  return node.source.slice(node.start, node.end);
}

export function isFrontMatterNode(node: WrappedNode): boolean {
  return hasFrontMatterMark(node);
}

// Element structure helpers

export function isVoidElement(node: WrappedNode): boolean {
  if (node.children.length > 0) return false;
  return !node.hasClosingTag;
}

export function isSelfClosing(node: WrappedNode): boolean {
  if (node.kind !== NodeKind.Element) return false;
  // The tree builder stores self-closing status in flat.data (1 = self-closing).
  return node.flat.data === 1;
}

// Node classification helpers

export function isBlockLike(node: WrappedNode): boolean {
  const d = node.cssDisplay;
  return (
    d === "block" ||
    d === "list-item" ||
    d.startsWith("table") ||
    node.kind === NodeKind.DirectiveBlock
  );
}

export function isIeConditionalStartComment(node: WrappedNode): boolean {
  return node.kind === NodeKind.Comment && node.isIeConditionalStartComment;
}

/**
 * Is this a pre-like node (whitespace/indentation sensitive)?
 * Uses the preprocessed flag rather than a hardcoded tag list.
 */
export function isPreLikeNode(node: WrappedNode): boolean {
  return node.isIndentationSensitive;
}

export function canHaveInterpolation(node: WrappedNode, options: Options): boolean {
  return node.children !== undefined && !isScriptLikeTag(node, options);
}

export function getLastDescendant(node: WrappedNode): WrappedNode {
  let current = node;
  while (current.children.length > 0) {
    current = current.children[current.children.length - 1];
  }
  return current;
}

export function hasLeadingLineBreak(node: WrappedNode): boolean {
  if (!node.hasLeadingSpaces) return false;
  if (node.prev) return node.prev.endLine < node.startLine;
  if (!node.parent) return false;
  return node.parent.kind === NodeKind.Root || node.parent.startLine < node.startLine;
}

export function hasTrailingLineBreak(node: WrappedNode): boolean {
  if (!node.hasTrailingSpaces) return false;
  if (node.next) return node.next.startLine > node.endLine;
  if (!node.parent) return false;
  return node.parent.kind === NodeKind.Root || node.parent.endLine > node.endLine;
}

export function hasSurroundingLineBreak(node: WrappedNode): boolean {
  return hasLeadingLineBreak(node) && hasTrailingLineBreak(node);
}

/**
 * Does a node have any non-text children?
 * Reference uses child.kind !== "text". We exclude Echo variants too since
 * they're inline-like for Blade (matching reference's "interpolation").
 */
function hasNonTextChild(node: WrappedNode): boolean {
  return (
    node.children?.some((child) => child.kind !== NodeKind.Text && !isEchoLike(child)) ?? false
  );
}

export function forceBreakChildren(node: WrappedNode): boolean {
  if (node.kind !== NodeKind.Element) return false;
  if (node.children.length === 0) return false;
  return (
    ["html", "head", "ul", "ol", "select"].includes(node.tagName) ||
    (node.cssDisplay.startsWith("table") && node.cssDisplay !== "table-cell")
  );
}

/**
 * Element content must break onto separate lines.
 * Ported from Prettier: checks if any child has non-text grandchildren
 * (NOT if any child IS non-text - that's a different semantic).
 */
export function forceBreakContent(node: WrappedNode): boolean {
  if (forceBreakChildren(node)) return true;

  if (node.kind !== NodeKind.Element) return false;
  if (node.children.length === 0) return false;

  if (isBladeSlotElement(node)) return true;

  const firstChild = node.children[0];
  const lastChild = node.children[node.children.length - 1];

  return (
    ["body", "script", "style"].includes(node.tagName) ||
    node.children.some((child) => hasNonTextChild(child)) ||
    // Single non-text/non-interpolation child with surrounding line breaks forces break.
    (firstChild === lastChild &&
      firstChild.kind !== NodeKind.Text &&
      !isEchoLike(firstChild) &&
      hasLeadingLineBreak(firstChild) &&
      (!lastChild.isTrailingSpaceSensitive || hasTrailingLineBreak(lastChild)))
  );
}

function isBladeSlotElement(node: WrappedNode): boolean {
  if (node.kind !== NodeKind.Element) return false;

  const fullName = node.fullName.toLowerCase();
  return (
    fullName === "x-slot" ||
    fullName.startsWith("x-slot:") ||
    fullName.startsWith("x-slot[") ||
    fullName.startsWith("x-slot:[")
  );
}

export function preferHardlineAsSurroundingSpaces(node: WrappedNode): boolean {
  switch (node.kind) {
    case NodeKind.Comment:
    case NodeKind.BogusComment:
    case NodeKind.BladeComment:
    case NodeKind.ConditionalComment:
    case NodeKind.Directive:
    case NodeKind.DirectiveBlock:
      return true;
    case NodeKind.Element:
      return node.tagName === "script" || node.tagName === "select";
    default:
      return false;
  }
}

export function preferHardlineAsLeadingSpaces(node: WrappedNode): boolean {
  return (
    preferHardlineAsSurroundingSpaces(node) ||
    (!!node.prev && preferHardlineAsTrailingSpaces(node.prev)) ||
    hasSurroundingLineBreak(node)
  );
}

export function preferHardlineAsTrailingSpaces(node: WrappedNode): boolean {
  return (
    preferHardlineAsSurroundingSpaces(node) ||
    (node.kind === NodeKind.Element && node.tagName === "br") ||
    hasSurroundingLineBreak(node)
  );
}

/**
 * Should content be preserved verbatim?
 * Ported from Prettier's shouldPreserveContent with full reference logic.
 */
export function shouldPreserveContent(node: WrappedNode, options?: Options): boolean {
  // Unterminated node in IE conditional comment.
  if (node.kind === NodeKind.ConditionalComment && node.children.length > 0) {
    const lastChild = node.children[node.children.length - 1];
    if (!lastChild.isSelfClosing && !lastChild.hasClosingTag) {
      return true;
    }
  }

  // Incomplete IE conditional comment.
  if (node.kind === NodeKind.ConditionalComment && !node.complete) {
    return true;
  }

  // If conditional content contains unpaired closing tags, keep original text.
  if (
    node.kind === NodeKind.ConditionalComment &&
    node.children.some((child) => child.kind === NodeKind.UnpairedClosingTag)
  ) {
    return true;
  }

  // Pre-like node with non-text/non-interpolation children.
  if (
    isPreLikeNode(node) &&
    node.children.some((child) => child.kind !== NodeKind.Text && !isEchoLike(child))
  ) {
    return true;
  }

  // Blade/PHP constructs inside <style> are not stable under CSS embedding;
  // preserve raw content to prevent indentation drift across passes.
  if (
    node.kind === NodeKind.Element &&
    node.tagName === "style" &&
    hasBladeLikeSyntaxInElementContent(node)
  ) {
    return true;
  }

  // Vue non-HTML block.
  if (
    options &&
    isVueNonHtmlBlock(node, options) &&
    !isScriptLikeTag(node, options) &&
    !isEchoLike(node)
  ) {
    return true;
  }

  return false;
}

function hasBladeLikeSyntaxInElementContent(node: WrappedNode): boolean {
  return parentContainsBladeSyntax(node, "style");
}

const HTML_WS_REGEX = /[\t\n\f\r ]+/;

export function htmlTrimLeadingBlankLines(s: string): string {
  return s.replaceAll(/^[\t\f\r ]*\n/g, "");
}

export function htmlTrimPreserveIndentation(s: string): string {
  return htmlTrimLeadingBlankLines(s.replace(/[\t\n\f\r ]+$/, ""));
}

export function getLeadingAndTrailingHtmlWhitespace(s: string): {
  leadingWhitespace: string;
  trailingWhitespace: string;
  text: string;
} {
  let text = s;
  const leadingMatch = text.match(/^[\t\n\f\r ]+/);
  const leadingWhitespace = leadingMatch ? leadingMatch[0] : "";
  if (leadingWhitespace) text = text.slice(leadingWhitespace.length);
  const trailingMatch = text.match(/[\t\n\f\r ]+$/);
  const trailingWhitespace = trailingMatch ? trailingMatch[0] : "";
  if (trailingWhitespace) text = text.slice(0, -trailingWhitespace.length);
  return { leadingWhitespace, trailingWhitespace, text };
}

export function htmlWhitespaceSplit(s: string): string[] {
  return s.split(HTML_WS_REGEX);
}

/**
 * Dedent a multi-line string by removing the common leading whitespace.
 * Ported from Prettier's htmlWhitespace.dedentString.
 */
export function dedentString(s: string): string {
  const lines = s.split("\n");
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const indent = line.match(/^[\t ]*/)?.[0].length ?? 0;
    if (indent < minIndent) minIndent = indent;
  }
  if (minIndent === 0 || minIndent === Infinity) return s;
  return lines.map((line) => line.slice(minIndent)).join("\n");
}

export function forceNextEmptyLine(node: WrappedNode): boolean {
  if (isFrontMatterNode(node)) return true;
  return !!node.next && node.endLine + 1 < node.next.startLine;
}

type IgnoreCommentKind = "ignore" | "ignore-start" | "ignore-end";
type IgnoreApplyMode = "single" | "range";

const ignoredChildrenCache = new WeakMap<WrappedNode, Map<WrappedNode, IgnoreApplyMode>>();

export function hasPrettierIgnore(node: WrappedNode): boolean {
  if (node.kind === NodeKind.Attribute) return false;
  if (!node.parent) return false;
  const ignoredChildren = getIgnoredChildren(node.parent);
  return ignoredChildren.has(node);
}

export function getPrettierIgnoreMode(node: WrappedNode): IgnoreApplyMode | null {
  if (node.kind === NodeKind.Attribute) return null;
  if (!node.parent) return null;
  const ignoredChildren = getIgnoredChildren(node.parent);
  return ignoredChildren.get(node) ?? null;
}

function getIgnoredChildren(parent: WrappedNode): Map<WrappedNode, IgnoreApplyMode> {
  const cached = ignoredChildrenCache.get(parent);
  if (cached) return cached;

  const ignored = new Map<WrappedNode, IgnoreApplyMode>();
  let ignoreDepth = 0;
  let ignoreNextCount = 0;

  for (const child of parent.children) {
    const ignoreKind = parseIgnoreCommentKind(child);
    const isRangeEnd = ignoreKind === "ignore-end";

    if ((ignoreDepth > 0 || ignoreNextCount > 0) && !isRangeEnd) {
      ignored.set(child, ignoreDepth > 0 ? "range" : "single");
      if (ignoreNextCount > 0) {
        ignoreNextCount--;
      }
    }

    if (ignoreKind === "ignore") {
      ignoreNextCount = Math.max(ignoreNextCount, 1);
      continue;
    }

    if (ignoreKind === "ignore-start") {
      ignoreDepth++;
      continue;
    }

    if (ignoreKind === "ignore-end" && ignoreDepth > 0) {
      ignoreDepth--;
    }
  }

  ignoredChildrenCache.set(parent, ignored);
  return ignored;
}

function parseIgnoreCommentKind(node: WrappedNode): IgnoreCommentKind | null {
  let value: string | null = null;

  if (node.kind === NodeKind.Comment) {
    const text = fullText(node);
    const match = text.match(/^<!--\s*([\s\S]*?)\s*-->$/s);
    value = match?.[1] ?? null;
  } else if (node.kind === NodeKind.BladeComment) {
    const text = fullText(node);
    const match = text.match(/^\{\{--\s*([\s\S]*?)\s*--\}\}$/s);
    value = match?.[1] ?? null;
  }

  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case "prettier-ignore":
    case "format-ignore":
      return "ignore";
    case "prettier-ignore-start":
    case "format-ignore-start":
      return "ignore-start";
    case "prettier-ignore-end":
    case "format-ignore-end":
      return "ignore-end";
    default:
      return null;
  }
}

export function getAttributeName(node: WrappedNode): string {
  const rawName = getAttributeNameRaw(node);
  if (!rawName) return "";

  const br = node.buildResult;
  const tokenStart = node.flat.tokenStart;
  const tokenEnd = tokenStart + node.flat.tokenCount;
  for (let i = tokenStart; i < tokenEnd; i++) {
    const token = br.tokens[i];
    if (
      token.type === TokenType.AttributeName ||
      token.type === TokenType.BoundAttribute ||
      token.type === TokenType.EscapedAttribute ||
      token.type === TokenType.ShorthandAttribute
    ) {
      return br.source.slice(token.start, token.end);
    }
  }

  return rawName;
}

export function getAttributeNameRaw(node: WrappedNode): string {
  const br = node.buildResult;
  const tokenStart = node.flat.tokenStart;
  const tokenEnd = tokenStart + node.flat.tokenCount;

  let start = -1;
  let end = -1;
  for (let i = tokenStart; i < tokenEnd; i++) {
    const token = br.tokens[i];
    if (token.type === TokenType.Equals) break;
    if (start === -1) start = token.start;
    if (token.type !== TokenType.Whitespace) end = token.end;
  }

  if (start === -1 || end === -1 || end < start) return "";
  return br.source.slice(start, end);
}

export function isStaticAttributeName(node: WrappedNode): boolean {
  const br = node.buildResult;
  const tokenStart = node.flat.tokenStart;
  const tokenEnd = tokenStart + node.flat.tokenCount;

  for (let i = tokenStart; i < tokenEnd; i++) {
    const tokenType = br.tokens[i].type;
    if (tokenType === TokenType.Equals) break;
    if (
      tokenType === TokenType.EchoStart ||
      tokenType === TokenType.RawEchoStart ||
      tokenType === TokenType.TripleEchoStart ||
      tokenType === TokenType.Directive ||
      tokenType === TokenType.PhpTagStart
    ) {
      return false;
    }
  }

  return true;
}

export function getStaticAttributeNameLower(node: WrappedNode): string | null {
  if (!isStaticAttributeName(node)) return null;
  const raw = getAttributeNameRaw(node);
  if (!raw) return null;
  return raw.toLowerCase();
}

export function getAttributeNameParts(node: WrappedNode): AttributeNamePart[] {
  const br = node.buildResult;
  const tokenStart = node.flat.tokenStart;
  const tokenEnd = tokenStart + node.flat.tokenCount;
  const parts: AttributeNamePart[] = [];

  for (let i = tokenStart; i < tokenEnd; i++) {
    const token = br.tokens[i];
    if (
      token.type === TokenType.EchoStart ||
      token.type === TokenType.RawEchoStart ||
      token.type === TokenType.TripleEchoStart ||
      token.type === TokenType.PhpTagStart ||
      token.type === TokenType.PhpBlockStart
    ) {
      const endType =
        token.type === TokenType.EchoStart
          ? TokenType.EchoEnd
          : token.type === TokenType.RawEchoStart
            ? TokenType.RawEchoEnd
            : token.type === TokenType.TripleEchoStart
              ? TokenType.TripleEchoEnd
              : token.type === TokenType.PhpTagStart
                ? TokenType.PhpTagEnd
                : TokenType.PhpBlockEnd;
      const start = token.start;
      let end = token.end;

      i++;
      while (i < tokenEnd) {
        const current = br.tokens[i];
        end = current.end;
        if (current.type === endType) {
          break;
        }
        i++;
      }

      parts.push({
        kind:
          token.type === TokenType.EchoStart
            ? "echo"
            : token.type === TokenType.RawEchoStart
              ? "raw_echo"
              : token.type === TokenType.TripleEchoStart
                ? "triple_echo"
                : token.type === TokenType.PhpTagStart
                  ? "php_tag"
                  : "php_block",
        text: br.source.slice(start, end),
      });
      continue;
    }

    if (token.type === TokenType.Equals) break;
    if (token.type === TokenType.Whitespace) continue;

    if (
      token.type === TokenType.AttributeName ||
      token.type === TokenType.BoundAttribute ||
      token.type === TokenType.EscapedAttribute ||
      token.type === TokenType.ShorthandAttribute ||
      token.type === TokenType.Text
    ) {
      parts.push({
        kind: "text",
        text: br.source.slice(token.start, token.end),
      });
      continue;
    }

    if (token.type === TokenType.Directive) {
      const start = token.start;
      let end = token.end;
      if (i + 1 < tokenEnd && br.tokens[i + 1].type === TokenType.DirectiveArgs) {
        i++;
        end = br.tokens[i].end;
      }
      parts.push({ kind: "directive", text: br.source.slice(start, end) });
      continue;
    }

    parts.push({ kind: "text", text: br.source.slice(token.start, token.end) });
  }

  return parts;
}

export function isStaticElementName(node: WrappedNode): boolean {
  if (node.kind !== NodeKind.Element) return true;
  return (
    !node.rawTagName.includes("{{") &&
    !node.rawTagName.includes("{!!") &&
    !node.rawTagName.includes("<?") &&
    !node.rawTagName.includes("@")
  );
}

function getAttributeValueRange(node: WrappedNode): AttributeValueRange | null {
  const br = node.buildResult;
  const tokenStart = node.flat.tokenStart;
  const tokenEnd = tokenStart + node.flat.tokenCount;

  let equalsIndex = -1;
  for (let i = tokenStart; i < tokenEnd; i++) {
    if (br.tokens[i].type === TokenType.Equals) {
      equalsIndex = i;
      break;
    }
  }

  if (equalsIndex === -1) return null;

  let valueStart = equalsIndex + 1;
  while (valueStart < tokenEnd && br.tokens[valueStart].type === TokenType.Whitespace) {
    valueStart++;
  }

  if (valueStart >= tokenEnd) {
    return {
      hasValue: true,
      start: valueStart,
      end: valueStart,
      quoted: false,
      quote: null,
    };
  }

  const isQuoted = br.tokens[valueStart].type === TokenType.Quote;
  if (!isQuoted) {
    return {
      hasValue: true,
      start: valueStart,
      end: tokenEnd,
      quoted: false,
      quote: null,
    };
  }

  const quote = br.source.slice(br.tokens[valueStart].start, br.tokens[valueStart].end);

  let end = tokenEnd;
  if (end > valueStart + 1 && br.tokens[end - 1].type === TokenType.Quote) {
    end--;
  }

  return {
    hasValue: true,
    start: valueStart + 1,
    end,
    quoted: true,
    quote,
  };
}

export function getAttributeRawValue(node: WrappedNode): string | null {
  const br = node.buildResult;
  const range = getAttributeValueRange(node);
  if (!range?.hasValue) return null;
  const { start: valueStart, end: valueEnd, quoted } = range;
  if (valueStart >= valueEnd) return "";

  let value = "";
  for (let i = valueStart; i < valueEnd; i++) {
    const token = br.tokens[i];
    // Guard against malformed token streams with stray quote tokens.
    if (quoted && token.type === TokenType.Quote) {
      continue;
    }
    value += br.source.slice(token.start, token.end);
  }

  return value;
}

export function getAttributeValueQuote(node: WrappedNode): string | null {
  const range = getAttributeValueRange(node);
  if (!range?.hasValue || !range.quoted) return null;
  return range.quote;
}

export function getAttributeValueKind(node: WrappedNode): AttributeValueKind {
  const br = node.buildResult;
  const range = getAttributeValueRange(node);
  if (!range?.hasValue) return "none";
  if (range.start >= range.end) return "static_text";

  let hasDynamic = false;
  let hasText = false;

  for (let i = range.start; i < range.end; i++) {
    const token = br.tokens[i];

    if (token.type === TokenType.JsxAttributeValue) {
      hasDynamic = true;
      continue;
    }

    const endType = VALUE_CONSTRUCT_END[token.type];

    if (endType !== undefined) {
      hasDynamic = true;
      i++;
      while (i < range.end && br.tokens[i].type !== endType) {
        i++;
      }
      continue;
    }

    if (token.type === TokenType.Directive) {
      hasDynamic = true;
      if (i + 1 < range.end && br.tokens[i + 1].type === TokenType.DirectiveArgs) {
        i++;
      }
      continue;
    }

    const text = br.source.slice(token.start, token.end);
    if (text.includes("<?")) {
      hasDynamic = true;
      continue;
    }

    hasText = true;
  }

  if (!hasDynamic) return "static_text";
  return hasText ? "mixed_structured" : "pure_construct";
}

export function isStaticAttributeValue(node: WrappedNode): boolean {
  return getAttributeValueKind(node) === "static_text";
}

export function unescapeQuoteEntities(text: string): string {
  return text.replaceAll("&apos;", "'").replaceAll("&quot;", '"');
}

export function getUnescapedAttributeValue(node: WrappedNode): string {
  const raw = getAttributeRawValue(node);
  return raw ? unescapeQuoteEntities(raw) : "";
}

/**
 * Build a {name: value} map from an Element's attribute children.
 * Reference uses node.attrMap - we derive it from the attrs array.
 */
export function getAttrMap(node: WrappedNode): Record<string, string> {
  const map: Record<string, string> = {};
  for (const attr of node.attrs) {
    if (!isStaticAttributeName(attr)) continue;
    const name = getAttributeNameRaw(attr);
    const value = getAttributeRawValue(attr);
    if (name) map[name.toLowerCase()] = value ?? "";
  }
  return map;
}

/**
 * Infer the sub-parser for a script/style element.
 * Reference: utilities/index.js inferElementParser, inferScriptParser, inferStyleParser.
 */
export function inferElementParser(node: WrappedNode, options: Options): string | undefined {
  return inferScriptParser(node, options) ?? inferStyleParser(node, options);
}

function inferScriptParser(node: WrappedNode, options: Options): string | undefined {
  // Use fullName to avoid matching <html:script> or other namespaced variants.
  if (node.fullName.toLowerCase() !== "script") return;
  const attrMap = getAttrMap(node);
  if ("src" in attrMap) return;
  const { type, lang } = attrMap;
  if (!lang && !type) return "babel";
  return inferParserByLanguage(options, lang) ?? inferParserByTypeAttribute(type);
}

function inferStyleParser(node: WrappedNode, options: Options): string | undefined {
  // Use fullName to avoid matching <html:style> or other namespaced variants.
  if (node.fullName.toLowerCase() !== "style") return;
  const { lang } = getAttrMap(node);
  if (lang) {
    return inferParserByLanguage(options, lang);
  }
  return "css";
}

type SupportLanguageLike = {
  name?: string;
  aliases?: string[];
  extensions?: string[];
  parsers?: string[];
};

/**
 * Port of Prettier's inferParser(..., { language }) behavior:
 * - reverse plugin order
 * - match by `name.toLowerCase()`, aliases, then extensions
 */
function inferParserByLanguage(options: Options, language: string | undefined): string | undefined {
  if (!language) return;

  const plugins = ((options as Record<string, unknown>).plugins ?? []) as unknown[];
  const languages = plugins
    .slice()
    .reverse()
    .flatMap((plugin) => {
      const p = plugin as Record<string, unknown>;
      return Array.isArray(p.languages) ? (p.languages as SupportLanguageLike[]) : [];
    });

  const matchedLanguage =
    languages.find(({ name }) => typeof name === "string" && name.toLowerCase() === language) ??
    languages.find(({ aliases }) => Array.isArray(aliases) && aliases.includes(language)) ??
    languages.find(
      ({ extensions }) => Array.isArray(extensions) && extensions.includes(`.${language}`),
    );

  return matchedLanguage?.parsers?.[0];
}

const SCRIPT_TYPE_ATTRIBUTE_PARSER_MAP: Readonly<Record<string, string>> = {
  module: "babel",
  "text/javascript": "babel",
  "text/babel": "babel",
  "text/jsx": "babel",
  "application/javascript": "babel",
  "application/x-typescript": "typescript",
  "text/markdown": "markdown",
  "text/html": "html",
  "text/x-handlebars-template": "glimmer",
};

function inferParserByTypeAttribute(type: string | undefined): string | undefined {
  if (!type) return;

  const explicitParser = SCRIPT_TYPE_ATTRIBUTE_PARSER_MAP[type];
  if (explicitParser) {
    return explicitParser;
  }

  if (type.endsWith("json") || type.endsWith("importmap") || type === "speculationrules") {
    return "json";
  }

  return;
}

/**
 * Normalize an attribute name: lowercase known HTML attributes on known elements.
 */
export function normalizeAttributeName(name: string, parentNode: WrappedNode | null): string {
  if (!parentNode || parentNode.kind !== NodeKind.Element) return name;
  // Only normalize non-namespaced attributes (no ":" prefix like v-bind:, x-on:, etc.)
  if (name.includes(":")) return name;
  const lowerName = name.toLowerCase();
  const elementName = parentNode.tagName; // already lowercase
  if (
    HTML_ELEMENT_ATTRIBUTES.has(elementName) &&
    (HTML_ELEMENT_ATTRIBUTES.get("*")!.has(lowerName) ||
      HTML_ELEMENT_ATTRIBUTES.get(elementName)!.has(lowerName))
  ) {
    return lowerName;
  }
  return name;
}
