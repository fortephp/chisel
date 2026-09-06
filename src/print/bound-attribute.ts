import type { Doc } from "prettier";
import { doc } from "prettier";
import { normalizeLineEndingsToLf } from "../string-utils.js";
import { replaceEndOfLine } from "./doc-utils.js";
import { dedentString } from "./utils.js";

const { hardline, indent } = doc.builders;

export function printMultilineBoundArrayValue(value: string): Doc {
  const lines = normalizeLineEndingsToLf(value).split("\n");
  const body = dedentString(lines.slice(1, -1).join("\n"));
  return ["[", indent([hardline, replaceEndOfLine(body, hardline)]), hardline, "]"];
}

export function isMultilineBracketArrayValue(value: string): boolean {
  const lines = normalizeLineEndingsToLf(value).split("\n");
  return (
    lines.length > 2 &&
    lines[0].trim() === "[" &&
    lines.at(-1)?.trim() === "]" &&
    !value.includes("<<<") &&
    !hasMultilineQuotedValue(value)
  );
}

function hasMultilineQuotedValue(value: string): boolean {
  let quote: "'" | '"' | "`" | null = null;
  let escaped = false;

  for (const char of value) {
    if (char === "\n" || char === "\r") {
      if (quote !== null) return true;
      continue;
    }
    if (quote === null) {
      if (char === "'" || char === '"' || char === "`") quote = char;
      continue;
    }
    if (escaped) {
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === quote) {
      quote = null;
    }
  }

  return false;
}
