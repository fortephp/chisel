import type { Options } from "prettier";
import { Directives as LexerDirectives } from "./lexer/directives.js";
import { collectIgnoreRanges } from "./lexer/ignore-ranges.js";
import type { IgnoreRangeRegion } from "./lexer/types.js";
import { parseFrontMatter } from "./front-matter.js";
import { resolveBladeSyntaxProfile } from "./plugins/runtime.js";

export interface BladeIgnoreRange {
  start: number;
  end: number;
}

export function collectIgnoreRangeRegions(source: string, options?: unknown): IgnoreRangeRegion[] {
  const hasBom = source.charCodeAt(0) === 0xfeff;
  const { content } = parseFrontMatter(hasBom ? source.slice(1) : source);
  // Front matter is blanked rather than sliced, so restoring the BOM keeps every offset raw.
  const maskedSource = hasBom ? `\ufeff${content}` : content;
  const syntaxProfile = resolveBladeSyntaxProfile(options);

  return collectIgnoreRanges(maskedSource, LexerDirectives.acceptAll(), {
    verbatimStartDirectives: syntaxProfile.verbatimStartDirectives,
    verbatimEndDirectives: syntaxProfile.verbatimEndDirectives,
  });
}

/**
 * Return formatter ignore ranges as UTF-16 offsets into the unmodified source.
 */
export function getBladeIgnoreRanges(source: string, options?: Options): BladeIgnoreRange[] {
  return collectIgnoreRangeRegions(source, options).map(({ start, end }) => ({
    start,
    end,
  }));
}
