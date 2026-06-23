import type { Options } from "prettier";
import { normalizeLineEndingsToLf } from "../string-utils.js";
import { NodeKind } from "../tree/types.js";
import { dedentString } from "./utils.js";

export interface EchoDelimiters {
  readonly open: string;
  readonly close: string;
}

export function getEchoDelimiters(node: { kind: unknown }): EchoDelimiters | null {
  switch (node.kind) {
    case NodeKind.RawEcho:
      return { open: "{!!", close: "!!}" };
    case NodeKind.TripleEcho:
      return { open: "{{{", close: "}}}" };
    case NodeKind.Echo:
      return { open: "{{", close: "}}" };
    default:
      return null;
  }
}

export function normalizeMultilineEchoIndentText(
  node: { kind: unknown },
  value: string,
  options: Options,
): string {
  if (!value.includes("\n") && !value.includes("\r")) {
    return value;
  }

  const delimiters = getEchoDelimiters(node);
  if (delimiters === null) {
    return value;
  }

  const normalized = normalizeLineEndingsToLf(value).trim();
  if (!normalized.startsWith(delimiters.open) || !normalized.endsWith(delimiters.close)) {
    return value;
  }

  const inner = stripBoundaryLineBreaks(
    normalized.slice(delimiters.open.length, normalized.length - delimiters.close.length),
  ).replace(/\n[^\S\r\n]*$/u, "");
  if (inner.trim().length === 0) {
    return `${delimiters.open}\n${delimiters.close}`;
  }

  const indentUnit = getIndentUnit(options);
  const body = dedentString(inner)
    .split("\n")
    .map((line) => (line.trim().length === 0 ? "" : `${indentUnit}${line}`))
    .join("\n");

  return `${delimiters.open}\n${body}\n${delimiters.close}`;
}

function getIndentUnit(options: Options): string {
  const raw = (options as Record<string, unknown>).tabWidth;
  const tabWidth = typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 2;
  return (options as Record<string, unknown>).useTabs === true ? "\t" : " ".repeat(tabWidth);
}

function stripBoundaryLineBreaks(value: string): string {
  let next = value;

  if (next.startsWith("\r\n")) {
    next = next.slice(2);
  } else if (next.startsWith("\n")) {
    next = next.slice(1);
  }

  if (next.endsWith("\r\n")) {
    next = next.slice(0, -2);
  } else if (next.endsWith("\n")) {
    next = next.slice(0, -1);
  }

  return next;
}
