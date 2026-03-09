import type { Doc, Options } from "prettier";
import { doc } from "prettier";

const { group, indent, softline } = doc.builders;

/**
 * Wrap a doc in indent + softline for expanded attribute values.
 */
export function printExpand(content: Doc, canHaveTrailingWhitespace = true): Doc {
  return [indent([softline, content]), canHaveTrailingWhitespace ? softline : ""];
}

/**
 * Determine if a JS expression AST should be hugged (kept on one line).
 */
export function shouldHugJsExpression(
  ast: Record<string, unknown>,
  options: Record<string, unknown>,
): boolean {
  const rootNode =
    ast.type === "NGRoot"
      ? (ast.node as Record<string, unknown>)?.type === "NGMicrosyntax" &&
        Array.isArray((ast.node as Record<string, unknown>)?.body) &&
        ((ast.node as Record<string, unknown>).body as unknown[]).length === 1 &&
        ((ast.node as Record<string, unknown>).body as Record<string, unknown>[])[0]?.type ===
          "NGMicrosyntaxExpression"
        ? (
            ((ast.node as Record<string, unknown>).body as Record<string, unknown>[])[0] as Record<
              string,
              unknown
            >
          ).expression
        : ast.node
      : ast.type === "JsExpressionRoot"
        ? ast.node
        : ast;

  if (!rootNode || typeof rootNode !== "object") return false;

  const root = rootNode as Record<string, unknown>;
  return (
    root.type === "ObjectExpression" ||
    root.type === "ArrayExpression" ||
    ((options.parser === "__vue_expression" ||
      options.parser === "__vue_ts_expression" ||
      options.parser === "__ng_binding" ||
      options.parser === "__ng_directive") &&
      (root.type === "TemplateLiteral" || root.type === "StringLiteral"))
  );
}

/**
 * Format an attribute value using a sub-parser.
 */
export async function formatAttributeValue(
  code: string,
  textToDoc: (text: string, options: Options) => Promise<Doc>,
  options: Record<string, unknown>,
  shouldHugFn?: (ast: Record<string, unknown>, options: Record<string, unknown>) => boolean,
): Promise<Doc> {
  const textToDocOptions: Record<string, unknown> = {
    __isInHtmlAttribute: true,
    __embeddedInHtml: true,
    ...options,
  };

  let shouldHug = true;
  if (shouldHugFn) {
    textToDocOptions.__onHtmlBindingRoot = (
      ast: Record<string, unknown>,
      opts: Record<string, unknown>,
    ) => {
      shouldHug = shouldHugFn(ast, opts);
    };
  }

  const result = await textToDoc(code, textToDocOptions as Options);

  return shouldHug ? group(result) : printExpand(result);
}
