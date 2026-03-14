import type { Directives } from "./directives.js";

export const enum NodeKind {
  Root = 0,
  Element = 1,
  Text = 2,
  Fragment = 3,
  Echo = 4,
  RawEcho = 5,
  TripleEcho = 6,
  Directive = 7,
  DirectiveBlock = 8,
  Verbatim = 9,
  PhpBlock = 10,
  PhpTag = 11,
  Comment = 12,
  BogusComment = 13,
  ConditionalComment = 14,
  BladeComment = 15,
  Doctype = 16,
  Cdata = 17,
  Decl = 18,
  Attribute = 19,
  JsxAttribute = 20,
  UnpairedClosingTag = 21,
  NonOutput = 22,
  ElementName = 23,
  ClosingElementName = 24,
  AttributeWhitespace = 25,
  AttributeName = 26,
  AttributeValue = 27,
  ProcessingInstruction = 28,
}

export const NODE_KIND_LABELS: Record<number, string> = {
  [NodeKind.Root]: "Root",
  [NodeKind.Element]: "Element",
  [NodeKind.Text]: "Text",
  [NodeKind.Fragment]: "Fragment",
  [NodeKind.Echo]: "Echo",
  [NodeKind.RawEcho]: "RawEcho",
  [NodeKind.TripleEcho]: "TripleEcho",
  [NodeKind.Directive]: "Directive",
  [NodeKind.DirectiveBlock]: "DirectiveBlock",
  [NodeKind.Verbatim]: "Verbatim",
  [NodeKind.PhpBlock]: "PhpBlock",
  [NodeKind.PhpTag]: "PhpTag",
  [NodeKind.Comment]: "Comment",
  [NodeKind.BogusComment]: "BogusComment",
  [NodeKind.ConditionalComment]: "ConditionalComment",
  [NodeKind.BladeComment]: "BladeComment",
  [NodeKind.Doctype]: "Doctype",
  [NodeKind.Cdata]: "Cdata",
  [NodeKind.Decl]: "Decl",
  [NodeKind.Attribute]: "Attribute",
  [NodeKind.JsxAttribute]: "JsxAttribute",
  [NodeKind.UnpairedClosingTag]: "UnpairedClosingTag",
  [NodeKind.NonOutput]: "NonOutput",
  [NodeKind.ElementName]: "ElementName",
  [NodeKind.ClosingElementName]: "ClosingElementName",
  [NodeKind.AttributeWhitespace]: "AttributeWhitespace",
  [NodeKind.AttributeName]: "AttributeName",
  [NodeKind.AttributeValue]: "AttributeValue",
  [NodeKind.ProcessingInstruction]: "ProcessingInstruction",
};

export function nodeKindLabel(kind: number): string {
  return NODE_KIND_LABELS[kind] ?? `Unknown(${kind})`;
}

export const enum StructureRole {
  None = 0,
  Opening = 1,
  Closing = 2,
  Intermediate = 3,
  Mixed = 4,
}

export const enum ArgumentRequirement {
  Optional = 0,
  Required = 1,
  NotAllowed = 2,
}

export interface FlatNode {
  kind: number;
  parent: number;
  firstChild: number;
  lastChild: number;
  nextSibling: number;
  tokenStart: number;
  tokenCount: number;
  genericOffset: number;
  data: number;
}

export const NONE = -1;

export function createFlatNode(
  kind: number,
  parent: number,
  tokenStart: number,
  tokenCount = 0,
  genericOffset = 0,
  data = 0,
): FlatNode {
  return {
    kind,
    parent,
    firstChild: NONE,
    lastChild: NONE,
    nextSibling: NONE,
    tokenStart,
    tokenCount,
    genericOffset,
    data,
  };
}

export interface BuildResult {
  nodes: FlatNode[];
  source: string;
  tokens: readonly { type: number; start: number; end: number }[];
  directives?: Directives;
}

export interface DirectiveFrame {
  blockIdx: number;
  startDirectiveIdx: number;
  name: string;
  elementStackBase: number;
  terminators: string[];
  branches: string[];
  openers: string[];
}

export interface ConditionFrame {
  blockIdx: number;
  currentBranchIdx: number;
  name: string;
  elementStackBase: number;
}

export interface SwitchFrame {
  blockIdx: number;
  switchDirectiveIdx: number;
  currentCaseIdx: number | null;
  name: string;
  elementStackBase: number;
}
