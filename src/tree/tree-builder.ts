import { TokenType, type Token } from "../lexer/types.js";
import {
  NodeKind,
  StructureRole,
  ArgumentRequirement,
  NONE,
  createFlatNode,
  type FlatNode,
  type BuildResult,
  type DirectiveFrame,
  type ConditionFrame,
  type SwitchFrame,
} from "./types.js";
import { VOID_ELEMENTS } from "./void-elements.js";
import * as OptionalTags from "./optional-tags.js";
import * as Constructs from "./construct-scanner.js";
import { Directives } from "./directives.js";
import { extractDirectiveName, checkDirectiveArgsFast } from "./directive-helper.js";
import { DirectiveTokenIndex } from "./directive-token-index.js";
import { countArguments, startsWithArray, unwrapParentheses } from "./argument-scanner.js";

type PhpTagShorthandRole = "open" | "branch" | "close";
type PhpTagShorthandContext = "if" | "switch" | "for" | "foreach" | "while" | "declare";

interface PhpTagShorthandMatch {
  role: PhpTagShorthandRole;
  name: string;
  context: PhpTagShorthandContext;
}

function classifyPhpTagShorthand(source: string): PhpTagShorthandMatch | null {
  const phpTagMatch = source.match(/^<\?(php)\s*([\s\S]*?)\s*\?>$/i);
  if (!phpTagMatch) return null;

  const body = phpTagMatch[2]?.trim() ?? "";
  if (body.length === 0) return null;

  if (/^if\b[\s\S]*:\s*$/iu.test(body)) {
    return { role: "open", name: "if", context: "if" };
  }
  if (/^elseif\b[\s\S]*:\s*$/iu.test(body)) {
    return { role: "branch", name: "elseif", context: "if" };
  }
  if (/^else\s*:\s*$/iu.test(body)) {
    return { role: "branch", name: "else", context: "if" };
  }
  if (/^endif\s*;?\s*$/iu.test(body)) {
    return { role: "close", name: "endif", context: "if" };
  }

  if (/^switch\b[\s\S]*:\s*$/iu.test(body)) {
    return { role: "open", name: "switch", context: "switch" };
  }
  if (/^case\b[\s\S]*:\s*$/iu.test(body)) {
    return { role: "branch", name: "case", context: "switch" };
  }
  if (/^default\s*:\s*$/iu.test(body)) {
    return { role: "branch", name: "default", context: "switch" };
  }
  if (/^endswitch\s*;?\s*$/iu.test(body)) {
    return { role: "close", name: "endswitch", context: "switch" };
  }

  if (/^for\b[\s\S]*:\s*$/iu.test(body)) {
    return { role: "open", name: "for", context: "for" };
  }
  if (/^endfor\s*;?\s*$/iu.test(body)) {
    return { role: "close", name: "endfor", context: "for" };
  }

  if (/^foreach\b[\s\S]*:\s*$/iu.test(body)) {
    return { role: "open", name: "foreach", context: "foreach" };
  }
  if (/^endforeach\s*;?\s*$/iu.test(body)) {
    return { role: "close", name: "endforeach", context: "foreach" };
  }

  if (/^while\b[\s\S]*:\s*$/iu.test(body)) {
    return { role: "open", name: "while", context: "while" };
  }
  if (/^endwhile\s*;?\s*$/iu.test(body)) {
    return { role: "close", name: "endwhile", context: "while" };
  }

  if (/^declare\b[\s\S]*:\s*$/iu.test(body)) {
    return { role: "open", name: "declare", context: "declare" };
  }
  if (/^enddeclare\s*;?\s*$/iu.test(body)) {
    return { role: "close", name: "enddeclare", context: "declare" };
  }

  return null;
}

export class TreeBuilder {
  private nodes: FlatNode[] = [];
  private nodeCount = 0;

  private openElements: number[] = [];
  private openDirectives: DirectiveFrame[] = [];
  private openConditions: ConditionFrame[] = [];
  private openSwitches: SwitchFrame[] = [];
  private openPhpTagConditions: ConditionFrame[] = [];

  private pos = 0;

  private tagNames = new Map<number, string>();
  private rawTagNames = new Map<number, string>();
  private dynamicTagNames = new Set<number>();
  private tagNameStacks = new Map<string, number[]>();

  private directiveIndex: DirectiveTokenIndex | null = null;

  private readonly maxElementDepth = 512;
  private readonly maxDirectiveDepth = 256;
  private readonly maxConditionDepth = 256;

  constructor(
    private readonly tokens: readonly Token[],
    private readonly source: string,
    private readonly directives: Directives = Directives.withDefaults(),
  ) {}

  build(): BuildResult {
    this.nodes.push(createFlatNode(NodeKind.Root, NONE, 0, 0));
    this.nodeCount = 1;
    this.openElements.push(0);

    const total = this.tokens.length;
    while (this.pos < total) {
      this.processToken();
    }

    this.closeRemainingDirectives();
    this.closeRemainingElements();

    return {
      nodes: this.nodes,
      source: this.source,
      tokens: this.tokens,
      directives: this.directives,
    };
  }

  private processToken(): void {
    const type = this.tokens[this.pos].type;

    switch (type) {
      case TokenType.LessThan:
        this.processElementStart();
        break;
      case TokenType.Text:
      case TokenType.TagName:
        this.processText();
        break;
      case TokenType.Whitespace:
        this.processText();
        break;
      case TokenType.AtSign:
        this.processAtSign();
        break;
      case TokenType.EchoStart:
        this.processEcho();
        break;
      case TokenType.RawEchoStart:
        this.processRawEcho();
        break;
      case TokenType.TripleEchoStart:
        this.processTripleEcho();
        break;
      case TokenType.Directive:
        this.processDirective();
        break;
      case TokenType.VerbatimStart:
        this.createBlockNode(this.pos, TokenType.VerbatimEnd, NodeKind.Verbatim);
        break;
      case TokenType.BladeCommentStart:
        this.createBlockNode(this.pos, TokenType.BladeCommentEnd, NodeKind.BladeComment);
        break;
      case TokenType.CommentStart:
        this.createBlockNode(this.pos, TokenType.CommentEnd, NodeKind.Comment);
        break;
      case TokenType.BogusComment:
        this.addChild(createFlatNode(NodeKind.BogusComment, 0, this.pos, 1, 0, 1));
        this.pos++;
        break;
      case TokenType.DoctypeStart:
        this.createBlockNode(this.pos, TokenType.DoctypeEnd, NodeKind.Doctype);
        break;
      case TokenType.PhpBlockStart:
        this.createBlockNode(this.pos, TokenType.PhpBlockEnd, NodeKind.PhpBlock);
        break;
      case TokenType.PhpTagStart:
        this.processPhpTag();
        break;
      case TokenType.PhpBlockEnd:
        this.processOrphanPhpBlockEnd();
        break;
      case TokenType.ConditionalCommentStart:
        this.createConditionalComment();
        break;
      case TokenType.CdataStart:
        this.createBlockNode(this.pos, TokenType.CdataEnd, NodeKind.Cdata);
        break;
      case TokenType.DeclStart:
        this.createDecl();
        break;
      case TokenType.PIStart:
        this.createBlockNode(this.pos, TokenType.PIEnd, NodeKind.ProcessingInstruction);
        break;
      case TokenType.ConditionalCommentEnd:
      case TokenType.GreaterThan:
        this.emitSingleTokenText();
        break;
      default:
        this.pos++;
        break;
    }
  }

  private addChild(node: FlatNode): number {
    this.implicitlyCloseVoidElements();

    const parentIdx = this.getCurrentParent();
    node.parent = parentIdx;

    const nodeIdx = this.nodeCount++;
    this.nodes[nodeIdx] = node;

    const parent = this.nodes[parentIdx];
    if (parent.firstChild === NONE) {
      parent.firstChild = nodeIdx;
    } else {
      this.nodes[parent.lastChild].nextSibling = nodeIdx;
    }
    parent.lastChild = nodeIdx;

    return nodeIdx;
  }

  private getCurrentParent(): number {
    const last = this.openElements[this.openElements.length - 1];
    return last !== undefined ? last : 0;
  }

  private createFirstChild(
    parentIdx: number,
    kind: number,
    tokenStart: number,
    tokenCount: number,
  ): number {
    const childIdx = this.nodeCount++;
    this.nodes[childIdx] = createFlatNode(kind, parentIdx, tokenStart, tokenCount);
    this.nodes[parentIdx].firstChild = childIdx;
    this.nodes[parentIdx].lastChild = childIdx;
    return childIdx;
  }

  private createSiblingChild(
    prevSiblingIdx: number,
    parentIdx: number,
    kind: number,
    tokenStart: number,
    tokenCount: number,
  ): number {
    const childIdx = this.nodeCount++;
    this.nodes[childIdx] = createFlatNode(kind, parentIdx, tokenStart, tokenCount);
    this.nodes[prevSiblingIdx].nextSibling = childIdx;
    this.nodes[parentIdx].lastChild = childIdx;
    return childIdx;
  }

  private popIfTop(idx: number): void {
    if (this.openElements[this.openElements.length - 1] === idx) {
      const popped = this.openElements.pop()!;
      this.cleanupTagNameStack(popped);
    }
  }

  private popElementsToDepth(targetDepth: number): void {
    while (this.openElements.length > targetDepth) {
      const popped = this.openElements.pop()!;
      this.cleanupTagNameStack(popped);
    }
  }

  private cleanupTagNameStack(elementIdx: number): void {
    const tagName = this.tagNames.get(elementIdx);
    this.tagNames.delete(elementIdx);
    this.rawTagNames.delete(elementIdx);
    this.dynamicTagNames.delete(elementIdx);
    if (tagName === undefined) return;

    const stack = this.tagNameStacks.get(tagName);
    if (stack && stack.length > 0) {
      stack.pop();
      if (stack.length === 0) {
        this.tagNameStacks.delete(tagName);
      }
    }
  }

  private checkElementDepth(): void {
    if (this.openElements.length >= this.maxElementDepth) {
      throw new Error(`Maximum element nesting depth (${this.maxElementDepth}) exceeded.`);
    }
  }

  private checkDirectiveDepth(): void {
    if (this.openDirectives.length >= this.maxDirectiveDepth) {
      throw new Error(`Maximum directive nesting depth (${this.maxDirectiveDepth}) exceeded.`);
    }
  }

  private checkConditionDepth(): void {
    if (this.openConditions.length + this.openPhpTagConditions.length >= this.maxConditionDepth) {
      throw new Error(`Maximum condition nesting depth (${this.maxConditionDepth}) exceeded.`);
    }
  }

  private implicitlyCloseVoidElements(): void {
    while (this.openElements.length > 1) {
      const topIdx = this.openElements[this.openElements.length - 1];
      const tagName = this.tagNames.get(topIdx);

      if (tagName === undefined || !VOID_ELEMENTS.has(tagName)) break;

      this.openElements.pop();

      const stack = this.tagNameStacks.get(tagName);
      if (stack) {
        stack.pop();
        if (stack.length === 0) this.tagNameStacks.delete(tagName);
      }
    }
  }

  private autoCloseElementsForSibling(newTag: string): void {
    if (newTag === "") return;

    const conditions = OptionalTags.getClosingConditions(newTag);
    if (conditions?.autoCloseAtParentEnd) {
      const containerIndex = this.findNearestValidContainer(
        conditions.autoCloseAtParentEnd as string[],
      );
      if (containerIndex >= 0) {
        this.autoCloseElementsBetween(containerIndex, newTag);
        return;
      }
      return;
    }

    this.autoCloseImmediateParent(newTag);
  }

  private autoCloseElementsBetween(containerIndex: number, newTag: string): void {
    let closeUpToIndex = -1;

    for (let i = this.openElements.length - 1; i > containerIndex; i--) {
      const elementIdx = this.openElements[i];
      if (this.nodes[elementIdx].kind !== NodeKind.Element) continue;

      const tagName = this.tagNames.get(elementIdx) ?? "";
      if (tagName === "") continue;

      const parentTagName = this.parentTagNameOf(elementIdx);

      if (OptionalTags.shouldAutoCloseElement(tagName, newTag, parentTagName, false)) {
        closeUpToIndex = i;
      }
    }

    if (closeUpToIndex >= 0) {
      while (this.openElements.length > closeUpToIndex) {
        const popped = this.openElements.pop()!;
        this.cleanupTagNameStack(popped);
      }
    }
  }

  private autoCloseImmediateParent(newTag: string): void {
    if (this.openElements.length <= 1) return;

    const currentIdx = this.openElements[this.openElements.length - 1];
    if (this.nodes[currentIdx].kind !== NodeKind.Element) return;

    const currentTagName = this.tagNames.get(currentIdx) ?? "";
    if (currentTagName === "") return;

    const parentTagName = this.parentTagNameOf(currentIdx);

    if (!OptionalTags.isInValidParentContext(currentTagName, parentTagName)) return;

    if (OptionalTags.shouldAutoCloseElement(currentTagName, newTag, parentTagName, false)) {
      this.openElements.pop();
      this.cleanupTagNameStack(currentIdx);
    }
  }

  private findNearestValidContainer(validParents: string[]): number {
    for (let i = this.openElements.length - 1; i > 0; i--) {
      const elementIdx = this.openElements[i];
      if (this.nodes[elementIdx].kind !== NodeKind.Element) continue;

      const tagName = this.tagNames.get(elementIdx) ?? "";
      if (tagName === "") continue;

      if (validParents.includes(tagName)) return i;
    }
    return -1;
  }

  private parentTagNameOf(idx: number): string | null {
    const parentIdx = this.nodes[idx].parent;
    if (parentIdx <= 0 || !this.nodes[parentIdx]) return null;
    if (this.nodes[parentIdx].kind !== NodeKind.Element) return null;
    return this.tagNames.get(parentIdx) ?? null;
  }

  private closeRemainingElements(): void {
    const totalTokens = this.tokens.length;
    for (const elementIdx of this.openElements) {
      if (elementIdx === 0) continue;
      this.nodes[elementIdx].tokenCount = totalTokens - this.nodes[elementIdx].tokenStart;
    }
  }

  private processText(): void {
    const parentIdx = this.getCurrentParent();
    const parent = this.nodes[parentIdx];

    if (parent.lastChild !== NONE) {
      const lastChild = this.nodes[parent.lastChild];
      if (lastChild.kind === NodeKind.Text) {
        lastChild.tokenCount++;
        this.pos++;
        return;
      }
    }

    const startPos = this.pos;
    this.pos++;

    this.addChild(createFlatNode(NodeKind.Text, 0, startPos, 1));
  }

  private processAtSign(): void {
    const startPos = this.pos;
    this.pos++;
    this.addChild(createFlatNode(NodeKind.NonOutput, 0, startPos, 1));
  }

  private emitSingleTokenText(): void {
    const startPos = this.pos;
    this.pos++;
    this.addChild(createFlatNode(NodeKind.Text, 0, startPos, 1));
  }

  private processEcho(): void {
    this.processEchoSpan(TokenType.EchoEnd, NodeKind.Echo);
  }

  private processRawEcho(): void {
    this.processEchoSpan(TokenType.RawEchoEnd, NodeKind.RawEcho);
  }

  private processTripleEcho(): void {
    this.processEchoSpan(TokenType.TripleEchoEnd, NodeKind.TripleEcho);
  }

  private processEchoSpan(endType: number, nodeKind: number): void {
    const startPos = this.pos;
    this.pos++;

    const total = this.tokens.length;
    while (this.pos < total) {
      const type = this.tokens[this.pos].type;
      if (type === endType) {
        this.pos++;
        break;
      }
      // Interrupted by another construct start
      if (
        type === TokenType.EchoStart ||
        type === TokenType.RawEchoStart ||
        type === TokenType.TripleEchoStart ||
        type === TokenType.BladeCommentStart
      ) {
        // Emit what we have as text
        this.addChild(createFlatNode(NodeKind.Text, 0, startPos, this.pos - startPos));
        return;
      }
      this.pos++;
    }

    this.addChild(createFlatNode(nodeKind, 0, startPos, this.pos - startPos));
  }

  private createBlockNode(startPos: number, endTokenType: number, nodeKind: number): void {
    let endPos = this.pos;
    let hasClosing = false;
    const total = this.tokens.length;

    while (endPos < total) {
      if (this.tokens[endPos].type === endTokenType) {
        hasClosing = true;
        endPos++;
        break;
      }
      endPos++;
    }

    this.addChild(createFlatNode(nodeKind, 0, startPos, endPos - startPos, 0, hasClosing ? 1 : 0));
    this.pos = endPos;
  }

  private getPhpTagTokenCount(startPos: number): { tokenCount: number; hasClosing: boolean } {
    let endPos = startPos;
    let hasClosing = false;
    const total = this.tokens.length;

    while (endPos < total) {
      if (this.tokens[endPos].type === TokenType.PhpTagEnd) {
        hasClosing = true;
        endPos++;
        break;
      }
      endPos++;
    }

    return { tokenCount: endPos - startPos, hasClosing };
  }

  private addStandalonePhpTag(startPos: number, tokenCount: number, hasClosing: boolean): void {
    this.addChild(createFlatNode(NodeKind.PhpTag, 0, startPos, tokenCount, 0, hasClosing ? 1 : 0));
    this.pos += tokenCount;
  }

  private processPhpTag(): void {
    const startPos = this.pos;
    const { tokenCount, hasClosing } = this.getPhpTagTokenCount(startPos);
    if (tokenCount <= 0) {
      this.pos++;
      return;
    }

    const startToken = this.tokens[startPos];
    const endToken = this.tokens[startPos + tokenCount - 1];
    const rawTag = this.source.slice(startToken.start, endToken.end);
    const shorthand = classifyPhpTagShorthand(rawTag);

    if (!shorthand) {
      this.addStandalonePhpTag(startPos, tokenCount, hasClosing);
      return;
    }

    if (shorthand.role === "open") {
      this.openPhpTagCondition(shorthand, startPos, tokenCount, hasClosing);
      return;
    }

    if (shorthand.role === "branch") {
      this.openPhpTagConditionBranch(shorthand, startPos, tokenCount, hasClosing);
      return;
    }

    this.closePhpTagCondition(shorthand, startPos, tokenCount, hasClosing);
  }

  private openPhpTagCondition(
    shorthand: PhpTagShorthandMatch,
    startPos: number,
    tokenCount: number,
    hasClosing: boolean,
  ): void {
    const blockIdx = this.addChild(
      createFlatNode(NodeKind.DirectiveBlock, 0, startPos, tokenCount),
    );

    const elementStackBase = this.openElements.length;
    this.checkElementDepth();
    this.openElements.push(blockIdx);

    const branchIdx = this.addChild(
      createFlatNode(NodeKind.PhpTag, 0, startPos, tokenCount, 0, hasClosing ? 1 : 0),
    );

    this.checkElementDepth();
    this.openElements.push(branchIdx);

    this.checkConditionDepth();
    this.openPhpTagConditions.push({
      blockIdx,
      currentBranchIdx: branchIdx,
      name: shorthand.context,
      elementStackBase,
    });

    this.pos += tokenCount;
  }

  private openPhpTagConditionBranch(
    shorthand: PhpTagShorthandMatch,
    startPos: number,
    tokenCount: number,
    hasClosing: boolean,
  ): void {
    if (this.openPhpTagConditions.length === 0) {
      this.addStandalonePhpTag(startPos, tokenCount, hasClosing);
      return;
    }

    const frame = this.openPhpTagConditions[this.openPhpTagConditions.length - 1];

    const isMatchingBranch =
      (frame.name === "if" && (shorthand.name === "elseif" || shorthand.name === "else")) ||
      (frame.name === "switch" && (shorthand.name === "case" || shorthand.name === "default"));

    if (!isMatchingBranch) {
      this.addStandalonePhpTag(startPos, tokenCount, hasClosing);
      return;
    }

    this.popIfTop(frame.currentBranchIdx);
    this.popElementsToDepth(frame.elementStackBase + 1);

    const branchIdx = this.addChild(
      createFlatNode(NodeKind.PhpTag, 0, startPos, tokenCount, 0, hasClosing ? 1 : 0),
    );

    this.checkElementDepth();
    this.openElements.push(branchIdx);
    frame.currentBranchIdx = branchIdx;

    this.pos += tokenCount;
  }

  private closePhpTagCondition(
    shorthand: PhpTagShorthandMatch,
    startPos: number,
    tokenCount: number,
    hasClosing: boolean,
  ): void {
    if (this.openPhpTagConditions.length === 0) {
      this.addStandalonePhpTag(startPos, tokenCount, hasClosing);
      return;
    }

    const frame = this.openPhpTagConditions[this.openPhpTagConditions.length - 1];
    const expectedCloser =
      frame.name === "if"
        ? "endif"
        : frame.name === "switch"
          ? "endswitch"
          : frame.name === "for"
            ? "endfor"
            : frame.name === "foreach"
              ? "endforeach"
              : frame.name === "while"
                ? "endwhile"
                : "enddeclare";

    if (shorthand.name !== expectedCloser) {
      this.addStandalonePhpTag(startPos, tokenCount, hasClosing);
      return;
    }

    this.openPhpTagConditions.pop();

    this.popElementsToDepth(frame.elementStackBase + 1);
    this.popIfTop(frame.currentBranchIdx);

    this.addChild(createFlatNode(NodeKind.PhpTag, 0, startPos, tokenCount, 0, hasClosing ? 1 : 0));

    this.popIfTop(frame.blockIdx);

    const endPos = startPos + tokenCount;
    this.nodes[frame.blockIdx].tokenCount = endPos - this.nodes[frame.blockIdx].tokenStart;

    this.pos += tokenCount;
  }

  private processOrphanPhpBlockEnd(): void {
    const startPos = this.pos;
    this.pos++;

    const node = createFlatNode(NodeKind.Directive, 0, startPos, 1);
    this.addChild(node);
  }

  private createConditionalComment(): void {
    const startPos = this.pos;
    const total = this.tokens.length;

    let endPos = startPos + 1;
    let hasClosing = false;

    while (endPos < total) {
      if (this.tokens[endPos].type === TokenType.ConditionalCommentEnd) {
        hasClosing = true;
        break;
      }
      endPos++;
    }

    const fullEndPos = hasClosing ? endPos + 1 : endPos;

    const node = createFlatNode(
      NodeKind.ConditionalComment,
      0,
      startPos,
      fullEndPos - startPos,
      0,
      hasClosing ? 1 : 0,
    );
    const nodeIdx = this.addChild(node);

    const elementStackDepth = this.openElements.length;

    this.checkElementDepth();
    this.openElements.push(nodeIdx);

    this.pos = startPos + 1;
    while (this.pos < endPos) {
      this.processToken();
    }

    while (this.openElements.length > elementStackDepth + 1) {
      const popped = this.openElements.pop()!;
      this.cleanupTagNameStack(popped);
    }

    const popped = this.openElements.pop()!;
    this.cleanupTagNameStack(popped);

    this.pos = fullEndPos;
  }

  private createDecl(): void {
    const tokens = this.tokens;
    const total = tokens.length;
    const startPos = this.pos;

    let endPos = this.pos;
    let hasClosing = false;
    while (endPos < total) {
      if (tokens[endPos].type === TokenType.DeclEnd) {
        hasClosing = true;
        break;
      }
      endPos++;
    }

    const declTokenCount = hasClosing ? endPos + 1 - startPos : endPos - startPos;

    const declIdx = this.addChild(
      createFlatNode(NodeKind.Decl, 0, startPos, declTokenCount, 0, hasClosing ? 1 : 0),
    );

    this.checkElementDepth();
    this.openElements.push(declIdx);

    this.pos++;

    while (this.pos < total) {
      const type = tokens[this.pos].type;

      if (type === TokenType.DeclEnd) {
        this.pos++;
        break;
      }

      if (type === TokenType.Whitespace) {
        this.addChild(createFlatNode(NodeKind.AttributeWhitespace, 0, this.pos, 1));
        this.pos++;
        continue;
      }

      if (
        type === TokenType.EchoStart ||
        type === TokenType.RawEchoStart ||
        type === TokenType.TripleEchoStart
      ) {
        this.processDeclEcho();
        continue;
      }

      if (
        type === TokenType.AttributeName ||
        type === TokenType.BoundAttribute ||
        type === TokenType.EscapedAttribute ||
        type === TokenType.ShorthandAttribute
      ) {
        this.buildDeclAttribute(endPos);
        continue;
      }

      this.pos++;
    }

    this.openElements.pop();
  }

  private processDeclEcho(): void {
    const startPos = this.pos;
    const total = this.tokens.length;
    const startType = this.tokens[startPos].type;

    const nodeKind = Constructs.getNodeKind(startType) ?? NodeKind.Echo;
    const constructTokenCount = Constructs.countConstructTokens(this.tokens, startPos, total);
    this.pos += constructTokenCount;

    this.addChild(createFlatNode(nodeKind, 0, startPos, constructTokenCount));
  }

  private buildDeclAttribute(attrEnd: number): void {
    const tokens = this.tokens;
    const total = tokens.length;

    const attrStart = this.pos;
    let nameCount = 0;

    while (this.pos < total && this.pos < attrEnd) {
      const type = tokens[this.pos].type;
      if (
        type === TokenType.AttributeName ||
        type === TokenType.EchoStart ||
        type === TokenType.RawEchoStart ||
        type === TokenType.TripleEchoStart
      ) {
        nameCount++;
        this.pos++;
        continue;
      }
      break;
    }

    if (nameCount === 0) {
      this.pos++;
      return;
    }

    const [hasValue, valueStart, valueCount] = this.scanDeclEqualsAndValue(attrEnd, total);

    const attrTokenCount = this.pos - attrStart;

    const attrIdx = this.addChild(createFlatNode(NodeKind.Attribute, 0, attrStart, attrTokenCount));

    const nameIdx = this.createFirstChild(attrIdx, NodeKind.AttributeName, attrStart, nameCount);
    this.buildDeclAttributeParts(attrStart, nameCount, nameIdx, false);

    if (hasValue && valueCount > 0) {
      const valueIdx = this.createSiblingChild(
        nameIdx,
        attrIdx,
        NodeKind.AttributeValue,
        valueStart,
        valueCount,
      );
      this.buildDeclAttributeParts(valueStart, valueCount, valueIdx, true);
    }
  }

  private scanDeclEqualsAndValue(attrEnd: number, total: number): [boolean, number, number] {
    let hasValue = false;
    let valueStart = 0;
    let valueCount = 0;

    let checkPos = this.pos;
    if (checkPos < total && this.tokens[checkPos].type === TokenType.Whitespace) {
      checkPos++;
    }

    if (checkPos < total && this.tokens[checkPos].type === TokenType.Equals) {
      this.pos = checkPos + 1;

      if (this.pos < total && this.tokens[this.pos].type === TokenType.Whitespace) {
        this.pos++;
      }

      if (this.pos < total) {
        valueStart = this.pos;
        valueCount = this.scanDeclAttributeValue(attrEnd);
        hasValue = valueCount > 0;
      }
    }

    return [hasValue, valueStart, valueCount];
  }

  private scanDeclAttributeValue(attrEnd: number): number {
    const total = this.tokens.length;

    if (this.pos >= total || this.tokens[this.pos].type !== TokenType.Quote) {
      return 0;
    }

    let count = 1;
    this.pos++;

    while (this.pos < total && this.pos < attrEnd) {
      const type = this.tokens[this.pos].type;

      if (type === TokenType.Quote) {
        count++;
        this.pos++;
        break;
      }

      if (type === TokenType.DeclEnd) {
        break;
      }

      count++;
      this.pos++;
    }

    return count;
  }

  private buildDeclAttributeParts(
    start: number,
    count: number,
    parentIdx: number,
    isValue: boolean,
  ): void {
    let lastChildIdx = NONE;

    for (let i = 0; i < count; i++) {
      const tokenPos = start + i;
      const type = this.tokens[tokenPos].type;

      if (isValue) {
        if (
          type === TokenType.Quote ||
          type === TokenType.EchoEnd ||
          type === TokenType.RawEchoEnd ||
          type === TokenType.TripleEchoEnd
        ) {
          continue;
        }
      }

      const nodeKind = this.declPartNodeKind(type);

      const partIdx = this.nodeCount++;
      this.nodes[partIdx] = createFlatNode(nodeKind, parentIdx, tokenPos, 1);

      if (lastChildIdx === NONE) {
        this.nodes[parentIdx].firstChild = partIdx;
      } else {
        this.nodes[lastChildIdx].nextSibling = partIdx;
      }
      this.nodes[parentIdx].lastChild = partIdx;
      lastChildIdx = partIdx;
    }
  }

  private declPartNodeKind(type: number): number {
    switch (type) {
      case TokenType.EchoStart:
        return NodeKind.Echo;
      case TokenType.RawEchoStart:
        return NodeKind.RawEcho;
      case TokenType.TripleEchoStart:
        return NodeKind.TripleEcho;
      default:
        return NodeKind.Text;
    }
  }

  private processElementStart(): void {
    const tokens = this.tokens;
    const total = tokens.length;
    const startPos = this.pos;

    this.pos++; // skip '<'

    if (startPos >= total || tokens[startPos].type !== TokenType.LessThan) return;

    // Closing tag?
    if (this.pos < total && tokens[this.pos].type === TokenType.Slash) {
      this.processElementEnd();
      return;
    }

    const tagNameStart = this.pos;
    const [tagNameCount, genericOffset] = this.scanElementName();
    const rawTagName = this.getRawNameText(tagNameStart, tagNameCount);
    const isDynamicTagName = this.isDynamicTagName(tagNameStart, tagNameCount);

    // Consume TsxGenericType if present after the tag name
    if (this.pos < total && tokens[this.pos].type === TokenType.TsxGenericType) {
      this.pos++;
    }

    if (tagNameCount === 0) {
      this.addChild(createFlatNode(NodeKind.Text, 0, startPos, 1));
      return;
    }

    const staticTagName = this.getTagNameText(tagNameStart, tagNameCount);
    const lowerNewTag = staticTagName.toLowerCase();

    if (!isDynamicTagName) {
      this.autoCloseElementsForSibling(lowerNewTag);
    }

    const elementIdx = this.addChild(createFlatNode(NodeKind.Element, 0, startPos, 0));

    const elementNameIdx = this.createFirstChild(
      elementIdx,
      NodeKind.ElementName,
      tagNameStart,
      tagNameCount,
    );
    this.buildElementNameParts(tagNameStart, tagNameCount, elementNameIdx);

    // Attributes
    this.buildAttributes(elementIdx, elementNameIdx);

    // Self-closing detection
    let selfClosing = false;
    let syntheticClose = false;

    if (this.pos < total && tokens[this.pos].type === TokenType.Slash) {
      this.pos++;
      selfClosing = true;
    }

    if (this.pos < total) {
      const type = tokens[this.pos].type;
      if (type === TokenType.GreaterThan) {
        this.pos++;
      } else if (type === TokenType.SyntheticClose) {
        this.pos++;
        syntheticClose = true;
      }
    }

    this.nodes[elementIdx].tokenCount = this.pos - startPos;
    this.nodes[elementIdx].genericOffset = genericOffset > 0 ? genericOffset + 1 : 0;
    this.nodes[elementIdx].data = selfClosing ? 1 : 0;

    // Decide if element stays open
    let shouldStayOpen = !selfClosing;
    if (syntheticClose && shouldStayOpen) {
      // Synthetic closes indicate the opening tag was malformed. Keep the raw
      // source text, but avoid carrying an open-element frame across tag
      // boundaries, otherwise malformed inputs like "<Map<R" collapse siblings
      // into a nested tree and drift across passes.
      const nextType = this.pos < total ? tokens[this.pos].type : null;
      if (this.pos >= total || nextType === TokenType.LessThan) {
        shouldStayOpen = false;
      }
    }

    if (!shouldStayOpen) return;

    this.checkElementDepth();
    this.openElements.push(elementIdx);
    this.tagNames.set(elementIdx, lowerNewTag);
    this.rawTagNames.set(elementIdx, rawTagName);
    if (isDynamicTagName) {
      this.dynamicTagNames.add(elementIdx);
    }

    if (lowerNewTag !== "" && !isDynamicTagName) {
      let stack = this.tagNameStacks.get(lowerNewTag);
      if (!stack) {
        stack = [];
        this.tagNameStacks.set(lowerNewTag, stack);
      }
      stack.push(this.openElements.length - 1);
    }
  }

  private processElementEnd(): void {
    const tokens = this.tokens;
    const total = tokens.length;

    const startPos = this.pos - 1; // before '<'
    this.pos++; // skip '/'

    const tagNameStartPos = this.pos;
    const [tagNameCount] = this.scanElementName();

    const closingTagName =
      tagNameCount > 0 ? this.getTagNameText(tagNameStartPos, tagNameCount) : "";
    const closingRawTagName =
      tagNameCount > 0 ? this.getRawNameText(tagNameStartPos, tagNameCount) : "";
    const closingIsDynamicTagName =
      tagNameCount > 0 ? this.isDynamicTagName(tagNameStartPos, tagNameCount) : false;

    // Skip to '>' or SyntheticClose
    while (
      this.pos < total &&
      tokens[this.pos].type !== TokenType.GreaterThan &&
      tokens[this.pos].type !== TokenType.SyntheticClose
    ) {
      this.pos++;
    }
    if (this.pos < total) this.pos++;

    // Directive scope boundary
    let searchLimit = 1;
    if (this.openDirectives.length > 0) {
      const currentDirective = this.openDirectives[this.openDirectives.length - 1];
      searchLimit = currentDirective.elementStackBase + 1;
    }

    const lowerClosingTag = closingTagName.toLowerCase();
    let foundMatch = false;
    let matchDepth = 0;
    let matchedOpenElementsIndex = -1;

    // Fast path: tagNameStacks
    const stack = !closingIsDynamicTagName ? this.tagNameStacks.get(lowerClosingTag) : null;
    if (stack && stack.length > 0) {
      const openElementsCount = this.openElements.length;
      for (let i = stack.length - 1; i >= 0; i--) {
        const openElementsIndex = stack[i];
        if (openElementsIndex >= searchLimit && openElementsIndex < openElementsCount) {
          const elementIdx = this.openElements[openElementsIndex];
          if ((this.tagNames.get(elementIdx) ?? "") === lowerClosingTag) {
            matchedOpenElementsIndex = openElementsIndex;
            foundMatch = true;
            matchDepth = openElementsCount - openElementsIndex;
            break;
          }
        }
      }
    }

    // Fallback: linear search for dynamic tags
    if (!foundMatch) {
      for (let i = this.openElements.length - 1; i >= searchLimit; i--) {
        const elementIdx = this.openElements[i];
        if (this.nodes[elementIdx].kind === NodeKind.DirectiveBlock) continue;

        const openTagName = this.tagNames.get(elementIdx) ?? "";
        const openRawTagName = this.rawTagNames.get(elementIdx) ?? "";
        const openIsDynamicTagName = this.dynamicTagNames.has(elementIdx);

        if (openIsDynamicTagName || closingIsDynamicTagName) {
          if (openRawTagName === closingRawTagName) {
            foundMatch = true;
            matchDepth = this.openElements.length - i;
            matchedOpenElementsIndex = i;
            break;
          }
          continue;
        }

        if (
          openTagName.toLowerCase() === lowerClosingTag ||
          this.isSlotClosingMatch(openRawTagName, closingRawTagName)
        ) {
          foundMatch = true;
          matchDepth = this.openElements.length - i;
          matchedOpenElementsIndex = i;
          break;
        }
      }
    }

    if (foundMatch) {
      const elementIdx = this.openElements[matchedOpenElementsIndex];
      this.nodes[elementIdx].tokenCount = this.pos - this.nodes[elementIdx].tokenStart;

      const closingNameIdx = this.createAndLinkClosingNameNode(
        elementIdx,
        tagNameStartPos,
        tagNameCount,
      );
      this.buildElementNameParts(tagNameStartPos, tagNameCount, closingNameIdx);

      for (let i = 0; i < matchDepth; i++) {
        if (this.openElements.length > 1) {
          const popped = this.openElements.pop()!;
          this.cleanupTagNameStack(popped);
        }
      }
      return;
    }

    // No match -> UnpairedClosingTag
    this.addChild(
      createFlatNode(
        NodeKind.UnpairedClosingTag,
        0,
        startPos,
        this.pos - startPos,
        0,
        tagNameCount,
      ),
    );
  }

  private createAndLinkClosingNameNode(
    parentIdx: number,
    tokenStart: number,
    tokenCount: number,
  ): number {
    const idx = this.nodeCount++;
    this.nodes[idx] = createFlatNode(
      NodeKind.ClosingElementName,
      parentIdx,
      tokenStart,
      tokenCount,
    );

    const lastChild = this.nodes[parentIdx].lastChild;
    if (lastChild !== NONE) {
      this.nodes[lastChild].nextSibling = idx;
    } else {
      this.nodes[parentIdx].firstChild = idx;
    }
    this.nodes[parentIdx].lastChild = idx;

    return idx;
  }

  private isSlotClosingMatch(openTagName: string, closingTagName: string): boolean {
    const lowerClose = closingTagName.toLowerCase();
    if (lowerClose !== "x-slot") return false;

    const lowerOpen = openTagName.toLowerCase();
    return lowerOpen.startsWith("x-slot:") || lowerOpen.startsWith("x-slot[");
  }

  private scanElementName(): [number, number] {
    const tokens = this.tokens;
    const limit = tokens.length;
    let count = 0;
    let genericOffset = 0;

    while (this.pos < limit) {
      const type = tokens[this.pos].type;

      if (this.isElementNameTerminator(type)) {
        if (type === TokenType.TsxGenericType) {
          genericOffset = count + 1;
        }
        break;
      }

      if (type === TokenType.TagName) {
        count++;
        this.pos++;
        continue;
      }

      if (Constructs.isConstructStart(type)) {
        const [newPos, constructCount] = Constructs.scanConstruct(tokens, this.pos, limit);
        count += constructCount;
        this.pos = newPos;
        continue;
      }

      break;
    }

    return [count, genericOffset];
  }

  private isElementNameTerminator(type: number): boolean {
    return (
      type === TokenType.Whitespace ||
      type === TokenType.GreaterThan ||
      type === TokenType.Slash ||
      type === TokenType.Directive ||
      type === TokenType.TsxGenericType ||
      type === TokenType.SyntheticClose
    );
  }

  private buildElementNameParts(startPos: number, tokenCount: number, parentIdx: number): void {
    const tokens = this.tokens;
    const endPos = startPos + tokenCount;
    let i = startPos;
    let lastChildIdx: number | null = null;

    while (i < endPos) {
      const type = tokens[i].type;
      let childTokenCount = 1;
      let childNode: FlatNode | null = null;

      if (type === TokenType.TagName) {
        childNode = createFlatNode(NodeKind.Text, parentIdx, i, 1);
      } else if (Constructs.isConstructStart(type)) {
        const nodeKind = Constructs.getNodeKind(type) ?? NodeKind.Echo;
        childTokenCount = Constructs.countConstructTokens(tokens, i, endPos);
        childNode = createFlatNode(nodeKind, parentIdx, i, childTokenCount);
      }

      if (childNode !== null) {
        const childIdx = this.nodeCount++;
        this.nodes[childIdx] = childNode;

        if (lastChildIdx === null) {
          this.nodes[parentIdx].firstChild = childIdx;
        } else {
          this.nodes[lastChildIdx].nextSibling = childIdx;
        }
        this.nodes[parentIdx].lastChild = childIdx;
        lastChildIdx = childIdx;
      }

      i += childTokenCount;
    }
  }

  private getTagNameText(startPos: number, tokenCount: number): string {
    let text = "";
    const total = this.tokens.length;

    for (let i = 0; i < tokenCount; i++) {
      const idx = startPos + i;
      if (idx >= total) break;
      if (this.tokens[idx].type === TokenType.TagName) {
        text += this.source.slice(this.tokens[idx].start, this.tokens[idx].end);
      }
    }
    return text;
  }

  private getRawNameText(startPos: number, tokenCount: number): string {
    let text = "";
    const total = this.tokens.length;

    for (let i = 0; i < tokenCount; i++) {
      const idx = startPos + i;
      if (idx >= total) break;
      const token = this.tokens[idx];
      text += this.source.slice(token.start, token.end);
    }

    return text;
  }

  private isDynamicTagName(startPos: number, tokenCount: number): boolean {
    const total = this.tokens.length;
    for (let i = 0; i < tokenCount; i++) {
      const idx = startPos + i;
      if (idx >= total) break;
      if (this.tokens[idx].type !== TokenType.TagName) return true;
    }
    return false;
  }

  // Attributes

  private buildAttributes(elementIdx: number, _lastChildIdx: number): void {
    const attrEnd = this.findAttributeRegionEnd();

    this.openElements.push(elementIdx);
    const savedDirectives = this.openDirectives;
    const savedConditions = this.openConditions;
    this.openDirectives = [];
    this.openConditions = [];

    try {
      while (this.pos < attrEnd) {
        const type = this.tokens[this.pos].type;

        if (this.isInsideAttributePhpDirective()) {
          if (type === TokenType.Directive) {
            const directiveName = extractDirectiveName(this.tokens[this.pos], this.source);
            if (directiveName === "endphp") {
              this.processDirective();
              continue;
            }
          }

          if (Constructs.isConstructStart(type)) {
            this.processConstructInAttributes(NodeKind.Echo);
          } else {
            this.processText();
          }
          continue;
        }

        if (type === TokenType.Whitespace) {
          this.addChild(createFlatNode(NodeKind.AttributeWhitespace, 0, this.pos, 1));
          this.pos++;
          continue;
        }

        if (type === TokenType.Directive) {
          this.processDirective();
          continue;
        }

        if (type === TokenType.JsxShorthandAttribute) {
          this.addChild(createFlatNode(NodeKind.JsxAttribute, 0, this.pos, 1));
          this.pos++;
          continue;
        }

        this.buildUnifiedAttribute(attrEnd);
      }

      this.closeRemainingAttributeDirectives();
    } finally {
      this.openDirectives = savedDirectives;
      this.openConditions = savedConditions;
      this.openElements.pop();
    }
  }

  private isInsideAttributePhpDirective(): boolean {
    if (this.openDirectives.length === 0) return false;
    const top = this.openDirectives[this.openDirectives.length - 1];
    return top.name === "php";
  }

  private findAttributeRegionEnd(): number {
    let attrEnd = this.pos;
    const total = this.tokens.length;

    while (attrEnd < total) {
      const type = this.tokens[attrEnd].type;

      if (type === TokenType.GreaterThan || type === TokenType.SyntheticClose) break;

      if (type === TokenType.Slash && attrEnd + 1 < total) {
        const next = this.tokens[attrEnd + 1].type;
        if (next === TokenType.GreaterThan || next === TokenType.SyntheticClose) break;
      }

      attrEnd++;
    }

    return attrEnd;
  }

  private buildUnifiedAttribute(attrEnd: number): void {
    const attrStart = this.pos;
    const bounds = this.scanAttributeBounds(attrEnd);

    if (bounds.length === 0) {
      this.pos++;
      return;
    }

    this.pos = bounds.end;

    const firstType = this.tokens[attrStart].type;
    if (Constructs.isConstructStart(firstType)) {
      const constructCount = Constructs.countConstructTokens(this.tokens, attrStart, attrEnd);
      if (constructCount === bounds.length) {
        this.pos = attrStart;
        this.processConstructInAttributes(NodeKind.Echo);
        return;
      }
    }

    if (bounds.isNameValue) {
      const attrIdx = this.addChild(
        createFlatNode(NodeKind.Attribute, 0, attrStart, bounds.length),
      );

      const nameIdx = this.createFirstChild(
        attrIdx,
        NodeKind.AttributeName,
        attrStart,
        bounds.nameCount,
      );
      this.buildAttributeNameParts(attrStart, bounds.nameCount, nameIdx);

      if (bounds.valueCount > 0) {
        const valueIdx = this.createSiblingChild(
          nameIdx,
          attrIdx,
          NodeKind.AttributeValue,
          bounds.valueStart,
          bounds.valueCount,
        );
        this.buildAttributeValueParts(bounds.valueStart, bounds.valueCount, valueIdx);
      }
      return;
    }

    // Standalone attribute (boolean)
    const attrIdx = this.addChild(createFlatNode(NodeKind.Attribute, 0, attrStart, bounds.length));

    const nameIdx = this.createFirstChild(
      attrIdx,
      NodeKind.AttributeName,
      attrStart,
      bounds.length,
    );
    this.buildAttributeNameParts(attrStart, bounds.length, nameIdx);
  }

  private scanAttributeBounds(attrEnd: number): {
    length: number;
    end: number;
    isNameValue: boolean;
    nameCount: number;
    valueStart: number;
    valueCount: number;
  } {
    const attrStart = this.pos;
    let equalsPos = -1;
    let nameEnd = -1;
    let scanPos = this.pos;
    let lastNonWhitespace = this.pos;

    while (scanPos < attrEnd) {
      const type = this.tokens[scanPos].type;

      if (type === TokenType.Whitespace) {
        let lookAhead = scanPos + 1;
        while (lookAhead < attrEnd && this.tokens[lookAhead].type === TokenType.Whitespace) {
          lookAhead++;
        }
        if (lookAhead < attrEnd && this.tokens[lookAhead].type === TokenType.Equals) {
          scanPos = lookAhead;
          continue;
        }
        break;
      }

      if (type === TokenType.Equals) {
        equalsPos = scanPos;
        nameEnd = lastNonWhitespace;
        scanPos++;

        while (scanPos < attrEnd && this.tokens[scanPos].type === TokenType.Whitespace) {
          scanPos++;
        }

        if (scanPos < attrEnd) {
          if (this.tokens[scanPos].type === TokenType.Quote) {
            scanPos++;
            while (scanPos < attrEnd && this.tokens[scanPos].type !== TokenType.Quote) {
              scanPos = Constructs.advancePast(this.tokens, scanPos, attrEnd);
            }
            if (scanPos < attrEnd) scanPos++;
          } else {
            while (scanPos < attrEnd && this.tokens[scanPos].type !== TokenType.Whitespace) {
              scanPos = Constructs.advancePast(this.tokens, scanPos, attrEnd);
            }
          }
        }
        break;
      }

      scanPos = Constructs.advancePast(this.tokens, scanPos, attrEnd);
      lastNonWhitespace = scanPos;
    }

    const length = scanPos - attrStart;

    if (length === 0) {
      return {
        length: 0,
        end: scanPos,
        isNameValue: false,
        nameCount: 0,
        valueStart: 0,
        valueCount: 0,
      };
    }

    if (equalsPos !== -1 && nameEnd !== -1) {
      const nameCount = nameEnd - attrStart;
      let valueStart = equalsPos + 1;
      while (valueStart < scanPos && this.tokens[valueStart].type === TokenType.Whitespace) {
        valueStart++;
      }
      const valueCount = scanPos - valueStart;

      return { length, end: scanPos, isNameValue: true, nameCount, valueStart, valueCount };
    }

    return { length, end: scanPos, isNameValue: false, nameCount: 0, valueStart: 0, valueCount: 0 };
  }

  private buildAttributeNameParts(startPos: number, tokenCount: number, parentIdx: number): void {
    this.buildParts(startPos, startPos + tokenCount, parentIdx, false);
  }

  private buildAttributeValueParts(startPos: number, tokenCount: number, parentIdx: number): void {
    let i = startPos;
    const endPos = startPos + tokenCount;

    // Skip opening quote
    if (i < endPos && this.tokens[i].type === TokenType.Quote) i++;

    // Stop before closing quote
    let effectiveEnd = endPos;
    if (effectiveEnd > startPos && this.tokens[effectiveEnd - 1].type === TokenType.Quote) {
      effectiveEnd--;
    }

    this.buildParts(i, effectiveEnd, parentIdx, true);
  }

  private buildParts(startPos: number, endPos: number, parentIdx: number, asValue: boolean): void {
    let i = startPos;
    let lastChildIdx: number | null = null;

    while (i < endPos) {
      const type = this.tokens[i].type;
      let childTokenCount = 1;
      let childNode: FlatNode;

      if (this.isTextLike(type, asValue)) {
        childNode = createFlatNode(NodeKind.Text, parentIdx, i, 1);
      } else if (Constructs.isConstructStart(type)) {
        const nodeKind = Constructs.getNodeKind(type) ?? NodeKind.Echo;
        childTokenCount = Constructs.countConstructTokens(this.tokens, i, endPos);
        childNode = createFlatNode(nodeKind, parentIdx, i, childTokenCount);
      } else if (asValue && type === TokenType.Directive) {
        let dirEnd = i + 1;
        if (dirEnd < endPos && this.tokens[dirEnd].type === TokenType.DirectiveArgs) {
          dirEnd++;
        }
        childTokenCount = dirEnd - i;
        childNode = createFlatNode(NodeKind.Directive, parentIdx, i, childTokenCount);
      } else {
        childNode = createFlatNode(NodeKind.Text, parentIdx, i, 1);
      }

      const childIdx = this.nodeCount++;
      this.nodes[childIdx] = childNode;

      if (lastChildIdx === null) {
        this.nodes[parentIdx].firstChild = childIdx;
      } else {
        this.nodes[lastChildIdx].nextSibling = childIdx;
      }
      this.nodes[parentIdx].lastChild = childIdx;
      lastChildIdx = childIdx;

      i += childTokenCount;
    }
  }

  private isTextLike(type: number, asValue: boolean): boolean {
    if (asValue) {
      return type === TokenType.AttributeValue || type === TokenType.Text;
    }
    return (
      type === TokenType.AttributeName ||
      type === TokenType.BoundAttribute ||
      type === TokenType.EscapedAttribute ||
      type === TokenType.ShorthandAttribute ||
      type === TokenType.Text
    );
  }

  private processConstructInAttributes(defaultKind: number): void {
    const startPos = this.pos;
    const startType = this.tokens[startPos].type;
    const nodeKind = Constructs.getNodeKind(startType) ?? defaultKind;
    const constructTokenCount = Constructs.countConstructTokens(
      this.tokens,
      startPos,
      this.tokens.length,
    );
    this.pos += constructTokenCount;

    this.addChild(createFlatNode(nodeKind, 0, startPos, constructTokenCount));
  }

  private closeRemainingAttributeDirectives(): void {
    while (this.openConditions.length > 0) {
      const frame = this.openConditions.pop()!;
      this.popIfTop(frame.currentBranchIdx);
      this.popIfTop(frame.blockIdx);
      this.nodes[frame.blockIdx].tokenCount = this.pos - this.nodes[frame.blockIdx].tokenStart;
    }

    while (this.openDirectives.length > 0) {
      const frame = this.openDirectives.pop()!;
      this.popIfTop(frame.startDirectiveIdx);
      this.popIfTop(frame.blockIdx);
      this.nodes[frame.blockIdx].tokenCount = this.pos - this.nodes[frame.blockIdx].tokenStart;
    }
  }

  private processDirective(): void {
    const startPos = this.pos;
    const directiveToken = this.tokens[this.pos];
    const directiveName = extractDirectiveName(directiveToken, this.source);

    let tokenCount = 1;
    const argsInfo = checkDirectiveArgsFast(this.tokens, this.pos + 1, this.tokens.length);
    tokenCount += argsInfo.consumed;

    if (this.isSwitchRelatedDirective(directiveName)) {
      this.processSwitchDirective(directiveName, startPos, tokenCount, null);
      return;
    }

    if (this.isConditionRelatedDirective(directiveName)) {
      this.processConditionDirective(directiveName, startPos, tokenCount, null);
      return;
    }

    if (this.directives.isConditionalPair(directiveName)) {
      const argsContent =
        argsInfo.argsTokenIndex >= 0
          ? this.source.slice(
              this.tokens[argsInfo.argsTokenIndex].start,
              this.tokens[argsInfo.argsTokenIndex].end,
            )
          : null;
      this.processConditionalPairingDirective(directiveName, startPos, tokenCount, argsContent);
      return;
    }

    if (this.isBranchOfOpenDirective(directiveName)) {
      this.openDirectiveBranch(directiveName, startPos, tokenCount, null);
      return;
    }

    if (this.isClosingDirective(directiveName)) {
      this.closeDirective(directiveName, startPos, tokenCount, null);
      return;
    }

    if (this.directives.isPaired(directiveName)) {
      const directiveMeta = this.directives.getDirective(directiveName);
      if (argsInfo.hasArgs && directiveMeta?.args === ArgumentRequirement.NotAllowed) {
        this.createStandaloneDirective(directiveName, startPos, tokenCount, null);
        return;
      }
      this.openPairedDirective(directiveName, startPos, tokenCount);
      return;
    }

    this.createStandaloneDirective(directiveName, startPos, tokenCount, null);
  }

  private isClosingDirective(directiveName: string): boolean {
    if (this.openDirectives.length === 0) return false;

    for (let i = this.openDirectives.length - 1; i >= 0; i--) {
      const frame = this.openDirectives[i];
      const directive = this.directives.getDirective(frame.name);

      if (directive !== null && directive.terminators.length > 0) {
        if (directive.terminators.includes(directiveName)) return true;
      }

      const terminator = this.directives.getTerminator(frame.name);
      if (terminator.toLowerCase() === directiveName) return true;
    }

    return false;
  }

  private isBranchOfOpenDirective(directiveName: string): boolean {
    if (this.openDirectives.length === 0) return false;

    for (let i = this.openDirectives.length - 1; i >= 0; i--) {
      const frame = this.openDirectives[i];
      const directive = this.directives.getDirective(frame.name);
      if (directive !== null && directive.hasConditionLikeBranches) {
        if (directive.conditionLikeBranches.includes(directiveName)) return true;
      }
    }

    return false;
  }

  private openPairedDirective(directiveName: string, startPos: number, tokenCount: number): void {
    const blockIdx = this.addChild(
      createFlatNode(NodeKind.DirectiveBlock, 0, startPos, tokenCount),
    );

    const elementStackBase = this.openElements.length;
    this.checkElementDepth();
    this.openElements.push(blockIdx);

    const startDirectiveIdx = this.addChild(
      createFlatNode(NodeKind.Directive, 0, startPos, tokenCount),
    );

    this.checkDirectiveDepth();
    this.openDirectives.push({
      blockIdx,
      startDirectiveIdx,
      name: directiveName,
      elementStackBase,
    });

    this.checkElementDepth();
    this.openElements.push(startDirectiveIdx);

    this.pos += tokenCount;
  }

  private openDirectiveBranch(
    directiveName: string,
    startPos: number,
    tokenCount: number,
    argsContent: string | null,
  ): void {
    if (this.openDirectives.length === 0) {
      this.createStandaloneDirective(directiveName, startPos, tokenCount, argsContent);
      return;
    }

    let matchedIdx = -1;
    for (let i = this.openDirectives.length - 1; i >= 0; i--) {
      const frame = this.openDirectives[i];
      const directive = this.directives.getDirective(frame.name);
      if (directive !== null && directive.hasConditionLikeBranches) {
        if (directive.conditionLikeBranches.includes(directiveName)) {
          matchedIdx = i;
          break;
        }
      }
    }

    if (matchedIdx === -1) {
      this.createStandaloneDirective(directiveName, startPos, tokenCount, argsContent);
      return;
    }

    const frame = this.openDirectives[matchedIdx];
    this.popIfTop(frame.startDirectiveIdx);
    this.popElementsToDepth(frame.elementStackBase + 1);

    const branchIdx = this.addChild(createFlatNode(NodeKind.Directive, 0, startPos, tokenCount));

    this.checkElementDepth();
    this.openElements.push(branchIdx);
    frame.startDirectiveIdx = branchIdx;

    this.pos += tokenCount;
  }

  private closeDirective(
    directiveName: string,
    startPos: number,
    tokenCount: number,
    argsContent: string | null,
  ): void {
    let matchedIdx = -1;

    for (let i = this.openDirectives.length - 1; i >= 0; i--) {
      const frame = this.openDirectives[i];
      const directive = this.directives.getDirective(frame.name);
      if (directive === null) continue;

      if (directive.terminators.length > 0 && directive.terminators.includes(directiveName)) {
        matchedIdx = i;
        break;
      }

      const terminator = this.directives.getTerminator(frame.name);
      if (terminator.toLowerCase() === directiveName) {
        matchedIdx = i;
        break;
      }
    }

    if (matchedIdx === -1) {
      this.createStandaloneDirective(directiveName, startPos, tokenCount, argsContent);
      return;
    }

    for (let i = this.openDirectives.length - 1; i >= matchedIdx; i--) {
      const frame = this.openDirectives.pop()!;
      const blockIdx = frame.blockIdx;

      this.popElementsToDepth(frame.elementStackBase + 2);
      this.popIfTop(frame.startDirectiveIdx);

      this.addChild(createFlatNode(NodeKind.Directive, 0, startPos, tokenCount));

      this.popIfTop(blockIdx);

      const endPos = startPos + tokenCount;
      this.nodes[blockIdx].tokenCount = endPos - this.nodes[blockIdx].tokenStart;
    }

    this.pos += tokenCount;
  }

  private createStandaloneDirective(
    _directiveName: string,
    startPos: number,
    tokenCount: number,
    _argsContent: string | null,
  ): void {
    this.addChild(createFlatNode(NodeKind.Directive, 0, startPos, tokenCount));
    this.pos += tokenCount;
  }

  private isConditionRelatedDirective(directiveName: string): boolean {
    if (this.directives.isCondition(directiveName)) return true;

    if (this.openConditions.length > 0) {
      const currentCondition = this.openConditions[this.openConditions.length - 1];
      const branches = this.directives.getBranches(currentCondition.name);
      for (const branch of branches) {
        if (branch.toLowerCase() === directiveName) return true;
      }
    }

    const terminators = this.directives.getConditionTerminators();
    return terminators.includes(directiveName);
  }

  private processConditionDirective(
    directiveName: string,
    startPos: number,
    tokenCount: number,
    argsContent: string | null,
  ): void {
    const terminators = this.directives.getConditionTerminators();
    const isFinalTerminator = terminators.includes(directiveName);

    if (isFinalTerminator && this.openConditions.length > 0) {
      this.closeCondition(directiveName, startPos, tokenCount, argsContent);
      return;
    }

    if (this.openConditions.length > 0) {
      const currentCondition = this.openConditions[this.openConditions.length - 1];
      const branches = this.directives.getBranches(currentCondition.name);
      for (const branch of branches) {
        if (branch.toLowerCase() === directiveName) {
          this.openConditionBranch(directiveName, startPos, tokenCount, argsContent);
          return;
        }
      }
    }

    const directive = this.directives.getDirective(directiveName);
    if (
      this.directives.isCondition(directiveName) &&
      directive !== null &&
      directive.role === StructureRole.Opening
    ) {
      this.openCondition(directiveName, startPos, tokenCount, argsContent);
      return;
    }

    this.createStandaloneDirective(directiveName, startPos, tokenCount, argsContent);
  }

  private openCondition(
    directiveName: string,
    startPos: number,
    tokenCount: number,
    _argsContent: string | null,
  ): void {
    const blockIdx = this.addChild(
      createFlatNode(NodeKind.DirectiveBlock, 0, startPos, tokenCount),
    );

    const elementStackBase = this.openElements.length;
    this.checkElementDepth();
    this.openElements.push(blockIdx);

    const branchIdx = this.addChild(createFlatNode(NodeKind.Directive, 0, startPos, tokenCount));

    this.checkElementDepth();
    this.openElements.push(branchIdx);

    this.checkConditionDepth();
    this.openConditions.push({
      blockIdx,
      currentBranchIdx: branchIdx,
      name: directiveName,
      elementStackBase,
    });

    this.pos += tokenCount;
  }

  private openConditionBranch(
    directiveName: string,
    startPos: number,
    tokenCount: number,
    _argsContent: string | null,
  ): void {
    if (this.openConditions.length === 0) {
      this.createStandaloneDirective(directiveName, startPos, tokenCount, _argsContent);
      return;
    }

    const frame = this.openConditions[this.openConditions.length - 1];

    this.popIfTop(frame.currentBranchIdx);
    this.popElementsToDepth(frame.elementStackBase + 1);

    const branchIdx = this.addChild(createFlatNode(NodeKind.Directive, 0, startPos, tokenCount));

    this.checkElementDepth();
    this.openElements.push(branchIdx);

    frame.currentBranchIdx = branchIdx;
    this.pos += tokenCount;
  }

  private closeCondition(
    directiveName: string,
    startPos: number,
    tokenCount: number,
    _argsContent: string | null,
  ): void {
    if (this.openConditions.length === 0) {
      this.createStandaloneDirective(directiveName, startPos, tokenCount, _argsContent);
      return;
    }

    const frame = this.openConditions.pop()!;

    this.popElementsToDepth(frame.elementStackBase + 1);
    this.popIfTop(frame.currentBranchIdx);

    this.addChild(createFlatNode(NodeKind.Directive, 0, startPos, tokenCount));

    this.popIfTop(frame.blockIdx);

    const endPos = startPos + tokenCount;
    this.nodes[frame.blockIdx].tokenCount = endPos - this.nodes[frame.blockIdx].tokenStart;

    this.pos += tokenCount;
  }

  private isSwitchRelatedDirective(directiveName: string): boolean {
    if (this.directives.isSwitch(directiveName)) return true;
    if (directiveName === "endswitch") return true;
    if (this.openSwitches.length > 0) {
      if (this.directives.isSwitchBranch(directiveName)) return true;
      if (this.directives.isSwitchTerminator(directiveName)) return true;
    }
    return false;
  }

  private processSwitchDirective(
    directiveName: string,
    startPos: number,
    tokenCount: number,
    argsContent: string | null,
  ): void {
    if (directiveName === "endswitch" && this.openSwitches.length > 0) {
      this.closeSwitch(directiveName, startPos, tokenCount, argsContent);
    } else if (this.directives.isSwitchTerminator(directiveName) && this.openSwitches.length > 0) {
      this.processSwitchBreak(directiveName, startPos, tokenCount, argsContent);
    } else if (this.openSwitches.length > 0 && this.directives.isSwitchBranch(directiveName)) {
      this.openSwitchCase(directiveName, startPos, tokenCount, argsContent);
    } else if (this.directives.isSwitch(directiveName)) {
      this.openSwitch(directiveName, startPos, tokenCount, argsContent);
    } else {
      this.createStandaloneDirective(directiveName, startPos, tokenCount, argsContent);
    }
  }

  private openSwitch(
    directiveName: string,
    startPos: number,
    tokenCount: number,
    _argsContent: string | null,
  ): void {
    const blockIdx = this.addChild(
      createFlatNode(NodeKind.DirectiveBlock, 0, startPos, tokenCount),
    );

    const elementStackBase = this.openElements.length;
    this.checkElementDepth();
    this.openElements.push(blockIdx);

    const switchDirectiveIdx = this.addChild(
      createFlatNode(NodeKind.Directive, 0, startPos, tokenCount),
    );

    this.checkDirectiveDepth();
    this.openSwitches.push({
      blockIdx,
      switchDirectiveIdx,
      currentCaseIdx: null,
      name: directiveName,
      elementStackBase,
    });

    this.checkElementDepth();
    this.openElements.push(switchDirectiveIdx);

    this.pos += tokenCount;
  }

  private openSwitchCase(
    directiveName: string,
    startPos: number,
    tokenCount: number,
    argsContent: string | null,
  ): void {
    if (this.openSwitches.length === 0) {
      this.createStandaloneDirective(directiveName, startPos, tokenCount, argsContent);
      return;
    }

    const frame = this.openSwitches[this.openSwitches.length - 1];

    this.popElementsToDepth(frame.elementStackBase + 2);

    if (frame.currentCaseIdx !== null) {
      this.popIfTop(frame.currentCaseIdx);
    }

    const caseIdx = this.addChild(createFlatNode(NodeKind.Directive, 0, startPos, tokenCount));

    frame.currentCaseIdx = caseIdx;
    this.checkElementDepth();
    this.openElements.push(caseIdx);

    this.pos += tokenCount;
  }

  private processSwitchBreak(
    directiveName: string,
    startPos: number,
    tokenCount: number,
    argsContent: string | null,
  ): void {
    if (this.openSwitches.length === 0) {
      this.createStandaloneDirective(directiveName, startPos, tokenCount, argsContent);
      return;
    }

    const frame = this.openSwitches[this.openSwitches.length - 1];
    if (frame.currentCaseIdx === null) {
      this.createStandaloneDirective(directiveName, startPos, tokenCount, argsContent);
      return;
    }

    this.addChild(createFlatNode(NodeKind.Directive, 0, startPos, tokenCount));
    this.pos += tokenCount;
  }

  private closeSwitch(
    directiveName: string,
    startPos: number,
    tokenCount: number,
    argsContent: string | null,
  ): void {
    if (this.openSwitches.length === 0) {
      this.createStandaloneDirective(directiveName, startPos, tokenCount, argsContent);
      return;
    }

    const frame = this.openSwitches.pop()!;

    this.popElementsToDepth(frame.elementStackBase + 2);

    if (frame.currentCaseIdx !== null) {
      this.popIfTop(frame.currentCaseIdx);
    }

    this.popIfTop(frame.switchDirectiveIdx);

    this.addChild(createFlatNode(NodeKind.Directive, 0, startPos, tokenCount));

    this.popIfTop(frame.blockIdx);

    const endPos = startPos + tokenCount;
    this.nodes[frame.blockIdx].tokenCount = endPos - this.nodes[frame.blockIdx].tokenStart;

    this.pos += tokenCount;
  }

  private processConditionalPairingDirective(
    directiveName: string,
    startPos: number,
    tokenCount: number,
    argsContent: string | null,
  ): void {
    if (this.shouldPairDirective(directiveName, startPos, tokenCount, argsContent)) {
      this.openPairedDirective(directiveName, startPos, tokenCount);
    } else {
      this.createStandaloneDirective(directiveName, startPos, tokenCount, argsContent);
    }
  }

  private shouldPairDirective(
    directiveName: string,
    startPos: number,
    tokenCount: number,
    argsContent: string | null,
  ): boolean {
    const strategy = this.directives.getPairingStrategy(directiveName);
    if (strategy === null) return false;

    switch (strategy) {
      case "lang_style":
        return this.shouldPairLangStyle(directiveName, startPos, tokenCount, argsContent);
      case "section_style":
        return this.shouldPairSectionStyle(directiveName, startPos, tokenCount, argsContent);
      default:
        return false;
    }
  }

  private shouldPairLangStyle(
    directiveName: string,
    startPos: number,
    tokenCount: number,
    argsContent: string | null,
  ): boolean {
    // @lang with no args or array args -> paired
    if (argsContent === null || startsWithArray(unwrapParentheses(argsContent))) {
      return this.hasMatchingTerminator(directiveName, startPos + tokenCount);
    }
    return false;
  }

  private shouldPairSectionStyle(
    directiveName: string,
    startPos: number,
    tokenCount: number,
    argsContent: string | null,
  ): boolean {
    // @section with 2+ args -> standalone (inline)
    if (argsContent !== null) {
      const argCount = countArguments(unwrapParentheses(argsContent));
      if (argCount >= 2) return false;
    }
    return this.hasMatchingTerminator(directiveName, startPos + tokenCount);
  }

  private hasMatchingTerminator(directiveName: string, afterPos: number): boolean {
    const directiveIndex = this.getDirectiveIndex();
    const terminators = this.directives.getTerminators(directiveName);
    if (terminators.length === 0) {
      terminators.push("end" + directiveName);
    }
    return directiveIndex.findMatchingTerminator(directiveName, afterPos, terminators) !== null;
  }

  private closeRemainingDirectives(): void {
    const endPos = this.tokens.length;

    while (this.openSwitches.length > 0) {
      const frame = this.openSwitches.pop()!;
      if (frame.currentCaseIdx !== null) this.popIfTop(frame.currentCaseIdx);
      this.popIfTop(frame.switchDirectiveIdx);
      this.popIfTop(frame.blockIdx);
      this.nodes[frame.blockIdx].tokenCount = endPos - this.nodes[frame.blockIdx].tokenStart;
    }

    while (this.openConditions.length > 0) {
      const frame = this.openConditions.pop()!;
      this.popIfTop(frame.currentBranchIdx);
      this.popIfTop(frame.blockIdx);
      this.nodes[frame.blockIdx].tokenCount = endPos - this.nodes[frame.blockIdx].tokenStart;
    }

    while (this.openPhpTagConditions.length > 0) {
      const frame = this.openPhpTagConditions.pop()!;
      this.popIfTop(frame.currentBranchIdx);
      this.popIfTop(frame.blockIdx);
      this.nodes[frame.blockIdx].tokenCount = endPos - this.nodes[frame.blockIdx].tokenStart;
    }

    while (this.openDirectives.length > 0) {
      const frame = this.openDirectives.pop()!;
      this.popIfTop(frame.startDirectiveIdx);
      this.popIfTop(frame.blockIdx);
      this.nodes[frame.blockIdx].tokenCount = endPos - this.nodes[frame.blockIdx].tokenStart;
    }
  }

  private getDirectiveIndex(): DirectiveTokenIndex {
    if (this.directiveIndex === null) {
      this.directiveIndex = new DirectiveTokenIndex(this.tokens, this.source);
    }
    return this.directiveIndex;
  }
}

export function buildTree(
  tokens: readonly Token[],
  source: string,
  directives?: Directives,
): BuildResult {
  return new TreeBuilder(tokens, source, directives).build();
}
