import type { DirectivePhpWrapperContext } from "../lexer/directives.js";
import type { TreeDirectiveDefinition } from "../tree/directive-definitions.js";

export const DIRECTIVE_PHP_FORMAT_ARGS_PLACEHOLDER = "__BLADE_DIRECTIVE_ARGS__";

export type DirectivePhpFormattingMode = "safe" | "aggressive";

export interface DirectivePhpFormatTemplate {
  key: string;
  template: string;
}

export interface DirectivePhpFormattingContext extends DirectivePhpWrapperContext {
  mode: DirectivePhpFormattingMode;
}

export interface BladeSyntaxPlugin {
  name: string;
  lexerDirectives: readonly string[];
  treeDirectives: readonly TreeDirectiveDefinition[];
  verbatimStartDirectives: readonly string[];
  verbatimEndDirectives: readonly string[];
  getDirectivePhpFormatTemplates?(
    directiveName: string,
    context: DirectivePhpFormattingContext,
  ): readonly DirectivePhpFormatTemplate[];
}
