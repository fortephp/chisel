import type { Options } from "prettier";
import type { WrappedNode } from "./types.js";
import { NodeKind } from "./tree/types.js";

const VUE_ROOT_ELEMENTS = new Set(["template", "style", "script"]);

export function hasParent(node: WrappedNode, predicate: (node: WrappedNode) => boolean): boolean {
  let current: WrappedNode | null = node;
  while (current) {
    if (predicate(current)) return true;
    current = current.parent;
  }
  return false;
}

export function isUnknownNamespace(node: WrappedNode): boolean {
  const namespace = node.namespace.toLowerCase();
  const hasExplicitNamespace = node.fullName.includes(":");
  return (
    node.kind === NodeKind.Element &&
    !hasExplicitNamespace &&
    namespace !== "" &&
    !["html", "svg"].includes(namespace)
  );
}

export function isEchoLike(node: WrappedNode): boolean {
  return (
    node.kind === NodeKind.Echo ||
    node.kind === NodeKind.RawEcho ||
    node.kind === NodeKind.TripleEcho
  );
}

/**
 * Text-like in printer terms:
 * text/cdata/comments + Blade interpolation nodes.
 */
export function isTextLikeNode(node: WrappedNode): boolean {
  if (node.kind === NodeKind.Comment) {
    return !node.isIeConditionalStartComment;
  }
  return (
    node.kind === NodeKind.Text ||
    node.kind === NodeKind.Cdata ||
    node.kind === NodeKind.BogusComment ||
    node.kind === NodeKind.UnpairedClosingTag ||
    isEchoLike(node)
  );
}

/**
 * Text-like in whitespace-sensitivity terms:
 * only raw text and Blade interpolation nodes.
 */
export function isWhitespaceTextLikeNode(node: WrappedNode): boolean {
  return node.kind === NodeKind.Text || isEchoLike(node);
}

export function isVueSfcBlock(node: WrappedNode, options: Options): boolean {
  return (
    (options as Record<string, unknown>).parser === "vue" &&
    node.kind === NodeKind.Element &&
    node.parent?.kind === NodeKind.Root &&
    node.fullName.toLowerCase() !== "html"
  );
}

export function isVueCustomBlock(node: WrappedNode, options: Options): boolean {
  return isVueSfcBlock(node, options) && !VUE_ROOT_ELEMENTS.has(node.fullName);
}

export function isVueNonHtmlBlock(node: WrappedNode, options: Options): boolean {
  return isVueSfcBlock(node, options) && isVueCustomBlock(node, options);
}

export function isScriptLikeTag(node: WrappedNode, options?: Options): boolean {
  if (node.kind !== NodeKind.Element) return false;
  const full = node.fullName.toLowerCase();
  return (
    full === "script" ||
    full === "style" ||
    full === "svg:style" ||
    full === "svg:script" ||
    ((node.namespace === "svg" || node.parent?.namespace === "svg") &&
      (node.tagName === "script" || node.tagName === "style")) ||
    (full === "mj-style" && (options as Record<string, unknown>)?.parser === "mjml") ||
    (isUnknownNamespace(node) && (node.tagName === "script" || node.tagName === "style"))
  );
}
