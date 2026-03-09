import type { AstPath, Doc, Options } from "prettier";
import { doc } from "prettier";
import type { WrappedNode } from "../types.js";
import { NodeKind } from "../tree/types.js";
import { TokenType } from "../lexer/types.js";
import {
  formatDirectiveNameToken,
  getBladeBlankLinesMode,
  getDirectiveArgSpacingMode,
  getDirectiveBlockStyle,
} from "./blade-options.js";
import { trimTrailingHorizontalWhitespace } from "../string-utils.js";
import { isEchoLike, isTextLikeNode } from "../node-predicates.js";
import { fullText, preferHardlineAsLeadingSpaces } from "./utils.js";
import { replaceEndOfLine } from "./doc-utils.js";

const { indent, hardline } = doc.builders;

type BranchNodeKind = NodeKind.Directive | NodeKind.PhpTag;

function isBranchNode(node: WrappedNode): node is WrappedNode & { kind: BranchNodeKind } {
  return node.kind === NodeKind.Directive || node.kind === NodeKind.PhpTag;
}

const BODY_BLANK_LINE_LAYOUT_DIRECTIVES = new Set([
  "include",
  "includeif",
  "includewhen",
  "includeunless",
  "includefirst",
  "each",
]);

export function printDirective(node: WrappedNode, options: Options): Doc {
  return renderDirectiveTokens(node, options);
}

function renderDirectiveTokens(node: WrappedNode, options: Options): string {
  const br = node.buildResult;
  const tc = node.flat.tokenCount;
  let result = "";
  const argSpacingMode = getDirectiveArgSpacingMode(options);
  const start = node.flat.tokenStart;
  let sawDirectiveToken = false;
  let sawArgsToken = false;

  for (let i = 0; i < tc; i++) {
    const tokenIndex = start + i;
    const t = br.tokens[tokenIndex];
    const prev = tokenIndex > start ? br.tokens[tokenIndex - 1] : null;
    const next = tokenIndex + 1 < start + tc ? br.tokens[tokenIndex + 1] : null;
    const tokenText = br.source.slice(t.start, t.end);

    if (t.type === TokenType.Directive) {
      result += formatDirectiveNameToken(tokenText, options);
      sawDirectiveToken = true;
      if (argSpacingMode === "space" && next?.type === TokenType.DirectiveArgs) {
        result += " ";
      }
      continue;
    }

    if (!sawDirectiveToken) {
      continue;
    }

    if (
      t.type === TokenType.Whitespace &&
      prev?.type === TokenType.Directive &&
      next?.type === TokenType.DirectiveArgs
    ) {
      if (argSpacingMode === "preserve") {
        result += tokenText;
      } else if (argSpacingMode === "space" && !result.endsWith(" ")) {
        result += " ";
      }
      continue;
    }

    if (t.type === TokenType.DirectiveArgs && !sawArgsToken) {
      // Normalize line-tail spaces inside directive args so malformed or
      // intentionally odd arg layouts still converge without trailing-space
      // churn across passes/options.
      result += trimTrailingHorizontalWhitespace(tokenText);
      sawArgsToken = true;
      continue;
    }

    // Recovery mode: unclosed directive blocks can have opener token ranges
    // that spill into body content. Stop when header tokens end.
    break;
  }

  if (!sawDirectiveToken) {
    return "";
  }

  if (hasUnterminatedDirectiveArgsAtEof(node)) {
    // Recovery mode: keep malformed args content, but trim trailing whitespace
    // so root-level hardline emission stays idempotent across passes.
    return result.replace(/\s+$/u, "");
  }

  return result;
}

function hasUnterminatedDirectiveArgsAtEof(node: WrappedNode): boolean {
  const start = node.flat.tokenStart;
  const end = start + node.flat.tokenCount;
  const tokens = node.buildResult.tokens;

  for (let i = start; i < end; i++) {
    const token = tokens[i];
    if (token.type !== TokenType.DirectiveArgs) continue;
    if (token.end < node.source.length) return false;

    const text = node.source.slice(token.start, token.end);
    if (!text.startsWith("(")) return false;
    return !text.trimEnd().endsWith(")");
  }

  return false;
}

export function printDirectiveBlock(
  node: WrappedNode,
  path: AstPath<WrappedNode>,
  print: (path: AstPath<WrappedNode>) => Doc,
  options: Options,
): Doc {
  if (shouldFallbackMalformedDirectiveBlock(node)) {
    return fullText(node).replace(/\s+$/u, "");
  }

  if (shouldFallbackUnterminatedRootDirectiveBlock(node)) {
    return fullText(node).replace(/\s+$/u, "");
  }

  // Tree structure:
  //   DirectiveBlock
  //     Directive (@if)        <- opener; its children are the body content
  //       Text / Element ...   <- body
  //     Directive (@else)      <- intermediate; its children are branch body
  //       Text / Element ...
  //     Directive (@endif)     <- closer; no children

  const children = node.children;
  if (children.length === 0) return "";

  const style = getDirectiveBlockStyle(options);
  if (style !== "multiline" && shouldPreserveInlineBlock(node, style)) {
    return printDirectiveBlockInline(path, print);
  }

  return printDirectiveBlockMultiline(node, path, print, options);
}

function shouldFallbackMalformedDirectiveBlock(node: WrappedNode): boolean {
  return node.children.some((child) => !isBranchNode(child));
}

function shouldFallbackUnterminatedRootDirectiveBlock(node: WrappedNode): boolean {
  if (node.parent?.kind !== NodeKind.Root) {
    return false;
  }

  // Treat trailing root whitespace as EOF-equivalent so pass-2 formatting
  // does not toggle fallback behavior.
  if (/\S/u.test(node.source.slice(node.end))) {
    return false;
  }

  const branches = node.children.filter((child) => isBranchNode(child));
  if (branches.length === 0) {
    return false;
  }

  const lastBranch = branches[branches.length - 1];
  if (lastBranch.children.length === 0) {
    return false;
  }

  // PHP alternative-syntax blocks are especially brittle when truncated.
  if (branches.some((branch) => branch.kind === NodeKind.PhpTag)) {
    return true;
  }

  // Keep normal structured formatting for simple unterminated directive bodies
  // (for example: @if (...)<newline><p>Hello world).
  if (isSimpleUnterminatedDirectiveBody(lastBranch)) {
    return false;
  }

  return true;
}

function isSimpleUnterminatedDirectiveBody(branch: WrappedNode): boolean {
  const meaningfulChildren = branch.children.filter(
    (child) => !(child.kind === NodeKind.Text && child.rawText.trim().length === 0),
  );

  if (meaningfulChildren.length !== 1) {
    return false;
  }

  return isSimpleLeafBodyNode(meaningfulChildren[0]);
}

function isSimpleLeafBodyNode(node: WrappedNode): boolean {
  if (
    node.kind === NodeKind.Text ||
    node.kind === NodeKind.Echo ||
    node.kind === NodeKind.RawEcho ||
    node.kind === NodeKind.TripleEcho
  ) {
    return true;
  }

  if (node.kind !== NodeKind.Element) {
    return false;
  }

  if (node.attrs.length > 0) {
    return false;
  }

  let hasAttribute = false;
  let hasNestedElement = false;

  const stack: WrappedNode[] = [...node.children];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current.kind === NodeKind.Attribute || current.kind === NodeKind.JsxAttribute) {
      hasAttribute = true;
      continue;
    }
    if (current.kind === NodeKind.Element) {
      hasNestedElement = true;
      break;
    }
    if (current.children.length > 0) {
      stack.push(...current.children);
    }
  }

  return !hasAttribute && !hasNestedElement;
}

function printDirectiveBody(
  branchPath: AstPath<WrappedNode>,
  print: (path: AstPath<WrappedNode>) => Doc,
  options: Options,
): Doc[] {
  const docs: Doc[] = [];
  const branch = branchPath.node;

  branchPath.each((childPath, i) => {
    const child = childPath.node;

    if (docs.length > 0) {
      const prev = branch.children[i - 1];
      if (prev) {
        docs.push(printBetweenLine(prev, child));
      }
    }

    // Directive children with their own body (e.g. @case/@default inside
    // @switch): print the directive marker, then recurse into its body
    // indented - mirroring how printDirectiveBlockMultiline handles its
    // direct Directive children.
    if (isBranchNode(child) && child.children.length > 0) {
      docs.push(
        child.kind === NodeKind.Directive
          ? renderDirectiveTokens(child, options)
          : print(childPath),
      );
      const nestedDocs = printDirectiveBody(childPath, print, options);
      if (nestedDocs.length > 0) {
        docs.push(indent([hardline, nestedDocs]));
      }
    } else {
      docs.push(printDirectiveBodyChild(childPath, print));
    }
  }, "children");

  return docs;
}

function printDirectiveBodyInline(
  branchPath: AstPath<WrappedNode>,
  print: (path: AstPath<WrappedNode>) => Doc,
): Doc[] {
  const docs: Doc[] = [];
  let prev: WrappedNode | null = null;

  branchPath.each((childPath) => {
    const child = childPath.node;
    if (prev !== null) {
      const between = getSourceBetween(prev, child);
      if (/\s/.test(between)) {
        docs.push(" ");
      }
    }
    docs.push(printDirectiveBodyChild(childPath, print));
    prev = child;
  }, "children");

  return docs;
}

function printDirectiveBlockInline(
  path: AstPath<WrappedNode>,
  print: (path: AstPath<WrappedNode>) => Doc,
): Doc {
  const segments: Doc[] = [];
  let previousDirective: WrappedNode | null = null;

  path.each((childPath) => {
    const child = childPath.node;
    if (!isBranchNode(child)) {
      segments.push(print(childPath));
      return;
    }

    if (segments.length > 0) {
      const separator = getInlineDirectiveSeparator(previousDirective, child);
      if (separator.length > 0) {
        segments.push(separator);
      }
    }

    segments.push(print(childPath));
    if (child.children.length > 0) {
      const body = printDirectiveBodyInline(childPath, print);
      if (body.length > 0) {
        segments.push(" ", body);
      }
    }

    previousDirective = child;
  }, "children");

  return segments;
}

function printDirectiveBlockMultiline(
  node: WrappedNode,
  path: AstPath<WrappedNode>,
  print: (path: AstPath<WrappedNode>) => Doc,
  options: Options,
): Doc {
  const branches = node.children.filter((child) => isBranchNode(child));
  if (branches.length === 0) {
    return path.map((childPath) => print(childPath), "children");
  }

  const segments: Doc[] = [];
  const separators: Doc[] = [];
  const blankMode = getBladeBlankLinesMode(options);
  let directiveIndex = 0;

  path.each((childPath) => {
    const child = childPath.node;
    if (!isBranchNode(child)) return;

    const segment: Doc[] = [print(childPath)];
    if (child.children.length > 0) {
      const bodyDocs = printDirectiveBody(childPath, print, options);
      if (bodyDocs.length > 0) {
        segment.push(indent([hardline, bodyDocs]));
      }
    }
    segments.push(segment);

    const nextDirective = branches[directiveIndex + 1];
    if (!nextDirective) return;

    separators.push(getDirectiveSeparator(child, nextDirective, blankMode));
    directiveIndex++;
  }, "children");

  if (segments.length === 1) return segments[0];

  const output: Doc[] = [segments[0]];
  for (let i = 0; i < separators.length; i++) {
    output.push(separators[i], segments[i + 1]);
  }
  return output;
}

function printDirectiveBodyChild(
  childPath: AstPath<WrappedNode>,
  print: (path: AstPath<WrappedNode>) => Doc,
): Doc {
  const child = childPath.node;
  if (
    child.kind === NodeKind.Text &&
    ((child.prev !== null && isEchoLike(child.prev)) ||
      (child.next !== null && isEchoLike(child.next)))
  ) {
    return replaceEndOfLine(child.rawText);
  }

  return print(childPath);
}

function shouldPreserveInlineBlock(
  node: WrappedNode,
  style: ReturnType<typeof getDirectiveBlockStyle>,
): boolean {
  const inlineAtTopLevel = isInlineDirectiveBlock(node);
  if (inlineAtTopLevel) return true;

  if (style !== "inline-if-short") {
    return false;
  }

  // Optional inline-if-short heuristic:
  // keep only very small blocks inline when the body is simple text/echo.
  const directives = node.children.filter((child) => isBranchNode(child));
  if (directives.length !== 2) return false;

  const opener = directives[0];
  if (opener.children.length !== 1) return false;
  const onlyBody = opener.children[0];
  if (
    onlyBody.kind !== NodeKind.Text &&
    onlyBody.kind !== NodeKind.Echo &&
    onlyBody.kind !== NodeKind.RawEcho &&
    onlyBody.kind !== NodeKind.TripleEcho
  ) {
    return false;
  }

  return fullText(node).trim().length <= 60;
}

function getDirectiveSeparator(
  prev: WrappedNode,
  next: WrappedNode,
  mode: ReturnType<typeof getBladeBlankLinesMode>,
): Doc {
  if (shouldSuppressDirectiveSeparator(prev, next)) {
    return "";
  }
  const between = getDirectiveSourceBetweenBranches(prev, next);
  if (mode === "always") {
    return [hardline, hardline];
  }
  return hasBlankLineBetween(between) ? [hardline, hardline] : hardline;
}

function getInlineDirectiveSeparator(prev: WrappedNode | null, next: WrappedNode): string {
  if (!prev) return "";
  if (shouldSuppressDirectiveSeparator(prev, next)) {
    return "";
  }
  const between = getSourceBetween(prev, next);
  if (between.length === 0) {
    return "";
  }
  return /\s$/.test(between) ? " " : "";
}

function hasBlankLineBetween(between: string): boolean {
  return /\r?\n\s*\r?\n/.test(between);
}

function getPhpTagKeyword(node: WrappedNode): string | null {
  if (node.kind !== NodeKind.PhpTag) {
    return null;
  }

  const match = fullText(node)
    .trim()
    .match(/^<\?(?:php)?\s*([a-z_][a-z0-9_]*)/iu);
  return match?.[1]?.toLowerCase() ?? null;
}

function shouldSuppressDirectiveSeparator(prev: WrappedNode, next: WrappedNode): boolean {
  // PHP alternative switch syntax requires zero output between
  // `switch (...):` and the first `case`/`default`.
  return (
    prev.children.length === 0 &&
    getPhpTagKeyword(prev) === "switch" &&
    (getPhpTagKeyword(next) === "case" || getPhpTagKeyword(next) === "default")
  );
}

function isInlineDirectiveBlock(node: WrappedNode): boolean {
  const directives = node.children.filter((child) => isBranchNode(child));
  if (directives.length === 0) return false;

  for (let i = 0; i < directives.length; i++) {
    const directive = directives[i];

    if (directive.children.length > 0) {
      const firstBodyChild = directive.children[0];
      if (firstBodyChild.startLine > directive.endLine) {
        return false;
      }

      for (const child of directive.children) {
        if (child.endLine > child.startLine) {
          return false;
        }
        if (!isDirectiveInElementOpenTag(directive) && child.kind === NodeKind.Element) {
          return false;
        }
      }

      for (let j = 1; j < directive.children.length; j++) {
        if (directive.children[j].startLine > directive.children[j - 1].endLine) {
          return false;
        }
      }
    }

    const nextDirective = directives[i + 1];
    const branchEndLine =
      directive.children.length > 0
        ? directive.children[directive.children.length - 1].endLine
        : directive.endLine;
    if (nextDirective && nextDirective.startLine > branchEndLine) {
      return false;
    }
  }

  return true;
}

function isDirectiveInElementOpenTag(directive: WrappedNode): boolean {
  const parent = directive.parent;
  if (!parent || parent.kind !== NodeKind.Element) return false;
  return directive.end <= parent.openTagEndOffset;
}

function getSourceBetween(prev: WrappedNode, next: WrappedNode): string {
  if (prev.source !== next.source) {
    return "";
  }
  return getSourceBetweenBounds(prev.source, prev.end, next.start);
}

function getSourceBetweenBounds(source: string, start: number, end: number): string {
  if (start > end) {
    return "";
  }
  return source.slice(start, end);
}

function getDirectiveSourceBetweenBranches(
  prevDirective: WrappedNode,
  nextDirective: WrappedNode,
): string {
  if (prevDirective.source !== nextDirective.source) {
    return "";
  }
  const prevBranchEnd = getDirectiveBranchEnd(prevDirective);
  return getSourceBetweenBounds(prevDirective.source, prevBranchEnd, nextDirective.start);
}

function getDirectiveBranchEnd(directive: WrappedNode): number {
  if (directive.children.length === 0) {
    return directive.end;
  }
  return directive.children[directive.children.length - 1].end;
}

function printBetweenLine(prev: WrappedNode, next: WrappedNode): Doc {
  // Escaped blade prefixes (e.g. @@, @{{, @{!!) must stay attached to
  // the following construct/text to preserve semantics.
  if (prev.kind === NodeKind.NonOutput || next.kind === NodeKind.NonOutput) {
    return "";
  }

  const sourceBetween = getSourceBetween(prev, next);
  const hasLineBreakBetweenNodes = /[\r\n]/.test(sourceBetween) || next.startLine > prev.endLine;

  if (hasBlankLineBetween(sourceBetween) && shouldPreserveBodyBlankLine(prev, next)) {
    return [hardline, hardline];
  }

  // Case 1: Both text-like - respect trailing space sensitivity.
  if (isTextLikeNode(prev) && isTextLikeNode(next)) {
    if (prev.isTrailingSpaceSensitive) {
      if (prev.hasTrailingSpaces) {
        if (isEchoLike(prev) || isEchoLike(next)) {
          return hasLineBreakBetweenNodes ? hardline : " ";
        }
        return preferHardlineAsLeadingSpaces(next) ? hardline : doc.builders.line;
      }
      return "";
    }
    if (isEchoLike(prev) || isEchoLike(next)) {
      return hasLineBreakBetweenNodes ? hardline : "";
    }
    return preferHardlineAsLeadingSpaces(next) ? hardline : doc.builders.softline;
  }

  // Case 2: Block-like or hardline-preferred - always hardline.
  if (!next.isLeadingSpaceSensitive || preferHardlineAsLeadingSpaces(next)) {
    return hardline;
  }

  // Case 3: Has leading spaces - breakable space.
  if (next.hasLeadingSpaces) {
    return doc.builders.line;
  }

  // Default: softline.
  return doc.builders.softline;
}

function shouldPreserveBodyBlankLine(prev: WrappedNode, next: WrappedNode): boolean {
  // Nested branch markers such as @default/@else inside directive bodies already
  // have dedicated separator handling. Preserving source blank lines here causes
  // pass-2 duplication when an outer mode like `always` inserts its own branch gap.
  if (isBranchNode(next) && next.children.length > 0) {
    return false;
  }

  // Keep preserve-mode scope narrow: retain authored gaps only for layout-like
  // boundaries such as `@include` before a container component. This matches
  // the expected section-body use case without changing general directive-body
  // spacing across the validation corpus.
  return (
    (isBodyLayoutDirective(prev) && isContainerLikeBodySibling(next)) ||
    (isBodyLayoutDirective(next) && isContainerLikeBodySibling(prev))
  );
}

function isBodyLayoutDirective(node: WrappedNode): boolean {
  if (node.kind !== NodeKind.Directive) {
    return false;
  }

  const directiveToken = findFirstToken(node, TokenType.Directive);
  if (!directiveToken) {
    return false;
  }

  const raw = node.source.slice(directiveToken.start, directiveToken.end);
  const name = raw.startsWith("@") ? raw.slice(1).toLowerCase() : raw.toLowerCase();
  return BODY_BLANK_LINE_LAYOUT_DIRECTIVES.has(name);
}

function isContainerLikeBodySibling(node: WrappedNode): boolean {
  if (isTextLikeNode(node)) {
    return false;
  }

  if (node.kind === NodeKind.Element) {
    return node.children.length > 0 && isComponentLikeElement(node);
  }

  return node.children.length > 0;
}

function isComponentLikeElement(node: WrappedNode): boolean {
  return node.tagName.includes("-") || node.fullName.includes(":");
}

function findFirstToken(node: WrappedNode, type: TokenType) {
  const start = node.flat.tokenStart;
  const end = start + node.flat.tokenCount;
  const tokens = node.buildResult.tokens;

  for (let i = start; i < end; i++) {
    if (tokens[i].type === type) {
      return tokens[i];
    }
  }

  return null;
}
