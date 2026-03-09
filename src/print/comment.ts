import type { Doc, Options } from "prettier";
import type { WrappedNode } from "../types.js";
import { fullText } from "./utils.js";
import { isIeConditionalStartComment } from "./utils.js";
import {
  printOpeningTagPrefix,
  printClosingTagSuffix,
  printOpeningTagStart,
  printClosingTagEnd,
} from "./tag.js";
import { replaceEndOfLine } from "./doc-utils.js";

/**
 * Print a comment node.
 * Ported from Prettier's printer-html.js comment case.
 * Wraps in replaceEndOfLine to normalize multi-line comments.
 */
export function printComment(node: WrappedNode, options: Options): Doc {
  if (isIeConditionalStartComment(node)) {
    return [printOpeningTagStart(node, options), printClosingTagEnd(node, options)];
  }

  return [
    printOpeningTagPrefix(node, options),
    replaceEndOfLine(fullText(node)),
    printClosingTagSuffix(node, options),
  ];
}

export function printBladeComment(node: WrappedNode): Doc {
  return fullText(node);
}
