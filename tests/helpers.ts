import { expect } from "vitest";
import * as prettier from "prettier";
import plugin from "../src/index.js";

const DEFAULT_IDEMPOTENT_PASSES = 2;
const TEST_DEFAULT_OPTIONS: prettier.Options = {
  bladePhpFormatting: "off",
  bladeSyntaxPlugins: [],
  bladeKeepHeadAndBodyAtRoot: false,
  bladeInlineIntentElements: ["svg", "svg:*"],
};

interface FormatPassOptions {
  passes?: number;
  assertIdempotent?: boolean;
}

export function hasLoneLf(input: string): boolean {
  return /(^|[^\r])\n/u.test(input);
}

export function leadingIndent(line: string): number {
  return line.match(/^[ \t]*/u)?.[0].length ?? 0;
}

export function findLineStartingWith(output: string, startsWith: string): string | undefined {
  return output.split(/\r?\n/u).find((line) => line.trimStart().startsWith(startsWith));
}

export function wrapInDiv(content: string, depth: number): string {
  let current = content.trimEnd();
  for (let i = 0; i < depth; i++) {
    current = `<div>\n${current}\n</div>`;
  }
  return `${current}\n`;
}

export async function format(code: string, options: prettier.Options = {}) {
  return formatWithPasses(code, options);
}

export async function formatWithPasses(
  code: string,
  options: prettier.Options = {},
  { passes = DEFAULT_IDEMPOTENT_PASSES, assertIdempotent = true }: FormatPassOptions = {},
) {
  if (passes < 1) {
    throw new Error("passes must be >= 1");
  }

  const opts = {
    parser: "blade" as const,
    plugins: [plugin],
    ...TEST_DEFAULT_OPTIONS,
    ...options,
  };

  let current = await prettier.format(code, opts);
  if (!assertIdempotent) {
    return current;
  }

  for (let i = 2; i <= passes; i++) {
    const next = await prettier.format(current, opts);
    expect(next, `formatter is not idempotent on pass ${i}`).toBe(current);
    current = next;
  }

  return current;
}

export async function printDocDebug(code: string, options: prettier.Options = {}) {
  const opts = {
    parser: "blade" as const,
    plugins: [plugin],
    ...TEST_DEFAULT_OPTIONS,
    ...options,
  };
  const debugApi = prettier.__debug as {
    printToDoc?: (source: string, options: prettier.Options) => Promise<unknown>;
    formatDoc?: (doc: unknown, options: prettier.Options) => string;
  };

  if (!debugApi?.printToDoc || !debugApi?.formatDoc) {
    throw new Error("Prettier debug API is unavailable in this runtime");
  }

  const doc = await debugApi.printToDoc(code, opts);
  return debugApi.formatDoc(doc, opts);
}

function toHtmlReferenceOptions(options: prettier.Options): prettier.Options {
  const record = options as Record<string, unknown>;
  const htmlOptions: Record<string, unknown> = { ...record };
  delete htmlOptions.plugins;
  delete htmlOptions.parser;
  delete htmlOptions.bladePhpFormatting;
  delete htmlOptions.bladePhpFormattingTargets;
  delete htmlOptions.bladeDirectiveCase;
  delete htmlOptions.bladeDirectiveCaseMap;
  delete htmlOptions.bladeDirectiveArgSpacing;
  delete htmlOptions.bladeDirectiveBlockStyle;
  delete htmlOptions.bladeBlankLinesAroundDirectives;
  delete htmlOptions.bladeEchoSpacing;
  delete htmlOptions.bladeSlotClosingTag;
  delete htmlOptions.bladeInsertOptionalClosingTags;
  delete htmlOptions.bladeSyntaxPlugins;
  delete htmlOptions.bladeInlineIntentElements;
  delete htmlOptions.bladeComponentPrefixes;
  delete htmlOptions.bladeKeepHeadAndBodyAtRoot;
  return htmlOptions as prettier.Options;
}

export async function formatEqualToPrettierHtml(input: string, options: prettier.Options = {}) {
  const bladeOpts = {
    parser: "blade" as const,
    plugins: [plugin],
    ...TEST_DEFAULT_OPTIONS,
    ...options,
  };
  const htmlOpts = { parser: "html" as const, ...toHtmlReferenceOptions(options) };

  const bladeOutput = await prettier.format(input, bladeOpts);
  const htmlOutput = await prettier.format(input, htmlOpts);
  expect(bladeOutput).toBe(htmlOutput);

  const secondPass = await prettier.format(bladeOutput, bladeOpts);
  expect(secondPass, "blade formatter is not idempotent").toBe(bladeOutput);

  return bladeOutput;
}

export async function formatEqual(
  input: string,
  expected: string,
  options: prettier.Options = {},
  passes = 5,
) {
  const opts = {
    parser: "blade" as const,
    plugins: [plugin],
    ...TEST_DEFAULT_OPTIONS,
    ...options,
  };
  const first = await prettier.format(input, opts);
  expect(first).toBe(expected);

  let prev = first;
  for (let i = 2; i <= passes; i++) {
    const next = await prettier.format(prev, opts);
    expect(next, `not idempotent on pass ${i}`).toBe(prev);
    prev = next;
  }
}

export {
  dumpTokens,
  dumpTree,
  parse,
  childrenOf,
  rootChildren,
  findByKind,
  nodeText,
  indexOf,
} from "./debug.js";
