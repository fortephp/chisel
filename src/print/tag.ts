import type { AstPath, Doc, Options } from "prettier";
import { doc } from "prettier";
import type { WrappedNode } from "../types.js";
import { NodeKind } from "../tree/types.js";
import { TokenType } from "../lexer/types.js";
import { HTML_TAGS } from "../html-data.js";
import {
  getEchoSpacingMode,
  getSlotClosingTagMode,
  shouldInsertOptionalClosingTags,
  shouldPreserveInlineIntentAttributes,
  shouldPreserveInlineIntentElement,
  shouldPreserveInlineIntentNamespace,
} from "./blade-options.js";
import { formatAttributeNameForPrint } from "./attribute-name.js";
import { isTextLikeNode, isVueSfcBlock } from "../node-predicates.js";
import {
  isPreLikeNode,
  getLastDescendant,
  hasPrettierIgnore,
  shouldPreserveContent,
  getAttributeNameRaw,
  getStaticAttributeNameLower,
  isStaticAttributeName,
  getAttributeValueKind,
  getAttributeValueQuote,
  getAttributeRawValue,
  unescapeQuoteEntities,
  normalizeAttributeName,
  isIeConditionalStartComment,
} from "./utils.js";
import { getDoctypeStartMarker } from "./doctype-utils.js";
import { replaceEndOfLine } from "./doc-utils.js";

const { indent, line, softline, hardline, join } = doc.builders;

const unpairedClosingTagIndexCache = new WeakMap<WrappedNode, Map<string, number[]>>();

function canBorrowParentTagMarkers(node: WrappedNode): boolean {
  return node.kind === NodeKind.Element || node.kind === NodeKind.ConditionalComment;
}

/**
 * Get the display tag name for marker output.
 * Matches Prettier's `node.rawName` after postprocess normalization:
 * - SVG namespace: preserve original case (e.g. `linearGradient`)
 * - Known HTML tags: lowercase (browsers normalize HTML tags to lowercase)
 * - Unknown tags (custom elements): preserve original case
 */
function getDisplayTagName(node: WrappedNode): string {
  const trimMalformedEofName = (name: string): string =>
    shouldTrimMalformedEofTagName(node) ? name.replace(/\s+$/u, "") : name;

  if (node.namespace === "svg") {
    return trimMalformedEofName(node.rawTagName);
  }
  if (node.kind === NodeKind.Element && node.flat.genericOffset > 0) {
    return trimMalformedEofName(node.rawTagName);
  }
  // Match Prettier's normalizeName: lowercase if the FULL name (with namespace
  // prefix) is a known HTML tag. "html:div" is NOT known -> preserves case.
  // "div" IS known -> lowercased.
  // Reference: prettier-main/src/language-html/parse/postprocess.js normalizeName
  const fullLower = node.rawTagName.toLowerCase();
  if (HTML_TAGS.has(fullLower)) {
    return trimMalformedEofName(fullLower);
  }
  return trimMalformedEofName(node.rawTagName);
}

function shouldTrimMalformedEofTagName(node: WrappedNode): boolean {
  return (
    node.kind === NodeKind.Element &&
    node.end === node.source.length &&
    node.openTagEndOffset <= node.start &&
    !node.hasClosingTag
  );
}

function getElementGenericSuffix(node: WrappedNode): string {
  if (node.kind !== NodeKind.Element) return "";

  const tokens = node.buildResult.tokens;
  const tokenStart = node.flat.tokenStart;
  const tokenEnd = tokenStart + node.flat.tokenCount;

  for (let i = tokenStart + 1; i < tokenEnd; i++) {
    const token = tokens[i];
    if (token.type === TokenType.TsxGenericType) {
      return node.buildResult.source.slice(token.start, token.end);
    }
    if (
      token.type === TokenType.Whitespace ||
      token.type === TokenType.GreaterThan ||
      token.type === TokenType.Slash ||
      token.type === TokenType.SyntheticClose
    ) {
      break;
    }
  }

  return "";
}

function isDynamicTagNameText(name: string): boolean {
  return name.includes("{{") || name.includes("{!!") || name.includes("<?") || name.includes("@");
}

function hasShorthandSlotClosingTag(node: WrappedNode): boolean {
  if (!node.rawClosingTagName) return false;
  const openTagName = node.rawTagName.toLowerCase();
  if (!openTagName.startsWith("x-slot:") && !openTagName.startsWith("x-slot[")) {
    return false;
  }
  return node.rawClosingTagName.toLowerCase() === "x-slot";
}

function getDisplayClosingTagName(node: WrappedNode, options?: Options): string {
  if (
    options &&
    getSlotClosingTagMode(options) === "preserve" &&
    hasShorthandSlotClosingTag(node)
  ) {
    return node.rawClosingTagName;
  }

  if (
    node.rawClosingTagName &&
    (isDynamicTagNameText(node.rawTagName) || isDynamicTagNameText(node.rawClosingTagName))
  ) {
    return node.rawClosingTagName;
  }
  return getDisplayTagName(node);
}

function isBorrowableMarkerNode(node: WrappedNode): boolean {
  return (
    node.kind === NodeKind.Element ||
    node.kind === NodeKind.ConditionalComment ||
    node.kind === NodeKind.Comment ||
    node.kind === NodeKind.BogusComment
  );
}

function canBorrowPrevClosingTagEndMarker(node: WrappedNode): boolean {
  return (
    node.kind === NodeKind.Element ||
    node.kind === NodeKind.ConditionalComment ||
    node.kind === NodeKind.Text ||
    node.kind === NodeKind.Comment ||
    node.kind === NodeKind.BogusComment ||
    node.kind === NodeKind.Echo ||
    node.kind === NodeKind.RawEcho ||
    node.kind === NodeKind.TripleEcho ||
    node.kind === NodeKind.Doctype ||
    node.kind === NodeKind.Cdata ||
    node.kind === NodeKind.Decl ||
    node.kind === NodeKind.ProcessingInstruction
  );
}

function getRoot(node: WrappedNode): WrappedNode {
  let current = node;
  while (current.parent) {
    current = current.parent;
  }
  return current;
}

function getUnpairedClosingTagName(node: WrappedNode): string | null {
  if (node.kind !== NodeKind.UnpairedClosingTag) return null;
  const raw = node.source.slice(node.start, node.end).trim();
  const match = raw.match(/^<\s*\/\s*([^\s>/]+)\s*>?$/);
  return match?.[1]?.toLowerCase() ?? null;
}

function buildUnpairedClosingTagIndex(root: WrappedNode): Map<string, number[]> {
  const index = new Map<string, number[]>();
  const stack: WrappedNode[] = [root];

  while (stack.length > 0) {
    const node = stack.pop()!;

    const name = getUnpairedClosingTagName(node);
    if (name) {
      const list = index.get(name);
      if (list) {
        list.push(node.start);
      } else {
        index.set(name, [node.start]);
      }
    }

    for (let i = node.children.length - 1; i >= 0; i--) {
      stack.push(node.children[i]);
    }
  }

  for (const positions of index.values()) {
    positions.sort((a, b) => a - b);
  }

  return index;
}

function getUnpairedClosingTagIndex(root: WrappedNode): Map<string, number[]> {
  const cached = unpairedClosingTagIndexCache.get(root);
  if (cached) return cached;

  const built = buildUnpairedClosingTagIndex(root);
  unpairedClosingTagIndexCache.set(root, built);
  return built;
}

function hasFutureMatchingUnpairedClosingTag(node: WrappedNode): boolean {
  if (node.kind !== NodeKind.Element) return false;
  if (!node.tagName) return false;

  const root = getRoot(node);
  const index = getUnpairedClosingTagIndex(root);
  const openTagName = node.tagName.toLowerCase();
  const candidateClosingNames = new Set<string>([openTagName]);

  // Blade slot shorthand: </x-slot> can close <x-slot:foo> / <x-slot[foo]>.
  if (openTagName.startsWith("x-slot:") || openTagName.startsWith("x-slot[")) {
    candidateClosingNames.add("x-slot");
  }

  for (const candidate of candidateClosingNames) {
    const positions = index.get(candidate) ?? [];
    let lo = 0;
    let hi = positions.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (positions[mid] <= node.end) {
        lo = mid + 1;
      } else {
        return true;
      }
    }
  }

  return false;
}

/**
 * Should the next node borrow the previous closing tag's end marker (`>`)?
 * e.g. `<p></p\n>123` - the `>` is printed with the text node.
 */
export function needsToBorrowPrevClosingTagEndMarker(node: WrappedNode): boolean {
  return (
    canBorrowPrevClosingTagEndMarker(node) &&
    !!node.prev &&
    isBorrowableMarkerNode(node.prev) &&
    node.prev.kind !== NodeKind.Doctype &&
    node.kind !== NodeKind.DirectiveBlock &&
    !isTextLikeNode(node.prev) &&
    node.isLeadingSpaceSensitive &&
    !node.hasLeadingSpaces
  );
}

/**
 * Should the parent borrow its last child's closing tag end marker?
 * e.g. `<p><a></a\n></p\n>` - the inner `>` is printed with closing `</p`.
 */
export function needsToBorrowLastChildClosingTagEndMarker(node: WrappedNode): boolean {
  if (!canBorrowParentTagMarkers(node)) {
    return false;
  }

  const last = node.children[node.children.length - 1];
  return (
    !!last &&
    isBorrowableMarkerNode(last) &&
    last.isTrailingSpaceSensitive &&
    !last.hasTrailingSpaces &&
    !isTextLikeNode(getLastDescendant(last)) &&
    !isPreLikeNode(node)
  );
}

/**
 * Should this node borrow the parent's closing tag start marker (`</tag`)?
 * e.g. `<p>123</p>` - the `</p` is printed on the same line as `123`.
 */
export function needsToBorrowParentClosingTagStartMarker(node: WrappedNode): boolean {
  return (
    !node.next &&
    !node.hasTrailingSpaces &&
    node.isTrailingSpaceSensitive &&
    isTextLikeNode(getLastDescendant(node))
  );
}

/**
 * Should this text node borrow the next opening tag's start marker (`<tag`)?
 * e.g. `123<p>` - the `<p` is printed on the same line as `123`.
 */
export function needsToBorrowNextOpeningTagStartMarker(node: WrappedNode): boolean {
  return (
    !!node.next &&
    isBorrowableMarkerNode(node.next) &&
    !isTextLikeNode(node.next) &&
    isTextLikeNode(node) &&
    node.isTrailingSpaceSensitive &&
    !node.hasTrailingSpaces
  );
}

/**
 * Should this node borrow the parent's opening tag end marker (`>`)?
 * e.g. `<p\n>123` - the `>` is printed with `123`.
 */
export function needsToBorrowParentOpeningTagEndMarker(node: WrappedNode): boolean {
  // Only nodes that print `printOpeningTagPrefix(...)` can safely borrow
  // the parent's opening `>` marker.
  const canBorrow =
    node.kind === NodeKind.Text ||
    node.kind === NodeKind.Comment ||
    node.kind === NodeKind.BogusComment ||
    node.kind === NodeKind.Echo ||
    node.kind === NodeKind.RawEcho ||
    node.kind === NodeKind.TripleEcho ||
    node.kind === NodeKind.Doctype ||
    node.kind === NodeKind.Cdata ||
    node.kind === NodeKind.Decl ||
    node.kind === NodeKind.ProcessingInstruction ||
    node.kind === NodeKind.Element ||
    node.kind === NodeKind.ConditionalComment;

  // Dotted component names (e.g. <x:editor.button>) are prone to
  // one-pass marker drift when their first child borrows the opening `>`.
  // Keep the parent's `>` attached to the opening tag for stable output.
  if (node.parent?.kind === NodeKind.Element && node.parent.rawTagName.includes(".")) {
    return false;
  }

  return canBorrow && !node.prev && node.isLeadingSpaceSensitive && !node.hasLeadingSpaces;
}

function shouldNotPrintClosingTag(node: WrappedNode, options: Options): boolean {
  if (
    node.kind === NodeKind.Element &&
    !node.isSelfClosing &&
    !node.hasClosingTag &&
    !shouldInsertOptionalClosingTags(options)
  ) {
    return true;
  }

  const hasClosingTagLikeTextInBody =
    node.kind === NodeKind.Element &&
    !node.isSelfClosing &&
    !node.hasClosingTag &&
    node.rawTagName.length > 0 &&
    node.openTagEndOffset > 0 &&
    node.source
      .slice(node.openTagEndOffset, node.end)
      .toLowerCase()
      .includes(`</${node.rawTagName.toLowerCase()}`);

  if (
    node.kind === NodeKind.Element &&
    !node.isSelfClosing &&
    !node.hasClosingTag &&
    hasFutureMatchingUnpairedClosingTag(node)
  ) {
    return true;
  }

  const hasUnpairedClosingChild =
    node.kind === NodeKind.Element &&
    node.children.some((child) => child.kind === NodeKind.UnpairedClosingTag);

  return (
    !node.isSelfClosing &&
    !node.hasClosingTag &&
    (hasClosingTagLikeTextInBody ||
      hasPrettierIgnore(node) ||
      shouldPreserveContent(node.parent!, options) ||
      hasUnpairedClosingChild)
  );
}

export function printOpeningTagStartMarker(node: WrappedNode, options?: Options): string {
  switch (node.kind) {
    case NodeKind.ConditionalComment:
      return `<!--[if ${node.condition}`;
    case NodeKind.Comment:
      if (isIeConditionalStartComment(node)) {
        return `<!--[if ${node.ieConditionalStartCondition}`;
      }
      return "<!--";
    case NodeKind.BogusComment:
      return "<!--";
    case NodeKind.Echo:
      return "{{";
    case NodeKind.RawEcho:
      return "{!!";
    case NodeKind.TripleEcho:
      return "{{{";
    case NodeKind.Doctype:
      return getDoctypeStartMarker(node.rawText, options);
    case NodeKind.Element:
      if (node.condition) {
        return `<!--[if ${node.condition}]><!--><${getDisplayTagName(node)}${getElementGenericSuffix(node)}`;
      }
      return `<${getDisplayTagName(node)}${getElementGenericSuffix(node)}`;
    default:
      return `<${getDisplayTagName(node)}`;
  }
}

export function printOpeningTagEndMarker(node: WrappedNode, options?: Options): string {
  switch (node.kind) {
    case NodeKind.ConditionalComment:
      return node.conditionalStartIsRevealed ? "]><!-->" : "]>";
    case NodeKind.Element:
      // Recovery mode: do not invent a missing ">" for malformed start tags.
      // This keeps malformed EOF inputs stable across passes.
      const hasFutureMatchingCloser = hasFutureMatchingUnpairedClosingTag(node);
      if (
        node.openTagEndOffset <= node.start &&
        !node.hasClosingTag &&
        !(options && shouldInsertOptionalClosingTags(options)) &&
        !hasFutureMatchingCloser
      ) {
        return "";
      }
      if (node.condition) {
        return "><!--<![endif]-->";
      }
      return ">";
    default:
      return ">";
  }
}

export function printClosingTagStartMarker(node: WrappedNode, options?: Options): string {
  if (options && shouldNotPrintClosingTag(node, options)) {
    return "";
  }
  switch (node.kind) {
    case NodeKind.ConditionalComment:
      return node.conditionalEndIsHidden ? "<!--<!" : "<!";
    case NodeKind.Element:
      if (node.hasHtmComponentClosingTag) {
        return "<//";
      }
      return `</${getDisplayClosingTagName(node, options)}`;
    default:
      return `</${getDisplayTagName(node)}`;
  }
}

export function printClosingTagEndMarker(node: WrappedNode, options?: Options): string {
  if (options && shouldNotPrintClosingTag(node, options)) {
    return "";
  }
  switch (node.kind) {
    case NodeKind.ConditionalComment:
      return "[endif]-->";
    case NodeKind.Comment:
      return isIeConditionalStartComment(node) ? "]><!-->" : ">";
    case NodeKind.Echo:
      return "}}";
    case NodeKind.RawEcho:
      return "!!}";
    case NodeKind.TripleEcho:
      return "}}}";
    case NodeKind.Element:
      if (node.isSelfClosing) {
        return "/>";
      }
      return ">";
    default:
      return ">";
  }
}

/**
 * Prefix for the opening tag: borrows parent's `>` or prev's `>`.
 * Used by text/comment nodes to glue their start to a preceding marker.
 */
export function printOpeningTagPrefix(node: WrappedNode, options?: Options): Doc {
  return needsToBorrowParentOpeningTagEndMarker(node)
    ? node.parent && canBorrowParentTagMarkers(node.parent)
      ? printOpeningTagEndMarker(node.parent, options)
      : ""
    : needsToBorrowPrevClosingTagEndMarker(node)
      ? printClosingTagEndMarker(node.prev!, options)
      : "";
}

/**
 * Opening tag start: prefix + `<tagname`.
 * Suppressed if the previous node borrows this node's `<tagname`.
 */
export function printOpeningTagStart(node: WrappedNode, options?: Options): Doc {
  return node.prev && needsToBorrowNextOpeningTagStartMarker(node.prev)
    ? ""
    : [printOpeningTagPrefix(node, options), printOpeningTagStartMarker(node, options)];
}

/**
 * Opening tag end: `>`.
 * Suppressed if the first child borrows the parent's `>`.
 */
function printOpeningTagEnd(node: WrappedNode, options?: Options): Doc {
  const firstChild = node.children[0];
  return firstChild && needsToBorrowParentOpeningTagEndMarker(firstChild)
    ? ""
    : printOpeningTagEndMarker(node, options);
}

/**
 * Suffix for the closing tag: borrows parent's `</tag` or next's `<tag`.
 * Used by text/comment nodes to glue their end to a following marker.
 */
export function printClosingTagSuffix(node: WrappedNode, options?: Options): Doc {
  if (needsToBorrowParentClosingTagStartMarker(node)) {
    if (
      node.parent &&
      canBorrowParentTagMarkers(node.parent) &&
      canBorrowParentClosingMarkerStart(node.parent, options)
    ) {
      return printClosingTagStartMarker(node.parent, options);
    }
    return "";
  }

  return needsToBorrowNextOpeningTagStartMarker(node)
    ? printOpeningTagStartMarker(node.next!, options)
    : "";
}

function canBorrowParentClosingMarkerStart(parent: WrappedNode, options?: Options): boolean {
  if (parent.kind !== NodeKind.Element) {
    return true;
  }

  if (parent.hasClosingTag) {
    return true;
  }

  return options ? shouldInsertOptionalClosingTags(options) : false;
}

/**
 * Closing tag prefix: borrows last child's `>` if applicable.
 */
function printClosingTagPrefix(node: WrappedNode, options?: Options): Doc {
  return needsToBorrowLastChildClosingTagEndMarker(node)
    ? printClosingTagEndMarker(node.children[node.children.length - 1], options)
    : "";
}

/**
 * Closing tag start: `</tagname`.
 * Suppressed if last child borrows the parent's `</tag`.
 */
function printClosingTagStart(node: WrappedNode, options?: Options): Doc {
  const lastChild = node.children[node.children.length - 1];
  return lastChild && needsToBorrowParentClosingTagStartMarker(lastChild)
    ? ""
    : [printClosingTagPrefix(node, options), printClosingTagStartMarker(node, options)];
}

/**
 * Closing tag end: `>` + suffix.
 * Suppressed if next sibling or parent borrows the `>`.
 */
export function printClosingTagEnd(node: WrappedNode, options?: Options): Doc {
  return (
    node.next
      ? needsToBorrowPrevClosingTagEndMarker(node.next)
      : needsToBorrowLastChildClosingTagEndMarker(node.parent!)
  )
    ? ""
    : [printClosingTagEndMarker(node, options), printClosingTagSuffix(node, options)];
}

export function getPrettierIgnoreAttributeCommentData(value: string): boolean | string[] | false {
  const match = value.trim().match(/^prettier-ignore-attribute(?:\s+(.+))?$/s);
  if (!match) return false;
  if (!match[1]) return true;
  return match[1].split(/\s+/);
}

export function printOpeningTag(
  path: AstPath<WrappedNode>,
  options: Options,
  print: (path: AstPath<WrappedNode>) => Doc,
): Doc {
  const node = path.node;
  return [
    printOpeningTagStart(node, options),
    printAttributes(path, options, print),
    node.isSelfClosing ? "" : printOpeningTagEnd(node, options),
  ];
}

export function printClosingTag(node: WrappedNode, options: Options): Doc[] {
  return [
    node.isSelfClosing ? "" : printClosingTagStart(node, options),
    printClosingTagEnd(node, options),
  ];
}

function printAttributes(
  path: AstPath<WrappedNode>,
  options: Options,
  print: (path: AstPath<WrappedNode>) => Doc,
): Doc {
  const node = path.node;
  const bracketSameLine = (options as Record<string, unknown>).bracketSameLine as
    | boolean
    | undefined;

  if (node.attrs.length === 0) {
    return node.isSelfClosing ? " " : "";
  }

  const ignoreAttributeData =
    node.prev?.kind === NodeKind.Comment &&
    getPrettierIgnoreAttributeCommentData(
      node.prev.rawText.replace(/^<!--\s*/, "").replace(/\s*-->$/, ""),
    );

  const hasPrettierIgnoreAttribute =
    typeof ignoreAttributeData === "boolean"
      ? () => ignoreAttributeData
      : Array.isArray(ignoreAttributeData)
        ? (attribute: WrappedNode) => {
            if (attribute.kind !== NodeKind.Attribute && attribute.kind !== NodeKind.JsxAttribute) {
              return false;
            }
            const attrName = getAttributeNameRaw(attribute);
            return ignoreAttributeData.includes(attrName);
          }
        : () => false;

  const printedAttrs = path.map((attrPath) => {
    const attribute = attrPath.node;
    if (hasPrettierIgnoreAttribute(attribute)) {
      return replaceEndOfLine(node.source.slice(attribute.start, attribute.end));
    }
    return print(attrPath);
  }, "attrs");

  // forceNotToBreakAttrContent for <script src>
  const forceNotToBreakAttrContent =
    node.kind === NodeKind.Element &&
    node.fullName.toLowerCase() === "script" &&
    node.attrs.length === 1 &&
    getStaticAttributeNameLower(node.attrs[0]) === "src" &&
    node.children.length === 0;

  const forceInlineIntentAttributeLayout = shouldKeepInlineIntentAttributeLayout(node, options);
  const forceMultilineSvgAttributeLayout = shouldForceMultilineSvgAttributeLayout(node, options);

  const shouldPrintAttributePerLine =
    !forceInlineIntentAttributeLayout &&
    !forceMultilineSvgAttributeLayout &&
    (options as Record<string, unknown>).singleAttributePerLine &&
    node.attrs.length > 1 &&
    !isVueSfcBlock(node, options);

  const attrLine = shouldPrintAttributePerLine ? hardline : line;

  const parts: Doc[] = [
    indent([
      forceNotToBreakAttrContent || forceInlineIntentAttributeLayout
        ? " "
        : forceMultilineSvgAttributeLayout
          ? hardline
          : line,
      join(
        forceInlineIntentAttributeLayout
          ? " "
          : forceMultilineSvgAttributeLayout
            ? hardline
            : attrLine,
        printedAttrs,
      ),
    ]),
  ];

  // Determine trailing whitespace before the end marker.
  const firstChild = node.children[0];
  const forceFlat =
    (firstChild && needsToBorrowParentOpeningTagEndMarker(firstChild)) ||
    (node.isSelfClosing &&
      node.parent !== null &&
      needsToBorrowLastChildClosingTagEndMarker(node.parent)) ||
    forceInlineIntentAttributeLayout ||
    forceNotToBreakAttrContent;

  if (forceMultilineSvgAttributeLayout) {
    parts.push(hardline);
  } else if (forceFlat) {
    parts.push(node.isSelfClosing ? " " : "");
  } else if (bracketSameLine) {
    parts.push(node.isSelfClosing ? " " : "");
  } else {
    parts.push(node.isSelfClosing ? line : softline);
  }

  return parts;
}

function shouldKeepInlineIntentAttributeLayout(node: WrappedNode, options: Options): boolean {
  if (node.kind !== NodeKind.Element) return false;
  if (node.attrs.length === 0) return false;
  if (node.openTagEndOffset <= node.start) return false;

  if (!shouldPreserveInlineIntentAttributes(options, node.tagName, node.namespace)) {
    return false;
  }

  const openingSource = node.source.slice(node.start, node.openTagEndOffset);
  // Blade echo/directive constructs inside the opening tag can expand into
  // multiline docs after PHP formatting. For these cases, avoid forced inline
  // attribute layout so first-pass and second-pass output converge.
  if (
    openingSource.includes("{{") ||
    openingSource.includes("{!!") ||
    openingSource.includes("{{{")
  ) {
    return false;
  }
  return !/[\r\n]/u.test(openingSource);
}

function shouldForceMultilineSvgAttributeLayout(node: WrappedNode, options: Options): boolean {
  if (node.kind !== NodeKind.Element) return false;
  if (node.namespace !== "svg") return false;
  if (node.attrs.length === 0) return false;
  return !hasInlineIntentAttributeConfig(node, options);
}

function hasInlineIntentAttributeConfig(node: WrappedNode, options: Options): boolean {
  if (node.kind !== NodeKind.Element) return false;
  return (
    shouldPreserveInlineIntentElement(options, node.tagName, node.namespace) ||
    shouldPreserveInlineIntentNamespace(options, node.namespace)
  );
}

// Ported from Prettier's utilities/get-preferred-quote.js
function getPreferredQuote(value: string, preferred: string): string {
  const alt = preferred === '"' ? "'" : '"';
  let prefCount = 0;
  let altCount = 0;
  for (const ch of value) {
    if (ch === preferred) prefCount++;
    else if (ch === alt) altCount++;
  }
  return prefCount > altCount ? alt : preferred;
}

type AttributeValueTokenRange = {
  start: number;
  end: number;
};

function getAttributeValueTokenRange(node: WrappedNode): AttributeValueTokenRange | null {
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
    return { start: valueStart, end: valueStart };
  }

  if (br.tokens[valueStart].type !== TokenType.Quote) {
    return { start: valueStart, end: tokenEnd };
  }

  let valueEnd = tokenEnd;
  if (valueEnd > valueStart + 1 && br.tokens[valueEnd - 1].type === TokenType.Quote) {
    valueEnd--;
  }

  return { start: valueStart + 1, end: valueEnd };
}

function getEchoConstructInfo(
  tokenType: TokenType,
): { open: string; close: string; endType: TokenType } | null {
  if (tokenType === TokenType.EchoStart) {
    return { open: "{{", close: "}}", endType: TokenType.EchoEnd };
  }
  if (tokenType === TokenType.RawEchoStart) {
    return { open: "{!!", close: "!!}", endType: TokenType.RawEchoEnd };
  }
  if (tokenType === TokenType.TripleEchoStart) {
    return { open: "{{{", close: "}}}", endType: TokenType.TripleEchoEnd };
  }
  return null;
}

function formatEchoConstruct(
  raw: string,
  open: string,
  close: string,
  spacing: ReturnType<typeof getEchoSpacingMode>,
): string {
  if (spacing === "preserve") {
    return raw;
  }

  if (!raw.startsWith(open) || !raw.endsWith(close)) {
    return raw;
  }

  const content = raw.slice(open.length, raw.length - close.length);
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return spacing === "tight" ? `${open}${close}` : `${open} ${close}`;
  }

  if (trimmed.includes("\n")) {
    return `${open}\n${trimmed}\n${close}`;
  }

  return spacing === "tight" ? `${open}${trimmed}${close}` : `${open} ${trimmed} ${close}`;
}

function formatDynamicAttributeValue(
  node: WrappedNode,
  originalValue: string,
  options: Options,
): string {
  const spacing = getEchoSpacingMode(options);
  if (spacing === "preserve") {
    return originalValue;
  }

  const range = getAttributeValueTokenRange(node);
  if (!range || range.start >= range.end) {
    return originalValue;
  }

  const br = node.buildResult;
  let output = "";

  for (let i = range.start; i < range.end; i++) {
    const token = br.tokens[i];
    const echoInfo = getEchoConstructInfo(token.type);

    if (!echoInfo) {
      output += br.source.slice(token.start, token.end);
      continue;
    }

    const segmentStart = token.start;
    let segmentEnd = token.end;

    i++;
    while (i < range.end) {
      const current = br.tokens[i];
      segmentEnd = current.end;
      if (current.type === echoInfo.endType) {
        break;
      }
      i++;
    }

    output += formatEchoConstruct(
      br.source.slice(segmentStart, segmentEnd),
      echoInfo.open,
      echoInfo.close,
      spacing,
    );
  }

  return output;
}

export function printAttribute(node: WrappedNode, options: Options): Doc {
  const br = node.buildResult;
  const tc = node.flat.tokenCount;

  let isBound = false;
  let isShorthand = false;
  let isEscaped = false;

  for (let i = 0; i < tc; i++) {
    const t = br.tokens[node.flat.tokenStart + i];
    if (t.type === TokenType.BoundAttribute) isBound = true;
    if (t.type === TokenType.ShorthandAttribute) isShorthand = true;
    if (t.type === TokenType.EscapedAttribute) isEscaped = true;
  }

  const rawName = formatAttributeNameForPrint(node, options);
  const name =
    isBound || isShorthand || isEscaped || !isStaticAttributeName(node)
      ? rawName
      : normalizeAttributeName(rawName, node.parent);
  const value = getAttributeRawValue(node);
  const valueKind = getAttributeValueKind(node);

  if (value === null) {
    return name;
  }

  if (valueKind !== "static_text") {
    const formattedDynamicValue = formatDynamicAttributeValue(node, value, options);
    const quote = getAttributeValueQuote(node);
    return quote
      ? [name, "=", quote, replaceEndOfLine(formattedDynamicValue), quote]
      : [name, "=", replaceEndOfLine(formattedDynamicValue)];
  }

  // Normalize quotes: unescape entities, choose preferred quote, re-escape.
  const unescaped = unescapeQuoteEntities(value);
  const quote = getPreferredQuote(unescaped, '"');
  const escaped =
    quote === '"' ? unescaped.replaceAll('"', "&quot;") : unescaped.replaceAll("'", "&apos;");

  return [name, "=", quote, replaceEndOfLine(escaped), quote];
}
