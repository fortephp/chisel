import type { Parser } from "prettier";
import { tokenize } from "./lexer/lexer.js";
import { Directives as LexerDirectives } from "./lexer/directives.js";
import { buildTree } from "./tree/tree-builder.js";
import { Directives as TreeDirectives } from "./tree/directives.js";
import type { WrappedNode } from "./types.js";
import { NodeKind, NONE, type BuildResult, type FlatNode } from "./tree/types.js";
import { TokenType } from "./lexer/types.js";
import { hasPragma } from "./pragma.js";
import { resolveBladeSyntaxProfile } from "./plugins/runtime.js";
import { markFrontMatter, parseFrontMatter, type FrontMatter } from "./front-matter.js";
import { buildLineOffsets, getLine } from "./line-offsets.js";

const INTERNAL_KINDS = new Set([
  NodeKind.ElementName,
  NodeKind.ClosingElementName,
  NodeKind.Attribute,
  NodeKind.JsxAttribute,
  NodeKind.AttributeName,
  NodeKind.AttributeValue,
  NodeKind.AttributeWhitespace,
]);

function buildTokenLineNumbers(
  tokens: BuildResult["tokens"],
  lineOffsets: number[],
): { startLines: number[]; endLines: number[] } {
  const startLines: number[] = [];
  const endLines: number[] = [];
  startLines.length = tokens.length;
  endLines.length = tokens.length;

  let line = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    while (line + 1 < lineOffsets.length && lineOffsets[line + 1] <= token.start) {
      line++;
    }
    startLines[i] = line;

    const endOffset = token.end > token.start ? token.end - 1 : token.end;
    while (line + 1 < lineOffsets.length && lineOffsets[line + 1] <= endOffset) {
      line++;
    }
    endLines[i] = line;
  }

  return { startLines, endLines };
}

function wrapTree(result: BuildResult): WrappedNode {
  const { nodes, tokens, source } = result;
  const wrapped: WrappedNode[] = [];
  wrapped.length = nodes.length;
  const lineOffsets = buildLineOffsets(source);
  const tokenLines = buildTokenLineNumbers(tokens, lineOffsets);

  // First pass: create all WrappedNodes without relationships.
  for (let i = 0; i < nodes.length; i++) {
    const flat = nodes[i];
    const [start, end] = nodeSourceRange(flat, tokens);
    let startLine = 0;
    let endLine = 0;
    if (flat.tokenCount > 0) {
      const firstTokenIdx = flat.tokenStart;
      const lastTokenIdx = flat.tokenStart + flat.tokenCount - 1;
      startLine = tokenLines.startLines[firstTokenIdx];
      endLine = tokenLines.endLines[lastTokenIdx];
    }

    wrapped[i] = {
      kind: flat.kind as NodeKind,
      flatIndex: i,
      flat,
      parent: null,
      children: [],
      source,
      start,
      end,
      rawText: shouldMaterializeRawText(flat.kind) ? ownTokenText(flat, tokens, source) : "",
      buildResult: result,
      attrs: [],
      tagName: "",
      rawTagName: "",
      rawClosingTagName: "",
      fullName: "",
      name: "",
      namespace: "",
      hasClosingTag: false,
      openTagEndOffset: 0,
      closingTagStartOffset: 0,
      startLine,
      endLine,
      prev: null,
      next: null,
      isSelfClosing: false,
      hasHtmComponentClosingTag: false,
      condition: "",
      complete: true,
      conditionalStartIsRevealed: false,
      conditionalEndIsHidden: false,
      isIeConditionalStartComment: false,
      ieConditionalStartCondition: "",
      cssDisplay: "inline",
      isWhitespaceSensitive: false,
      isIndentationSensitive: false,
      isLeadingSpaceSensitive: false,
      isTrailingSpaceSensitive: false,
      isDanglingSpaceSensitive: false,
      hasLeadingSpaces: false,
      hasTrailingSpaces: false,
      hasDanglingSpaces: false,
    };
  }

  // Second pass: wire parent/children, filtering internal kinds from children.
  for (let i = 0; i < nodes.length; i++) {
    const flat = nodes[i];
    let childIdx = flat.firstChild;
    while (childIdx !== NONE) {
      const child = wrapped[childIdx];
      child.parent = wrapped[i];

      if (child.kind !== "frontMatter" && INTERNAL_KINDS.has(child.kind)) {
        // Route structural children to appropriate properties.
        // Attribute nodes belong in `attrs` only for Element parents.
        // In other contexts (notably directive blocks parsed in attribute
        // regions), attribute nodes must remain printable body children.
        if (child.kind === NodeKind.Attribute || child.kind === NodeKind.JsxAttribute) {
          if (wrapped[i].kind !== NodeKind.Element) {
            wrapped[i].children.push(child);
            childIdx = nodes[childIdx].nextSibling;
            continue;
          }
          wrapped[i].attrs.push(child);
        }
        if (child.kind === NodeKind.ElementName) {
          const raw = child.rawText;
          wrapped[i].rawTagName = raw;
          wrapped[i].fullName = raw;
          const colonIdx = raw.indexOf(":");
          if (colonIdx >= 0) {
            wrapped[i].namespace = raw.slice(0, colonIdx);
            wrapped[i].name = raw.slice(colonIdx + 1);
            wrapped[i].tagName = raw.slice(colonIdx + 1).toLowerCase();
          } else {
            wrapped[i].namespace = "";
            wrapped[i].name = raw;
            wrapped[i].tagName = raw.toLowerCase();
          }
        }
        if (child.kind === NodeKind.ClosingElementName) {
          wrapped[i].hasClosingTag = true;
          wrapped[i].rawClosingTagName = child.rawText;
        }
      } else {
        wrapped[i].children.push(child);
      }

      childIdx = nodes[childIdx].nextSibling;
    }

    // Compute opening/closing tag offsets for Element nodes.
    // openTagEndOffset equivalent to Prettier's startSourceSpan.end.offset (position after ">")
    // closingTagStartOffset equivalent to Prettier's endSourceSpan.start.offset (position of "</")
    if (flat.kind === NodeKind.Element && flat.tokenCount > 0) {
      const tokenEnd = flat.tokenStart + flat.tokenCount;
      // Opening tag: find first GreaterThan token (lexer ensures > never appears inside attr values)
      for (let j = flat.tokenStart; j < tokenEnd; j++) {
        if (tokens[j].type === TokenType.GreaterThan) {
          wrapped[i].openTagEndOffset = tokens[j].end;
          break;
        }
      }
      // Closing tag: find last LessThan+Slash pair (scanning backwards)
      if (wrapped[i].hasClosingTag) {
        for (let j = tokenEnd - 1; j > flat.tokenStart; j--) {
          if (tokens[j].type === TokenType.Slash && tokens[j - 1].type === TokenType.LessThan) {
            wrapped[i].closingTagStartOffset = tokens[j - 1].start;
            break;
          }
        }
      }
    }

    // Extract condition text and compute offsets for ConditionalComment nodes.
    // Opening token: ConditionalCommentStart "<!--[if CONDITION]>"
    // Closing token: ConditionalCommentEnd "<![endif]-->"
    if (flat.kind === NodeKind.ConditionalComment && flat.tokenCount > 0) {
      const firstToken = tokens[flat.tokenStart];
      if (firstToken.type === TokenType.ConditionalCommentStart) {
        const text = source.slice(firstToken.start, firstToken.end);
        wrapped[i].conditionalStartIsRevealed = text.endsWith("]><!-->");
        // Use [^\]]* to match condition across newlines, then normalize whitespace.
        // Reference: prettier-main/src/language-html/parse/conditional-comment.js
        const match = text.match(/^<!--\[if\s*([^\]]*)\]>/);
        if (match) {
          wrapped[i].condition = match[1].trim().replace(/\s+/g, " ");
        }
        // openTagEndOffset = position right after "<!--[if ...]>"
        wrapped[i].openTagEndOffset = firstToken.end;
      }
      // Check completeness: has ConditionalCommentEnd token
      const lastToken = tokens[flat.tokenStart + flat.tokenCount - 1];
      const isComplete = lastToken.type === TokenType.ConditionalCommentEnd;
      wrapped[i].complete = isComplete;
      if (isComplete) {
        const endText = source.slice(lastToken.start, lastToken.end);
        wrapped[i].conditionalEndIsHidden = endText.startsWith("<!--<![");
        wrapped[i].hasClosingTag = true;
        // closingTagStartOffset = position of "<![endif]-->"
        wrapped[i].closingTagStartOffset = lastToken.start;
      }
    }

    if (flat.kind === NodeKind.Comment) {
      const condition = parseIeConditionalStartCommentCondition(wrapped[i].rawText);
      if (condition !== null) {
        wrapped[i].isIeConditionalStartComment = true;
        wrapped[i].ieConditionalStartCondition = condition;
      }
    }
  }

  return wrapped[0]; // root
}

function nodeSourceRange(node: FlatNode, tokens: BuildResult["tokens"]): [number, number] {
  if (node.tokenCount === 0) return [0, 0];
  const first = tokens[node.tokenStart];
  const last = tokens[node.tokenStart + node.tokenCount - 1];
  return [first.start, last.end];
}

/**
 * Get source text for a node's "own" tokens - tokens that belong to this node
 * but not to any of its children. For leaf nodes this is the full text.
 * For container nodes (Element, DirectiveBlock) this is typically empty or
 * just the structural tokens (tags, directive markers).
 */
function ownTokenText(node: FlatNode, tokens: BuildResult["tokens"], source: string): string {
  if (node.tokenCount === 0) return "";
  const s = tokens[node.tokenStart];
  const e = tokens[node.tokenStart + node.tokenCount - 1];
  return source.slice(s.start, e.end);
}

function shouldMaterializeRawText(kind: number): boolean {
  switch (kind) {
    case NodeKind.Text:
    case NodeKind.Comment:
    case NodeKind.BogusComment:
    case NodeKind.BladeComment:
    case NodeKind.Doctype:
    case NodeKind.ElementName:
    case NodeKind.ClosingElementName:
      return true;
    default:
      return false;
  }
}

function parseCommentValue(rawText: string): string | null {
  const match = rawText.match(/^<!--([\s\S]*?)-->$/);
  return match ? match[1] : null;
}

function parseIeConditionalStartCommentCondition(rawText: string): string | null {
  const value = parseCommentValue(rawText);
  if (value === null) return null;
  const match = value.match(/^\[if([^\]]*)\]><!$/s);
  if (!match) return null;
  return match[1].trim().replace(/\s+/g, " ");
}

function prependFrontMatterNode(root: WrappedNode, source: string, frontMatter: FrontMatter): void {
  const lineOffsets = buildLineOffsets(source);
  const endLine = getLine(Math.max(frontMatter.end.index - 1, 0), lineOffsets);

  const frontMatterNode: WrappedNode = {
    kind: "frontMatter",
    flatIndex: -1,
    flat: root.flat,
    parent: root,
    children: [],
    source,
    start: frontMatter.start.index,
    end: frontMatter.end.index,
    rawText: frontMatter.raw,
    raw: frontMatter.raw,
    value: frontMatter.value,
    language: frontMatter.language,
    explicitLanguage: frontMatter.explicitLanguage,
    startDelimiter: frontMatter.startDelimiter,
    endDelimiter: frontMatter.endDelimiter,
    buildResult: root.buildResult,
    attrs: [],
    tagName: "",
    rawTagName: "",
    rawClosingTagName: "",
    fullName: "",
    name: "",
    namespace: "",
    hasClosingTag: false,
    openTagEndOffset: 0,
    closingTagStartOffset: 0,
    startLine: 0,
    endLine,
    prev: null,
    next: null,
    isSelfClosing: true,
    hasHtmComponentClosingTag: false,
    condition: "",
    complete: true,
    conditionalStartIsRevealed: false,
    conditionalEndIsHidden: false,
    isIeConditionalStartComment: false,
    ieConditionalStartCondition: "",
    cssDisplay: "inline",
    isWhitespaceSensitive: false,
    isIndentationSensitive: false,
    isLeadingSpaceSensitive: false,
    isTrailingSpaceSensitive: false,
    isDanglingSpaceSensitive: false,
    hasLeadingSpaces: false,
    hasTrailingSpaces: false,
    hasDanglingSpaces: false,
  };

  markFrontMatter(frontMatterNode);
  root.children.unshift(frontMatterNode);
}

function parse(text: string, options?: unknown): WrappedNode {
  const { frontMatter, content } = parseFrontMatter(text);

  const syntaxProfile = resolveBladeSyntaxProfile(options);
  const lexerDirectives = LexerDirectives.acceptAll();

  const { tokens } = tokenize(content, lexerDirectives, {
    verbatimStartDirectives: syntaxProfile.verbatimStartDirectives,
    verbatimEndDirectives: syntaxProfile.verbatimEndDirectives,
  });

  const directives = TreeDirectives.withDefaults(syntaxProfile.treeDirectives);
  directives.train(tokens, content);
  const result = buildTree(tokens, content, directives);
  const root = wrapTree(result);

  if (frontMatter) {
    prependFrontMatterNode(root, text, frontMatter);
  }

  return root;
}

export const bladeParser: Parser<WrappedNode> = {
  parse,
  hasPragma,
  astFormat: "blade-ast",
  locStart: (node: WrappedNode) => node.start,
  locEnd: (node: WrappedNode) => node.end,
};
