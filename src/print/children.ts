import type { AstPath, Doc, Options } from "prettier";
import { doc } from "prettier";
import type { WrappedNode } from "../types.js";
import { NodeKind } from "../tree/types.js";
import { isTextLikeNode, isEchoLike } from "../node-predicates.js";
import {
  hasPrettierIgnore,
  getPrettierIgnoreMode,
  forceBreakChildren,
  forceNextEmptyLine,
  preferHardlineAsLeadingSpaces,
} from "./utils.js";
import {
  needsToBorrowNextOpeningTagStartMarker,
  needsToBorrowPrevClosingTagEndMarker,
  needsToBorrowParentClosingTagStartMarker,
  printOpeningTagPrefix,
  printOpeningTagStartMarker,
  printClosingTagSuffix,
  printClosingTagEndMarker,
} from "./tag.js";
import { htmlTrimEnd, htmlTrimStart, replaceEndOfLine } from "./doc-utils.js";
import { ifBreakChain } from "./if-break-chain.js";

const { breakParent, group, hardline, softline, line, dedentToRoot } = doc.builders;

/**
 * Get the end location for a node, accounting for unclosed elements
 * whose end is determined by their last child.
 * Ported from Prettier's print/children.js getEndLocation.
 */
function getEndLocation(node: WrappedNode): number {
  if (node.kind === NodeKind.Element && !node.hasClosingTag && node.children.length > 0) {
    return Math.max(node.end, getEndLocation(node.children[node.children.length - 1]));
  }
  return node.end;
}

/**
 * Print a child node, handling prettier-ignore by emitting raw source.
 * Ported from Prettier's print/children.js printChild
 */
function printChild(
  childPath: AstPath<WrappedNode>,
  options: Options,
  print: (path: AstPath<WrappedNode>) => Doc,
): Doc {
  const child = childPath.node;
  const ignoreMode = getPrettierIgnoreMode(child);

  if (hasPrettierIgnore(child) && ignoreMode) {
    const endLocation = getEndLocation(child);
    let preservedText = htmlTrimEnd(
      child.source.slice(
        child.start +
          (child.prev && needsToBorrowNextOpeningTagStartMarker(child.prev)
            ? printOpeningTagStartMarker(child).length
            : 0),
        endLocation -
          (child.next && needsToBorrowPrevClosingTagEndMarker(child.next)
            ? printClosingTagEndMarker(child, options).length
            : 0),
      ),
    );

    // Our text node boundaries include leading indentation that Prettier's
    // parser doesn't attach to ignored text nodes. Remove it to avoid
    // double-indenting when surrounding docs already provide spacing.
    if (child.kind === NodeKind.Text) {
      preservedText = htmlTrimStart(preservedText);
    }

    return [
      printOpeningTagPrefix(child, options),
      ignoreMode === "range"
        ? dedentToRoot(replaceEndOfLine(preservedText))
        : replaceEndOfLine(preservedText),
      printClosingTagSuffix(child, options),
    ];
  }

  return print(childPath);
}

/**
 * Determine line break between two adjacent content nodes.
 * Ported from Prettier's print/children.js printBetweenLine.
 */
function printBetweenLine(prev: WrappedNode, next: WrappedNode): Doc {
  // Escaped blade prefixes (e.g. @@, @{{, @{!!) must stay attached to
  // the following construct/text to preserve semantics.
  if (prev.kind === NodeKind.NonOutput || next.kind === NodeKind.NonOutput) {
    return "";
  }

  // Case 1: Both text-like - respect trailing space sensitivity.
  if (isTextLikeNode(prev) && isTextLikeNode(next)) {
    if (prev.isTrailingSpaceSensitive) {
      if (prev.hasTrailingSpaces) {
        if (isEchoLike(prev) || isEchoLike(next)) {
          return " ";
        }
        return preferHardlineAsLeadingSpaces(next) ? hardline : line;
      }
      return "";
    }
    if (isEchoLike(prev) || isEchoLike(next)) {
      return "";
    }
    return preferHardlineAsLeadingSpaces(next) ? hardline : softline;
  }

  // Case 2: Marker borrowing - tags glue together.
  if (
    (needsToBorrowNextOpeningTagStartMarker(prev) &&
      (hasPrettierIgnore(next) ||
        next.children.length > 0 ||
        next.isSelfClosing ||
        (next.kind === NodeKind.Element && next.attrs.length > 0))) ||
    (prev.kind === NodeKind.Element &&
      prev.isSelfClosing &&
      needsToBorrowPrevClosingTagEndMarker(next))
  ) {
    return "";
  }

  // Case 3: Block-like or hardline-preferred - always hardline.
  if (
    !next.isLeadingSpaceSensitive ||
    preferHardlineAsLeadingSpaces(next) ||
    (needsToBorrowPrevClosingTagEndMarker(next) &&
      prev.children.length > 0 &&
      needsToBorrowParentClosingTagStartMarker(prev.children[prev.children.length - 1]) &&
      prev.children[prev.children.length - 1].children.length > 0 &&
      needsToBorrowParentClosingTagStartMarker(
        prev.children[prev.children.length - 1].children[
          prev.children[prev.children.length - 1].children.length - 1
        ],
      ))
  ) {
    return hardline;
  }

  // Case 4: Has leading spaces - breakable space.
  if (next.hasLeadingSpaces) {
    return line;
  }

  // Default: softline.
  return softline;
}

export function printChildren(
  path: AstPath<WrappedNode>,
  print: (path: AstPath<WrappedNode>) => Doc,
  options: Options,
): Doc[] {
  const node = path.node;

  // Force-break mode: certain elements (ul, ol, table, etc.) always break.
  if (forceBreakChildren(node)) {
    return [
      breakParent,
      ...path.map((childPath) => {
        const childNode = childPath.node;
        const prevBetweenLine = !childNode.prev ? "" : printBetweenLine(childNode.prev, childNode);
        return [
          !prevBetweenLine
            ? ""
            : [prevBetweenLine, forceNextEmptyLine(childNode.prev!) ? hardline : ""],
          printChild(childPath, options, print),
        ];
      }, "children"),
    ];
  }

  // Normal mode: use group IDs for proper inline element formatting.
  const needsGroupIds = node.children.some((child) => !isTextLikeNode(child));
  const groupIds = needsGroupIds ? node.children.map(() => Symbol("")) : [];

  return path.map((childPath, childIndex) => {
    const childNode = childPath.node;

    // Text-like nodes: simpler handling - no group wrapping needed.
    if (isTextLikeNode(childNode)) {
      if (childNode.prev && isTextLikeNode(childNode.prev)) {
        const prevBetweenLine = printBetweenLine(childNode.prev, childNode);
        if (prevBetweenLine) {
          if (forceNextEmptyLine(childNode.prev)) {
            return [hardline, hardline, printChild(childPath, options, print)];
          }
          return [prevBetweenLine, printChild(childPath, options, print)];
        }
      }
      return printChild(childPath, options, print);
    }

    // Non-text nodes: wrap in groups with leading/trailing parts.
    const prevParts: Doc[] = [];
    const leadingParts: Doc[] = [];
    const trailingParts: Doc[] = [];
    const nextParts: Doc[] = [];

    const prevBetweenLine = childNode.prev ? printBetweenLine(childNode.prev, childNode) : "";

    const nextBetweenLine = childNode.next ? printBetweenLine(childNode, childNode.next) : "";

    if (prevBetweenLine) {
      if (forceNextEmptyLine(childNode.prev!)) {
        prevParts.push(hardline, hardline);
      } else if (prevBetweenLine === hardline) {
        prevParts.push(hardline);
      } else if (isTextLikeNode(childNode.prev!)) {
        leadingParts.push(prevBetweenLine);
      } else {
        leadingParts.push(ifBreakChain(softline, [groupIds[childIndex - 1]]));
      }
    }

    if (nextBetweenLine) {
      if (forceNextEmptyLine(childNode)) {
        if (isTextLikeNode(childNode.next!)) {
          nextParts.push(hardline, hardline);
        }
      } else if (nextBetweenLine === hardline) {
        if (isTextLikeNode(childNode.next!)) {
          nextParts.push(hardline);
        }
      } else {
        trailingParts.push(nextBetweenLine);
      }
    }

    return [
      ...prevParts,
      group([
        ...leadingParts,
        group([printChild(childPath, options, print), ...trailingParts], {
          id: groupIds[childIndex],
        }),
      ]),
      ...nextParts,
    ];
  }, "children");
}
