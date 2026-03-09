import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import * as prettier from "prettier";
import bladePlugin from "../../../src/index.js";
import {
  expectRespectsFormattingInvariants,
  pickDeterministicSample,
} from "../support/fixture-suite.js";

const CONFORMANCE_FIXTURE_DIR = join(
  process.cwd(),
  "tests",
  "validation",
  "conformance",
  "fixtures",
);

const PROFILES: Array<{ name: string; options: Options }> = [
  { name: "default", options: {} },
  { name: "php-safe", options: { bladePhpFormatting: "safe", singleQuote: true } },
];

const DEFAULT_SAMPLE_SIZE = 8;

class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  int(maxExclusive: number): number {
    return this.next() % maxExclusive;
  }
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function listConformanceInputs(): string[] {
  return readdirSync(CONFORMANCE_FIXTURE_DIR)
    .filter((name) => name.endsWith(".input.blade.php"))
    .sort();
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let start = 0;
  for (;;) {
    const at = haystack.indexOf(needle, start);
    if (at < 0) return count;
    count++;
    start = at + needle.length;
  }
}

function withMarkerEnvelope(input: string, marker: string): string {
  return `<div data-mutation="${marker}">${marker}</div>\n${input.trimEnd()}\n<p>${marker}</p>\n`;
}

function mutateTruncateTail(input: string, rng: Rng): string {
  if (input.length < 4) return input;
  const drop = Math.max(1, Math.floor(input.length * 0.15) + rng.int(7));
  return input.slice(0, Math.max(1, input.length - drop));
}

function mutateDuplicateLine(input: string, rng: Rng): string {
  const lines = input.split(/\r?\n/u);
  if (lines.length < 2) return input;
  const index = rng.int(lines.length);
  lines.splice(index, 0, lines[index] ?? "");
  return `${lines.join("\n")}\n`;
}

function mutateDropMiddleChunk(input: string, rng: Rng): string {
  if (input.length < 20) return input;
  const start = Math.floor(input.length * 0.25) + rng.int(Math.floor(input.length * 0.2));
  const length = Math.max(1, Math.floor(input.length * 0.1));
  return `${input.slice(0, start)}${input.slice(Math.min(input.length, start + length))}`;
}

function mutateInjectOrphanClose(input: string, rng: Rng): string {
  const lines = input.split(/\r?\n/u);
  const index = Math.min(lines.length, 1 + rng.int(Math.max(1, lines.length - 1)));
  lines.splice(index, 0, "</div>");
  return `${lines.join("\n")}\n`;
}

function mutateLineEndingMix(input: string): string {
  const lines = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  let out = "";

  for (let i = 0; i < lines.length; i++) {
    out += lines[i];
    if (i === lines.length - 1) continue;
    out += i % 2 === 0 ? "\r\n" : "\n";
  }

  return out;
}

function mutateDirectiveArgsBreak(input: string): string {
  const at = input.indexOf(")");
  if (at < 0) return `${input}\n@if ($broken\n`;
  return `${input.slice(0, at)}${input.slice(at + 1)}`;
}

function buildMutations(
  source: string,
  seed: number,
  marker: string,
): Array<{ name: string; input: string }> {
  const rng = new Rng(seed);
  const base = withMarkerEnvelope(source, marker);
  return [
    { name: "truncate-tail", input: mutateTruncateTail(base, rng) },
    { name: "duplicate-line", input: mutateDuplicateLine(base, rng) },
    { name: "drop-middle-chunk", input: mutateDropMiddleChunk(base, rng) },
    { name: "inject-orphan-close", input: mutateInjectOrphanClose(base, rng) },
    { name: "mixed-line-endings", input: mutateLineEndingMix(base) },
    { name: "directive-args-break", input: mutateDirectiveArgsBreak(base) },
  ];
}

async function formatPasses(
  input: string,
  options: Options,
): Promise<{ first: string; second: string; third: string; fourth: string }> {
  const formatOptions: Options = {
    parser: "blade",
    plugins: [bladePlugin],
    bladeInlineIntentElements: ["svg", "svg:*"],
    ...options,
  };
  const first = await prettier.format(input, formatOptions);
  const second = await prettier.format(first, formatOptions);
  const third = await prettier.format(second, formatOptions);
  const fourth = await prettier.format(third, formatOptions);
  return { first, second, third, fourth };
}

describe("validation/fixture-mutations", () => {
  const sampleSize = parsePositiveInt(
    process.env.VALIDATION_FIXTURE_MUTATION_SAMPLE_SIZE,
    DEFAULT_SAMPLE_SIZE,
  );
  const sampleFiles = pickDeterministicSample(listConformanceInputs(), sampleSize);

  for (const [fileIndex, fileName] of sampleFiles.entries()) {
    const source = readFileSync(join(CONFORMANCE_FIXTURE_DIR, fileName), "utf8");
    const marker = `MUT_${fileIndex}`;
    const mutations = buildMutations(source, 0x9e3779b9 ^ fileIndex, marker);

    for (const mutation of mutations) {
      for (const profile of PROFILES) {
        it(`${fileName} :: ${mutation.name} :: ${profile.name}`, async () => {
          const { first, second, third, fourth } = await formatPasses(
            mutation.input,
            profile.options,
          );
          const context = `mutation ${fileName} mut=${mutation.name} profile=${profile.name}`;

          expectRespectsFormattingInvariants(first, profile.options, `${context} pass=1`, {
            checkTrailingWhitespace: false,
          });
          expectRespectsFormattingInvariants(fourth, profile.options, `${context} pass=4`, {
            checkTrailingWhitespace: false,
          });

          expect(
            first.length,
            `${context}: pass 1 output growth exceeded sanity bound`,
          ).toBeLessThanOrEqual(mutation.input.length * 8 + 500);
          expect(
            Math.abs(second.length - first.length),
            `${context}: unstable pass-size delta from pass 1 to pass 2`,
          ).toBeLessThanOrEqual(120);
          expect(
            Math.abs(fourth.length - third.length),
            `${context}: unstable pass-size delta from pass 3 to pass 4`,
          ).toBeLessThanOrEqual(120);

          expect(
            countOccurrences(first, marker),
            `${context}: marker count drifted on pass 1 for ${marker}`,
          ).toBe(countOccurrences(mutation.input, marker));
          expect(
            countOccurrences(fourth, marker),
            `${context}: marker count drifted by pass 4 for ${marker}`,
          ).toBe(countOccurrences(mutation.input, marker));
        });
      }
    }
  }
});
