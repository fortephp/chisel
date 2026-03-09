import type { Doc, Options } from "prettier";
import { doc } from "prettier";
import type { WrappedNode } from "../types.js";
import { isEchoLike } from "../node-predicates.js";
import { dedentString, htmlTrimPreserveIndentation } from "./utils.js";
import { printOpeningTagPrefix, printClosingTagSuffix } from "./tag.js";
import { replaceEndOfLine } from "./doc-utils.js";

const { line, hardline, fill, join } = doc.builders;

/**
 * Print a text node.
 * Ported from Prettier's printer-html.js case "text" +
 * utilities/index.js getTextValueParts.
 *
 * The prefix/suffix (for marker borrowing) are ALWAYS included,
 * even for whitespace-sensitive parents. The whitespace handling
 * inside the text varies by parent sensitivity.
 */
export function printText(node: WrappedNode, options?: Options): Doc {
  const text = node.rawText;

  // Interpolation parent (Echo-like): replace trailing newline with hardline.
  if (node.parent && isEchoLike(node.parent)) {
    const trailingNewlineRegex = /\n[^\S\n]*$/;
    const hasTrailingNewline = trailingNewlineRegex.test(text);
    const value = hasTrailingNewline ? text.replace(trailingNewlineRegex, "") : text;
    return [replaceEndOfLine(value), hasTrailingNewline ? hardline : ""];
  }

  const prefix = printOpeningTagPrefix(node);
  const suffix = printClosingTagSuffix(node, options);

  // Three-way branch from getTextValueParts:
  const printed = getTextValueParts(node);

  // Attach prefix to first content part, suffix to last.
  // Following Prettier's pop/push pattern so single-word case works too.
  if (Array.isArray(printed) && printed.length > 0) {
    printed[0] = [prefix, printed[0]];
    printed.push([printed.pop()!, suffix]);
    return fill(printed);
  }

  return [prefix, printed, suffix];
}

/**
 * Three-way text value splitting.
 * Ported from Prettier's utilities/index.js getTextValueParts.
 */
function getTextValueParts(node: WrappedNode): Doc[] {
  const value = node.rawText;

  if (node.parent?.isWhitespaceSensitive) {
    if (node.parent.isIndentationSensitive) {
      // Branch 1: WS-sensitive + indent-sensitive -> literalline
      return replaceEndOfLine(value);
    }
    // Branch 2: WS-sensitive + NOT indent-sensitive -> dedent + hardline
    return replaceEndOfLine(dedentString(htmlTrimPreserveIndentation(value)), hardline);
  }

  // Branch 3: Normal -> split on whitespace, join with line
  return join(line, value.split(/[\t\n\f\r ]+/)) as Doc[];
}
