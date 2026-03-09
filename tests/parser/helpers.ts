export {
  parse,
  rootChildren,
  childrenOf,
  findByKind,
  nodeText,
  indexOf,
  dumpTree,
  dumpTokens,
} from "../debug.js";

import { TokenType } from "../../src/lexer/types.js";
import { NodeKind, NONE, type FlatNode, type BuildResult } from "../../src/tree/types.js";
import { childrenOf, indexOf, nodeText } from "../debug.js";
export function getTagName(r: BuildResult, elementIdx: number): string {
  const node = r.nodes[elementIdx];
  let childIdx = node.firstChild;
  while (childIdx !== NONE) {
    const child = r.nodes[childIdx];
    if (child.kind === NodeKind.ElementName) {
      let name = "";
      for (let i = 0; i < child.tokenCount; i++) {
        const t = r.tokens[child.tokenStart + i];
        if (t.type === TokenType.TagName) {
          name += r.source.slice(t.start, t.end);
        }
      }
      return name.toLowerCase();
    }
    childIdx = child.nextSibling;
  }
  return "";
}

export function getRawTagName(r: BuildResult, elementIdx: number): string {
  const node = r.nodes[elementIdx];
  let childIdx = node.firstChild;
  while (childIdx !== NONE) {
    const child = r.nodes[childIdx];
    if (child.kind === NodeKind.ElementName) {
      let name = "";
      for (let i = 0; i < child.tokenCount; i++) {
        const t = r.tokens[child.tokenStart + i];
        if (t.type === TokenType.TagName) {
          name += r.source.slice(t.start, t.end);
        }
      }
      return name;
    }
    childIdx = child.nextSibling;
  }
  return "";
}

export function isSelfClosing(node: FlatNode): boolean {
  return node.data === 1;
}

export function isPaired(r: BuildResult, elementIdx: number): boolean {
  const node = r.nodes[elementIdx];
  let childIdx = node.firstChild;
  while (childIdx !== NONE) {
    if (r.nodes[childIdx].kind === NodeKind.ClosingElementName) return true;
    childIdx = r.nodes[childIdx].nextSibling;
  }
  return false;
}
const INTERNAL_KINDS = new Set([
  NodeKind.ElementName,
  NodeKind.ClosingElementName,
  NodeKind.Attribute,
  NodeKind.JsxAttribute,
  NodeKind.AttributeName,
  NodeKind.AttributeValue,
  NodeKind.AttributeWhitespace,
]);

export function getContentChildren(r: BuildResult, nodeIdx: number): FlatNode[] {
  return childrenOf(r, nodeIdx).filter((c) => !INTERNAL_KINDS.has(c.kind));
}
export function getAttributes(r: BuildResult, elementIdx: number): FlatNode[] {
  return childrenOf(r, elementIdx).filter(
    (c) => c.kind === NodeKind.Attribute || c.kind === NodeKind.JsxAttribute,
  );
}

export function getAttributeName(r: BuildResult, attrNode: FlatNode): string {
  const kids = childrenOf(r, indexOf(r, attrNode));
  const nameNode = kids.find((c) => c.kind === NodeKind.AttributeName);
  if (!nameNode) return "";
  return nodeText(r, nameNode);
}

export function getAttributeValue(r: BuildResult, attrNode: FlatNode): string | null {
  const kids = childrenOf(r, indexOf(r, attrNode));
  const valueNode = kids.find((c) => c.kind === NodeKind.AttributeValue);
  if (!valueNode) return null;
  return nodeText(r, valueNode);
}
export function getDirectiveName(r: BuildResult, node: FlatNode): string {
  const tok = r.tokens[node.tokenStart];
  const text = r.source.slice(tok.start, tok.end);
  return text.startsWith("@") ? text.slice(1).toLowerCase() : text.toLowerCase();
}

export function getDirectiveArgs(r: BuildResult, node: FlatNode): string | null {
  for (let i = 0; i < node.tokenCount; i++) {
    const t = r.tokens[node.tokenStart + i];
    if (t.type === TokenType.DirectiveArgs) {
      return r.source.slice(t.start, t.end);
    }
  }
  return null;
}
export function getEchoContent(r: BuildResult, node: FlatNode): string {
  const full = nodeText(r, node);
  if (full.startsWith("{{{")) return full.slice(3, -3);
  if (full.startsWith("{!!")) return full.slice(3, -3);
  if (full.startsWith("{{")) return full.slice(2, -2);
  return full;
}
export function renderDocument(r: BuildResult): string {
  // Root node has tokenCount=0 by design, so use source directly.
  return r.source;
}
