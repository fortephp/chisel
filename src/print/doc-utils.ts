import type { Doc } from "prettier";
import { doc } from "prettier";
import {
  htmlTrimStart as sharedHtmlTrimStart,
  htmlTrimEnd as sharedHtmlTrimEnd,
} from "../html-whitespace.js";

export function replaceEndOfLine(text: string, replacement: Doc = doc.builders.literalline): Doc[] {
  const parts: Doc[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) parts.push(replacement);
    if (lines[i]) parts.push(lines[i]);
  }
  return parts;
}

export function htmlTrimStart(s: string): string {
  return sharedHtmlTrimStart(s);
}

export function htmlTrimEnd(s: string): string {
  return sharedHtmlTrimEnd(s);
}
