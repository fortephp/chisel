import { expect } from "vitest";
import { collectIgnoreRanges } from "../../src/lexer/index.js";
import { Directives } from "../../src/lexer/directives.js";
import { getIgnoreCommentKindFromCommentText } from "../../src/ignore-markers.js";
import { resolveBladeSyntaxProfile } from "../../src/plugins/runtime.js";

function normalizeEndOfLine(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

function getIgnoreRanges(source: string, options?: unknown) {
  const syntaxProfile = resolveBladeSyntaxProfile(options);
  return collectIgnoreRanges(source, Directives.acceptAll(), {
    verbatimStartDirectives: syntaxProfile.verbatimStartDirectives,
    verbatimEndDirectives: syntaxProfile.verbatimEndDirectives,
  });
}

function getIgnoreRangeMarkerKind(comment: string): "start" | "end" | null {
  const wrapper = comment.startsWith("{{--") ? "blade" : "html";
  const kind = getIgnoreCommentKindFromCommentText(comment, wrapper);

  if (kind === "ignore-start") {
    return "start";
  }
  if (kind === "ignore-end") {
    return "end";
  }

  return null;
}

function extractIgnoreRangeMarkerCounts(source: string): { start: number; end: number } {
  const counts = { start: 0, end: 0 };

  for (const match of source.matchAll(/\{\{--[\s\S]*?--\}\}|<!--[\s\S]*?-->/g)) {
    const kind = getIgnoreRangeMarkerKind(match[0]);
    if (kind === "start") {
      counts.start++;
    } else if (kind === "end") {
      counts.end++;
    }
  }

  return counts;
}

export function containsIgnoreRanges(source: string, options?: unknown): boolean {
  return getIgnoreRanges(source, options).length > 0;
}

export function collectIgnoreRangeSlices(source: string, options?: unknown): string[] {
  return getIgnoreRanges(source, options).map((range) => source.slice(range.start, range.end));
}

export function expectIgnoreRangeSlicesUnchanged(
  input: string,
  output: string,
  context = "ignore-range contract",
  options?: unknown,
): void {
  expect(
    collectIgnoreRangeSlices(output, options).map(normalizeEndOfLine),
    `${context}: changed ignored range slices`,
  ).toEqual(collectIgnoreRangeSlices(input, options).map(normalizeEndOfLine));
}

export function expectIgnoreRangesUnchanged(
  input: string,
  output: string,
  context = "ignore-range contract",
  options?: unknown,
): void {
  if (!containsIgnoreRanges(input, options)) {
    return;
  }

  expect(
    extractIgnoreRangeMarkerCounts(output),
    `${context}: changed ignore marker counts`,
  ).toEqual(extractIgnoreRangeMarkerCounts(input));

  expectIgnoreRangeSlicesUnchanged(input, output, context, options);
}
