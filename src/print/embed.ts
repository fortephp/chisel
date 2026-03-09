import type { AstPath, Doc, Options } from "prettier";
import { doc } from "prettier";
import { format as prettierFormat } from "prettier";
import type { WrappedNode } from "../types.js";
import { NodeKind } from "../tree/types.js";
import { trimFinalLineBreak } from "../string-utils.js";
import { isScriptLikeTag } from "../node-predicates.js";
import { inferElementParser, getAttrMap, dedentString } from "./utils.js";
import { isBladeConstructChild, parentContainsBladeSyntax } from "./blade-syntax.js";
import {
  printOpeningTag,
  printClosingTag,
  printOpeningTagPrefix,
  printClosingTagSuffix,
} from "./tag.js";
import { printEmbedAttribute } from "./embed/attribute.js";
import {
  formatDirectiveNodeArgs,
  formatEchoNode,
  formatPhpBlockNode,
  formatPhpTagNode,
  isPhpFormattingEnabled,
} from "./embed/php.js";
import { resolvePhpPlugins } from "./embed/php-plugin.js";
import {
  embedMixedRawContentElement,
  shouldBypassStyleParserEmbedding,
  shouldUseMixedRawContentEmbedding,
} from "./embed/raw-content.js";
import { resolveEmbeddedParserPlugins } from "./embed/embedded-parser-plugins.js";
import { fullText } from "./utils.js";
import { replaceEndOfLine } from "./doc-utils.js";
import { shouldPreserveInlineIntentElement } from "./blade-options.js";

const { breakParent, group, hardline, indent } = doc.builders;
const INLINE_INTENT_EMBED_TAGS = new Set(["p", "svg"]);
const INLINE_INTENT_MIN_LENGTH = 160;
const INLINE_INTENT_TRIGGER_WIDTH_MULTIPLIER = 2;
const INLINE_INTENT_SUBFORMAT_WIDTH_MULTIPLIER = 8;
const INLINE_INTENT_GUARD_FLAG = "__bladeInlineIntentDelegated";

type EmbedPrint = (selector?: string | number | Array<string | number> | AstPath) => Doc;

type EmbeddedDocPrinter = (
  textToDoc: (text: string, options: Options) => Promise<Doc>,
  print: EmbedPrint,
  path: AstPath,
  options: Options,
) => Doc | Promise<Doc | undefined> | undefined;

type EmbedResult = EmbeddedDocPrinter | null;

type EmbedHandler = (path: AstPath<WrappedNode>, options: Options) => EmbedResult;

function handleElementEmbed(path: AstPath<WrappedNode>, options: Options): EmbedResult {
  const node = path.node;

  if (shouldUseInlineIntentElementEmbed(node, options)) {
    return async (
      _textToDoc: (text: string, options: Options) => Promise<Doc>,
      _print: EmbedPrint,
    ) => {
      try {
        const delegated = await prettierFormat(
          fullText(node),
          createInlineIntentSubformatOptions(options),
        );
        return replaceEndOfLine(trimFinalLineBreak(delegated), hardline);
      } catch {
        return fullText(node);
      }
    };
  }

  // Script-like tags are normally embedded from their text child.
  // Our permissive lexer may split style content into directives/text;
  // in that case, embed from raw element content for parity.
  if (isScriptLikeTag(node, options)) {
    if (shouldBypassStyleParserEmbedding(node, options)) {
      return null;
    }

    if (shouldUseMixedRawContentEmbedding(node, options)) {
      return async (
        textToDoc: (text: string, options: Options) => Promise<Doc>,
        print: EmbedPrint,
      ) => {
        return (
          (await embedMixedRawContentElement(
            path as AstPath<WrappedNode>,
            options,
            textToDoc,
            print,
          )) ?? fullText(node)
        );
      };
    }

    const parser = inferElementParser(node, options);
    if (
      parser &&
      node.tagName === "style" &&
      node.children.some((child) => child.kind !== NodeKind.Text)
    ) {
      // CSS embedding is unstable when Blade/PHP constructs appear in style
      // content. Fall back to native node printing in that case.
      if (node.children.some((child) => isBladeConstructChild(child, "style"))) {
        return null;
      }
      return async (
        textToDoc: (text: string, options: Options) => Promise<Doc>,
        print: EmbedPrint,
      ) => {
        const rawValue = getRawElementContent(node);
        const value =
          parser === "markdown" ? dedentString(rawValue.replace(/^[^\S\n]*\n/, "")) : rawValue;

        const plugins = await resolveEmbeddedParserPlugins(options, parser);

        const textToDocOptions: Record<string, unknown> = {
          parser,
          __embeddedInHtml: true,
          plugins,
        };

        const docContent = await textToDoc(value, textToDocOptions as Options);
        const isEmpty = /^\s*$/.test(rawValue) || docContent === "";

        return [
          printOpeningTagPrefix(node, options),
          group(
            printOpeningTag(
              path as AstPath<WrappedNode>,
              options,
              print as unknown as (path: AstPath<WrappedNode>) => Doc,
            ),
          ),
          isEmpty ? "" : indent([hardline, docContent]),
          isEmpty ? "" : hardline,
          printClosingTag(node, options),
          printClosingTagSuffix(node, options),
        ];
      };
    }
    return null;
  }

  // Vue non-HTML blocks would be handled here but not applicable for Blade.
  return null;
}

function handleTextEmbed(path: AstPath<WrappedNode>, options: Options): EmbedResult {
  const node = path.node;
  if (node.parent && isScriptLikeTag(node.parent, options)) {
    if (shouldBypassStyleParserEmbedding(node.parent, options)) {
      return null;
    }

    const parser = inferElementParser(node.parent, options);
    if (parser) {
      if (parser === "css" && parentContainsBladeSyntax(node.parent, "style")) {
        return null;
      }

      return async (
        textToDoc: (text: string, options: Options) => Promise<Doc>,
        _print: EmbedPrint,
      ) => {
        // Get raw text content (rawText has the text between tags)
        const rawValue = node.rawText;
        const value =
          parser === "markdown" ? dedentString(rawValue.replace(/^[^\S\n]*\n/, "")) : rawValue;

        const plugins = await resolveEmbeddedParserPlugins(options, parser);

        const textToDocOptions: Record<string, unknown> = {
          parser,
          __embeddedInHtml: true,
          plugins,
        };

        // For babel in HTML, determine source type from parent's type attribute
        if (parser === "babel") {
          let sourceType = "script";
          const attrMap = getAttrMap(node.parent!);
          if (
            attrMap.type === "module" ||
            ((attrMap.type === "text/babel" || attrMap.type === "text/jsx") &&
              attrMap["data-type"] === "module")
          ) {
            sourceType = "module";
          }
          textToDocOptions.__babelSourceType = sourceType;
        }

        return [
          breakParent,
          printOpeningTagPrefix(node, options),
          await textToDoc(value, textToDocOptions as Options),
          printClosingTagSuffix(node, options),
        ];
      };
    }
  }
  return null;
}

function handleAttributeEmbed(path: AstPath<WrappedNode>, options: Options): EmbedResult {
  return printEmbedAttribute(path as AstPath<WrappedNode>, options);
}

function handleEchoEmbed(path: AstPath<WrappedNode>, options: Options): EmbedResult {
  if (!isPhpFormattingEnabled(options)) return null;

  const node = path.node;
  return async (
    _textToDoc: (text: string, options: Options) => Promise<Doc>,
    print: EmbedPrint,
  ) => {
    const formatted = await formatEchoNode(node, options);
    if (formatted === null) {
      return print(path);
    }
    const rendered = replaceEndOfLine(formatted, hardline);
    return [printOpeningTagPrefix(node, options), rendered, printClosingTagSuffix(node, options)];
  };
}

function handleDirectiveEmbed(path: AstPath<WrappedNode>, options: Options): EmbedResult {
  if (!isPhpFormattingEnabled(options)) return null;

  const node = path.node;
  return async (
    _textToDoc: (text: string, options: Options) => Promise<Doc>,
    print: EmbedPrint,
  ) => {
    const phpPlugins = await resolvePhpPlugins(options);
    if (!phpPlugins) {
      // No PHP parser available: fall back to the normal directive printer
      // so Blade spacing options still apply.
      return print(path);
    }

    const formatted = await formatDirectiveNodeArgs(node, options);
    if (formatted === null) {
      return print(path);
    }
    return replaceEndOfLine(formatted, hardline);
  };
}

function handlePhpBlockEmbed(path: AstPath<WrappedNode>, options: Options): EmbedResult {
  if (!isPhpFormattingEnabled(options)) return null;

  const node = path.node;
  return async (
    _textToDoc: (text: string, options: Options) => Promise<Doc>,
    print: EmbedPrint,
  ) => {
    const formatted = await formatPhpBlockNode(node, options);
    if (formatted === null) {
      return print(path);
    }
    const rendered = replaceEndOfLine(formatted, hardline);
    return [printOpeningTagPrefix(node, options), rendered, printClosingTagSuffix(node, options)];
  };
}

function handlePhpTagEmbed(path: AstPath<WrappedNode>, options: Options): EmbedResult {
  if (!isPhpFormattingEnabled(options)) return null;

  const node = path.node;
  return async (
    _textToDoc: (text: string, options: Options) => Promise<Doc>,
    print: EmbedPrint,
  ) => {
    const formatted = await formatPhpTagNode(node, options);
    if (formatted === null) {
      return print(path);
    }
    const rendered = replaceEndOfLine(formatted, hardline);
    return [printOpeningTagPrefix(node, options), rendered, printClosingTagSuffix(node, options)];
  };
}

const EMBED_HANDLERS: Partial<Record<NodeKind, EmbedHandler>> = {
  [NodeKind.Element]: handleElementEmbed,
  [NodeKind.Text]: handleTextEmbed,
  [NodeKind.Attribute]: handleAttributeEmbed,
  [NodeKind.JsxAttribute]: handleAttributeEmbed,
  [NodeKind.Echo]: handleEchoEmbed,
  [NodeKind.RawEcho]: handleEchoEmbed,
  [NodeKind.TripleEcho]: handleEchoEmbed,
  [NodeKind.Directive]: handleDirectiveEmbed,
  [NodeKind.PhpBlock]: handlePhpBlockEmbed,
  [NodeKind.PhpTag]: handlePhpTagEmbed,
};

export function embed(path: AstPath, options: Options): EmbedResult {
  const node = path.node as WrappedNode;
  const handler = EMBED_HANDLERS[node.kind as NodeKind];
  if (!handler) return null;
  return handler(path as AstPath<WrappedNode>, options);
}

function getRawElementContent(node: WrappedNode): string {
  if (!node.hasClosingTag) return "";
  if (node.openTagEndOffset > 0 && node.closingTagStartOffset > node.openTagEndOffset) {
    return node.source.slice(node.openTagEndOffset, node.closingTagStartOffset);
  }
  if (node.children.length === 0) return "";
  const start = node.children[0].start;
  const end = node.children[node.children.length - 1].end;
  return node.source.slice(start, end);
}

function shouldUseInlineIntentElementEmbed(node: WrappedNode, options: Options): boolean {
  if (node.kind !== NodeKind.Element) return false;
  if (!node.hasClosingTag) return false;
  if ((options as Record<string, unknown>)[INLINE_INTENT_GUARD_FLAG]) {
    return false;
  }
  if (!INLINE_INTENT_EMBED_TAGS.has(node.tagName)) return false;
  if (!shouldPreserveInlineIntentElement(options, node.tagName, node.namespace)) {
    return false;
  }

  const source = fullText(node).trimEnd();
  if (source.length < getInlineIntentLengthThreshold(options)) return false;
  if (source.includes("\n") || source.includes("\r")) return false;

  return true;
}

function getInlineIntentLengthThreshold(options: Options): number {
  const candidate = Number(options.printWidth);
  if (!Number.isFinite(candidate) || candidate <= 0) {
    return INLINE_INTENT_MIN_LENGTH;
  }
  return Math.max(
    INLINE_INTENT_MIN_LENGTH,
    Math.floor(candidate * INLINE_INTENT_TRIGGER_WIDTH_MULTIPLIER),
  );
}

function createInlineIntentSubformatOptions(options: Options): Options {
  const base = { ...(options as Record<string, unknown>) };
  const printWidth = Number(options.printWidth);
  const computedPrintWidth =
    Number.isFinite(printWidth) && printWidth > 0
      ? Math.max(200, Math.floor(printWidth * INLINE_INTENT_SUBFORMAT_WIDTH_MULTIPLIER))
      : 200;

  return {
    ...base,
    parser: "blade",
    printWidth: computedPrintWidth,
    [INLINE_INTENT_GUARD_FLAG]: true,
  } as Options;
}
