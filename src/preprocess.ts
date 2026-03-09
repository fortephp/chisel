/**
 * Preprocessing pipeline - runs on the WrappedNode tree before printing.
 *
 * Ported from Prettier's print-preprocess.js, adapted for our flat-node AST.
 */
import type { Options } from "prettier";
import type { WrappedNode } from "./types.js";
import { NodeKind } from "./tree/types.js";
import { VOID_ELEMENTS } from "./tree/void-elements.js";
import { hasFrontMatterMark } from "./front-matter.js";
import { buildLineOffsets, getLine } from "./line-offsets.js";
import {
  htmlTrim,
  htmlTrimStart,
  htmlTrimEnd,
  hasHtmlWhitespaceCharacter,
} from "./html-whitespace.js";
import { executePreprocessStages, type PreprocessStage } from "./preprocess/pipeline.js";
import {
  isBlockLikeCssDisplay,
  isFirstChildLeadingSpaceSensitiveCssDisplay,
  isLastChildTrailingSpaceSensitiveCssDisplay,
  isNextLeadingSpaceSensitiveCssDisplay,
  isPrevTrailingSpaceSensitiveCssDisplay,
} from "./preprocess/whitespace-model.js";
import {
  CSS_DISPLAY_TAGS,
  CSS_DISPLAY_DEFAULT,
  CSS_WHITE_SPACE_TAGS,
  CSS_WHITE_SPACE_DEFAULT,
} from "./constants.js";
import {
  hasParent,
  isUnknownNamespace,
  isScriptLikeTag,
  isEchoLike,
  isWhitespaceTextLikeNode,
  isVueSfcBlock,
  isVueCustomBlock,
} from "./node-predicates.js";

function isWhitespaceOnlyText(node: WrappedNode): boolean {
  return node.kind === NodeKind.Text && /^[\t\n\f\r ]*$/.test(node.rawText);
}

function getPrevNonWhitespaceSibling(node: WrappedNode): WrappedNode | null {
  let sibling = node.prev;
  while (sibling) {
    if (!isWhitespaceOnlyText(sibling)) return sibling;
    sibling = sibling.prev;
  }
  return null;
}

function isBladeSlotElement(node: WrappedNode): boolean {
  if (node.kind !== NodeKind.Element) return false;
  return /^x-slot(?::|\[|$)/iu.test(node.fullName);
}

function getCssDisplay(node: WrappedNode, options: Options): string {
  // Every root block in Vue SFC is a block.
  if (isVueSfcBlock(node, options)) return "block";

  // Blade slots are semantically block-like in templates; treating them as
  // block avoids cramped inline wrapping and aligns with Laravel whitespace trim.
  if (isBladeSlotElement(node)) return "block";

  // Comment display hint: <!-- display: block -->
  const prevSibling = getPrevNonWhitespaceSibling(node);
  if (prevSibling?.kind === NodeKind.Comment) {
    const match = prevSibling.rawText.match(/^<!--\s*display:\s*([a-z]+)\s*-->$/);
    if (match) return match[1];
  }

  // SVG namespace handling.
  if (node.kind === NodeKind.Element && node.namespace === "svg") {
    if (
      hasParent(
        node,
        (parent) =>
          parent.kind === NodeKind.Element &&
          parent.namespace === "svg" &&
          parent.tagName === "foreignobject",
      )
    ) {
      // Inside foreignObject - fall through to CSS_DISPLAY_TAGS lookup.
    } else {
      return node.tagName === "svg" ? "inline-block" : "block";
    }
  }

  const wsSensitivity = (options as Record<string, unknown>).htmlWhitespaceSensitivity as
    | string
    | undefined;

  // Reference lookup is by local tag name (node.name in Prettier).
  // Our equivalent is tagName (already lowercase).
  const lowerName = node.tagName;

  switch (wsSensitivity) {
    case "strict":
      return "inline";
    case "ignore":
      return "block";
    default: // "css"
      if (
        node.kind === NodeKind.Element &&
        (!node.namespace ||
          hasParent(
            node,
            (parent) =>
              parent.kind === NodeKind.Element &&
              parent.namespace === "svg" &&
              parent.tagName === "foreignobject",
          ) ||
          isUnknownNamespace(node)) &&
        lowerName in CSS_DISPLAY_TAGS
      ) {
        return CSS_DISPLAY_TAGS[lowerName];
      }
  }

  // Directive blocks behave like block elements for layout.
  if (node.kind === NodeKind.DirectiveBlock) return "block";

  // Root is block.
  if (node.kind === NodeKind.Root) return "block";

  return CSS_DISPLAY_DEFAULT;
}

function getCssWhiteSpace(node: WrappedNode): string {
  if (node.kind === NodeKind.Element && (!node.namespace || isUnknownNamespace(node))) {
    const lowerName = node.tagName;
    if (lowerName in CSS_WHITE_SPACE_TAGS) {
      return CSS_WHITE_SPACE_TAGS[lowerName];
    }
  }
  return CSS_WHITE_SPACE_DEFAULT;
}

function isPreLikeNode(node: WrappedNode): boolean {
  return getCssWhiteSpace(node).startsWith("pre");
}

function isFrontMatterNode(node: WrappedNode): boolean {
  return hasFrontMatterMark(node);
}

/**
 * Infer implicit namespace for elements without an explicit prefix.
 * Mirrors HTML/SVG tree behavior used by Prettier's HTML parser.
 */
function addImplicitNamespaces(node: WrappedNode, inheritedNamespace = ""): void {
  let childNamespace = inheritedNamespace;

  if (node.kind === NodeKind.Element) {
    if (!node.fullName.includes(":")) {
      if (node.tagName === "svg") {
        node.namespace = "svg";
      } else if (
        inheritedNamespace === "svg" &&
        node.parent?.kind === NodeKind.Element &&
        node.parent.tagName !== "foreignobject"
      ) {
        node.namespace = "svg";
      } else if (
        inheritedNamespace === "svg" &&
        node.parent?.kind === NodeKind.Element &&
        node.parent.tagName === "foreignobject"
      ) {
        node.namespace = "";
      }
    }

    childNamespace = node.namespace;
    if (node.namespace === "svg" && node.tagName === "foreignobject") {
      childNamespace = "";
    }
  }

  for (const child of node.children) {
    addImplicitNamespaces(child, childNamespace);
  }
}

const isTextLikeNode = isWhitespaceTextLikeNode;

/**
 * Stage 0: Remove ignorable first line feed from pre-like elements.
 * Per HTML spec, a leading newline in <pre>, <textarea>, and <listing>
 * is ignored by browsers. Prettier strips it during preprocessing so that
 * the formatter can re-insert it consistently via lineBeforeChildren.
 * Ported from Prettier's print-preprocess.js removeIgnorableFirstLf.
 */
const IGNORE_FIRST_LF_TAGS = new Set(["pre", "textarea", "listing"]);

function removeIgnorableFirstLf(node: WrappedNode): void {
  if (
    node.kind === NodeKind.Element &&
    IGNORE_FIRST_LF_TAGS.has(node.fullName.toLowerCase()) &&
    node.children.length > 0 &&
    node.children[0].kind === NodeKind.Text &&
    node.children[0].rawText[0] === "\n"
  ) {
    const text = node.children[0];
    if (text.rawText.length === 1) {
      // The entire text node was just "\n" - remove it.
      node.children.splice(0, 1);
    } else {
      // Strip the leading "\n" from the text content.
      text.rawText = text.rawText.slice(1);
      text.start += 1;
    }
  }

  for (const child of node.children) {
    removeIgnorableFirstLf(child);
  }
}

function addCssDisplay(node: WrappedNode, options: Options): void {
  node.cssDisplay = getCssDisplay(node, options);
  for (const child of node.children) {
    addCssDisplay(child, options);
  }
}

function addWhitespaceFlags(node: WrappedNode, options: Options): void {
  node.isWhitespaceSensitive =
    isScriptLikeTag(node, options) || isEchoLike(node) || isPreLikeNode(node);
  node.isIndentationSensitive = isPreLikeNode(node);
  for (const child of node.children) {
    addWhitespaceFlags(child, options);
  }
}

function addSiblings(node: WrappedNode): void {
  for (let i = 0; i < node.children.length; i++) {
    node.children[i].prev = i > 0 ? node.children[i - 1] : null;
    node.children[i].next = i < node.children.length - 1 ? node.children[i + 1] : null;
  }
  for (const child of node.children) {
    addSiblings(child);
  }
}

function extractWhitespace(node: WrappedNode, lineOffsets: number[]): void {
  const children = node.children;

  if (children.length === 0) {
    return;
  }

  // Check for dangling: all children are whitespace-only text.
  if (
    children.length === 1 &&
    children[0].kind === NodeKind.Text &&
    htmlTrim(children[0].rawText).length === 0
  ) {
    node.hasDanglingSpaces = children[0].rawText.length > 0;
    children.splice(0, 1);
    return;
  }

  // If the node is whitespace-sensitive, don't strip anything.
  if (node.isWhitespaceSensitive) return;

  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    if (child.kind !== NodeKind.Text) continue;

    const text = child.rawText;
    const trimmed = htmlTrim(text);

    if (!trimmed) {
      // Pure whitespace text node - transfer space info to siblings and remove.
      const prev = children[i - 1];
      const next = children[i + 1];
      if (prev) prev.hasTrailingSpaces = true;
      if (next) next.hasLeadingSpaces = true;
      if (!prev && !next) {
        // Only child and is whitespace - becomes dangling.
        node.hasDanglingSpaces = true;
      }
      children.splice(i, 1);
      continue;
    }

    // Has content - check leading/trailing whitespace.
    const leadingLen = text.length - htmlTrimStart(text).length;
    const trailingLen = text.length - htmlTrimEnd(text).length;

    if (leadingLen > 0) {
      child.hasLeadingSpaces = true;
      const prev = children[i - 1];
      if (prev) prev.hasTrailingSpaces = true;
    }
    if (trailingLen > 0) {
      child.hasTrailingSpaces = true;
      const next = children[i + 1];
      if (next) next.hasLeadingSpaces = true;
    }

    // Trim the raw text so the printer gets clean content.
    child.rawText = trimmed;

    // Update line numbers to reflect the trimmed content's actual position
    // in the source. Without this, startLine/endLine span the full token
    // including leading/trailing whitespace, which breaks hasSurroundingLineBreak.
    const contentStart = child.start + leadingLen;
    const contentEnd = child.end - trailingLen;
    child.startLine = getLine(contentStart, lineOffsets);
    child.endLine = getLine(contentEnd > 0 ? contentEnd - 1 : 0, lineOffsets);
  }

  // Recurse.
  for (const child of children) {
    extractWhitespace(child, lineOffsets);
  }
}

function addSpaceSensitivity(node: WrappedNode, options: Options): void {
  const children = node.children;

  if (children.length === 0) {
    node.isDanglingSpaceSensitive = isDanglingSpaceSensitive(node);
    return;
  }

  // First pass: calculate each child's sensitivity independently.
  for (const child of children) {
    child.isLeadingSpaceSensitive = isLeadingSpaceSensitive(child, options);
    child.isTrailingSpaceSensitive = isTrailingSpaceSensitive(child, options);
  }

  // Second pass: reconcile between siblings.
  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    if (i > 0) {
      // Leading space only matters if prev sibling's trailing space also matters.
      child.isLeadingSpaceSensitive =
        children[i - 1].isTrailingSpaceSensitive && child.isLeadingSpaceSensitive;
    }

    if (i < children.length - 1) {
      // Trailing space only matters if next sibling's leading space also matters.
      child.isTrailingSpaceSensitive =
        children[i + 1].isLeadingSpaceSensitive && child.isTrailingSpaceSensitive;
    }
  }

  // Recurse.
  for (const child of children) {
    addSpaceSensitivity(child, options);
  }
}

function isLeadingSpaceSensitive(node: WrappedNode, options: Options): boolean {
  const result = _isLeadingSpaceSensitive(node, options);

  // Special case: first child of elements that ignore first LF (pre, textarea, listing).
  // After removeIgnorableFirstLf strips the leading "\n", the first child should NOT
  // borrow the parent's ">" marker. Only interpolation nodes are exempt.
  // Reference: prettier-main/src/language-html/utilities/index.js:142-148
  if (
    result &&
    !node.prev &&
    node.parent &&
    IGNORE_FIRST_LF_TAGS.has(node.parent.fullName.toLowerCase())
  ) {
    return isEchoLike(node);
  }

  return result;
}

function _isLeadingSpaceSensitive(node: WrappedNode, options: Options): boolean {
  if (isFrontMatterNode(node)) return false;

  // DirectiveBlock (angularControlFlowBlock equivalent) is never space-sensitive.
  if (node.kind === NodeKind.DirectiveBlock) return false;

  const parent = node.parent;
  const prev = node.prev;

  // Text-like or interpolation adjacent to text-like/interpolation always preserves space.
  if (
    (isTextLikeNode(node) || isEchoLike(node)) &&
    prev &&
    (isTextLikeNode(prev) || isEchoLike(prev))
  ) {
    return true;
  }

  if (!parent || parent.cssDisplay === "none") return false;
  if (isPreLikeNode(parent)) return true;

  // First child.
  if (!prev) {
    if (
      parent.kind === NodeKind.Root ||
      (isPreLikeNode(node) && parent) ||
      isScriptLikeTag(parent, options) ||
      isVueCustomBlock(parent, options) ||
      !isFirstChildLeadingSpaceSensitiveCssDisplay(parent.cssDisplay)
    ) {
      return false;
    }
    return true;
  }

  // Not first child - check previous sibling's display.
  if (!isNextLeadingSpaceSensitiveCssDisplay(prev.cssDisplay)) {
    return false;
  }

  return true;
}

function isTrailingSpaceSensitive(node: WrappedNode, options: Options): boolean {
  if (isFrontMatterNode(node)) return false;

  // DirectiveBlock (angularControlFlowBlock equivalent) is never space-sensitive.
  if (node.kind === NodeKind.DirectiveBlock) return false;

  const parent = node.parent;
  const next = node.next;

  // Text-like or interpolation adjacent to text-like/interpolation always preserves space.
  if (
    (isTextLikeNode(node) || isEchoLike(node)) &&
    next &&
    (isTextLikeNode(next) || isEchoLike(next))
  ) {
    return true;
  }

  if (!parent || parent.cssDisplay === "none") return false;
  if (isPreLikeNode(parent)) return true;

  // Last child.
  if (!next) {
    if (
      parent.kind === NodeKind.Root ||
      (isPreLikeNode(node) && parent) ||
      isScriptLikeTag(parent, options) ||
      isVueCustomBlock(parent, options) ||
      !isLastChildTrailingSpaceSensitiveCssDisplay(parent.cssDisplay)
    ) {
      return false;
    }
    return true;
  }

  // Not last child - check next sibling's display.
  if (!isPrevTrailingSpaceSensitiveCssDisplay(next.cssDisplay)) {
    return false;
  }

  return true;
}

function isDanglingSpaceSensitive(node: WrappedNode): boolean {
  return (
    !isBlockLikeCssDisplay(node.cssDisplay) &&
    node.cssDisplay !== "inline-block" &&
    !isScriptLikeTag(node)
  );
}

/**
 * Set unified isSelfClosing flag.
 * Ported from Prettier's print-preprocess.js addIsSelfClosing.
 *
 * Reference: node.isSelfClosing = !node.children ||
 *   (node.kind === "element" && (node.tagDefinition.isVoid || <self-closing spans>))
 *
 * For elements: only void elements (br, img, etc.) or self-closing slash (/>) are self-closing.
 * An element that merely lacks a closing tag (e.g. <html> inside a conditional comment)
 * is NOT self-closing - it's just unterminated.
 */
function addIsSelfClosing(node: WrappedNode): void {
  if (node.kind === NodeKind.Element) {
    node.isSelfClosing =
      // HTML void element (br, img, input, etc.)
      VOID_ELEMENTS.has(node.fullName.toLowerCase()) ||
      // Self-closing slash (stored in flat.data)
      node.flat.data === 1;
  } else {
    // Non-element nodes: self-closing if they have no children array concept.
    // In our AST all nodes have children[], so leaf-type nodes (Text, Comment,
    // Echo, etc.) with no children are self-closing.
    node.isSelfClosing = node.children.length === 0;
  }
  for (const child of node.children) {
    addIsSelfClosing(child);
  }
}

/**
 * Detect HTM component closing tags (`<//>` syntax).
 * Ported from Prettier's print-preprocess.js addHasHtmComponentClosingTag.
 */
function addHasHtmComponentClosingTag(node: WrappedNode): void {
  if (node.kind === NodeKind.Element && node.hasClosingTag) {
    // Check if closing tag source text matches HTM's `<//>`
    // We look at the end of the source from the closing tag position
    const closingStart = node.source.lastIndexOf("</", node.end);
    if (closingStart >= 0) {
      const closingText = node.source.slice(closingStart, node.end);
      node.hasHtmComponentClosingTag = /^<\s*\/\s*\/\s*>$/.test(closingText);
    }
  }
  for (const child of node.children) {
    addHasHtmComponentClosingTag(child);
  }
}

/**
 * Merge simple inline elements into adjacent text nodes.
 * Ported from Prettier's print-preprocess.js mergeSimpleElementIntoText.
 *
 * Example:
 *   before<span>_</span>after -> one text node:
 *   before<span>_</span>after
 */
function mergeSimpleElementIntoText(node: WrappedNode): void {
  const children = node.children;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    if (child.kind !== NodeKind.Element) {
      mergeSimpleElementIntoText(child);
      continue;
    }

    const prev = i > 0 ? children[i - 1] : null;
    const next = i < children.length - 1 ? children[i + 1] : null;
    const firstChild = child.children[0];

    const isSimpleElement =
      child.attrs.length === 0 &&
      child.children.length === 1 &&
      firstChild.kind === NodeKind.Text &&
      !hasHtmlWhitespaceCharacter(firstChild.rawText) &&
      !firstChild.hasLeadingSpaces &&
      !firstChild.hasTrailingSpaces &&
      child.isLeadingSpaceSensitive &&
      !child.hasLeadingSpaces &&
      child.isTrailingSpaceSensitive &&
      !child.hasTrailingSpaces &&
      prev?.kind === NodeKind.Text &&
      next?.kind === NodeKind.Text;

    if (!isSimpleElement) {
      mergeSimpleElementIntoText(child);
      continue;
    }

    prev.rawText +=
      `<${child.rawTagName}>` + firstChild.rawText + `</${child.rawTagName}>` + next.rawText;
    prev.end = next.end;
    prev.endLine = next.endLine;
    prev.isTrailingSpaceSensitive = next.isTrailingSpaceSensitive;
    prev.hasTrailingSpaces = next.hasTrailingSpaces;

    // Remove merged element and the following text node.
    children.splice(i, 2);
    i--;
  }
}

const VALIDATE_PREPROCESS_STAGES =
  typeof process !== "undefined" && process.env.FORTE_VALIDATE_PREPROCESS === "1";

export function preprocess(ast: WrappedNode, options: Options): WrappedNode {
  const lineOffsets = buildLineOffsets(ast.source);
  const stages: PreprocessStage[] = [
    {
      name: "removeIgnorableFirstLf",
      run: () => removeIgnorableFirstLf(ast),
      validateParents: true,
    },
    {
      name: "mergeIfConditionalStartEndCommentIntoElementOpeningTag",
      run: () => mergeIfConditionalStartEndCommentIntoElementOpeningTag(ast),
      validateParents: true,
    },
    {
      name: "addImplicitNamespaces",
      run: () => addImplicitNamespaces(ast),
      validateParents: true,
    },
    {
      name: "addSiblings:initial",
      run: () => addSiblings(ast),
      validateSiblings: true,
    },
    {
      name: "addCssDisplay",
      run: () => addCssDisplay(ast, options),
    },
    {
      name: "addIsSelfClosing",
      run: () => addIsSelfClosing(ast),
    },
    {
      name: "addHasHtmComponentClosingTag",
      run: () => addHasHtmComponentClosingTag(ast),
    },
    {
      name: "addWhitespaceFlags",
      run: () => addWhitespaceFlags(ast, options),
    },
    {
      name: "extractWhitespace",
      run: () => extractWhitespace(ast, lineOffsets),
      validateParents: true,
    },
    {
      name: "addSiblings:postExtractWhitespace",
      run: () => addSiblings(ast),
      validateSiblings: true,
    },
    {
      name: "addSpaceSensitivity",
      run: () => addSpaceSensitivity(ast, options),
    },
    {
      name: "mergeSimpleElementIntoText",
      run: () => mergeSimpleElementIntoText(ast),
      validateParents: true,
    },
    {
      name: "addSiblings:postMergeSimpleElementIntoText",
      run: () => addSiblings(ast),
      validateSiblings: true,
    },
    {
      name: "promoteOpeningTagChildrenToAttrs",
      run: () => promoteOpeningTagChildrenToAttrs(ast),
      validateParents: true,
    },
    {
      name: "addSiblings:postPromoteOpeningTagChildrenToAttrs",
      run: () => addSiblings(ast),
      validateSiblings: true,
    },
  ];

  executePreprocessStages(ast, stages, {
    validateStages: VALIDATE_PREPROCESS_STAGES,
  });
  return ast;
}

function isOpeningTagContextChild(parent: WrappedNode, child: WrappedNode): boolean {
  if (parent.kind !== NodeKind.Element) return false;
  if (parent.openTagEndOffset <= 0) return false;

  return (
    child.start >= parent.start &&
    child.start < parent.openTagEndOffset &&
    child.end <= parent.openTagEndOffset
  );
}

function promoteOpeningTagChildrenToAttrs(node: WrappedNode): void {
  for (const child of node.children) {
    promoteOpeningTagChildrenToAttrs(child);
  }

  if (node.kind !== NodeKind.Element) {
    return;
  }

  if (node.children.length === 0) {
    return;
  }

  const moved: WrappedNode[] = [];
  const retained: WrappedNode[] = [];

  for (const child of node.children) {
    if (isOpeningTagContextChild(node, child)) {
      // Opening-tag embedded constructs should be printed as attribute payload,
      // not as flow/content nodes with marker borrowing behavior.
      child.prev = null;
      child.next = null;
      child.isLeadingSpaceSensitive = false;
      child.isTrailingSpaceSensitive = false;
      child.hasLeadingSpaces = false;
      child.hasTrailingSpaces = false;
      moved.push(child);
    } else {
      retained.push(child);
    }
  }

  if (moved.length === 0) {
    return;
  }

  node.children = retained;
  node.attrs = [...node.attrs, ...moved].sort((a, b) =>
    a.start === b.start ? a.end - b.end : a.start - b.start,
  );
}

function mergeIfConditionalStartEndCommentIntoElementOpeningTag(node: WrappedNode): void {
  if (node.children.length === 0) {
    return;
  }

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];

    if (child.kind !== NodeKind.Element) {
      mergeIfConditionalStartEndCommentIntoElementOpeningTag(child);
      continue;
    }

    const prev = i > 0 ? node.children[i - 1] : null;
    const firstChild = child.children[0];
    const condition = prev ? parseIeConditionalStartComment(prev) : null;

    const canMerge =
      !!condition &&
      prev !== null &&
      prev.end === child.start &&
      !!firstChild &&
      firstChild.kind === NodeKind.Comment &&
      firstChild.start === child.openTagEndOffset &&
      isIeConditionalEndComment(firstChild);

    if (!canMerge) {
      mergeIfConditionalStartEndCommentIntoElementOpeningTag(child);
      continue;
    }

    child.condition = condition;
    child.start = prev.start;
    child.startLine = prev.startLine;
    child.openTagEndOffset = firstChild.end;

    node.children.splice(i - 1, 1);
    i--;
    child.children.splice(0, 1);

    mergeIfConditionalStartEndCommentIntoElementOpeningTag(child);
  }
}

function parseCommentValue(node: WrappedNode): string | null {
  if (node.kind !== NodeKind.Comment) return null;
  const match = node.rawText.match(/^<!--([\s\S]*?)-->$/);
  return match ? match[1] : null;
}

function parseIeConditionalStartComment(node: WrappedNode): string | null {
  const value = parseCommentValue(node);
  if (!value) return null;
  const match = value.match(/^\[if([^\]]*)\]><!$/s);
  if (!match) return null;
  return match[1].trim().replace(/\s+/g, " ");
}

function isIeConditionalEndComment(node: WrappedNode): boolean {
  const value = parseCommentValue(node);
  return !!value && /^<!\s*\[endif\]$/s.test(value);
}
