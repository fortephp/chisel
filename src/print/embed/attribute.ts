import type { AstPath, Doc, Options } from "prettier";
import { doc } from "prettier";
import { format as prettierFormat } from "prettier";
import parseSrcset from "@prettier/parse-srcset";
import type { WrappedNode } from "../../types.js";
import { normalizeLineEndingsToLf } from "../../string-utils.js";
import { isHtmlEventAttribute } from "../../frontend-attribute-names.js";
import { NodeKind } from "../../tree/types.js";
import { formatAttributeNameForPrint } from "../attribute-name.js";
import {
  fullText,
  getStaticAttributeNameLower,
  getAttributeNameRaw,
  isStaticAttributeName,
  isStaticAttributeValue,
  getUnescapedAttributeValue,
  normalizeAttributeName,
} from "../utils.js";
import { formatAttributeValue, printExpand } from "./utilities.js";
import { alpineAttributePrinters } from "./alpine-attributes.js";
import { sortClassNamesWithTailwind } from "./tailwind.js";
import { resolveEmbeddedParserPlugins } from "./embedded-parser-plugins.js";
import { resolvePhpPlugins } from "./php-plugin.js";
import { isPhpFormattingEnabled } from "./php.js";
import {
  getBladeComponentPrefixes,
  shouldPreserveInlineIntentAttributes,
} from "../blade-options.js";

const { group, join, line, ifBreak } = doc.builders;

function hasMustacheInterpolation(node: WrappedNode): boolean {
  return fullText(node).includes("{{");
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

function isColonBoundAttributeName(name: string): boolean {
  return name.trimStart().startsWith(":");
}

function isBladeComponentElement(node: WrappedNode | null, options: Options): boolean {
  if (!node || node.kind !== NodeKind.Element) return false;
  const fullName = node.fullName.toLowerCase();
  return getBladeComponentPrefixes(options).some((prefix) => fullName.startsWith(prefix));
}

function createPhpAttributeOptions(options: Options, plugins: unknown[]): Options {
  const baseOptions = {
    ...(options as Record<string, unknown>),
  };

  delete baseOptions.parser;
  delete baseOptions.parentParser;
  delete baseOptions.plugins;
  delete baseOptions.rangeStart;
  delete baseOptions.rangeEnd;
  delete baseOptions.cursorOffset;

  const runtime = globalThis as Record<string, unknown>;
  const isBrowserRuntime = typeof runtime.window === "object";
  const phpVersion = baseOptions.phpVersion;
  if (
    isBrowserRuntime &&
    (phpVersion === undefined ||
      phpVersion === null ||
      phpVersion === "auto" ||
      phpVersion === "composer")
  ) {
    baseOptions.phpVersion = "8.4";
  }

  return {
    ...baseOptions,
    parser: "php",
    plugins,
  } as Options;
}

function wrapBoundAttributeExpression(value: string): string {
  // Keep the wrapper light so array literals preserve their original shape.
  return `<?php __blade_bound_attr__(${value});`;
}

function extractWrapperCallArgument(formatted: string): string | null {
  const wrapperIndex = formatted.indexOf("__blade_bound_attr__");
  if (wrapperIndex < 0) return null;

  const openIndex = formatted.indexOf("(", wrapperIndex);
  if (openIndex < 0) return null;

  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escape = false;

  for (let i = openIndex; i < formatted.length; i++) {
    const char = formatted[i];
    const next = formatted[i + 1] ?? "";

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inSingle) {
      if (escape) {
        escape = false;
        continue;
      }
      if (char === "\\") {
        escape = true;
        continue;
      }
      if (char === "'") {
        inSingle = false;
      }
      continue;
    }

    if (inDouble) {
      if (escape) {
        escape = false;
        continue;
      }
      if (char === "\\") {
        escape = true;
        continue;
      }
      if (char === '"') {
        inDouble = false;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (char === "#") {
      inLineComment = true;
      continue;
    }
    if (char === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (char === "'") {
      inSingle = true;
      continue;
    }
    if (char === '"') {
      inDouble = true;
      continue;
    }

    if (char === "(") {
      depth += 1;
      continue;
    }

    if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        return formatted.slice(openIndex + 1, i);
      }
    }
  }

  return null;
}

function dedentMultiline(text: string): string {
  const normalized = normalizeLineEndingsToLf(text);
  if (!normalized.includes("\n")) return normalized.trim();
  const lines = normalized.trim().split("\n");
  let minIndent = Number.POSITIVE_INFINITY;
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const indent = line.match(/^[\t ]*/u)?.[0].length ?? 0;
    if (indent < minIndent) {
      minIndent = indent;
    }
  }
  if (!Number.isFinite(minIndent) || minIndent <= 0) {
    return lines.join("\n");
  }
  return lines
    .map((line) => (line.trim().length === 0 ? "" : line.slice(Math.min(minIndent, line.length))))
    .join("\n");
}

function indentMultilineRelativeToAttributeName(value: string, attributeName: string): string {
  if (!value.includes("\n")) return value;

  const lines = value.split("\n");
  const nonEmpty = lines.map((line) => line.trim()).filter(Boolean);
  const first = nonEmpty[0] ?? "";
  const last = nonEmpty[nonEmpty.length - 1] ?? "";

  // Only reindent stable multiline payloads that benefit from attribute-relative alignment.
  const isWrappedMethodCall = first.includes("->") && first.endsWith("(") && last === ")";
  const isBracketWrapped = first === "[" && last === "]";
  const shouldApplyRelativeIndent = isWrappedMethodCall || isBracketWrapped;
  if (!shouldApplyRelativeIndent) {
    return value;
  }

  const continuationLines = lines.slice(1).filter((line) => line.trim().length > 0);
  if (continuationLines.length > 0) {
    const minContinuationIndent = Math.min(
      ...continuationLines.map((line) => line.match(/^[\t ]*/u)?.[0].length ?? 0),
    );

    // Strip shared continuation indentation so repeated passes do not deepen indentation.
    if (minContinuationIndent > 0) {
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().length === 0) continue;
        lines[i] = line.slice(Math.min(minContinuationIndent, line.length));
      }
    }
  }

  const continuationIndentSize = isBracketWrapped
    ? Math.max(2, Math.floor(attributeName.length / 2))
    : attributeName.length;
  const continuationIndent = " ".repeat(continuationIndentSize);
  const bracketClosingIndent = isBracketWrapped
    ? " ".repeat(Math.max(4, Math.floor(attributeName.length / 3)))
    : continuationIndent;

  return lines
    .map((line, index) => {
      if (index === 0) return line;
      if (line.trim().length === 0) return "";
      if (isBracketWrapped && line.trim() === "]") {
        return `${bracketClosingIndent}${line.trimStart()}`;
      }
      return `${continuationIndent}${line}`;
    })
    .join("\n");
}

async function formatAsPhpBoundAttributeValue(
  value: string,
  options: Options,
): Promise<string | undefined> {
  const plugins = await resolvePhpPlugins(options);
  if (!plugins) return undefined;

  try {
    const formatted = await prettierFormat(
      wrapBoundAttributeExpression(value),
      createPhpAttributeOptions(options, plugins),
    );
    const extracted = extractWrapperCallArgument(normalizeLineEndingsToLf(formatted));
    if (extracted === null) return undefined;
    const normalized = dedentMultiline(extracted)
      // The wrapper call can introduce a top-level trailing comma; drop it when unwrapping.
      .replace(/,\s*$/u, "")
      .replace(/;\s*$/u, "");
    return normalized || undefined;
  } catch {
    return undefined;
  }
}

type EmbedPrint = (selector?: string | number | Array<string | number> | AstPath) => Doc;

type AttrPredicate = (path: AstPath<WrappedNode>, options: Options) => boolean;
type AttrPrint = (
  textToDoc: (text: string, options: Options) => Promise<Doc>,
  print: EmbedPrint,
  path: AstPath<WrappedNode>,
  options: Options,
) => Doc | Promise<Doc | undefined>;

interface AttrPrinter {
  test: AttrPredicate;
  print: AttrPrint;
}

const isSrcset: AttrPredicate = (path) => {
  const node = path.node;
  const name = getStaticAttributeNameLower(node);
  if (name === null) return false;
  if (!isStaticAttributeValue(node)) return false;
  return (
    name === "srcset" &&
    node.parent !== null &&
    (node.parent.fullName.toLowerCase() === "img" ||
      node.parent.fullName.toLowerCase() === "source")
  );
};

const SRCSET_UNITS = {
  width: "w",
  height: "h",
  density: "x",
} as const;

type SrcsetDescriptorType = keyof typeof SRCSET_UNITS;

type SrcsetCandidate = {
  source: { value: string };
} & Partial<Record<SrcsetDescriptorType, { value: number }>>;

const printSrcset: AttrPrint = (_textToDoc, _print, path) => {
  const value = getUnescapedAttributeValue(path.node);
  const srcset = parseSrcset(value) as SrcsetCandidate[];

  if (srcset.length === 0) return value;

  const srcsetTypes = Object.keys(SRCSET_UNITS) as SrcsetDescriptorType[];
  const types = srcsetTypes.filter((type) =>
    srcset.some((candidate) => Object.hasOwn(candidate, type)),
  );

  if (types.length > 1) {
    throw new Error("Mixed descriptor in srcset is not supported");
  }

  const [key] = types;
  const unit = key ? SRCSET_UNITS[key] : "";

  const urls = srcset.map((candidate) => candidate.source.value);
  const maxUrlLength = Math.max(...urls.map((u) => u.length));

  const descriptors = srcset.map((candidate) =>
    key && candidate[key] ? String(candidate[key].value) : "",
  );
  const descriptorLeftLengths = descriptors.map((d) => {
    const idx = d.indexOf(".");
    return idx === -1 ? d.length : idx;
  });
  const maxDescriptorLeftLength = Math.max(...descriptorLeftLengths);

  return printExpand(
    join(
      [",", line],
      urls.map((url, index) => {
        const parts: Doc[] = [url];
        const descriptor = descriptors[index];
        if (descriptor) {
          const urlPadding = maxUrlLength - url.length + 1;
          const descriptorPadding = maxDescriptorLeftLength - descriptorLeftLengths[index];
          const alignment = " ".repeat(urlPadding + descriptorPadding);
          parts.push(ifBreak(alignment, " "), descriptor + unit);
        }
        return parts;
      }),
    ),
  );
};

const isStyle: AttrPredicate = (path, options) => {
  const node = path.node;
  const name = getStaticAttributeNameLower(node);
  if (!isStaticAttributeValue(node)) return false;
  return (
    name === "style" &&
    !(options as Record<string, unknown>).parentParser &&
    !hasMustacheInterpolation(node)
  );
};

function shouldPreserveInlineSvgStyleAttribute(
  path: AstPath<WrappedNode>,
  options: Options,
): boolean {
  const node = path.node;
  const parent = node.parent;
  if (!parent || parent.kind !== NodeKind.Element) return false;
  if (parent.namespace !== "svg") return false;
  if (!shouldPreserveInlineIntentAttributes(options, parent.tagName, parent.namespace)) {
    return false;
  }
  if (fullText(parent).includes("\n") || fullText(parent).includes("\r")) return false;
  if (fullText(node).includes("\n") || fullText(node).includes("\r")) return false;
  return true;
}

const printStyle: AttrPrint = async (textToDoc, _print, path, options) => {
  const value = getUnescapedAttributeValue(path.node);
  if (shouldPreserveInlineSvgStyleAttribute(path, options)) {
    return value;
  }
  const plugins = await resolveEmbeddedParserPlugins(options, "css");
  return printExpand(
    await textToDoc(value, {
      parser: "css",
      __isHTMLStyleAttribute: true,
      plugins,
    } as Options),
  );
};

const isEventHandler: AttrPredicate = (path, options) => {
  const node = path.node;
  const name = getStaticAttributeNameLower(node);
  if (!name) return false;
  if (!isStaticAttributeValue(node)) return false;
  return (
    isHtmlEventAttribute(name) &&
    !(options as Record<string, unknown>).parentParser &&
    !hasMustacheInterpolation(node)
  );
};

const printEventHandler: AttrPrint = async (textToDoc, _print, path, options) => {
  const value = getUnescapedAttributeValue(path.node);
  const plugins = await resolveEmbeddedParserPlugins(options, "babel");
  return formatAttributeValue(
    value,
    textToDoc,
    {
      parser: "babel",
      __isHtmlInlineEventHandler: true,
      plugins,
    },
    () => false,
  );
};

// - Blade component tags: treat :attr values as PHP
// - Non-Blade tags: treat :attr values as JS expressions

const isColonBoundAttribute: AttrPredicate = (path, options) => {
  if ((options as Record<string, unknown>).parentParser) return false;

  const node = path.node;
  if (!isStaticAttributeName(node)) return false;
  if (!isStaticAttributeValue(node)) return false;
  if (hasMustacheInterpolation(node)) return false;

  const name = getAttributeNameRaw(node);
  if (!name) return false;
  return isColonBoundAttributeName(name);
};

const printColonBoundAttribute: AttrPrint = async (textToDoc, _print, path, options) => {
  const node = path.node;
  if (!isStaticAttributeName(node) || !isStaticAttributeValue(node)) {
    return undefined;
  }

  const name = getAttributeNameRaw(node);
  if (!name || !isColonBoundAttributeName(name)) {
    return undefined;
  }

  const value = getUnescapedAttributeValue(node);
  if (!value) return undefined;

  if (isBladeComponentElement(node.parent, options)) {
    if (!isPhpFormattingEnabled(options)) {
      return undefined;
    }

    const formattedValue = await formatAsPhpBoundAttributeValue(value, options);
    if (!formattedValue) return undefined;

    const normalizedName = normalizeAttributeName(name, node.parent);
    const indentedValue = indentMultilineRelativeToAttributeName(formattedValue, normalizedName);
    return indentedValue.includes("\n") ? printExpand(indentedValue) : indentedValue;
  }

  try {
    return await formatAttributeValue(value, textToDoc, { parser: "__js_expression" });
  } catch (error) {
    if (!isSyntaxError(error)) {
      throw error;
    }

    try {
      return await formatAttributeValue(value, textToDoc, {
        parser: "babel",
        __isHtmlInlineEventHandler: true,
      });
    } catch (fallbackError) {
      if (!isSyntaxError(fallbackError)) {
        throw fallbackError;
      }
      return undefined;
    }
  }
};

const isClassNames: AttrPredicate = (path, options) => {
  const node = path.node;
  const name = getStaticAttributeNameLower(node);
  if (!isStaticAttributeValue(node)) return false;
  return (
    (name === "class" || name === "classname") &&
    !(options as Record<string, unknown>).parentParser &&
    !hasMustacheInterpolation(node)
  );
};

const printClassNames: AttrPrint = async (_textToDoc, _print, path, options) => {
  const value = getUnescapedAttributeValue(path.node);
  const tailwindSortedValue = await sortClassNamesWithTailwind(value, options);

  if (tailwindSortedValue !== null) {
    return tailwindSortedValue;
  }

  return value.trim().split(/\s+/).join(" ");
};

const isPermissionsPolicy: AttrPredicate = (path, options) => {
  const node = path.node;
  const name = getStaticAttributeNameLower(node);
  if (!isStaticAttributeValue(node)) return false;
  return (
    name === "allow" &&
    !(options as Record<string, unknown>).parentParser &&
    node.parent !== null &&
    node.parent.fullName.toLowerCase() === "iframe" &&
    !hasMustacheInterpolation(node)
  );
};

function parsePermissionsPolicy(value: string): Array<{ name: string; value: string[] }> {
  return value
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((directive) => {
      const parts = directive.split(/\s+/);
      return { name: parts[0], value: parts.slice(1) };
    });
}

const printPermissionsPolicy: AttrPrint = (_textToDoc, _print, path) => {
  const value = getUnescapedAttributeValue(path.node);
  const directives = parsePermissionsPolicy(value);

  if (directives.length === 0) return [""];

  return printExpand(
    directives.map(({ name, value: vals }, index) => [
      [name, ...vals].join(" "),
      index === directives.length - 1 ? ifBreak(";") : [";", line],
    ]),
  );
};

const rawPrinters: Array<{ test: AttrPredicate; print: AttrPrint }> = [
  { test: isSrcset, print: printSrcset },
  { test: isStyle, print: printStyle },
  { test: isEventHandler, print: printEventHandler },
  { test: isColonBoundAttribute, print: printColonBoundAttribute },
  { test: isClassNames, print: printClassNames },
  { test: isPermissionsPolicy, print: printPermissionsPolicy },
  ...alpineAttributePrinters,
];

/**
 * Wrap a value printer to handle quoting and &quot; escaping.
 */
function createAttributePrinter(printValue: AttrPrint): AttrPrint {
  return async (textToDoc, print, path, options) => {
    let valueDoc = await printValue(textToDoc, print, path, options);
    if (!valueDoc) return undefined;

    // Escape double quotes in string parts of the doc
    valueDoc = doc.utils.mapDoc(valueDoc as Doc, (d) =>
      typeof d === "string" ? d.replaceAll('"', "&quot;") : d,
    );

    const rawName = formatAttributeNameForPrint(path.node, options);
    const name = isStaticAttributeName(path.node)
      ? normalizeAttributeName(rawName, path.node.parent)
      : rawName;
    return [name, '="', group(valueDoc), '"'];
  };
}

const printers: AttrPrinter[] = rawPrinters.map(({ test, print: p }) => ({
  test,
  print: createAttributePrinter(p),
}));

/**
 * Check if an attribute should use embedded formatting.
 * Returns a print function or null.
 */
export function printEmbedAttribute(
  path: AstPath<WrappedNode>,
  options: Options,
):
  | ((
      textToDoc: (text: string, options: Options) => Promise<Doc>,
      print: EmbedPrint,
      path: AstPath,
      options: Options,
    ) => Promise<Doc | undefined> | Doc | undefined)
  | null {
  const node = path.node;
  const value = getUnescapedAttributeValue(node);

  if (!value) return null;

  // Find the first matching printer
  const match = printers.find(({ test }) => test(path, options));
  if (!match) return null;

  // Wrap to match Prettier's embed callback signature
  return (textToDoc, print, cbPath, cbOptions) =>
    match.print(textToDoc, print, cbPath as AstPath<WrappedNode>, cbOptions);
}
