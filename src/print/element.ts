import type { AstPath, Doc, Options } from "prettier";
import { doc } from "prettier";
import type { WrappedNode } from "../types.js";
import { NodeKind } from "../tree/types.js";
import { TokenType } from "../lexer/types.js";
import { isEchoLike, isScriptLikeTag, isVueCustomBlock } from "../node-predicates.js";
import { shouldPreserveContent, forceBreakContent } from "./utils.js";
import {
  shouldInsertOptionalClosingTags,
  shouldKeepHeadAndBodyAtRoot,
  shouldPreserveInlineIntentElement,
} from "./blade-options.js";
import {
  printOpeningTag,
  printClosingTag,
  printOpeningTagPrefix,
  printClosingTagSuffix,
  printOpeningTagEndMarker,
  printClosingTagStartMarker,
  printClosingTagEndMarker,
  needsToBorrowPrevClosingTagEndMarker,
  needsToBorrowLastChildClosingTagEndMarker,
  needsToBorrowParentOpeningTagEndMarker,
  needsToBorrowParentClosingTagStartMarker,
} from "./tag.js";
import { printChildren } from "./children.js";
import { replaceEndOfLine } from "./doc-utils.js";

const {
  group,
  indent,
  indentIfBreak,
  ifBreak,
  breakParent,
  dedentToRoot,
  softline,
  line,
  hardline,
} = doc.builders;

export function printElement(
  path: AstPath<WrappedNode>,
  options: Options,
  print: (path: AstPath<WrappedNode>) => Doc,
): Doc {
  const node = path.node;
  if (shouldPreserveMalformedOpeningTag(node, options)) {
    return printMalformedOpeningTag(node);
  }

  const forceInlineIntentLayout = shouldKeepInlineIntentLayout(node, options);
  const forceMultilineSvgChildren = shouldForceMultilineSvgChildren(node);
  const keepHeadBodyAtRoot = shouldKeepHtmlHeadBodyAtRoot(node, options);

  // Preserve content verbatim (e.g. <pre> with non-text children).
  if (shouldPreserveContent(node, options)) {
    return [
      printOpeningTagPrefix(node, options),
      group(printOpeningTag(path, options, print)),
      replaceEndOfLine(getNodeContent(node, options)),
      ...printClosingTag(node, options),
      printClosingTagSuffix(node, options),
    ];
  }

  /**
   * Hug content: single interpolation child without surrounding spaces.
   * Indent only when the opening tag attributes break.
   *
   *     <div>{{ interpolation }}</div>
   *
   * exception: break if the opening tag breaks
   *
   *     <div
   *       long
   *     >{{
   *       interpolation
   *     }}</div>
   */
  const shouldHugContent =
    node.children.length === 1 &&
    isEchoLike(node.children[0]) &&
    node.children[0].isLeadingSpaceSensitive &&
    !node.children[0].hasLeadingSpaces &&
    node.children[0].isTrailingSpaceSensitive &&
    !node.children[0].hasTrailingSpaces;

  const attrGroupId = Symbol("element-attr-group-id");

  const printTag = (content: Doc): Doc =>
    group([
      group(printOpeningTag(path, options, print), { id: attrGroupId }),
      content,
      printClosingTag(node, options),
    ]);

  const printChildrenDoc = (childrenDoc: Doc): Doc => {
    if (forceInlineIntentLayout) {
      return flattenInlineIntentChildren(childrenDoc);
    }
    if (keepHeadBodyAtRoot) {
      return childrenDoc;
    }
    if (shouldHugContent) {
      return indentIfBreak(childrenDoc, { groupId: attrGroupId });
    }
    if (
      (isScriptLikeTag(node, options) || isVueCustomBlock(node, options)) &&
      node.parent?.kind === NodeKind.Root &&
      (options as Record<string, unknown>).parser === "vue" &&
      !(options as Record<string, unknown>).vueIndentScriptAndStyle
    ) {
      return childrenDoc;
    }
    return indent(childrenDoc);
  };

  const printLineBeforeChildren = (): Doc => {
    const firstChild = node.children[0];
    if (forceInlineIntentLayout) {
      return "";
    }
    if (forceMultilineSvgChildren) {
      return hardline;
    }
    if (shouldHugContent) {
      return ifBreak(softline, "", { groupId: attrGroupId });
    }
    if (firstChild.hasLeadingSpaces && firstChild.isLeadingSpaceSensitive) {
      return line;
    }
    if (
      firstChild.kind === NodeKind.Text &&
      node.isWhitespaceSensitive &&
      node.isIndentationSensitive
    ) {
      return dedentToRoot(softline);
    }
    return softline;
  };

  const printLineAfterChildren = (): Doc => {
    const lastChild = node.children[node.children.length - 1];
    if (forceInlineIntentLayout) {
      return "";
    }
    if (forceMultilineSvgChildren) {
      return hardline;
    }
    if (!node.hasClosingTag && !node.isSelfClosing && !shouldInsertOptionalClosingTags(options)) {
      return "";
    }

    if (isRecoveryUnclosedElementWithClosingText(node)) {
      return "";
    }

    const needsToBorrow = node.next
      ? needsToBorrowPrevClosingTagEndMarker(node.next)
      : needsToBorrowLastChildClosingTagEndMarker(node.parent!);

    if (needsToBorrow) {
      if (lastChild.hasTrailingSpaces && lastChild.isTrailingSpaceSensitive) {
        return " ";
      }
      return "";
    }

    if (shouldHugContent) {
      return ifBreak(softline, "", { groupId: attrGroupId });
    }

    if (lastChild.hasTrailingSpaces && lastChild.isTrailingSpaceSensitive) {
      return line;
    }

    // For pre-like elements or comment last children whose content ends with
    // a newline at the expected indentation, suppress the extra softline.
    const lastChildTrailingValue =
      lastChild.kind === NodeKind.Comment ? getCommentValue(lastChild.rawText) : lastChild.rawText;
    if (
      (lastChild.kind === NodeKind.Comment ||
        lastChild.kind === NodeKind.BogusComment ||
        (lastChild.kind === NodeKind.Text &&
          node.isWhitespaceSensitive &&
          node.isIndentationSensitive)) &&
      endsWithIndentedNewline(
        lastChildTrailingValue,
        (options.tabWidth ?? 2) * countAncestors(path),
      )
    ) {
      return "";
    }

    return softline;
  };

  // Empty element.
  if (node.children.length === 0) {
    const shouldPrintDanglingSpaceLine =
      node.hasDanglingSpaces &&
      node.isDanglingSpaceSensitive &&
      !shouldSuppressDanglingSpaceAtEof(node);
    return printTag(shouldPrintDanglingSpaceLine ? line : "");
  }

  return printTag([
    forceBreakContent(node) ? breakParent : "",
    printChildrenDoc([printLineBeforeChildren(), printChildren(path, print, options)]),
    printLineAfterChildren(),
  ]);
}

function shouldPreserveMalformedOpeningTag(node: WrappedNode, options: Options): boolean {
  if (
    node.kind !== NodeKind.Element ||
    node.openTagEndOffset > node.start ||
    node.hasClosingTag ||
    node.isSelfClosing
  ) {
    return false;
  }

  if (isRecoverableUnterminatedOpeningEcho(node)) {
    return false;
  }

  if (!shouldInsertOptionalClosingTags(options)) {
    return true;
  }

  return hasComplexMalformedOpeningSyntax(node);
}

function isRecoverableUnterminatedOpeningEcho(node: WrappedNode): boolean {
  if (node.kind !== NodeKind.Element) {
    return false;
  }

  if (node.attrs.length > 0 || node.children.length !== 1) {
    return false;
  }

  const onlyChild = node.children[0];
  return (
    (onlyChild.kind === NodeKind.Echo ||
      onlyChild.kind === NodeKind.RawEcho ||
      onlyChild.kind === NodeKind.TripleEcho) &&
    onlyChild.start >= node.start &&
    onlyChild.end === node.end
  );
}

function hasComplexMalformedOpeningSyntax(node: WrappedNode): boolean {
  const tokens = node.buildResult.tokens;
  const start = node.flat.tokenStart;
  const end = start + node.flat.tokenCount;

  for (let i = start; i < end; i++) {
    switch (tokens[i].type) {
      case TokenType.TsxGenericType:
      case TokenType.Directive:
      case TokenType.DirectiveArgs:
      case TokenType.EchoStart:
      case TokenType.RawEchoStart:
      case TokenType.TripleEchoStart:
      case TokenType.PhpTagStart:
      case TokenType.PhpBlockStart:
        return true;
      default:
        break;
    }
  }

  return (
    node.attrs.length > 1 ||
    node.children.length > 0 ||
    node.source.slice(node.start + 1, node.end).includes("<")
  );
}

function printMalformedOpeningTag(node: WrappedNode): string {
  return node.source.slice(node.start, node.end).replace(/\s+$/u, "");
}

function flattenInlineIntentChildren(childrenDoc: Doc): Doc {
  return doc.utils.mapDoc(childrenDoc, (current) => {
    if (current === softline) {
      return "";
    }
    if (current === line || current === hardline) {
      return " ";
    }
    if (current === breakParent) {
      return "";
    }
    return current;
  }) as Doc;
}

function isRecoveryUnclosedElementWithClosingText(node: WrappedNode): boolean {
  return (
    node.kind === NodeKind.Element &&
    !node.hasClosingTag &&
    !node.isSelfClosing &&
    node.rawTagName.length > 0 &&
    node.openTagEndOffset > 0 &&
    node.source
      .slice(node.openTagEndOffset, node.end)
      .toLowerCase()
      .includes(`</${node.rawTagName.toLowerCase()}`)
  );
}

function shouldKeepInlineIntentLayout(node: WrappedNode, options: Options): boolean {
  if (node.kind !== NodeKind.Element) return false;
  if (node.children.length === 0) return false;
  if (!node.hasClosingTag) return false;
  if (node.openTagEndOffset <= node.start) return false;
  if (node.closingTagStartOffset <= node.openTagEndOffset) return false;
  if (!shouldPreserveInlineIntentElement(options, node.tagName, node.namespace)) {
    return false;
  }
  if (containsBlockDirectiveDescendant(node)) {
    return false;
  }

  // Mixed inline/multiline icon trees are a common source of one-pass drift.
  // For svg roots with multiple element children, prefer stable multiline
  // layout over aggressive single-line preservation.
  if (node.tagName === "svg") {
    let elementChildCount = 0;
    for (const child of node.children) {
      if (child.kind === NodeKind.Element) {
        elementChildCount++;
        if (elementChildCount > 1) {
          return false;
        }
      }
    }
  }

  return hasInlineIntentShellSource(node);
}

function shouldSuppressDanglingSpaceAtEof(node: WrappedNode): boolean {
  if (node.kind !== NodeKind.Element) return false;
  if (node.end !== node.source.length) return false;
  return !node.hasClosingTag && !node.isSelfClosing;
}

function hasInlineIntentShellSource(node: WrappedNode): boolean {
  const source = node.source.slice(node.start, node.end);
  if (!/[\r\n]/u.test(source)) {
    return true;
  }

  const firstChild = node.children[0];
  const lastChild = node.children[node.children.length - 1];
  if (!firstChild || !lastChild) {
    return false;
  }

  const openingGap = node.source.slice(node.openTagEndOffset, firstChild.start);
  if (/[\r\n]/u.test(openingGap)) {
    return false;
  }

  const closingGap = node.source.slice(lastChild.end, node.closingTagStartOffset);
  return !/[\r\n]/u.test(closingGap);
}

function shouldForceMultilineSvgChildren(node: WrappedNode): boolean {
  if (node.kind !== NodeKind.Element) return false;
  if (node.tagName === "clippath") {
    for (const child of node.children) {
      if (child.kind === NodeKind.Element) {
        return true;
      }
    }
    return false;
  }

  if (node.tagName !== "svg") return false;

  let elementChildCount = 0;
  for (const child of node.children) {
    if (child.kind === NodeKind.Element) {
      elementChildCount++;
      if (elementChildCount > 1) {
        return true;
      }
    }
  }
  return false;
}

function containsBlockDirectiveDescendant(node: WrappedNode): boolean {
  const stack = [...node.children];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (
      current.kind === NodeKind.DirectiveBlock ||
      (current.kind === NodeKind.Directive && current.children.length > 0)
    ) {
      return true;
    }
    for (let i = 0; i < current.children.length; i++) {
      stack.push(current.children[i]);
    }
  }
  return false;
}

function shouldKeepHtmlHeadBodyAtRoot(node: WrappedNode, options: Options): boolean {
  if (!shouldKeepHeadAndBodyAtRoot(options)) return false;
  if (node.kind !== NodeKind.Element) return false;
  if (node.namespace.length > 0) return false;
  if (node.tagName !== "html") return false;
  if (node.parent?.kind !== NodeKind.Root) return false;

  const directElementChildren = node.children.filter(
    (child): child is WrappedNode => child.kind === NodeKind.Element,
  );
  if (directElementChildren.length === 0) return false;

  return directElementChildren.every(
    (child) =>
      child.namespace.length === 0 && (child.tagName === "head" || child.tagName === "body"),
  );
}

/**
 * Count ancestor depth, matching reference's `path.ancestors.length - 1`.
 * path.ancestors includes all ancestors; subtracting 1 gives depth from root.
 */
function countAncestors(path: AstPath<WrappedNode>): number {
  // Match Prettier HTML reference exactly: path.ancestors.length - 1.
  // When unavailable, prefer 0-depth fallback instead of parent-chain depth,
  // which over-indents this heuristic and changes line-after-children behavior.
  if ("ancestors" in path && Array.isArray(path.ancestors)) {
    return Math.max((path.ancestors as unknown[]).length - 1, 0);
  }
  return 0;
}

/**
 * Get the raw content between the opening and closing tags.
 * Ported from Prettier's get-node-content.js.
 *
 * Uses openTagEndOffset / closingTagStartOffset (equivalent to Prettier's startSourceSpan.end
 * / endSourceSpan.start) to read verbatim from the **original** source text,
 * exactly as the reference does with `options.originalText.slice(start, end)`.
 */
function getNodeContent(node: WrappedNode, options?: Options): string {
  if (!node.hasClosingTag) return "";
  if (!node.openTagEndOffset && !node.closingTagStartOffset) return "";

  let start = node.openTagEndOffset;
  if (node.children.length > 0 && needsToBorrowParentOpeningTagEndMarker(node.children[0])) {
    start -= printOpeningTagEndMarker(node).length;
  }

  let end = node.closingTagStartOffset;
  const last = node.children.length > 0 ? node.children[node.children.length - 1] : null;
  if (last && needsToBorrowParentClosingTagStartMarker(last)) {
    end += printClosingTagStartMarker(node, options).length;
  } else if (needsToBorrowLastChildClosingTagEndMarker(node)) {
    end -= printClosingTagEndMarker(last!, options).length;
  }

  return node.source.slice(start, end);
}

function getCommentValue(rawText: string): string {
  const match = rawText.match(/^<!--([\s\S]*?)-->$/);
  return match ? match[1] : rawText;
}

function endsWithIndentedNewline(value: string, indentWidth: number): boolean {
  let index = value.length - 1;
  let wsCount = 0;

  while (index >= 0) {
    const ch = value.charCodeAt(index);
    if (ch !== 32 && ch !== 9) break;
    wsCount++;
    index--;
  }

  return wsCount === indentWidth && index >= 0 && value.charCodeAt(index) === 10;
}
