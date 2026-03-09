import type { WrappedNode } from "./types.js";
import { nodeKindLabel } from "./tree/types.js";

export function getNodeRawSource(node: WrappedNode): string {
  return node.source.slice(node.start, node.end);
}

export function describeNode(node: WrappedNode): string {
  const kind = typeof node.kind === "number" ? nodeKindLabel(node.kind) : node.kind;
  return `${kind} [${node.start}, ${node.end})`;
}
