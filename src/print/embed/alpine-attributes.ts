import type { AstPath, Doc, Options } from "prettier";
import type { WrappedNode } from "../../types.js";
import {
  getAttributeNameRaw,
  getUnescapedAttributeValue,
  isStaticAttributeName,
  isStaticAttributeValue,
} from "../utils.js";
import { formatAttributeValue, shouldHugJsExpression } from "./utilities.js";

type AttrPredicate = (path: AstPath<WrappedNode>, options: Options) => boolean;
type AttrPrint = (
  textToDoc: (text: string, options: Options) => Promise<Doc>,
  print: (selector?: string | number | Array<string | number> | AstPath) => Doc,
  path: AstPath<WrappedNode>,
  options: Options,
) => Doc | Promise<Doc | undefined>;

export interface AlpineAttrPrinter {
  test: AttrPredicate;
  print: AttrPrint;
}

type AlpineDirectiveKind = "expression" | "statement";

interface AlpineDirectiveInfo {
  kind: AlpineDirectiveKind;
  name: string;
}

function getLineIndent(line: string): number {
  return line.match(/^[\t ]*/u)?.[0].length ?? 0;
}

function isBracketPair(open: string, close: string): boolean {
  return (
    (open === "[" && close === "]") ||
    (open === "{" && close === "}") ||
    (open === "(" && close === ")")
  );
}

function normalizeMultilineFallbackValueIndentation(value: string): string {
  if (!value.includes("\n")) return value;

  const lines = value.replace(/\r\n/g, "\n").split("\n");

  let firstNonEmpty = -1;
  let lastNonEmpty = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().length === 0) continue;
    if (firstNonEmpty === -1) firstNonEmpty = i;
    lastNonEmpty = i;
  }

  if (firstNonEmpty === -1 || lastNonEmpty === -1 || firstNonEmpty >= lastNonEmpty) {
    return value;
  }

  const firstTrimmed = lines[firstNonEmpty].trim();
  const lastTrimmed = lines[lastNonEmpty].trim();
  if (firstTrimmed.length === 0 || lastTrimmed.length === 0) {
    return value;
  }

  const open = firstTrimmed[0];
  const close = lastTrimmed[0];
  if (!isBracketPair(open, close)) {
    return value;
  }

  const closeIndent = getLineIndent(lines[lastNonEmpty]);
  let minMiddleIndent = Number.POSITIVE_INFINITY;

  for (let i = firstNonEmpty + 1; i < lastNonEmpty; i++) {
    if (lines[i].trim().length === 0) continue;
    const indent = getLineIndent(lines[i]);
    if (indent < minMiddleIndent) minMiddleIndent = indent;
  }

  if (!Number.isFinite(minMiddleIndent)) {
    return value;
  }

  const targetMiddleIndent = closeIndent + 2;
  const shiftLeft = minMiddleIndent - targetMiddleIndent;
  if (shiftLeft <= 0) {
    return value;
  }

  const output = [...lines];
  for (let i = firstNonEmpty + 1; i < lastNonEmpty; i++) {
    const line = output[i];
    if (line.trim().length === 0) {
      continue;
    }
    output[i] = line.slice(Math.min(shiftLeft, line.length));
  }

  return output.join("\n");
}

function hasMustacheInterpolation(node: WrappedNode): boolean {
  return getUnescapedAttributeValue(node).includes("{{");
}

const ALPINE_DIRECTIVES = new Map<string, AlpineDirectiveKind>([
  // Core directives
  ["x-data", "expression"],
  ["x-model", "expression"],
  ["x-modelable", "expression"],
  ["x-show", "expression"],
  ["x-if", "expression"],
  ["x-for", "expression"],
  ["x-text", "expression"],
  ["x-html", "expression"],
  ["x-effect", "expression"],
  ["x-id", "expression"],
  ["x-teleport", "expression"],
  ["x-init", "statement"],
  // Plugin directives
  ["x-intersect", "expression"],
  ["x-trap", "expression"],
  ["x-mask", "expression"],
  ["x-sort", "expression"],
  ["x-anchor", "expression"],
  ["x-persist", "expression"],
  ["x-resize", "statement"],
]);

function getAlpineDirectiveInfo(name: string): AlpineDirectiveInfo | null {
  const lower = name.toLowerCase();

  if (lower.startsWith("@") || lower.startsWith("x-on:")) {
    return { kind: "statement", name };
  }

  if (lower.startsWith(":") || lower.startsWith("x-bind:")) {
    return { kind: "expression", name };
  }

  for (const [directive, kind] of ALPINE_DIRECTIVES) {
    if (
      lower === directive ||
      lower.startsWith(`${directive}.`) ||
      lower.startsWith(`${directive}:`)
    ) {
      return { kind, name };
    }
  }

  return null;
}

function isSyntaxError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    typeof (error as { cause?: unknown }).cause === "object" &&
    (error as { cause?: { code?: string } }).cause?.code === "BABEL_PARSER_SYNTAX_ERROR"
  );
}

async function formatAsExpression(
  value: string,
  textToDoc: (text: string, options: Options) => Promise<Doc>,
): Promise<Doc> {
  return formatAttributeValue(
    value,
    textToDoc,
    { parser: "__js_expression" },
    shouldHugJsExpression,
  );
}

async function formatAsStatement(
  value: string,
  textToDoc: (text: string, options: Options) => Promise<Doc>,
): Promise<Doc> {
  return formatAttributeValue(
    value,
    textToDoc,
    { parser: "babel", __isHtmlInlineEventHandler: true },
    () => false,
  );
}

async function printAlpineDirective(
  info: AlpineDirectiveInfo,
  value: string,
  textToDoc: (text: string, options: Options) => Promise<Doc>,
): Promise<Doc> {
  const strategies =
    info.kind === "statement"
      ? [formatAsStatement, formatAsExpression]
      : [formatAsExpression, formatAsStatement];

  let lastError: unknown;

  for (const strategy of strategies) {
    try {
      return await strategy(value, textToDoc);
    } catch (error) {
      if (!isSyntaxError(error)) {
        throw error;
      }
      lastError = error;
    }
  }

  if (lastError) {
    return normalizeMultilineFallbackValueIndentation(value);
  }

  return value;
}

const isAlpineAttribute: AttrPredicate = (path, options) => {
  if ((options as Record<string, unknown>).parentParser) {
    return false;
  }

  const node = path.node;
  if (hasMustacheInterpolation(node)) {
    return false;
  }
  if (!isStaticAttributeValue(node)) {
    return false;
  }

  if (!isStaticAttributeName(node)) {
    return false;
  }

  const name = getAttributeNameRaw(node);
  if (!name) {
    return false;
  }

  return getAlpineDirectiveInfo(name) !== null;
};

const printAlpineAttribute: AttrPrint = async (textToDoc, _print, path) => {
  const node = path.node;
  if (!isStaticAttributeName(node)) {
    return undefined;
  }

  const name = getAttributeNameRaw(node);
  const info = getAlpineDirectiveInfo(name);
  if (!info) {
    return undefined;
  }

  const value = getUnescapedAttributeValue(node);
  if (!value) {
    return undefined;
  }
  if (!isStaticAttributeValue(node)) {
    return undefined;
  }

  return printAlpineDirective(info, value, textToDoc);
};

export const alpineAttributePrinters: AlpineAttrPrinter[] = [
  {
    test: isAlpineAttribute,
    print: printAlpineAttribute,
  },
];
