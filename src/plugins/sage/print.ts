import {
  DIRECTIVE_PHP_FORMAT_ARGS_PLACEHOLDER,
  type DirectivePhpFormatTemplate,
  type DirectivePhpFormattingContext,
} from "../types.js";
import { getSageDirectiveMetadata } from "./metadata.js";

const DIRECTIVE_CALL_TEMPLATE = `<?php __b(${DIRECTIVE_PHP_FORMAT_ARGS_PLACEHOLDER});`;
const DIRECTIVE_GLOBAL_TEMPLATE = `<?php global ${DIRECTIVE_PHP_FORMAT_ARGS_PLACEHOLDER};`;
const DIRECTIVE_IF_TEMPLATE = `<?php if (${DIRECTIVE_PHP_FORMAT_ARGS_PLACEHOLDER}) {}`;
const DIRECTIVE_QUERY_TEMPLATE = `<?php $__blade_sage_query__ = new WP_Query(${DIRECTIVE_PHP_FORMAT_ARGS_PLACEHOLDER});`;
const DIRECTIVE_REPEAT_TEMPLATE = `<?php $__currentLoopData = range(1, ${DIRECTIVE_PHP_FORMAT_ARGS_PLACEHOLDER}); foreach ($__currentLoopData as $__i) : endforeach; ?>`;
const DIRECTIVE_POSTS_TEMPLATE = `<?php $__blade_sage_query__ = ${DIRECTIVE_PHP_FORMAT_ARGS_PLACEHOLDER}; if ($__blade_sage_query__) : while (true) : endwhile; endif; ?>`;

function withCallFallback(
  key: string,
  template: string,
  directiveName: string,
): readonly DirectivePhpFormatTemplate[] {
  return [
    { key, template },
    { key: `sage-call:${directiveName}`, template: DIRECTIVE_CALL_TEMPLATE },
  ];
}

const SAGE_DIRECTIVE_TEMPLATES = new Map<string, readonly DirectivePhpFormatTemplate[]>([
  ["global", withCallFallback("sage-global", DIRECTIVE_GLOBAL_TEMPLATE, "global")],
  ["posts", withCallFallback("sage-posts", DIRECTIVE_POSTS_TEMPLATE, "posts")],
  ["query", withCallFallback("sage-query", DIRECTIVE_QUERY_TEMPLATE, "query")],
  ["repeat", withCallFallback("sage-repeat", DIRECTIVE_REPEAT_TEMPLATE, "repeat")],
]);

export function getSageDirectivePhpFormatTemplates(
  directiveName: string,
  context: DirectivePhpFormattingContext,
): readonly DirectivePhpFormatTemplate[] {
  const normalizedDirectiveName = directiveName.trim().toLowerCase();

  const direct = SAGE_DIRECTIVE_TEMPLATES.get(normalizedDirectiveName);
  if (direct) return direct;

  const metadata = getSageDirectiveMetadata(normalizedDirectiveName);
  if (metadata === null || !metadata.allowsArguments) {
    return [];
  }

  if (
    metadata.isConditionDirective ||
    context.isConditionLikeDirective?.(normalizedDirectiveName)
  ) {
    return withCallFallback(
      `sage-if:${normalizedDirectiveName}`,
      DIRECTIVE_IF_TEMPLATE,
      normalizedDirectiveName,
    );
  }

  return [{ key: `sage-call:${normalizedDirectiveName}`, template: DIRECTIVE_CALL_TEMPLATE }];
}
