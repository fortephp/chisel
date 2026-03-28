import type { AstPath, Doc, Options } from "prettier";
import { doc } from "prettier";
import type { WrappedNode } from "../types.js";
import { NodeKind } from "../tree/types.js";
import { isTextLikeNode, isEchoLike } from "../node-predicates.js";
import {
  getChildPrintSegments,
  hasPrettierIgnore,
  getPrettierIgnoreMode,
  forceBreakChildren,
  forceNextEmptyLine,
  getPrintableSubtreeEnd,
  preferHardlineAsLeadingSpaces,
  type ChildPrintSegment,
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

const { breakParent, group, hardline, softline, line } = doc.builders;

function getSourceBetween(prev: WrappedNode, next: WrappedNode): string {
  if (prev.source !== next.source) {
    return "";
  }

  return prev.source.slice(prev.end, next.start);
}

function isIgnoreRangeNode(node: WrappedNode): boolean {
  return node.kind === NodeKind.IgnoreRange;
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

  if (hasPrettierIgnore(child) && ignoreMode === "single") {
    const endLocation = getPrintableSubtreeEnd(child);
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
    if (child.kind === NodeKind.Text && ignoreMode === "single") {
      preservedText = htmlTrimStart(preservedText);
    }

    return [
      printOpeningTagPrefix(child, options),
      replaceEndOfLine(preservedText),
      printClosingTagSuffix(child, options),
    ];
  }

  return print(childPath);
}

function getSourceBetweenSegments(prev: ChildPrintSegment, next: ChildPrintSegment): string {
  if (prev.first.source !== next.first.source) {
    return "";
  }

  return prev.first.source.slice(prev.sourceEnd, next.sourceStart);
}

function hasEmptyLineBetweenSegments(prev: ChildPrintSegment, next: ChildPrintSegment): boolean {
  if (!isIgnoreRangeNode(prev.last) && !isIgnoreRangeNode(next.first)) {
    return forceNextEmptyLine(prev.last);
  }

  const sourceBetween = getSourceBetweenSegments(prev, next);

  return /(?:\r\n|\r|\n)[^\S\r\n]*(?:\r\n|\r|\n)/u.test(sourceBetween);
}

function printBetweenSegments(prev: ChildPrintSegment, next: ChildPrintSegment): Doc {
  if (isIgnoreRangeNode(prev.last) || isIgnoreRangeNode(next.first)) {
    const sourceBetween = getSourceBetweenSegments(prev, next);
    if (sourceBetween.length === 0) {
      return "";
    }

    if (/(?:\r\n|\r|\n)[^\S\r\n]*(?:\r\n|\r|\n)/u.test(sourceBetween)) {
      return [hardline, hardline];
    }

    if (/[\r\n]/u.test(sourceBetween)) {
      return hardline;
    }

    return sourceBetween;
  }

  return printBetweenLine(prev.last, next.first);
}

/**
 * Determine line break between two adjacent content nodes.
 * Ported from Prettier's print/children.js printBetweenLine.
 */
function printBetweenLine(prev: WrappedNode, next: WrappedNode): Doc {
  const sourceBetween = getSourceBetween(prev, next);

  if (isIgnoreRangeNode(prev) || isIgnoreRangeNode(next)) {
    if (sourceBetween.length === 0) {
      return "";
    }
    if (/(?:\r\n|\r|\n)[^\S\r\n]*(?:\r\n|\r|\n)/u.test(sourceBetween)) {
      return [hardline, hardline];
    }
    if (/[\r\n]/u.test(sourceBetween)) {
      return hardline;
    }
    return sourceBetween;
  }

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
  const segments = getChildPrintSegments(node.children);
  const printedChildren = path.map(
    (childPath) => printChild(childPath, options, print),
    "children",
  );

  // Force-break mode: certain elements (ul, ol, table, etc.) always break.
  if (forceBreakChildren(node)) {
    return [
      breakParent,
      ...segments.map((segment, segmentIndex) => {
        const prevSegment = segmentIndex > 0 ? segments[segmentIndex - 1] : null;
        const prevBetweenLine = !prevSegment ? "" : printBetweenSegments(prevSegment, segment);
        return [
          !prevBetweenLine
            ? ""
            : [prevBetweenLine, hasEmptyLineBetweenSegments(prevSegment!, segment) ? hardline : ""],
          printedChildren[segment.startIndex],
        ];
      }),
    ];
  }

  // Normal mode: use group IDs for proper inline element formatting.
  const needsGroupIds = segments.some((segment) => !isTextLikeNode(segment.first));
  const groupIds = needsGroupIds ? segments.map(() => Symbol("")) : [];

  return segments.map((segment, childIndex) => {
    const childNode = segment.first;
    const segmentDoc = printedChildren[segment.startIndex];

    // Text-like nodes: simpler handling - no group wrapping needed.
    if (isTextLikeNode(childNode)) {
      const prevSegment = childIndex > 0 ? segments[childIndex - 1] : null;
      if (prevSegment && isTextLikeNode(prevSegment.last)) {
        const prevBetweenLine = printBetweenSegments(prevSegment, segment);
        if (prevBetweenLine) {
          if (hasEmptyLineBetweenSegments(prevSegment, segment)) {
            return [hardline, hardline, segmentDoc];
          }
          return [prevBetweenLine, segmentDoc];
        }
      }
      return segmentDoc;
    }

    // Non-text nodes: wrap in groups with leading/trailing parts.
    const prevParts: Doc[] = [];
    const leadingParts: Doc[] = [];
    const trailingParts: Doc[] = [];
    const nextParts: Doc[] = [];

    const prevSegment = childIndex > 0 ? segments[childIndex - 1] : null;
    const prevBetweenLine = prevSegment ? printBetweenSegments(prevSegment, segment) : "";

    const nextSegment = childIndex + 1 < segments.length ? segments[childIndex + 1] : null;
    const nextBetweenLine = nextSegment ? printBetweenSegments(segment, nextSegment) : "";

    if (prevBetweenLine) {
      if (hasEmptyLineBetweenSegments(prevSegment!, segment)) {
        prevParts.push(hardline, hardline);
      } else if (prevBetweenLine === hardline) {
        prevParts.push(hardline);
      } else if (prevSegment && isTextLikeNode(prevSegment.last)) {
        leadingParts.push(prevBetweenLine);
      } else {
        leadingParts.push(ifBreakChain(softline, [groupIds[childIndex - 1]]));
      }
    }

    if (nextBetweenLine) {
      if (nextSegment && hasEmptyLineBetweenSegments(segment, nextSegment)) {
        if (isTextLikeNode(nextSegment.first)) {
          nextParts.push(hardline, hardline);
        }
      } else if (nextBetweenLine === hardline) {
        if (nextSegment && isTextLikeNode(nextSegment.first)) {
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
        group([segmentDoc, ...trailingParts], {
          id: groupIds[childIndex],
        }),
      ]),
      ...nextParts,
    ];
  });
}
