import type { Printer, AstPath, Doc, Options } from "prettier";
import { doc } from "prettier";
import type { WrappedNode } from "../types.js";
import { NodeKind } from "../tree/types.js";
import { TokenType } from "../lexer/types.js";
import { preprocess } from "../preprocess.js";
import { insertPragma } from "../pragma.js";
import { fullText } from "./utils.js";
import { printElement } from "./element.js";
import { printChildren } from "./children.js";
import { printText } from "./text.js";
import { printDirective, printDirectiveBlock } from "./directive.js";
import { printEcho } from "./echo.js";
import { printComment, printBladeComment } from "./comment.js";
import { printDoctype } from "./doctype.js";
import { printOpeningTagPrefix, printClosingTagSuffix, printAttribute } from "./tag.js";
import { embed } from "./embed.js";

const { group, hardline } = doc.builders;
type FrontMatterPrinterFeatures = {
  experimental_frontMatterSupport?: {
    massageAstNode?: boolean;
    embed?: boolean;
    print?: boolean;
  };
};

type BladePrinter = Printer<WrappedNode> & {
  features?: FrontMatterPrinterFeatures;
};

function assertNever(x: never): never {
  throw new Error(`Unhandled node kind in printer: ${String(x)}`);
}

function genericPrint(
  path: AstPath<WrappedNode>,
  options: Options,
  print: (path: AstPath<WrappedNode>) => Doc,
): Doc {
  const node = path.node;

  switch (node.kind) {
    case "frontMatter":
      return fullText(node);

    case NodeKind.Root: {
      const children = printChildren(path, print, options);
      if (children.length === 0) return "";
      return [group(children), hardline];
    }

    case NodeKind.Element:
    case NodeKind.ConditionalComment:
      return printElement(path, options, print);

    case NodeKind.Text:
      return printText(node, options);

    case NodeKind.Echo:
    case NodeKind.RawEcho:
    case NodeKind.TripleEcho:
      return [
        printOpeningTagPrefix(node, options),
        printEcho(node, options),
        printClosingTagSuffix(node, options),
      ];

    case NodeKind.Directive:
      return printDirective(node, options);

    case NodeKind.DirectiveBlock:
      return printDirectiveBlock(node, path, print, options);

    case NodeKind.Comment:
    case NodeKind.BogusComment:
      return printComment(node, options);

    case NodeKind.BladeComment:
      return printBladeComment(node);

    case NodeKind.Attribute:
    case NodeKind.JsxAttribute:
      return printAttribute(node, options);

    case NodeKind.Doctype:
      return printDoctype(node, options);

    case NodeKind.Verbatim:
    case NodeKind.PhpBlock:
    case NodeKind.PhpTag:
      return printRawBlockNode(node);

    case NodeKind.Cdata:
    case NodeKind.Decl:
    case NodeKind.ProcessingInstruction:
      return [
        printOpeningTagPrefix(node, options),
        printRawDelimitedNode(node),
        printClosingTagSuffix(node, options),
      ];

    case NodeKind.Fragment:
      return printChildren(path, print, options);

    case NodeKind.NonOutput:
      return fullText(node);

    case NodeKind.UnpairedClosingTag:
      return trimTrailingWhitespaceAtEof(node);

    case NodeKind.ElementName:
    case NodeKind.AttributeWhitespace:
    case NodeKind.AttributeName:
    case NodeKind.AttributeValue:
      return fullText(node);

    case NodeKind.ClosingElementName:
      return trimTrailingWhitespaceAtEof(node);

    default:
      return assertNever(node.kind);
  }
}

export const bladePrinter: BladePrinter = {
  features: {
    experimental_frontMatterSupport: {
      massageAstNode: true,
      embed: true,
      print: true,
    },
  },
  preprocess,
  print: genericPrint,
  embed,
  insertPragma,
  getVisitorKeys(_node: WrappedNode): string[] {
    return ["children", "attrs"];
  },
};

function printRawBlockNode(node: WrappedNode): string {
  return trimUnterminatedNodeAtEof(node);
}

function printRawDelimitedNode(node: WrappedNode): string {
  return trimUnterminatedNodeAtEof(node);
}

function trimUnterminatedNodeAtEof(node: WrappedNode): string {
  const text = fullText(node);
  if (!isUnterminatedDelimitedNodeAtEof(node)) {
    return text;
  }

  // Unterminated delimited nodes can absorb EOF whitespace. Trimming keeps pass-2
  // idempotency stable while preserving all non-whitespace content.
  return text.replace(/\s+$/u, "");
}

function isUnterminatedDelimitedNodeAtEof(node: WrappedNode): boolean {
  if (node.end !== node.source.length) {
    return false;
  }

  const closingToken = getClosingTokenForDelimitedNode(node.kind);
  if (closingToken === null) {
    return false;
  }

  const start = node.flat.tokenStart;
  const end = start + node.flat.tokenCount;
  const tokens = node.buildResult.tokens;

  for (let i = start; i < end; i++) {
    if (tokens[i].type === closingToken) {
      return false;
    }
  }

  return true;
}

function getClosingTokenForDelimitedNode(kind: WrappedNode["kind"]): TokenType | null {
  switch (kind) {
    case NodeKind.Verbatim:
      return TokenType.VerbatimEnd;
    case NodeKind.PhpBlock:
      return TokenType.PhpBlockEnd;
    case NodeKind.PhpTag:
      return TokenType.PhpTagEnd;
    case NodeKind.Cdata:
      return TokenType.CdataEnd;
    case NodeKind.Decl:
      return TokenType.DeclEnd;
    case NodeKind.ProcessingInstruction:
      return TokenType.PIEnd;
    default:
      return null;
  }
}

function trimTrailingWhitespaceAtEof(node: WrappedNode): string {
  const text = fullText(node);
  if (node.end !== node.source.length) {
    return text;
  }
  return text.replace(/\s+$/u, "");
}
