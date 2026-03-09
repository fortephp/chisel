import type { Doc, Options } from "prettier";
import type { WrappedNode } from "../types.js";
import { printOpeningTagPrefix, printClosingTagSuffix } from "./tag.js";
import { formatDoctype } from "./doctype-utils.js";

/**
 * Print a doctype node.
 * Simple HTML5 doctype (`<!DOCTYPE html>`) is lowercased.
 * Complex doctypes (PUBLIC/SYSTEM) preserve uppercase `<!DOCTYPE`.
 */
export function printDoctype(node: WrappedNode, options: Options): Doc {
  return [
    printOpeningTagPrefix(node, options),
    formatDoctype(node.rawText, options),
    printClosingTagSuffix(node, options),
  ];
}
