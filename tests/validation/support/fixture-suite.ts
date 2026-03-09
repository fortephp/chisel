import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as prettier from "prettier";
import { expect } from "vitest";
import plugin from "../../../src/index.js";
import { tokenize } from "../../../src/lexer/lexer.js";
import { TokenType, tokenLabel, type Token } from "../../../src/lexer/types.js";

const VALIDATION_DEFAULT_OPTIONS: prettier.Options = {
  bladePhpFormatting: "off",
  bladeSyntaxPlugins: [],
  bladeKeepHeadAndBodyAtRoot: false,
  bladeInlineIntentElements: ["svg", "svg:*"],
};

export const DEFAULT_OPTION_MATRIX: Array<{
  name: string;
  options: prettier.Options;
}> = [
  { name: "default", options: {} },
  {
    name: "inline-intent-plugin-defaults",
    options: { bladeInlineIntentElements: ["p", "svg", "svg:*"] },
  },
  { name: "printWidth-60", options: { printWidth: 60 } },
  { name: "tabWidth-4", options: { tabWidth: 4 } },
  { name: "useTabs", options: { useTabs: true, tabWidth: 4 } },
  { name: "singleAttributePerLine", options: { singleAttributePerLine: true } },
  { name: "bracketSameLine", options: { bracketSameLine: true } },
  { name: "bladeEchoSpacing-tight", options: { bladeEchoSpacing: "tight" } },
  {
    name: "bladeDirectiveArgSpacing-none",
    options: { bladeDirectiveArgSpacing: "none" },
  },
  {
    name: "bladeDirectiveCase-lower",
    options: { bladeDirectiveCase: "lower" },
  },
  {
    name: "bladeDirectiveBlockStyle-inline-if-short",
    options: { bladeDirectiveBlockStyle: "inline-if-short" },
  },
  {
    name: "htmlWhitespaceSensitivity-strict",
    options: { htmlWhitespaceSensitivity: "strict" },
  },
  {
    name: "htmlWhitespaceSensitivity-ignore",
    options: { htmlWhitespaceSensitivity: "ignore" },
  },
  {
    name: "directive-style-multiline",
    options: {
      bladeDirectiveBlockStyle: "multiline",
      bladeBlankLinesAroundDirectives: "preserve",
      bladeDirectiveArgSpacing: "space",
      bladeEchoSpacing: "space",
    },
  },
  {
    name: "php-safe-singleQuote",
    options: { bladePhpFormatting: "safe", singleQuote: true },
  },
  { name: "endOfLine-lf", options: { endOfLine: "lf" } },
  { name: "endOfLine-crlf", options: { endOfLine: "crlf" } },
  { name: "endOfLine-auto", options: { endOfLine: "auto" } },
];

const TRACKED_TOKENS: readonly TokenType[] = [
  TokenType.Directive,
  TokenType.DirectiveArgs,
  TokenType.EchoStart,
  TokenType.EchoEnd,
  TokenType.EchoContent,
  TokenType.RawEchoStart,
  TokenType.RawEchoEnd,
  TokenType.TripleEchoStart,
  TokenType.TripleEchoEnd,
  TokenType.PhpTagStart,
  TokenType.PhpTagEnd,
  TokenType.PhpContent,
  TokenType.PhpBlockStart,
  TokenType.PhpBlockEnd,
  TokenType.PhpBlock,
  TokenType.BladeCommentStart,
  TokenType.BladeCommentEnd,
];

export function fixtureDir(validationSuiteDir: string): string {
  return join(
    process.cwd(),
    "tests",
    "fixtures",
    "validation",
    "forte",
    validationSuiteDir,
  );
}

export function listFixtureFiles(
  dir: string,
  compareFn?: (a: string, b: string) => number,
): string[] {
  const files = readdirSync(dir).filter((name) => name.endsWith(".blade.php"));
  return compareFn ? files.sort(compareFn) : files.sort();
}

export function listRecursiveFixtureFiles(
  root: string,
  accept: (fileName: string) => boolean,
): string[] {
  const out: string[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const entries = readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (!accept(entry.name)) {
        continue;
      }

      out.push(fullPath.slice(root.length + 1).replaceAll("\\", "/"));
    }
  }

  return out.sort();
}

export function readFixture(dir: string, fileName: string): string {
  return readFileSync(join(dir, fileName), "utf8");
}

function countTrackedTokens(tokens: readonly Token[]): Map<TokenType, number> {
  const tracked = new Set<TokenType>(TRACKED_TOKENS);
  const counts = new Map<TokenType, number>();

  for (const token of tokens) {
    if (!tracked.has(token.type)) continue;
    counts.set(token.type, (counts.get(token.type) ?? 0) + 1);
  }

  return counts;
}

export function expectNoBladePhpConstructLoss(
  input: string,
  output: string,
  context: string,
): void {
  const inputCounts = countTrackedTokens(tokenize(input).tokens);
  const outputCounts = countTrackedTokens(tokenize(output).tokens);

  for (const type of TRACKED_TOKENS) {
    expect(
      outputCounts.get(type) ?? 0,
      `${context}: changed ${tokenLabel(type)} token count`,
    ).toBe(inputCounts.get(type) ?? 0);
  }
}

export async function formatWithStabilityChecks(
  input: string,
  options: prettier.Options = {},
): Promise<string> {
  const formatOptions = {
    parser: "blade" as const,
    plugins: [plugin],
    ...VALIDATION_DEFAULT_OPTIONS,
    ...options,
  };

  const first = await prettier.format(input, formatOptions);
  const second = await prettier.format(first, formatOptions);
  const third = await prettier.format(second, formatOptions);

  expect(second, "formatter drifted on pass 2").toBe(first);
  expect(third, "formatter drifted on pass 3").toBe(second);
  expectRespectsFormattingInvariants(first, options, "stability pass 1");
  expectRespectsFormattingInvariants(second, options, "stability pass 2");
  expectRespectsFormattingInvariants(third, options, "stability pass 3");

  return first;
}

export async function formatWithConvergenceChecks(
  input: string,
  options: prettier.Options = {},
): Promise<{ first: string; second: string; third: string }> {
  const formatOptions = {
    parser: "blade" as const,
    plugins: [plugin],
    ...VALIDATION_DEFAULT_OPTIONS,
    ...options,
  };

  const first = await prettier.format(input, formatOptions);
  const second = await prettier.format(first, formatOptions);
  const third = await prettier.format(second, formatOptions);

  expect(third, "formatter did not converge by pass 3").toBe(second);
  expectRespectsFormattingInvariants(first, options, "convergence pass 1");
  expectRespectsFormattingInvariants(second, options, "convergence pass 2");
  expectRespectsFormattingInvariants(third, options, "convergence pass 3");

  return { first, second, third };
}

export async function formatWithRoundTripChecks(
  input: string,
  options: prettier.Options = {},
): Promise<{ first: string; second: string }> {
  const formatOptions = {
    parser: "blade" as const,
    plugins: [plugin],
    ...VALIDATION_DEFAULT_OPTIONS,
    ...options,
  };

  const first = await prettier.format(input, formatOptions);
  const second = await prettier.format(first, formatOptions);

  expectRespectsFormattingInvariants(first, options, "round-trip pass 1");
  expectRespectsFormattingInvariants(second, options, "round-trip pass 2");

  return { first, second };
}

export function expectCoreConstructDelimiterSafety(
  input: string,
  output: string,
  context: string,
): void {
  const markers = [
    "{{{",
    "}}}",
    "{!!",
    "!!}",
    "{{",
    "}}",
    "@php",
    "@endphp",
    "<?php",
    "?>",
    "{{--",
    "--}}",
  ] as const;

  for (const marker of markers) {
    const inputCount = input.split(marker).length - 1;
    const outputCount = output.split(marker).length - 1;
    expect(
      outputCount,
      `${context}: changed core delimiter count for ${marker}`,
    ).toBe(inputCount);
  }
}

function hasLoneLf(input: string): boolean {
  return /(^|[^\r])\n/.test(input);
}

function collectTrailingWhitespaceExemptLines(output: string): Set<number> {
  const lines = output.split(/\r?\n/u);
  const exempt = new Set<number>();
  let inPreserveBlock = false;
  let inBladeComment = false;
  let inHtmlComment = false;
  let inPhpDirective = false;
  let inPhpTag = false;

  for (let index = 0; index < lines.length; index++) {
    const lineNumber = index + 1;
    const line = lines[index] ?? "";
    const trimmed = line.trim();

    if (line.includes("{{--")) {
      inBladeComment = true;
    }
    if (line.includes("<!--")) {
      inHtmlComment = true;
    }

    const startsPreserveBlock =
      /(?:prettier|format)-ignore-start/u.test(trimmed) ||
      /^@(?:verbatim|antlers)\b/u.test(trimmed);
    const endsPreserveBlock =
      /(?:prettier|format)-ignore-end/u.test(trimmed) ||
      /^@end(?:verbatim|antlers)\b/u.test(trimmed);
    const startsPhpDirective = /^@php\b/u.test(trimmed);
    const endsPhpDirective = /^@endphp\b/u.test(trimmed);
    const startsPhpTag = /<\?(?:php|=)/u.test(line);
    const endsPhpTag = /\?>/u.test(line);

    if (startsPreserveBlock) {
      inPreserveBlock = true;
    }
    if (startsPhpDirective) {
      inPhpDirective = true;
    }
    if (startsPhpTag) {
      inPhpTag = true;
    }

    if (inPreserveBlock) {
      exempt.add(lineNumber);
    }

    if (inBladeComment || inHtmlComment) {
      exempt.add(lineNumber);
    }
    if (inPhpDirective || inPhpTag) {
      exempt.add(lineNumber);
    }

    // prettier-ignore/format-ignore on its own line preserves the next concrete line.
    if (
      /(?:prettier|format)-ignore/u.test(trimmed) &&
      !/(?:prettier|format)-ignore-start/u.test(trimmed) &&
      !/(?:prettier|format)-ignore-end/u.test(trimmed)
    ) {
      exempt.add(lineNumber);
      for (let lookahead = index + 1; lookahead < lines.length; lookahead++) {
        const lookaheadLine = lines[lookahead] ?? "";
        exempt.add(lookahead + 1);
        if (lookaheadLine.trim().length > 0) {
          break;
        }
      }
    }

    if (endsPreserveBlock) {
      inPreserveBlock = false;
    }
    if (endsPhpDirective) {
      inPhpDirective = false;
    }
    if (endsPhpTag) {
      inPhpTag = false;
    }

    if (line.includes("--}}")) {
      inBladeComment = false;
    }
    if (line.includes("-->")) {
      inHtmlComment = false;
    }
  }

  return exempt;
}

function firstTrailingWhitespaceLine(output: string): number | null {
  const lines = output.split(/\r?\n/u);
  const exemptLines = collectTrailingWhitespaceExemptLines(output);

  for (let index = 0; index < lines.length; index++) {
    if (exemptLines.has(index + 1)) {
      continue;
    }

    if (/[ \t]+$/u.test(lines[index] ?? "")) {
      return index + 1;
    }
  }

  return null;
}

export function expectNoUnexpectedTrailingWhitespace(
  output: string,
  context: string,
): void {
  const line = firstTrailingWhitespaceLine(output);
  expect(
    line,
    `${context}: found trailing horizontal whitespace on line ${line ?? "unknown"}`,
  ).toBeNull();
}

export function expectRespectsFormattingInvariants(
  output: string,
  options: prettier.Options,
  context: string,
  {
    checkTrailingWhitespace = true,
  }: { checkTrailingWhitespace?: boolean } = {},
): void {
  const endOfLine = (options as Record<string, unknown>).endOfLine;
  if (endOfLine === "lf") {
    expect(output.includes("\r\n"), `${context}: found CRLF with endOfLine=lf`).toBe(false);
  }

  if (endOfLine === "crlf") {
    expect(hasLoneLf(output), `${context}: found lone LF with endOfLine=crlf`).toBe(false);
  }

  if (output.length > 0) {
    if (endOfLine === "crlf") {
      expect(output.endsWith("\r\n"), `${context}: missing trailing CRLF`).toBe(true);
    } else {
      expect(/\r?\n$/u.test(output), `${context}: missing trailing newline`).toBe(true);
    }
  }

  if (checkTrailingWhitespace) {
    expectNoUnexpectedTrailingWhitespace(output, context);
  }
}

export function pickDeterministicSample(
  files: readonly string[],
  sampleSize: number,
): string[] {
  if (files.length <= sampleSize) {
    return [...files];
  }

  const selected = new Set<number>();
  const maxIndex = files.length - 1;

  for (let i = 0; i < sampleSize; i++) {
    const index = Math.round((i * maxIndex) / (sampleSize - 1));
    selected.add(index);
  }

  if (selected.size < sampleSize) {
    for (let i = 0; i <= maxIndex && selected.size < sampleSize; i++) {
      selected.add(i);
    }
  }

  return [...selected]
    .sort((a, b) => a - b)
    .map((index) => files[index]);
}
