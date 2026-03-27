import type { Options } from "prettier";
import type { WrappedNode } from "../types.js";
import { TokenType } from "../lexer/types.js";
import { NodeKind } from "../tree/types.js";
import {
  isBladeComponentTagName,
  resolveDirectiveArgSpacingRule,
  type DirectiveArgSpacingRule,
} from "./blade-options.js";

export function getDirectiveName(node: WrappedNode): string | null {
  const start = node.flat.tokenStart;
  const end = start + node.flat.tokenCount;
  const tokens = node.buildResult.tokens;

  for (let i = start; i < end; i++) {
    const token = tokens[i];
    if (token.type !== TokenType.Directive) continue;

    const raw = node.source.slice(token.start, token.end);
    return raw.startsWith("@") ? raw.slice(1).toLowerCase() : raw.toLowerCase();
  }

  return null;
}

export function getDirectiveAttributeContextElement(node: WrappedNode): WrappedNode | null {
  let current = node;
  while (current.parent?.kind === NodeKind.DirectiveBlock) {
    current = current.parent;
  }

  const parent = current.parent;
  if (!parent || parent.kind !== NodeKind.Element) {
    return null;
  }

  return current.end <= parent.openTagEndOffset ? parent : null;
}

export function isDirectiveInElementOpenTag(node: WrappedNode): boolean {
  return getDirectiveAttributeContextElement(node) !== null;
}

export function isDirectiveInBladeComponentAttributeContext(
  node: WrappedNode,
  options: Options,
): boolean {
  const element = getDirectiveAttributeContextElement(node);
  if (!element) {
    return false;
  }

  return isBladeComponentTagName(element.fullName, options);
}

export function getEffectiveDirectiveArgSpacingRule(
  node: WrappedNode,
  options: Options,
): DirectiveArgSpacingRule {
  return resolveDirectiveArgSpacingRule(
    getDirectiveName(node) ?? "",
    options,
    isDirectiveInBladeComponentAttributeContext(node, options),
  );
}
