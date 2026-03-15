import { SAGE_TREE_DIRECTIVES } from "./metadata.js";
import { getSageDirectivePhpFormatTemplates } from "./print.js";
import { type BladeSyntaxPlugin } from "../types.js";

export const SAGE_PLUGIN_NAME = "log1x/sage-directives";

export const sagePlugin: BladeSyntaxPlugin = {
  name: SAGE_PLUGIN_NAME,
  // The parser tokenizes directives permissively, so Sage only needs tree metadata.
  lexerDirectives: [],
  treeDirectives: SAGE_TREE_DIRECTIVES,
  verbatimStartDirectives: [],
  verbatimEndDirectives: [],
  getDirectivePhpFormatTemplates: getSageDirectivePhpFormatTemplates,
};
