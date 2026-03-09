import type { Options } from "prettier";
import type { WrappedNode } from "../types.js";
import {
  getAttributeNameParts,
  getAttributeNameRaw,
  isStaticAttributeName,
  type AttributeNamePart,
} from "./utils.js";
import {
  formatDirectiveNameToken,
  getDirectiveArgSpacingMode,
  getEchoSpacingMode,
} from "./blade-options.js";

function getEchoDelimiters(part: AttributeNamePart): { open: string; close: string } | null {
  switch (part.kind) {
    case "echo":
      return { open: "{{", close: "}}" };
    case "raw_echo":
      return { open: "{!!", close: "!!}" };
    case "triple_echo":
      return { open: "{{{", close: "}}}" };
    default:
      return null;
  }
}

function formatEchoPart(part: AttributeNamePart, options: Options): string {
  const spacing = getEchoSpacingMode(options);
  if (spacing === "preserve") return part.text;

  const delimiters = getEchoDelimiters(part);
  if (!delimiters) return part.text;

  const { open, close } = delimiters;
  if (!part.text.startsWith(open) || !part.text.endsWith(close)) {
    return part.text;
  }

  const content = part.text.slice(open.length, part.text.length - close.length);
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return spacing === "tight" ? `${open}${close}` : `${open} ${close}`;
  }

  if (trimmed.includes("\n")) {
    return `${open}\n${trimmed}\n${close}`;
  }

  if (spacing === "tight") {
    return `${open}${trimmed}${close}`;
  }

  return `${open} ${trimmed} ${close}`;
}

function formatDirectivePart(part: AttributeNamePart, options: Options): string {
  if (!part.text.startsWith("@")) return part.text;

  const argsStart = part.text.indexOf("(");
  if (argsStart === -1) {
    return formatDirectiveNameToken(part.text, options);
  }

  const beforeArgs = part.text.slice(0, argsStart);
  const trimmedName = beforeArgs.trimEnd();
  const spacing = beforeArgs.slice(trimmedName.length);
  const args = part.text.slice(argsStart);
  const formattedName = formatDirectiveNameToken(trimmedName, options);
  const spacingMode = getDirectiveArgSpacingMode(options);

  if (spacingMode === "preserve") {
    return `${formattedName}${spacing}${args}`;
  }

  const normalizedArgs = args.trimStart();
  if (spacingMode === "none") {
    return `${formattedName}${normalizedArgs}`;
  }

  return `${formattedName} ${normalizedArgs}`;
}

function formatAttributeNamePart(part: AttributeNamePart, options: Options): string {
  switch (part.kind) {
    case "echo":
    case "raw_echo":
    case "triple_echo":
      return formatEchoPart(part, options);
    case "directive":
      return formatDirectivePart(part, options);
    case "php_tag":
    case "php_block":
    case "text":
    default:
      return part.text;
  }
}

export function formatAttributeNameForPrint(node: WrappedNode, options: Options): string {
  if (isStaticAttributeName(node)) {
    return getAttributeNameRaw(node);
  }

  const parts = getAttributeNameParts(node);
  if (parts.length === 0) {
    return getAttributeNameRaw(node);
  }

  return parts.map((part) => formatAttributeNamePart(part, options)).join("");
}
